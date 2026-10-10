/**
 * Keeps rendered assets in Google Cloud Storage, so any session or machine can
 * fetch what another one made. Renders stay out of git; this is their home.
 *
 *   npm run assets --workspace=social -- upload reel-07-claude [extra files…] [--dry-run]
 *   npm run assets --workspace=social -- download reel-07-claude [dir]
 *   npm run assets --workspace=social -- list [prefix]
 *
 * An asset ID is a render's base name in out/. Upload sends `out/<id>.*` and
 * `out/<id>-*` (its cover, loop and so on), plus any extra files named, to
 * `reels/<id without "reel-">/` (or `posts/<id>/` for anything that isn't a
 * reel). Files whose MD5 already matches the bucket copy are skipped.
 * Download fetches that folder into out/ (or the dir given).
 *
 * Credentials, read from apps/social/.env.local if present, then the
 * environment: GCS_BUCKET, plus either GOOGLE_APPLICATION_CREDENTIALS (a key
 * file path, kept outside the repo) or GCS_SERVICE_ACCOUNT_JSON (the key's
 * contents, for cloud sessions where only environment variables persist).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { Storage } from "@google-cloud/storage";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

const envFile = join(ROOT, ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const BUCKET = process.env.GCS_BUCKET;
if (!BUCKET) fail("GCS_BUCKET is not set (see the header of scripts/assets.mjs).");

function storage() {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile && existsSync(keyFile)) return new Storage({ keyFilename: keyFile });
  const json = process.env.GCS_SERVICE_ACCOUNT_JSON;
  if (json) {
    const credentials = JSON.parse(json);
    return new Storage({ credentials, projectId: credentials.project_id });
  }
  fail("No credentials: set GOOGLE_APPLICATION_CREDENTIALS or GCS_SERVICE_ACCOUNT_JSON.");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** reel-07-claude → reels/07-claude/; anything else → posts/<id>/. */
const folderOf = (id) => (id.startsWith("reel-") ? `reels/${id.slice(5)}/` : `posts/${id}/`);

/** GCS stores MD5 as base64; compare like with like. */
const md5 = (file) => createHash("md5").update(readFileSync(file)).digest("base64");

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const TYPES = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".json": "application/json",
  ".md": "text/markdown",
  ".txt": "text/plain",
};
const typeOf = (file) => TYPES[file.slice(file.lastIndexOf(".")).toLowerCase()];

async function upload(id, extras, dryRun) {
  if (!id) fail("Usage: assets upload <asset-id> [extra files…] [--dry-run]");
  const renders = existsSync(OUT)
    ? readdirSync(OUT)
        .filter((f) => f.startsWith(`${id}.`) || f.startsWith(`${id}-`))
        .map((f) => join(OUT, f))
    : [];
  const files = [...renders, ...extras.map((f) => join(process.cwd(), f))];
  if (files.length === 0) fail(`Nothing to upload: no out/${id}.* or out/${id}-* files.`);
  for (const f of files) if (!existsSync(f)) fail(`Not found: ${f}`);

  const bucket = storage().bucket(BUCKET);
  const folder = folderOf(id);
  let sent = 0;
  for (const file of files) {
    const name = folder + basename(file);
    const [exists] = await bucket.file(name).exists();
    if (exists) {
      const [meta] = await bucket.file(name).getMetadata();
      if (meta.md5Hash === md5(file)) {
        console.log(`  same      ${name}`);
        continue;
      }
    }
    const size = mb(statSync(file).size);
    if (dryRun) {
      console.log(`  would put ${name} (${size})`);
      continue;
    }
    await bucket.upload(file, { destination: name, contentType: typeOf(file), resumable: false });
    console.log(`  put       ${name} (${size})`);
    sent++;
  }
  console.log(`${dryRun ? "Dry run: " : ""}${sent} uploaded to gs://${BUCKET}/${folder}`);
}

async function download(id, dir = OUT) {
  if (!id) fail("Usage: assets download <asset-id> [dir]");
  const folder = folderOf(id);
  const [files] = await storage().bucket(BUCKET).getFiles({ prefix: folder });
  if (files.length === 0) fail(`Nothing at gs://${BUCKET}/${folder}`);
  mkdirSync(dir, { recursive: true });
  for (const file of files) {
    const target = join(dir, file.name.slice(folder.length));
    if (existsSync(target) && md5(target) === file.metadata.md5Hash) {
      console.log(`  same  ${relative(process.cwd(), target)}`);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    await file.download({ destination: target });
    console.log(`  got   ${relative(process.cwd(), target)} (${mb(Number(file.metadata.size))})`);
  }
}

async function list(prefix = "") {
  const [files] = await storage().bucket(BUCKET).getFiles({ prefix });
  for (const f of files) console.log(`${mb(Number(f.metadata.size)).padStart(9)}  ${f.name}`);
  console.log(`${files.length} objects in gs://${BUCKET}/${prefix}`);
}

const [command, ...args] = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rest = args.filter((a) => a !== "--dry-run");

if (command === "upload") await upload(rest[0], rest.slice(1), dryRun);
else if (command === "download") await download(rest[0], rest[1]);
else if (command === "list") await list(rest[0]);
else fail("Usage: assets <upload|download|list> … (see scripts/assets.mjs)");
