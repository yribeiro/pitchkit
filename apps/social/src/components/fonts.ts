import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import { continueRender, delayRender } from "remotion";

/**
 * Hold every frame until the webfonts have loaded — otherwise the first
 * frames of a render screenshot the system fallback and the text jumps.
 */
const handle = delayRender("Loading Inter + JetBrains Mono");
Promise.all(
  [
    "400 16px Inter",
    "600 16px Inter",
    "700 16px Inter",
    "800 16px Inter",
    "400 16px 'JetBrains Mono'",
    "600 16px 'JetBrains Mono'",
  ].map((font) => document.fonts.load(font)),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
