export function getHeartPathAdminEmails() {
  const raw = import.meta.env.VITE_HEARTPATH_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isHeartPathAdmin(email?: string | null) {
  if (!email) return false;
  return getHeartPathAdminEmails().includes(email.trim().toLowerCase());
}
