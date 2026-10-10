/**
 * Render every composition to out/: stills as PNG, reels as H.264 MP4.
 * Renders are then uploaded with `npm run assets -- upload <id>` (see scripts/assets.mjs).
 *
 *   npm run render --workspace=social            # everything
 *   npm run render --workspace=social -- post-03 # ids containing "post-03"
 *
 * Set REMOTION_BROWSER to a Chrome/Chromium headless-shell binary to skip
 * Remotion's own download (e.g. in CI or a container with one preinstalled).
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filter = process.argv[2] ?? "";
const browser = process.env.REMOTION_BROWSER
  ? [`--browser-executable=${process.env.REMOTION_BROWSER}`]
  : [];

const STILLS = [
  "post-01-intro",
  "post-02-code",
  "post-03-winner",
  "post-04-network",
  "post-05-palettes",
  "post-06-layers",
  "wall-mosaic",
  "wall-mosaic-preview",
  "wall-mosaic-profile",
  "x-header",
  "carousel-01-cover",
  "carousel-02-data",
  "carousel-03-find",
  "carousel-04-freeze",
  "carousel-05-follow",
  "carousel-06-all",
  "carousel-07-questions",
  "carousel-08-save",
  "linkedin-hexbin",
  "linkedin-positional",
  "linkedin-voronoi",
  "linkedin-flow",
  "linkedin-momentum",
];
const REELS = [
  "reel-01-quickstart",
  "reel-02-tracking",
  "reel-03-layers",
  "reel-04-networks",
  "reel-04-networks-loop",
  "reel-05-wc-final",
  "reel-06-live-final",
  "reel-06-network-final",
  "reel-06-goals-final",
  "reel-07-claude",
  "post-03-winner-animated",
];

/**
 * Cut the 3240x2880 mosaic into six 1080x1440 (3:4) tiles, named in reading
 * order — tile-1 is top-left. Post them in REVERSE (6 first, 1 last): the grid
 * shows the newest post top-left. (The grid preview is its own still, since
 * Remotion's bundled ffmpeg has no `tile` or `pad` filter.)
 */
function cutMosaic() {
  const ffmpeg = (...args) =>
    execFileSync("npx", ["remotion", "ffmpeg", "-loglevel", "error", "-y", ...args], {
      cwd: root,
      stdio: "inherit",
    });
  for (let i = 0; i < 6; i++) {
    const [col, row] = [i % 3, Math.floor(i / 3)];
    ffmpeg(
      "-i",
      "out/wall-mosaic.png",
      "-vf",
      `crop=1080:1440:${col * 1080}:${row * 1440}`,
      "-frames:v",
      "1",
      `out/mosaic-tile-${i + 1}.png`,
    );
  }
}

const run = (args) =>
  execFileSync("npx", ["remotion", ...args, ...browser, "--log=error"], {
    cwd: root,
    stdio: "inherit",
  });

for (const id of STILLS.filter((id) => id.includes(filter))) {
  // The grid mockups are drawn at cell size (360px), so render them at 2x.
  const scale = id.endsWith("-preview") || id.endsWith("-profile") ? ["--scale=2"] : [];
  run(["still", "src/index.ts", id, `out/${id}.png`, ...scale]);
  if (id === "wall-mosaic") cutMosaic();
}
for (const id of REELS.filter((id) => id.includes(filter))) {
  // CRF 18 survives Instagram's re-encode noticeably better than the default.
  run(["render", "src/index.ts", id, `out/${id}.mp4`, "--codec=h264", "--crf=18"]);
}
