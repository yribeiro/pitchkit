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
            <dt>Frame</dt><dd class="frame">${b.still} (${fmt(seconds(b.still))}) · frames ${b.start}–${b.end}</dd>
          </dl>
        </div>
      </article>`,
  )
  .join("");
/** X counts every link as 23 characters. */
const weigh = (key, text) =>
  (key === "x" ? text.replace(/https?:\/\/\S+/g, "x".repeat(23)) : text).length;
const copyBlock = (key, label, text, limit) => {
  const n = weigh(key, text);
  const over = limit && n > limit;
  return `
      <section class="copy">
        <h2>${label} <button type="button" data-copy="${key}">Copy</button></h2>
        <pre class="copybox" id="copy-${key}" tabindex="0">${esc(text)}</pre>
        <p class="count${over ? " over" : ""}">${n}${limit ? ` / ${limit}` : ""} characters${over ? " · over the limit, trim before posting" : ""}</p>
      </section>`;
};
const saveRow = `
          <div class="saves" hidden>
            <button type="button" data-save="reel.mp4" data-name="${esc(reelName.split("/").pop())}">Save MP4</button>
            <button type="button" data-save="cover.png" data-name="${esc(`${id}-cover.png`)}">Save cover</button>
            <span class="note save-note"></span>
          </div>`;
const linkRow = links
  ? `
          <p class="note">Or download from the bucket: <a href="${esc(links.reel)}" target="_blank" rel="noopener">reel</a> · <a href="${esc(links.cover)}" target="_blank" rel="noopener">cover</a> (links expire ${links.expires}; re-run <code>npm run storyboard -- ${esc(id)}</code> to refresh).</p>`
  : "";

const html = `<title>${esc(number ? `Reel ${number} storyboard` : `${id} storyboard`)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@500&display=swap">
<style>
  /* Layout: PitchKit's reel-page look. Pill tabs over one panel at a time; the
     storyboard is a timed strip (cell width = beat length) over a card per beat;
     the reel tab is a phone-shaped player beside its posting pack. */
  :root {
    --bg: #050806;
    --panel: #0d1712;
    --line: rgba(52, 211, 153, 0.18);
    --fg: #eef5f1;
    --muted: #8fa89b;
    --accent: #34d399;
    --accent-2: #1f7a58;
    --flag: #fde047;
    --display: "Anton", Impact, "Arial Narrow", sans-serif;
    --body: "Inter", system-ui, sans-serif;
    --mono: "JetBrains Mono", ui-monospace, monospace;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { background: var(--bg); color: var(--fg); font-family: var(--body); font-size: 15px; line-height: 1.55; }
  .wrap { max-width: 1080px; margin: 0 auto; padding-inline: 20px; padding-block: 24px 64px; }
  .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
  .tab { font: 600 14px/1 var(--body); color: var(--muted); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 9px 16px; cursor: pointer; }
  .tab[aria-selected="true"] { color: var(--bg); background: var(--accent); border-color: var(--accent); }
  header.top { display: grid; gap: 6px; margin-bottom: 24px; }
  .status { width: fit-content; font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--bg); background: var(--flag); border-radius: 999px; padding: 4px 12px; }
  h1 { font-family: var(--display); font-weight: 400; font-size: clamp(34px, 6vw, 56px); line-height: 1; letter-spacing: 0.01em; margin: 6px 0 0; text-wrap: balance; }
  h1 em { font-style: normal; color: var(--accent); }
  .lede { color: var(--muted); max-width: 64ch; margin: 4px 0 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--mono); font-size: 12px; color: var(--muted); }
  .meta span { border: 1px solid var(--line); border-radius: 8px; padding: 3px 8px; }
  h2 { font-family: var(--display); font-weight: 400; font-size: 26px; letter-spacing: 0.02em; margin: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .board-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; padding-bottom: 12px; border-bottom: 2px solid var(--accent); margin-bottom: 16px; }
  .board-head .meta { font-size: 13px; }
  .strip { display: flex; gap: 6px; }
  .cell { flex-basis: 0; min-width: 0; display: flex; align-items: flex-end; height: 84px; padding: 0 10px 10px; background: var(--panel); border: 1px solid var(--line); border-bottom: 5px solid var(--accent); border-radius: 8px 8px 0 0; color: var(--fg); text-decoration: none; overflow: hidden; }
  .cell.alt { border-bottom-color: var(--accent-2); }
  .cell:hover { border-color: var(--accent); }
  .cell span { font: 500 16px var(--mono); font-variant-numeric: tabular-nums; }
  .axis { display: flex; justify-content: space-between; font: 500 12px var(--mono); color: var(--muted); margin-top: 10px; font-variant-numeric: tabular-nums; }
  .beats { display: grid; gap: 16px; margin-top: 28px; }
  .beat { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 22px; padding: 16px; background: var(--panel); border: 1px solid var(--line); border-radius: 14px; scroll-margin-top: 16px; }
  .beat img { width: 100%; height: auto; aspect-ratio: 9 / 16; border-radius: 10px; background: #000; border: 1px solid var(--line); display: block; }
  .beat-body { min-width: 0; }
  .beat-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
  .num { font: 500 14px var(--mono); color: var(--accent); }
  .beat:nth-child(even) .num { color: var(--muted); }
  .beat-head h3 { font: 400 24px/1.1 var(--display); letter-spacing: 0.02em; margin: 0; }
  .time { margin-left: auto; font: 500 12px var(--mono); color: var(--muted); font-variant-numeric: tabular-nums; }
  dl { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 8px 16px; margin: 14px 0 0; }
  dt { font: 500 11px/1.9 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
  dd { margin: 0; max-width: 64ch; }
  dd.frame { font: 500 12px/1.9 var(--mono); color: var(--muted); }
  @media (max-width: 640px) {
    .beat { grid-template-columns: 1fr; }
    .beat img { max-width: 220px; }
    dl { grid-template-columns: 1fr; gap: 0; }
    dd { margin-bottom: 8px; }
    .cell { height: 60px; padding: 0 4px 8px; }
    .cell span { font-size: 11px; }
  }
  .grid { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 32px; align-items: start; }
  @media (max-width: 780px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  .player { display: grid; gap: 12px; position: sticky; top: calc(env(safe-area-inset-top, 0px) + 16px); }
  @media (max-width: 780px) { .player { position: static; } }
  video, .cover { width: 100%; max-width: 100%; aspect-ratio: 9 / 16; border-radius: 18px; background: #000; border: 1px solid var(--line); display: block; }
  .saves { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .pack { display: grid; gap: 22px; min-width: 0; }
  section { display: grid; gap: 10px; min-width: 0; }
  .copybox { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; margin: 0; font-family: var(--body); }
  .count { font: 500 12px var(--mono); color: var(--muted); margin: 0; }
  .count.over { color: var(--flag); }
  button { font: 600 13px/1 var(--body); color: var(--bg); background: var(--accent); border: 0; border-radius: 999px; padding: 8px 14px; cursor: pointer; }
  button:focus-visible, .tab:focus-visible, .cell:focus-visible, .copybox:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
  ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; }
  ul li::marker { color: var(--accent); }
  .note { color: var(--muted); font-size: 13px; margin: 0; }
  a { color: var(--accent); }
  code { font: 500 0.86em var(--mono); background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 1px 5px; overflow-wrap: anywhere; }
  .notes { display: grid; gap: 14px; max-width: 860px; }
  .notes p { margin: 0; max-width: 70ch; }
  .table { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }
  th { font: 500 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  td:first-child { color: var(--accent); white-space: nowrap; }
  @media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>

<div class="wrap">
  <nav class="tabs" role="tablist" aria-label="Sections">
    <button type="button" class="tab" role="tab" aria-controls="storyboard" aria-selected="true" data-tab="storyboard">Storyboard</button>
    <button type="button" class="tab" role="tab" aria-controls="reel" aria-selected="false" data-tab="reel">Reel</button>
    <button type="button" class="tab" role="tab" aria-controls="copy" aria-selected="false" data-tab="copy">Copy</button>
    <button type="button" class="tab" role="tab" aria-controls="notes" aria-selected="false" data-tab="notes">Notes</button>
  </nav>

  <header class="top">
    <span class="status">${number ? `Reel ${number}` : esc(id)} · storyboard</span>
    <h1>${esc(board.title)}</h1>
    ${board.formula ? `<p class="lede">Hook formula: ${esc(board.formula)}</p>` : ""}
  </header>

  <div class="panel" role="tabpanel" id="storyboard">
    <div class="board-head"><h2>Storyboard</h2><div class="meta"><span>${board.beats.length} beats</span><span>${fmt(seconds(total))}</span><span>${board.fps} fps</span></div></div>
    <div class="strip">${strip}</div>
    <div class="axis"><span>0s</span><span>${fmt(seconds(total) / 2)}</span><span>${fmt(seconds(total))}</span></div>
    <div class="beats">${cards}
    </div>
  </div>

  <div class="panel" role="tabpanel" id="reel" hidden>
    <div class="grid">
      <div class="player">
        <video src="reel.mp4" poster="cover.png" controls playsinline preload="metadata"></video>
        <div class="meta"><span>1080×1920</span><span>${fmt(seconds(total))}</span><span>H.264 + SFX</span><span>${size(files.reel)}</span></div>${saveRow}${linkRow}
      </div>
      <div class="pack">
        <section><h2>Cover</h2><img class="cover" src="cover.png" alt="The cover frame" width="1080" height="1920" loading="lazy"></section>
        <section><h2>Before posting</h2><ul>
          <li>No music in the render: add a track in the app and keep the original audio at about 40% so the sound effects land (rule 21).</li>
          <li>Bucket: <code>gs://${esc(BUCKET ?? "pitchkit-assets")}/${esc(reelName)}</code> and <code>${esc(coverName)}</code>.</li>
          <li>Captions and alt text are on the Copy tab.</li>
        </ul></section>
      </div>
    </div>
  </div>

  <div class="panel" role="tabpanel" id="copy" hidden>
    <div class="pack">${copyBlock("instagram", "Instagram caption", instagram, 2200)}${copyBlock("x", "X post", x, 280)}${copyBlock("alt", "Alt text", alt, 0)}
    </div>
  </div>

  <div class="panel notes" role="tabpanel" id="notes" hidden>
    <h2>Notes</h2>
    ${markdown(intro)}
    ${markdown(facts)}
  </div>
</div>

<script>
  const tabs = document.querySelectorAll(".tab");
  function show(id) {
    if (!document.getElementById(id)) id = "storyboard";
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === id)));
    document.querySelectorAll(".panel").forEach((p) => {
      p.hidden = p.id !== id;
      if (p.hidden) p.querySelector("video")?.pause();
    });
  }
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));
  const hash = location.hash.slice(1);
  if (hash && !hash.startsWith("beat-")) show(hash);

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = document.getElementById("copy-" + btn.dataset.copy);
      const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy"), 1500); };
      const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected"; };
      try { navigator.clipboard.writeText(el.textContent).then(done, select); } catch { select(); }
    });
  });

  (async () => {
    const downloads = await window.claude?.use?.("downloads");
    if (!downloads) return;
    document.querySelectorAll(".saves").forEach((row) => {
      row.hidden = false;
      const note = row.querySelector(".save-note");
      row.querySelectorAll("[data-save]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const filename = btn.dataset.name;
          btn.disabled = true;
          note.textContent = "Preparing " + filename + "…";
          try {
            const data = await (await fetch(btn.dataset.save)).blob();
            await downloads.save({ filename, data });
            note.textContent = "Saved " + filename;
          } catch (e) {
            note.textContent = e && e.code === "declined" ? "Save cancelled" : "Couldn't save " + filename + " here";
          } finally {
            btn.disabled = false;
          }
        });
      });
    });
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
