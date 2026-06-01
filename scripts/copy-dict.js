const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "kuromoji", "dict");
const dst = path.join(__dirname, "..", "dict");

if (!fs.existsSync(src)) {
  console.log("[copy-dict] kuromoji dict not found, skipping");
  process.exit(0);
}

if (!fs.existsSync(dst)) {
  fs.mkdirSync(dst, { recursive: true });
}

const files = fs.readdirSync(src);
let copied = 0;
for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dst, file));
  copied++;
}

console.log(`[copy-dict] Copied ${copied} dictionary files to ./dict/`);