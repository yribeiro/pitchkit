/**
 * Render every composition to out/: stills as PNG, reels as H.264 MP4.
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
];
const REELS = ["reel-01-quickstart", "reel-02-tracking", "reel-03-layers"];

const run = (args) =>
  execFileSync("npx", ["remotion", ...args, ...browser, "--log=error"], {
    cwd: root,
    stdio: "inherit",
  });

for (const id of STILLS.filter((id) => id.includes(filter))) {
  run(["still", "src/index.ts", id, `out/${id}.png`]);
}
for (const id of REELS.filter((id) => id.includes(filter))) {
  // CRF 18 survives Instagram's re-encode noticeably better than the default.
  run(["render", "src/index.ts", id, `out/${id}.mp4`, "--codec=h264", "--crf=18"]);
}
