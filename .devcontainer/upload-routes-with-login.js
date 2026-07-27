#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const GHOST_URL = "http://localhost:2368";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "RandomSecure123456789";
const ROUTES_FILE = path.join(__dirname, "../routes.yaml");

async function uploadRoutes() {
  try {
    const FormData = require("form-data");
    const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

    // Step 1: Get session cookie by logging in
    console.log("Logging in to Ghost Admin...");
    const loginResponse = await fetch(`${GHOST_URL}/ghost/api/admin/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const cookies = loginResponse.headers.raw()["set-cookie"];
    const sessionCookie = cookies.find(c => c.startsWith("ghost-admin-api-session="));

    if (!sessionCookie) {
      throw new Error("No session cookie received");
    }

    console.log("✓ Logged in successfully");

    // Step 2: Upload routes.yaml
    console.log("Uploading routes.yaml...");
    const form = new FormData();
    form.append("routes", fs.createReadStream(ROUTES_FILE), {
      filename: "routes.yaml",
      contentType: "application/x-yaml",
    });

    const uploadResponse = await fetch(`${GHOST_URL}/ghost/api/admin/settings/routes/yaml/`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`
      );
    }

    const result = await uploadResponse.json();
    console.log("✓ Routes uploaded successfully");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
}

uploadRoutes();
