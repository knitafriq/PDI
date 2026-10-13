const crypto = require("crypto");

const COOKIE_NAME = "salga_model_reference_access";

function parseCookies(header) {
  const out = {};
  if (!header) return out;

  header.split(";").forEach((part) => {
    const index = part.indexOf("=");
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    out[key] = decodeURIComponent(value);
  });

  return out;
}

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createToken(email, secret) {
  const payload = b64url(JSON.stringify({
    email,
    iat: Date.now(),
    purpose: "salga-model-reference-access"
  }));

  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return false;

  const [payload, provided] = token.split(".");
  const expected = sign(payload, secret);

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  Object.entries(extraHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.end(JSON.stringify(body));
}

function isAllowedEmail(email, allowedRaw) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return false;

  const entries = String(allowedRaw || "")
    .split(/[,\n;\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (entries.length === 0) return false;

  return entries.some((entry) => {
    if (entry === normalized) return true;

    if (entry.startsWith("*.")) {
      const domain = entry.slice(2);
      return normalized.endsWith(`@${domain}`) || normalized.endsWith(`.${domain}`);
    }

    if (entry.startsWith("@")) {
      return normalized.endsWith(entry);
    }

    if (!entry.includes("@") && normalized.endsWith(`@${entry}`)) {
      return true;
    }

    return false;
  });
}

module.exports = async function handler(req, res) {
  const sharedPassword =
    process.env.SALGA_MODEL_REFERENCE_SHARED_PASSWORD || "";

  const allowedEmails =
    process.env.SALGA_MODEL_REFERENCE_ALLOWED_EMAILS || "";

  const sessionSecret =
    process.env.SALGA_MODEL_REFERENCE_SESSION_SECRET || "";

  if (!sharedPassword || !allowedEmails || !sessionSecret) {
    return json(res, 500, {
      authenticated: false,
      error: "model_access_not_configured"
    });
  }

  if (req.method === "GET") {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];

    return json(res, 200, {
      authenticated: verifyToken(token, sessionSecret)
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, {
      authenticated: false,
      error: "method_not_allowed"
    });
  }

  let body = "";

  await new Promise((resolve) => {
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", resolve);
  });

  let parsed = {};
  try {
    parsed = JSON.parse(body || "{}");
  } catch {
    return json(res, 400, {
      authenticated: false,
      error: "invalid_json"
    });
  }

  const email =
    String(parsed.email || "").trim().toLowerCase();

  const password =
    String(parsed.password || "");

  const passwordOk =
    password.length === sharedPassword.length &&
    crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(sharedPassword)
    );

  const emailOk =
    isAllowedEmail(email, allowedEmails);

  if (!passwordOk || !emailOk) {
    return json(res, 401, {
      authenticated: false
    });
  }

  const token =
    createToken(email, sessionSecret);

  return json(
    res,
    200,
    { authenticated: true },
    {
      "Set-Cookie":
        `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`
    }
  );
};