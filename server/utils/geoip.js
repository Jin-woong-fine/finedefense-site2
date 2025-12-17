// server/utils/geoip.js
import geoip from "geoip-lite";

export function getGeoInfo(ip) {
  // IPv6 ::ffff: 제거
  const cleanIp = ip.replace("::ffff:", "");

  // 사설 IP 판별
  const isPrivate =
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.16.") ||
    cleanIp.startsWith("127.");

  if (isPrivate) {
    return {
      ip_class: "private",
      country_code: "LOCAL",
      country: "Local Network"
    };
  }

  const geo = geoip.lookup(cleanIp);

  return {
    ip_class: "public",
    country_code: geo?.country || "UNK",
    country: geo?.country || "Unknown"
  };
}
