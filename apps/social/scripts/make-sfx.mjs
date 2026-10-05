/**
 * Synthesise the reels' sound effects into public/sfx/ as 16-bit mono WAVs,
 * so there's nothing to license.
 *
 *   node scripts/make-sfx.mjs
 */
import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
const RATE = 48000;

function wav(name, seconds, sample) {
  const n = Math.round(seconds * RATE);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, sample(i / RATE)));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(join(out, `${name}.wav`), buf);
}

const TAU = 2 * Math.PI;
// A deterministic noise source, so re-running gives identical files.
let seed = 1;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

mkdirSync(out, { recursive: true });

// A short wooden "tok", like a counter peg.
wav(
  "tick",
  0.09,
  (t) =>
    0.55 * Math.sin(TAU * 1500 * t) * Math.exp(-70 * t) +
    0.25 * Math.sin(TAU * 2900 * t) * Math.exp(-110 * t),
);

// A low kick with a falling pitch, for the payoff.
let phase = 0;
wav("pop", 0.45, (t) => {
  phase += (TAU * (90 + 420 * Math.exp(-28 * t))) / RATE;
  return 0.9 * Math.sin(phase) * Math.exp(-9 * t);
});

// Air moving past the camera: band-limited noise that swells and fades.
let low = 0;
let high = 0;
let prev = 0;
const WHOOSH = 0.6;
wav("whoosh", WHOOSH, (t) => {
  const x = noise();
  // One-pole low-pass whose cutoff sweeps up then down with the swell.
  const swell = Math.sin((Math.PI * t) / WHOOSH);
  const a = 0.04 + 0.25 * swell;
  low += a * (x - low);
  // Then a one-pole high-pass to take out the rumble.
  high = 0.97 * (high + low - prev);
  prev = low;
  return 1.6 * high * swell ** 2;
});

console.log(`sfx written to ${out}`);
