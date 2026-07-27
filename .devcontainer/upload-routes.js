#!/usr/bin/env node
/**
 * Upload routes.yaml to Ghost via Admin API
 * Usage: node upload-routes.js <api-key-id:secret> <routes-file-path>
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

const [apiKey, routesPath] = process.argv.slice(2);

if (!apiKey || !routesPath) {
  console.error("Usage: node upload-routes.js <api-key-id:secret> <routes-file-path>");
  process.exit(1);
}

const [id, secret] = apiKey.split(":");
const ghostUrl = process.env.GHOST_URL || "http://localhost:2368";

// Generate JWT
const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })).toString(
  "base64url"
);
const payload = Buffer.from(
  JSON.stringify({
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    aud: "/admin/",
  })
).toString("base64url");
const signature = crypto
  .createHmac("sha256", Buffer.from(secret, "hex"))
  .update(`${header}.${payload}`)
  .digest("base64url");
const jwt = `${header}.${payload}.${signature}`;

// Read routes file
const routesYaml = fs.readFileSync(routesPath, "utf8");

// Upload
const url = new URL("/ghost/api/admin/settings/routes/yaml/", ghostUrl);
const isHttps = url.protocol === "https:";
const client = isHttps ? https : http;

const req = client.request(
  {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: "POST",
    headers: {
      Authorization: `Ghost ${jwt}`,
      "Content-Type": "text/x-yaml",
      "Content-Length": Buffer.byteLength(routesYaml),
    },
  },
  res => {
    let body = "";
    res.on("data", chunk => (body += chunk));
    res.on("end", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("✓ Routes uploaded successfully");
        process.exit(0);
      } else {
        console.error(`✗ Upload failed (${res.statusCode}): ${body}`);
        process.exit(1);
      }
    });
  }
);

req.on("error", err => {
  console.error(`✗ Request error: ${err.message}`);
  process.exit(1);
});

req.write(routesYaml);
req.end();
