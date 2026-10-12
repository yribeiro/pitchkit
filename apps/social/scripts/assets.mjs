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
import { existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { BUCKET, OUT, bucket, fail, folderOf, mb, md5, objectFor, put } from "./lib/bucket.mjs";
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
