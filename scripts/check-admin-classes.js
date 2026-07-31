#!/usr/bin/env node
/**
 * check-admin-classes.js — verify the Admin-only styling channel still holds.
 *
 *   node scripts/check-admin-classes.js
 *
 * The cards style their Admin view with Tailwind utilities taken from Ghost Admin's
 * own stylesheet (see scripts/cards/index.js for why). That rests on two conditions,
 * neither of which is ours to control:
 *
 *   1. Every utility the chip uses survives in Admin's PURGED Tailwind build. Ghost
 *      only ships classes Admin itself uses, so an upgrade can drop one — the chip
 *      then degrades to unstyled text with no error anywhere.
 *   2. None of those utilities appears in the theme's built screen.css. If one ever
 *      did, it would leak Admin styling onto the public site — or, for `hidden`,
 *      blank the card entirely.
 *
 * Run after a Ghost upgrade, and after adding a utility to the chip.
 * Exits non-zero if either condition breaks.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const THEME_ROOT = path.resolve(__dirname, "..");
const THEME_CSS = path.join(THEME_ROOT, "assets", "built", "screen.css");
const ADMIN_ASSETS = "/var/lib/ghost/current/core/built/admin";

// Every class the cards hand to Admin. Keep in sync with CHIP/CHIP_TYPE/CHIP_TEXT in
// scripts/cards/index.js and the `hidden` on .custom-card-body.
const ADMIN_CLASSES = [
  "flex",
  "items-center",
  "gap-2",
  "rounded",
  "border",
  "border-grey-200",
  "bg-grey-50",
  "px-3",
  "py-2",
  "select-none",
  "font-mono",
  "text-xs",
  "uppercase",
  "tracking-wide",
  "text-grey-700",
  "truncate",
  "text-sm",
  "text-grey-600",
  "hidden",
];

/**
 * Build a regex matching `.class` used as a selector.
 * @param {string} name bare class name, e.g. "text-grey-600"
 * @returns {RegExp} matcher for that class in a selector position
 */
function selector(name) {
  const escaped = name.replace(/[-[\]().]/g, c => "\\" + c);
  return new RegExp("\\." + escaped + "(?=[,{:>\\s])");
}

/**
 * Read Ghost Admin's stylesheet out of the ghost-dev container.
 * @returns {string} the concatenated admin CSS
 */
function readAdminCss() {
  const list = execFileSync(
    "bash",
    [
      path.join(THEME_ROOT, "scripts", "ghost-exec.sh"),
      "sh",
      "-c",
      `grep -o 'assets/[a-zA-Z0-9._-]*\\.css' ${ADMIN_ASSETS}/index.html | sort -u`,
    ],
    { encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean);

  if (!list.length) throw new Error("no stylesheets referenced by Admin's index.html");

  return list
    .map(rel =>
      execFileSync(
        "bash",
        [path.join(THEME_ROOT, "scripts", "ghost-exec.sh"), "cat", `${ADMIN_ASSETS}/${rel}`],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
      )
    )
    .join("\n");
}

function main() {
  if (!fs.existsSync(THEME_CSS)) {
    console.error(`✗ ${path.relative(THEME_ROOT, THEME_CSS)} not built — run: pnpm gulp build`);
    process.exit(1);
  }
  const themeCss = fs.readFileSync(THEME_CSS, "utf8");
  const adminCss = readAdminCss();

  console.log("Checking Admin-only card classes");
  console.log(`  admin css : ${adminCss.length} bytes`);
  console.log(`  theme css : ${themeCss.length} bytes\n`);

  const missing = [];
  const leaking = [];

  for (const name of ADMIN_CLASSES) {
    const re = selector(name);
    const inAdmin = re.test(adminCss);
    const inTheme = re.test(themeCss);
    if (!inAdmin) missing.push(name);
    if (inTheme) leaking.push(name);
    console.log(
      `  ${inAdmin && !inTheme ? "✓" : "✗"} ${name.padEnd(16)} admin:${inAdmin ? "yes" : "NO "} theme:${inTheme ? "YES" : "no "}`
    );
  }

  console.log("");
  if (missing.length) {
    console.error(`✗ purged from Admin's Tailwind build: ${missing.join(", ")}`);
    console.error("  The Admin chip will render unstyled. Pick replacements Admin still uses.");
  }
  if (leaking.length) {
    console.error(`✗ also defined in the theme's screen.css: ${leaking.join(", ")}`);
    console.error("  These would leak Admin styling onto the public site.");
  }
  if (missing.length || leaking.length) process.exit(1);

  console.log("✓ all Admin-only classes present in Admin and absent from the theme");
}

try {
  main();
} catch (err) {
  console.error("✗ " + err.message);
  process.exit(1);
}
