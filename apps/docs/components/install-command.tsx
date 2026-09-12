"use client";

import { useState } from "react";

/** The hero's copyable one-liner install command. */
export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const command = "npm install @pitchkit/react";

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(command).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="group inline-flex w-full min-w-0 max-w-full items-center gap-3 rounded-lg sm:w-auto border border-fd-border bg-fd-card px-4 py-2.5 font-mono text-sm text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:text-fd-foreground"
      aria-label={`Copy install command: ${command}`}
    >
      <span aria-hidden className="select-none text-fd-primary">
        $
      </span>
      <span className="truncate">{command}</span>
      {/* `ml-auto` pins "copy" to the right edge once the button is full
          width on mobile; above `sm` the button is content-sized, so there is
          no free space for it to absorb and it sits flush against the command
          exactly as before. */}
      <span className="ml-auto shrink-0 text-xs text-fd-muted-foreground/70 transition-colors group-hover:text-fd-primary">
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
