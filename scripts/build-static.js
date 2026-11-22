const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const output = path.join(root, "dist");
const entries = ["index.html", "portal.css", "cloud-worship", "cloud-fishing", "food-fun", "not-a-leek"];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const entry of entries) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}

console.log(`Static build completed: ${output}`);
