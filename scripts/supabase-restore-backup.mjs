#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getPositionalArgs() {
  const args = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (value.startsWith("--")) {
      index += 1;
      continue;
    }
    args.push(value);
  }
  return args;
}

function commandExists(command) {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  return result.status === 0;
}

function readHeader(filePath) {
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(5);
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  return buffer.toString("utf8");
}

function gunzipToTemp(sourcePath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "supabase-restore-"));
  const filename = path.basename(sourcePath).replace(/\.gz$/i, "");
  const destinationPath = path.join(tempDir, filename);
  const compressed = fs.readFileSync(sourcePath);
  const uncompressed = zlib.gunzipSync(compressed);
  fs.writeFileSync(destinationPath, uncompressed);
  return { destinationPath, tempDir };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (typeof result.status === "number") {
    return result.status;
  }

  throw result.error || new Error(`Failed to execute ${command}`);
}

function cleanupDir(dirPath) {
  if (!dirPath) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function resolveBackupPath() {
  const positional = getPositionalArgs();
  const fromArg = positional[positional.length - 1];
  const candidate = fromArg || process.env.SUPABASE_BACKUP_FILE;

  if (!candidate) {
    throw new Error("Provide a backup path, for example: npm run supabase:restore-backup -- ./backup_name.backup.gz");
  }

  return path.resolve(process.cwd(), candidate);
}

function ensureCommand(command, message) {
  if (!commandExists(command)) {
    throw new Error(message);
  }
}

function main() {
  const dbUrl = getArg("--db-url") || process.env.SUPABASE_DB_URL;
  const keepUnzipped = hasFlag("--keep-unzipped");

  if (!dbUrl) {
    throw new Error("Missing SUPABASE_DB_URL. Set it in your shell or pass --db-url.");
  }

  const backupPath = resolveBackupPath();

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  let restorePath = backupPath;
  let tempDir;

  if (/\.gz$/i.test(backupPath)) {
    console.log(`Unzipping ${backupPath}...`);
    const unzipped = gunzipToTemp(backupPath);
    restorePath = unzipped.destinationPath;
    tempDir = unzipped.tempDir;
    console.log(`Unzipped backup ready at ${restorePath}`);
  }

  const isCustomDump = readHeader(restorePath) === "PGDMP";

  if (isCustomDump) {
    ensureCommand(
      "pg_restore",
      "pg_restore was not found. Install the PostgreSQL client tools and rerun the restore."
    );
    console.log("Detected a custom-format PostgreSQL dump. Restoring with pg_restore...");
    const status = run("pg_restore", ["--no-owner", "--no-privileges", "-d", dbUrl, restorePath]);
    if (status !== 0) {
      throw new Error(`pg_restore exited with status ${status}`);
    }
  } else {
    ensureCommand(
      "psql",
      "psql was not found. Install the latest PostgreSQL client tools and rerun the restore."
    );
    console.log("Detected a plain SQL/dashboard-style dump. Restoring with psql...");
    const status = run("psql", ["-d", dbUrl, "-f", restorePath]);
    if (status !== 0) {
      throw new Error(
        `psql exited with status ${status}. Supabase documents that some \"object already exists\" messages are expected for full dashboard backups, but you should verify the restore output above.`
      );
    }
  }

  if (!keepUnzipped) {
    cleanupDir(tempDir);
  }

  console.log("Restore command completed.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
