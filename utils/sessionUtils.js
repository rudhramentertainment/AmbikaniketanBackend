import {UAParser} from "ua-parser-js";
import geoip from "geoip-lite";

export function parseUserAgent(uaString) {
  try {
    const parser = new UAParser(uaString || "");
    const result = parser.getResult();
    const device = result.device && result.device.type ? `${result.device.type}` : "Desktop";
    const browser = result.browser?.name ? `${result.browser.name} ${result.browser.version||""}`.trim() : "";
    const os = result.os?.name ? `${result.os.name} ${result.os.version||""}`.trim() : "";
    const title = `${device.charAt(0).toUpperCase() + device.slice(1)} - ${browser || "Unknown Browser"}`;
    return { device: title, browser, os };
  } catch (err) {
    return { device: "Unknown", browser: "", os: "" };
  }
}

export function ipToLocation(ip) {
  if (!ip) return null;
  try {
    const geo = geoip.lookup(ip);
    if (!geo) return null;
    return [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
  } catch (err) {
    return null;
  }
}
