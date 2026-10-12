/**
 * A reel's storyboard page: its beats, each with a rendered frame, timing,
 * what's on screen, the motion and the sound; the reel and its cover; the
 * copy; and the notes. One HTML page in out/storyboard/<id>/, ready to publish
 * as an artifact or upload to the bucket.
 *
 *   npm run storyboard --workspace=social -- reel-07-claude [--upload] [--no-render]
 *
 * The beats live in src/storyboards/<id>.json, which the reel reads its
 * timeline from too, so the board and the render can't drift apart. A beat is
 * { key, title, start, end, still, onScreen, motion, sound }, frames at the
 * file's fps; `still` is the frame shown for it.
 *
 * The reel and cover come from out/<id>.mp4 and out/<id>-cover.png when
 * rendered locally, otherwise from the bucket. Download links are signed
 * bucket URLs valid for 7 days (a published page can't start downloads
 * itself); re-run to refresh them. The copy comes from the reel's section of
 * CAPTIONS.md (the heading naming its bucket folder). --upload puts the page
 * in the bucket at <folder>storyboard/. --no-render reuses the frames already
 * in the output folder.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { BUCKET, OUT, ROOT, bucket, fail, folderOf, mb, objectFor, put } from "./lib/bucket.mjs";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
if (!id) fail("Usage: storyboard <composition-id> [--upload] [--no-render]");
const boardFile = join(ROOT, "src", "storyboards", `${id}.json`);
if (!existsSync(boardFile)) fail(`No beats file: src/storyboards/${id}.json`);
const board = JSON.parse(readFileSync(boardFile, "utf8"));
const dir = join(OUT, "storyboard", id);
mkdirSync(dir, { recursive: true });

const seconds = (frames) => frames / board.fps;
const fmt = (s) => `${s.toFixed(1)}s`;
const pad = (n) => String(n).padStart(2, "0");
const total = Math.max(...board.beats.map((b) => b.end));

/* Frames ---------------------------------------------------------------------- */

if (!args.includes("--no-render")) {
  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: join(ROOT, "src", "index.ts") });
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  if (composition.durationInFrames !== total)
    console.warn(
      `  note: the reel is ${composition.durationInFrames} frames, the beats end at ${total}`,
    );
  for (const [i, b] of board.beats.entries()) {
    await renderStill({
      serveUrl,
      composition,
      frame: b.still,
      output: join(dir, `beat-${pad(i + 1)}.png`),
      scale: 0.5,
      browserExecutable,
    });
    console.log(`  beat ${pad(i + 1)} · frame ${b.still}`);
  }
}

/* Reel and cover ---------------------------------------------------------------- */

const reelName = objectFor(`${id}.mp4`);
const coverName = objectFor(`${id}-cover.png`);
const local = { reel: join(OUT, `${id}.mp4`), cover: join(OUT, `${id}-cover.png`) };
const files = { reel: join(dir, "reel.mp4"), cover: join(dir, "cover.png") };
let links = null;
let b = null;
try {
  b = bucket();
} catch {
  b = null;
}
for (const key of ["reel", "cover"]) {
  if (existsSync(local[key])) copyFileSync(local[key], files[key]);
  else if (b)
    await b.file(key === "reel" ? reelName : coverName).download({ destination: files[key] });
  else console.warn(`  no ${key}: render it or set bucket credentials`);
}
if (b) {
  const expires = Date.now() + 7 * 24 * 3600 * 1000;
  const sign = async (name, filename) =>
    (
      await b.file(name).getSignedUrl({
        version: "v4",
        action: "read",
        expires,
        responseDisposition: `attachment; filename="${filename}"`,
      })
    )[0];
  links = {
    reel: await sign(reelName, reelName.split("/").pop()),
    cover: await sign(coverName, `${id}-cover.png`),
    expires: new Date(expires).toISOString().slice(0, 10),
  };
}
const size = (f) => (existsSync(f) ? mb(readFileSync(f).length) : "");

/* Copy and notes, from CAPTIONS.md ---------------------------------------------- */

const folder = folderOf(id);
const captions = readFileSync(join(ROOT, "CAPTIONS.md"), "utf8");
const start = captions.search(new RegExp(`^## .*\`${folder.replace(/[/.]/g, "\\$&")}`, "m"));
let section = "";
if (start >= 0) {
  const next = captions.indexOf("\n## ", start + 3);
  section = captions.slice(start, next < 0 ? undefined : next);
} else console.warn(`  no CAPTIONS.md section names ${folder}`);
const fence = (label) => {
  const at = section.indexOf(`**${label}**`);
  if (at < 0) return "";
  const m = section.slice(at).match(/```\n([\s\S]*?)\n```/);
  return m ? m[1] : "";
};
const instagram = fence("Instagram");
const x = fence("X");
const alt = (section.match(/^\*\*Alt text:\*\* (.+)$/m) ?? [])[1] ?? "";
const intro = section
  .slice(section.indexOf("\n") + 1, Math.max(0, section.indexOf("**Instagram**")))
  .trim();
const factsAt = section.indexOf("Facts behind it");
const facts = factsAt >= 0 ? section.slice(factsAt).trim() : "";
writeFileSync(join(dir, "caption-instagram.txt"), `${instagram}\n`);
writeFileSync(join(dir, "caption-x.txt"), `${x}\n`);
writeFileSync(join(dir, "alt-text.txt"), `${alt}\n`);

/* Markdown, just enough of it ---------------------------------------------------- */

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
function markdown(text) {
  const out = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    if (lines[0].startsWith("|")) {
      const rows = lines
        .filter((l) => !/^\|\s*-/.test(l))
        .map((l) =>
          l
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim()),
        );
      const [headRow, ...body] = rows;
      out.push(
        `<div class="table"><table><thead><tr>${headRow.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
    } else out.push(`<p>${inline(lines.join(" "))}</p>`);
  }
  return out.join("\n");
}

/* The page ----------------------------------------------------------------------- */

const number = (id.match(/^reel-(\d\d)/) ?? [])[1];
const strip = board.beats
  .map(
    (b, i) =>
      `<a class="cell${i % 2 ? " alt" : ""}" href="#beat-${pad(i + 1)}" style="flex-grow:${b.end - b.start}" title="${esc(b.title)} · ${fmt(seconds(b.start))}–${fmt(seconds(b.end))}"><span>${pad(i + 1)}</span></a>`,
  )
  .join("");
const cards = board.beats
  .map(
    (b, i) => `
    <article class="beat" id="beat-${pad(i + 1)}">
      <img src="beat-${pad(i + 1)}.png" alt="Beat ${i + 1}, ${esc(b.title)}: frame ${b.still}" width="540" height="960" loading="lazy">
      <div class="beat-body">
        <header class="beat-head">
          <span class="num">${pad(i + 1)}</span>
          <h3>${esc(b.title)}</h3>
          <span class="time">${fmt(seconds(b.start))}–${fmt(seconds(b.end))} · ${fmt(seconds(b.end - b.start))}</span>
        </header>
        <dl>
          <dt>On screen</dt><dd>${inline(b.onScreen)}</dd>
          <dt>Motion</dt><dd>${inline(b.motion)}</dd>
          <dt>Sound</dt><dd>${inline(b.sound)}</dd>
          <dt>Frame</dt><dd class="mono">${b.still} (${fmt(seconds(b.still))}) · frames ${b.start}–${b.end}</dd>
        </dl>
      </div>
    </article>`,
  )
  .join("");
/** X counts every link as 23 characters. */
const weigh = (key, text) =>
  (key === "x" ? text.replace(/https?:\/\/\S+/g, "x".repeat(23)) : text).length;
const copyBlock = (key, label, text, limit) => `
    <section class="copy-block">
      <header><h3>${label}</h3><span class="count${limit && weigh(key, text) > limit ? " over" : ""}">${weigh(key, text)}${limit ? ` / ${limit}` : ""} characters${limit && weigh(key, text) > limit ? " · over the limit" : ""}</span>
        <button type="button" class="btn" data-copy="${key}">Copy</button></header>
      <pre id="copy-${key}" tabindex="0">${esc(text)}</pre>
    </section>`;
const download = (href, label, note) =>
  href
    ? `<a class="btn primary" href="${esc(href)}" target="_blank" rel="noopener">${label}</a><span class="note">${note}</span>`
    : `<span class="note">${label}: no bucket credentials, so no link. The file sits beside this page.</span>`;

const html = `<title>${esc(number ? `Reel ${number} storyboard` : `${id} storyboard`)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
/* Layout: a film-slate page. Pill tabs over one panel at a time; the storyboard
   is a timed strip (cell width = beat length) over one card per beat. One
   deliberate dark look, from the brief. */
:root {
  --bg: #1e1b22;
  --surface: #16141a;
  --line: #3a3540;
  --fg: #ece6df;
  --muted: #9a928b;
  --accent: #d9785e;
  --accent-2: #8f6b5d;
  --mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font: 15px/1.6 var(--sans); }
.wrap { max-width: 1120px; margin: 0 auto; padding-inline: 24px; padding-block: 28px 64px; }
@media (max-width: 480px) { .wrap { padding-inline: 16px; } }
.eyebrow, .tabs a, .section-head, .num, .time, .count, .cell span, .axis, dt, .btn, .mono, .note, code {
  font-family: var(--mono);
}
.eyebrow { color: var(--muted); letter-spacing: 0.14em; text-transform: uppercase; font-size: 12px; margin: 0; }
h1 { font: 600 clamp(24px, 4vw, 36px)/1.15 var(--sans); margin: 8px 0 6px; text-wrap: balance; }
.meta { color: var(--muted); font: 13px/1.5 var(--mono); margin: 0; }
.tabs { display: flex; flex-wrap: wrap; gap: 10px; margin: 28px 0 0; padding-bottom: 24px; border-bottom: 1px solid var(--line); }
.tabs a { color: var(--fg); text-decoration: none; letter-spacing: 0.12em; text-transform: uppercase; font-size: 14px;
  padding: 10px 22px; border: 1px solid var(--line); border-radius: 999px; }
.tabs a:hover { border-color: var(--muted); }
.tabs a[aria-selected="true"] { border-color: var(--accent); color: var(--accent); }
.tabs a:focus-visible, .btn:focus-visible, .cell:focus-visible, pre:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.panel { padding-top: 36px; }
.section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap;
  color: var(--muted); letter-spacing: 0.14em; text-transform: uppercase; font-size: 15px;
  padding-bottom: 14px; border-bottom: 2px solid var(--fg); margin: 0 0 18px; }
.section-head span:last-child { letter-spacing: 0.04em; text-transform: none; font-variant-numeric: tabular-nums; }
.strip { display: flex; gap: 6px; }
.cell { flex-basis: 0; min-width: 0; display: flex; align-items: flex-end; height: 92px; padding: 0 10px 12px;
  background: var(--surface); border-radius: 6px 6px 0 0; border-bottom: 5px solid var(--accent);
  color: var(--fg); text-decoration: none; overflow: hidden; }
.cell.alt { border-bottom-color: var(--accent-2); }
.cell:hover { background: #221f27; }
.cell span { font-size: 17px; font-variant-numeric: tabular-nums; }
.axis { display: flex; justify-content: space-between; color: var(--muted); font-size: 13px; margin: 12px 0 0; font-variant-numeric: tabular-nums; }
.beats { display: grid; gap: 20px; margin-top: 36px; }
.beat { display: grid; grid-template-columns: 180px 1fr; gap: 22px; padding: 18px; background: var(--surface); border-radius: 10px; scroll-margin-top: 16px; }
.beat img { width: 100%; height: auto; aspect-ratio: 9 / 16; border-radius: 6px; background: #000; display: block; }
.beat-body { min-width: 0; }
.beat-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
.num { color: var(--accent); font-size: 15px; font-variant-numeric: tabular-nums; }
.beat:nth-child(even) .num { color: var(--accent-2); }
.beat-head h3 { font: 600 19px/1.3 var(--sans); margin: 0; }
.time { margin-left: auto; color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
dl { display: grid; grid-template-columns: 96px 1fr; gap: 10px 16px; margin: 14px 0 0; }
dt { color: var(--muted); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; padding-top: 3px; }
dd { margin: 0; max-width: 64ch; }
.mono { font-size: 13px; color: var(--muted); }
@media (max-width: 640px) {
  .beat { grid-template-columns: 1fr; }
  .beat img { max-width: 240px; }
  dl { grid-template-columns: 1fr; gap: 2px 0; }
  dd { margin-bottom: 8px; }
  .cell { height: 64px; padding: 0 4px 8px; }
  .cell span { font-size: 12px; }
}
.reel { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 240px) 1fr; gap: 24px; align-items: start; }
.reel figure { margin: 0; }
.reel video, .reel figure img { width: 100%; max-width: 100%; aspect-ratio: 9 / 16; border-radius: 8px; background: #000; display: block; }
figcaption { color: var(--muted); font: 12px/1.5 var(--mono); margin-top: 8px; }
.actions { display: grid; gap: 10px; align-content: start; }
.btn { display: inline-flex; justify-content: center; align-items: center; gap: 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 9px 18px; cursor: pointer; text-decoration: none; }
.btn:hover { border-color: var(--muted); }
.btn.primary { border-color: var(--accent); color: var(--accent); }
.note { color: var(--muted); font-size: 12px; line-height: 1.5; }
@media (max-width: 860px) { .reel { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .actions { grid-column: 1 / -1; } }
@media (max-width: 480px) { .reel { grid-template-columns: 1fr; } }
.copy-block { padding: 18px; background: var(--surface); border-radius: 10px; }
.copy-block + .copy-block { margin-top: 18px; }
.copy-block header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.copy-block h3 { margin: 0; font: 600 17px/1.3 var(--sans); }
.count.over { color: var(--accent); }
.count { color: var(--muted); font-size: 12px; margin-right: auto; font-variant-numeric: tabular-nums; }
pre { margin: 14px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 14px/1.6 var(--sans); color: var(--fg); max-width: 72ch; }
.notes { max-width: 860px; }
.notes p { max-width: 70ch; }
code { font-size: 0.9em; background: #2a2630; padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere; }
.table { overflow-x: auto; margin-top: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }
th { font: 500 12px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
td:first-child { white-space: nowrap; color: var(--accent); }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>

<div class="wrap">
  <p class="eyebrow">PitchKit · ${number ? `Reel ${number}` : esc(id)}</p>
  <h1>${esc(board.title)}</h1>
  <p class="meta">${esc(id)} · ${fmt(seconds(total))} · ${board.fps} fps${board.formula ? ` · ${esc(board.formula)}` : ""}</p>

  <nav class="tabs" role="tablist" aria-label="Sections">
    <a href="#storyboard" role="tab" aria-controls="storyboard">Storyboard</a>
    <a href="#reel" role="tab" aria-controls="reel">Reel</a>
    <a href="#copy" role="tab" aria-controls="copy">Copy</a>
    <a href="#notes" role="tab" aria-controls="notes">Notes</a>
  </nav>

  <section class="panel" id="storyboard" role="tabpanel">
    <h2 class="section-head"><span>Storyboard</span><span>${board.beats.length} beats · ${fmt(seconds(total))}</span></h2>
    <div class="strip">${strip}</div>
    <div class="axis"><span>0s</span><span>${fmt(seconds(total) / 2)}</span><span>${fmt(seconds(total))}</span></div>
    <div class="beats">${cards}
    </div>
  </section>

  <section class="panel" id="reel" role="tabpanel" hidden>
    <h2 class="section-head"><span>Reel</span><span>1080 × 1920 · ${fmt(seconds(total))}</span></h2>
    <div class="reel">
      <figure><video src="reel.mp4" poster="cover.png" controls playsinline preload="metadata"></video>
        <figcaption>gs://${esc(BUCKET ?? "pitchkit-assets")}/${esc(reelName)} · ${size(files.reel)}</figcaption></figure>
      <figure><img src="cover.png" alt="Cover: frame from the hook" width="1080" height="1920">
        <figcaption>gs://${esc(BUCKET ?? "pitchkit-assets")}/${esc(coverName)} · ${size(files.cover)}</figcaption></figure>
      <div class="actions">
        ${download(links?.reel, "Download reel", "MP4, opens the bucket download in a new tab.")}
        ${download(links?.cover, "Download cover", "PNG, 1080 × 1920.")}
        ${links ? `<span class="note">Links expire ${links.expires}. Re-run <code>npm run storyboard -- ${esc(id)}</code> to refresh them.</span>` : ""}
        <span class="note">No music in the render: add a track in the app and cut to it (rule 21).</span>
      </div>
    </div>
  </section>

  <section class="panel" id="copy" role="tabpanel" hidden>
    <h2 class="section-head"><span>Copy</span><span>Instagram · X · alt text</span></h2>
    ${copyBlock("instagram", "Instagram caption", instagram, 2200)}
    ${copyBlock("x", "X post", x, 280)}
    ${copyBlock("alt", "Alt text", alt, 0)}
  </section>

  <section class="panel notes" id="notes" role="tabpanel" hidden>
    <h2 class="section-head"><span>Notes</span><span>from CAPTIONS.md</span></h2>
    ${markdown(intro)}
    ${markdown(facts)}
  </section>
</div>

<script>
(() => {
  const tabs = [...document.querySelectorAll(".tabs a")];
  const panels = [...document.querySelectorAll(".panel")];
  function show(name) {
    if (!panels.some((p) => p.id === name)) name = "storyboard";
    panels.forEach((p) => { p.hidden = p.id !== name; });
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.getAttribute("href") === "#" + name)));
  }
  tabs.forEach((t) => t.addEventListener("click", (e) => {
    e.preventDefault();
    const name = t.getAttribute("href").slice(1);
    show(name);
    try { history.replaceState(null, "", "#" + name); } catch {}
  }));
  const hash = location.hash.slice(1);
  show(hash.startsWith("beat-") ? "storyboard" : hash);
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", () => {
    const pre = document.getElementById("copy-" + btn.dataset.copy);
    const done = () => { btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy"; }, 1500); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected: press Ctrl+C"; };
    try { navigator.clipboard.writeText(pre.textContent).then(done, select); } catch { select(); }
  }));
})();
</script>
`;
writeFileSync(join(dir, "index.html"), html);
console.log(`Wrote ${dir}/index.html`);

if (args.includes("--upload")) {
  const names = [
    "index.html",
    "reel.mp4",
    "cover.png",
    "caption-instagram.txt",
    "caption-x.txt",
    "alt-text.txt",
    ...board.beats.map((_, i) => `beat-${pad(i + 1)}.png`),
  ];
  await put(
    names
      .filter((n) => existsSync(join(dir, n)))
      .map((n) => [join(dir, n), `${folder}storyboard/${n}`]),
    false,
  );
}
