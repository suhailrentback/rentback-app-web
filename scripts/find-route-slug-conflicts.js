// scripts/find-route-slug-conflicts.js
const fs = require("fs");
const path = require("path");

const appDir = path.join(process.cwd(), "app");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      acc.push(full);
      walk(full, acc);
    }
  }
  return acc;
}

function stripRouteGroup(seg) {
  // remove (group) segments from the URL
  return seg.replace(/^\((.*)\)$/, "");
}
function isDynamic(seg) {
  return /^\[.*\]$/.test(seg);
}
function dynamicName(seg) {
  // handles [id], [...slug], [[...slug]]
  const m = seg.match(/^\[+\.{0,3}(.+?)\]+$/);
  return m ? m[1] : null;
}

const dirs = walk(appDir);
const routeDirs = dirs.filter((d) =>
  ["page.tsx", "page.jsx", "route.ts", "route.js"].some((f) =>
    fs.existsSync(path.join(d, f))
  )
);

const entries = [];
for (const d of routeDirs) {
  const relParts = path.relative(appDir, d).split(path.sep).filter(Boolean);
  const visibleSegs = relParts.map(stripRouteGroup).filter(Boolean);
  const shapeSegs = visibleSegs.map((s) => (isDynamic(s) ? "[]" : s));
  const names = visibleSegs.filter(isDynamic).map(dynamicName);
  const shapeKey = "/" + shapeSegs.join("/");
  entries.push({
    rel: relParts.join("/"),
    visiblePath: "/" + visibleSegs.join("/"),
    shapeKey,
    names,
  });
}

// group by shapeKey (same visible path shape)
const byShape = new Map();
for (const e of entries) {
  const arr = byShape.get(e.shapeKey) || [];
  arr.push(e);
  byShape.set(e.shapeKey, arr);
}

let conflict = false;
for (const [shape, arr] of byShape.entries()) {
  // same path shape but different param name signatures => conflict
  const sigs = new Map();
  for (const e of arr) {
    const sig = JSON.stringify(e.names);
    if (!sigs.has(sig)) sigs.set(sig, []);
    sigs.get(sig).push(e);
  }
  if (sigs.size > 1) {
    conflict = true;
    console.log("⚠️  Slug-name conflict for path shape:", shape);
    for (const [sig, list] of sigs.entries()) {
      console.log("   Param names:", sig);
      list.forEach((x) =>
        console.log("   •", x.visiblePath, "(folder: app/" + x.rel + ")")
      );
    }
    console.log();
  }
}

if (!conflict) {
  console.log("✅ No dynamic slug-name conflicts found.");
}
