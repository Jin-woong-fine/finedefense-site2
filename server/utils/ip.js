// utils/ip.js
export function getClientIp(req) {
  const raw =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip;

  if (!raw) return null;
  if (raw === "::1") return "127.0.0.1";

  if (raw.startsWith("::ffff:")) {
    return raw.replace("::ffff:", "");
  }
  return raw;
}