#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const apiBase = "https://api.supabase.com/v1";

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.message || data?.error || data?.msg || `${response.status} ${response.statusText}`;
    throw new Error(`Supabase API error: ${message}`);
  }

  return data;
}

function upsertEnv(contents, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(contents)) {
    return contents.replace(regex, line);
  }

  return contents.trimEnd() ? `${contents.trimEnd()}\n${line}\n` : `${line}\n`;
}

function selectPublicApiKey(keys) {
  return (
    keys.find((key) => /publishable/i.test(key.name || "")) ||
    keys.find((key) => /anon/i.test(key.name || "")) ||
    keys.find((key) => {
      const name = `${key.name || ""} ${key.type || ""}`.toLowerCase();
      return !name.includes("service") && !name.includes("secret");
    })
  );
}

async function pollProject(accessToken, ref) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const projects = await requestJson(`${apiBase}/projects`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const project = projects.find((item) => item.ref === ref);

    if (!project) {
      await sleep(5000);
      continue;
    }

    const status = `${project.status || ""}`.toUpperCase();
    console.log(`Project status: ${project.status || "unknown"} (attempt ${attempt}/30)`);

    if (status.includes("ACTIVE") || status.includes("HEALTHY")) {
      return project;
    }

    await sleep(10000);
  }

  return null;
}

async function main() {
  const accessToken = requireValue(
    "SUPABASE_ACCESS_TOKEN",
    getArg("--token") || process.env.SUPABASE_ACCESS_TOKEN
  );
  const organizationSlug = requireValue(
    "SUPABASE_ORG_SLUG",
    getArg("--org") || process.env.SUPABASE_ORG_SLUG
  );
  const name = requireValue(
    "project name",
    getArg("--name") || process.env.SUPABASE_PROJECT_NAME
  );
  const dbPass = requireValue(
    "database password",
    getArg("--db-pass") || process.env.SUPABASE_DB_PASSWORD
  );
  const region = getArg("--region") || process.env.SUPABASE_REGION;
  const instanceSize = getArg("--instance-size") || process.env.SUPABASE_INSTANCE_SIZE;
  const envFile = path.resolve(
    process.cwd(),
    getArg("--env-file") || process.env.SUPABASE_ENV_FILE || ".env.local"
  );
  const shouldWriteEnv = !hasFlag("--no-write-env");

  const body = {
    organization_slug: organizationSlug,
    name,
    db_pass: dbPass,
  };

  if (region) {
    body.region = region;
  }

  if (instanceSize) {
    body.desired_instance_size = instanceSize;
  }

  console.log(`Creating Supabase project "${name}" in org "${organizationSlug}"...`);

  const project = await requestJson(`${apiBase}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const ref = project.ref;
  const projectUrl = `https://${ref}.supabase.co`;

  console.log(`Project created with ref: ${ref}`);
  console.log(`Project URL: ${projectUrl}`);

  const activeProject = await pollProject(accessToken, ref);

  if (!activeProject) {
    console.log("Project is still provisioning. You can rerun this script later with --no-write-env disabled.");
    process.exit(0);
  }

  console.log(`Project is ready with status: ${activeProject.status}`);

  if (!shouldWriteEnv) {
    return;
  }

  try {
    const keys = await requestJson(`${apiBase}/projects/${ref}/api-keys?reveal=true`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const publicKey = selectPublicApiKey(keys);

    if (!publicKey?.api_key) {
      console.log("No public API key was returned. Set VITE_SUPABASE_PUBLISHABLE_KEY manually.");
      return;
    }

    const current = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
    let next = upsertEnv(current, "VITE_SUPABASE_URL", projectUrl);
    next = upsertEnv(next, "VITE_SUPABASE_PUBLISHABLE_KEY", publicKey.api_key);
    fs.writeFileSync(envFile, next, "utf8");

    console.log(`Updated ${envFile} with the new project URL and public API key.`);
    console.log("Set SUPABASE_DB_URL separately from the Connect dialog before restoring the backup.");
  } catch (error) {
    console.log(`Could not fetch API keys automatically: ${error.message}`);
    console.log("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY manually in .env.local.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
