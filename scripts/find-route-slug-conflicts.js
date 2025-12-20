// scans ./app for dynamic folder names and reports mismatches on identical paths
const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "app");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, acc);
    else if (name === "page.tsx" || name === "route.ts") acc.push(p);
  }
  return acc;
}

function normalizeAppPath(absFile) {
  // strip root and filename
  let rel = absFile.replace(ROOT, "").replace(/\/(page|route)\.tsx?$/, "");
  // drop route groups: /(marketing)/ -> /
  rel = rel.replace(/\/\([^/]+\)/g, "");
  // split into segments, track dynamic names in order
  const segs = rel.split("/").filter(Boolean);
  const dynNames = [];
  const normSegs = segs.map(s => {
    const m = s.match(/^\[([^\]]+)\]$/);
    if (m) { dynNames.push(m[1]); return "[]"; }
    return s;
  });
  return { key: normSegs.join("/"), dynNames, file: absFile };
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.log("No app/ directory found.");
    process.exit(0);
  }
  const files = walk(ROOT);
  const buckets = new Map(); // key|index -> Set of names
  const samples = new Map(); // key -> array of {file, dynNames}

  for (const f of files) {
    const { key, dynNames, file } = normalizeAppPath(f);
    if (!samples.has(key)) samples.set(key, []);
    samples.get(key).push({ file, dynNames });
    dynNames.forEach((name, idx) => {
      const k = `${key}|${idx}`;
      if (!buckets.has(k)) buckets.set(k, new Set());
      buckets.get(k).add(name);
    });
  }

  let found = false;
  for (const [k, set] of buckets.entries()) {
    if (set.size > 1) {
      found = true;
      const [key, idx] = k.split("|");
      console.log("\n⚠️  Conflict on path:", `/${key}`);
      console.log("   Dynamic segment index:", idx);
      console.log("   Different names:", Array.from(set).join(", "));
      console.log("   Files:");
      for (const s of samples.get(key) || []) {
        console.log("   -", s.file.replace(process.cwd()+"/", ""), "params:", s.dynNames.join("/"));
      }
    }
  }

  if (found) {
    console.error("\n❌ Fix by renaming the dynamic folders so the names match for the same path.");
    process.exit(1);
  } else {
    console.log("✅ No slug conflicts detected.");
  }
}
main();
