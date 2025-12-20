import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "app");

function listRoutes(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) listRoutes(p, acc);
    else if (/\/(page|route)\.tsx?$/.test(p)) acc.push(p);
  }
  return acc;
}

function normalize(abs) {
  // strip root + filename
  let rel = abs.replace(ROOT, "").replace(/\/(page|route)\.tsx?$/, "");
  // remove route groups: /(marketing)/ -> /
  rel = rel.replace(/\/\([^/]+\)/g, "");
  const segs = rel.split("/").filter(Boolean);
  const dyn = [];
  const key = segs.map(s => {
    const m = s.match(/^\[([^\]]+)\]$/);
    if (m) { dyn.push(m[1]); return "[]"; }
    return s;
  }).join("/");
  return { key, dyn, file: abs };
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.log("No app/ directory present. Skipping.");
    process.exit(0);
  }
  const files = listRoutes(ROOT);
  const buckets = new Map();   // key|index -> Set(names)
  const samples = new Map();   // key -> [{file, dyn}]

  for (const f of files) {
    const { key, dyn, file } = normalize(f);
    if (!samples.has(key)) samples.set(key, []);
    samples.get(key).push({ file, dyn });
    dyn.forEach((name, i) => {
      const k = `${key}|${i}`;
      if (!buckets.has(k)) buckets.set(k, new Set());
      buckets.get(k).add(name);
    });
  }

  let bad = false;
  for (const [k, set] of buckets.entries()) {
    if (set.size > 1) {
      bad = true;
      const [key, idx] = k.split("|");
      console.log(`\n⚠️  Slug name conflict on: /${key} (segment #${idx})`);
      console.log(`   Different names: ${[...set].join(", ")}`);
      console.log("   Files:");
      for (const s of (samples.get(key) || [])) {
        const rel = s.file.replace(process.cwd() + path.sep, "");
        console.log(`   - ${rel}  params: ${s.dyn.join("/") || "(none)"}`);
      }
    }
  }

  if (bad) {
    console.error("\n❌ Rename the dynamic folders so the names match for the same URL (e.g. use [id] everywhere).");
    process.exit(1);
  } else {
    console.log("✅ No slug conflicts detected.");
  }
}
main();
