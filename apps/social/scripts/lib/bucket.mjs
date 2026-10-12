/**
 * The asset bucket: credentials, the layout that maps a render to its object
 * name, and uploading. Shared by scripts/assets.mjs and scripts/storyboard.mjs;
 * the layout is documented in the header of scripts/assets.mjs.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { Storage } from "@google-cloud/storage";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const OUT = join(ROOT, "out");

const envFile = join(ROOT, ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

/* Where things go ------------------------------------------------------------ */

/** Every composition id, plus files render-all.mjs cuts from them. */
const IDS = [
  ...readFileSync(join(ROOT, "src", "Root.tsx"), "utf8").matchAll(/\bid="([^"]+)"/g),
].map((m) => m[1]);
IDS.push("mosaic-tile");

/** Compositions that are another cut of one, and live in its folder. */
const VARIANT_OF = {
  "post-03-winner-animated": "post-03-winner",
  "reel-04-networks-loop": "reel-04-networks",
};

/** An id's folder, and the base name its files take there. */
export function home(id) {
  let m;
  if ((m = id.match(/^reel-(\d\d)-(.+)$/))) return { folder: `reels/${m[1]}-${m[2]}/`, base: m[2] };
  if ((m = id.match(/^post-(\d\d)-(.+)$/))) return { folder: `posts/${m[1]}-${m[2]}/`, base: m[2] };
  if ((m = id.match(/^carousel-(\d\d-.+)$/)))
    return { folder: "carousels/01-corner-kicks/", base: m[1] };
  if ((m = id.match(/^linkedin-(.+)$/))) return { folder: "linkedin/", base: m[1] };
  if (id === "wall-mosaic") return { folder: "mosaic/", base: "wall" };
  if ((m = id.match(/^wall-mosaic-(.+)$/))) return { folder: "mosaic/", base: m[1] };
  if (id === "mosaic-tile") return { folder: "mosaic/", base: "tile" };
  if (id === "x-header") return { folder: "brand/", base: "x-header" };
  if ((m = id.match(/^experiment-(.+)$/))) return { folder: `experiments/${m[1]}/`, base: m[1] };
  return null;
}

/** The id a local file belongs to: the longest id it starts with. */
function idOf(stem) {
  return IDS.filter((id) => stem === id || stem.startsWith(`${id}-`)).sort(
    (a, b) => b.length - a.length,
  )[0];
}

/** out/<name> → its object name in the bucket, or null if it belongs to nothing. */
export function objectFor(name) {
  const ext = extname(name);
  const stem = name.slice(0, -ext.length);
  let id = idOf(stem);
  if (!id) return null;
  let rest = stem.slice(id.length);
  if (VARIANT_OF[id]) {
    rest = id.slice(VARIANT_OF[id].length) + rest;
    id = VARIANT_OF[id];
  }
  const where = home(id);
  if (!where) return null;
  const { folder, base } = where;
  if (rest === "-cover") return `${folder}cover${ext}`;
  if (rest.endsWith("-cover")) return `${folder}cover${rest.slice(0, -"-cover".length)}${ext}`;
  const sub = [".mp3", ".wav", ".m4a"].includes(ext)
    ? "audio/"
    : /-(preview|draft|v\d+)$/.test(rest)
      ? "drafts/"
      : rest.includes("-still")
        ? "stills/"
        : "";
  return `${folder}${sub}${base}${rest}${ext}`;
}

/** The folder an id's files live in, for download. */
export function folderOf(id) {
  const where = home(VARIANT_OF[id] ?? id);
  if (!where) fail(`Unknown asset id: ${id}`);
  return where.folder;
}

/* Storage --------------------------------------------------------------------- */

export const BUCKET = process.env.GCS_BUCKET;

export function bucket() {
  if (!BUCKET) fail("GCS_BUCKET is not set (see the header of scripts/assets.mjs).");
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile && existsSync(keyFile)) return new Storage({ keyFilename: keyFile }).bucket(BUCKET);
  const json = process.env.GCS_SERVICE_ACCOUNT_JSON;
  if (json) {
    const credentials = JSON.parse(json);
    return new Storage({ credentials, projectId: credentials.project_id }).bucket(BUCKET);
  }
  fail("No credentials: set GOOGLE_APPLICATION_CREDENTIALS or GCS_SERVICE_ACCOUNT_JSON.");
}

export function fail(message) {
  console.error(message);
  process.exit(1);
}

/** GCS stores MD5 as base64; compare like with like. */
export const md5 = (file) => createHash("md5").update(readFileSync(file)).digest("base64");
export const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const TYPES = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".json": "application/json",
  ".html": "text/html",
  ".md": "text/markdown",
  ".txt": "text/plain",
};

/** Uploads [local path, object name] pairs, skipping any already identical. */
export async function put(pairs, dryRun) {
  const b = bucket();
  let sent = 0;
  for (const [file, name] of pairs) {
    const [exists] = await b.file(name).exists();
    if (exists) {
      const [meta] = await b.file(name).getMetadata();
      if (meta.md5Hash === md5(file)) {
        console.log(`  same      ${name}`);
        continue;
      }
    }
    const size = mb(statSync(file).size);
    if (dryRun) {
      console.log(`  would put ${name} (${size})  ← ${relative(process.cwd(), file)}`);
      continue;
    }
    const contentType = TYPES[extname(file).toLowerCase()];
    await b.upload(file, { destination: name, contentType, resumable: false });
    console.log(`  put       ${name} (${size})`);
    sent++;
  }
  console.log(`${dryRun ? "Dry run: " : ""}${sent} uploaded to gs://${BUCKET}/`);
}
