/**
 * Keeps rendered assets in Google Cloud Storage (gs://pitchkit-assets), so any
 * session or machine can fetch what another one made. Renders stay out of git:
 * render to out/, upload, and out/ can be cleared.
 *
 *   npm run assets --workspace=social -- upload reel-07-claude [--dry-run]
 *   npm run assets --workspace=social -- upload --all [--dry-run]
 *   npm run assets --workspace=social -- upload reel-07-claude --into stills a.png b.png
 *   npm run assets --workspace=social -- download reel-07-claude [dir]
 *   npm run assets --workspace=social -- list [prefix]
 *
 * One layout for everything, keyed by composition id (src/Root.tsx):
 *
 *   reels/<NN>-<slug>/        reel-07-claude → reels/07-claude/
 *     <slug>.mp4              the cut (out/reel-07-claude.mp4 → claude.mp4)
 *     <slug>-<variant>.mp4    another cut of it (…-flat, …-loop)
 *     cover.png               out/<id>-cover.png; cover-<variant>.png for a variant's
 *     audio/                  any .mp3/.wav for it (voiceovers)
 *     drafts/                 files ending -preview, -draft or -v<N>
 *     stills/                 files named with -still-, or uploaded with --into stills
 *   posts/<NN>-<slug>/<slug>.png      (+ <slug>-animated.mp4)
 *   carousels/01-corner-kicks/<NN>-<slide>.png
 *   linkedin/<slug>.png
 *   mosaic/wall.png, preview.png, profile.png, tile-<N>.png
 *   brand/x-header.png
 *   experiments/<slug>/<slug>.mp4
 *
 * Upload sends out/<id>.* and out/<id>-*, skipping files whose MD5 already
 * matches the bucket copy. Download mirrors a folder into out/<folder> (or the
 * dir given).
 *
 * Credentials, read from apps/social/.env.local if present, then the
 * environment: GCS_BUCKET, plus either GOOGLE_APPLICATION_CREDENTIALS (a key
 * file path, kept outside the repo) or GCS_SERVICE_ACCOUNT_JSON (the key's
 * contents, for cloud sessions where only environment variables persist).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { Storage } from "@google-cloud/storage";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

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
function home(id) {
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
function objectFor(name) {
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
function folderOf(id) {
  const where = home(VARIANT_OF[id] ?? id);
  if (!where) fail(`Unknown asset id: ${id}`);
  return where.folder;
}

/* Storage --------------------------------------------------------------------- */

const BUCKET = process.env.GCS_BUCKET;

function bucket() {
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

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** GCS stores MD5 as base64; compare like with like. */
const md5 = (file) => createHash("md5").update(readFileSync(file)).digest("base64");
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const TYPES = {
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
async function put(pairs, dryRun) {
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

/* Commands -------------------------------------------------------------------- */

const outFiles = () =>
  existsSync(OUT) ? readdirSync(OUT).filter((f) => statSync(join(OUT, f)).isFile()) : [];

async function upload(args, dryRun) {
  const into = args.indexOf("--into");
  const sub = into >= 0 ? args[into + 1] : null;
  const rest = into >= 0 ? args.filter((_, i) => i !== into && i !== into + 1) : args;
  const [id, ...extras] = rest;
  if (!id) fail("Usage: assets upload <asset-id>|--all [--into <subfolder> files…] [--dry-run]");

  if (id === "--all") {
    const pairs = [];
    const unknown = [];
    for (const f of outFiles()) {
      const name = objectFor(f);
      if (name) pairs.push([join(OUT, f), name]);
      else unknown.push(f);
    }
    if (unknown.length) console.log(`  skipped (no matching id): ${unknown.join(", ")}`);
    return put(pairs, dryRun);
  }

  const pairs = outFiles()
    .filter((f) => f.startsWith(`${id}.`) || f.startsWith(`${id}-`))
    .map((f) => [join(OUT, f), objectFor(f)]);
  const folder = folderOf(id);
  for (const f of extras) {
    const file = join(process.cwd(), f);
    if (!existsSync(file)) fail(`Not found: ${f}`);
    pairs.push([file, `${folder}${sub ? `${sub}/` : ""}${basename(f)}`]);
  }
  if (pairs.length === 0) fail(`Nothing to upload: no out/${id}.* or out/${id}-* files.`);
  return put(pairs, dryRun);
}

async function download(id, dir) {
  if (!id) fail("Usage: assets download <asset-id> [dir]");
  const folder = folderOf(id);
  const target = dir ?? join(OUT, folder);
  const [files] = await bucket().getFiles({ prefix: folder });
  if (files.length === 0) fail(`Nothing at gs://${BUCKET}/${folder}`);
  for (const file of files) {
    const local = join(target, file.name.slice(folder.length));
    if (existsSync(local) && md5(local) === file.metadata.md5Hash) {
      console.log(`  same  ${relative(process.cwd(), local)}`);
      continue;
    }
    mkdirSync(dirname(local), { recursive: true });
    await file.download({ destination: local });
    console.log(`  got   ${relative(process.cwd(), local)} (${mb(Number(file.metadata.size))})`);
  }
}

async function list(prefix = "") {
  const [files] = await bucket().getFiles({ prefix });
  for (const f of files) console.log(`${mb(Number(f.metadata.size)).padStart(9)}  ${f.name}`);
  console.log(`${files.length} objects in gs://${BUCKET}/${prefix}`);
}

const [command, ...args] = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rest = args.filter((a) => a !== "--dry-run");

if (command === "upload") await upload(rest, dryRun);
else if (command === "download") await download(rest[0], rest[1]);
else if (command === "list") await list(rest[0]);
else if (command === "where") for (const f of rest) console.log(`${f} → ${objectFor(f)}`);
else fail("Usage: assets <upload|download|list|where> … (see scripts/assets.mjs)");
