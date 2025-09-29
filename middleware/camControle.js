// middleware/camControl.js
import axios from "axios";
import { URLSearchParams } from "url";
import dotenv from "dotenv";
dotenv.config();

const { CAM_HOST, CAM_PORT, CAM_USER, CAM_PASS, CAM_LOGIN_PATH } = process.env;

function buildUrl(pathOrUrl) {
  try {
    return new URL(pathOrUrl).href;
  } catch {
    return `http://${CAM_HOST}:${CAM_PORT}${pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl}`;
  }
}

export default async function loginAndGetCookie() {
  const loginUrl = buildUrl(CAM_LOGIN_PATH);
  console.log("[camControl] POST login URL:", loginUrl);

  const params = new URLSearchParams();
  params.append("userid", CAM_USER);
  params.append("password", CAM_PASS);

  try {
    const postRes = await axios.post(loginUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Referer: `http://${CAM_HOST}:${CAM_PORT}/`
      },
      maxRedirects: 0,
      validateStatus: s => s >= 200 && s < 400
    });

    let rawCookies = postRes.headers["set-cookie"] || [];
    const location = postRes.headers["location"];

    if (location) {
      const followUrl = buildUrl(location);
      const cookieHeader = rawCookies.map(c => c.split(";")[0]).join("; ");
      const followRes = await axios.get(followUrl, {
        headers: { Cookie: cookieHeader, "User-Agent": "Mozilla/5.0" },
        maxRedirects: 0,
        validateStatus: s => s >= 200 && s < 400
      });
      rawCookies = rawCookies.concat(followRes.headers["set-cookie"] || []);
    }

    if (!rawCookies.length) throw new Error("Login failed — no cookies returned");

    return rawCookies.map(s => s.split(";")[0]).join("; ");
  } catch (err) {
    throw new Error("Login request failed: " + (err.response?.status || err.message));
  }
}
