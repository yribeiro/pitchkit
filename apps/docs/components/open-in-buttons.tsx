"use client";

import { compressToBase64 } from "lz-string";
import { buildSandboxFiles } from "@/lib/sandbox-project";

interface OpenInButtonsProps {
  /** Registry name of the example, e.g. "scatter-basic". */
  name: string;
  /** The example's raw source (the registry's `source` string). */
  source: string;
}

/** Submits a dynamically-built form POST in a new tab, then removes it. */
function postForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.target = "_blank";
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/**
 * "Open in StackBlitz / CodeSandbox" via each platform's project-POST API —
 * the whole Vite project is built client-side from the example's source
 * (see lib/sandbox-project.ts), no server round-trip.
 */
export function OpenInButtons({ name, source }: OpenInButtonsProps) {
  const openStackBlitz = () => {
    const files = buildSandboxFiles(name, source);
    const fields: Record<string, string> = {
      "project[title]": `PitchKit — ${name}`,
      "project[description]": "A PitchKit live example, exported from pitchkit's docs site.",
      "project[template]": "node",
    };
    for (const [path, content] of Object.entries(files)) {
      fields[`project[files][${path}]`] = content;
    }
    postForm(`https://stackblitz.com/run?file=${encodeURIComponent("src/example.tsx")}`, fields);
  };

  const openCodeSandbox = () => {
    const files = buildSandboxFiles(name, source);
    const parameters = compressToBase64(
      JSON.stringify({
        files: Object.fromEntries(
          Object.entries(files).map(([path, content]) => [path, { content }]),
        ),
      }),
    )
      // The define API's URL-safe base64 variant.
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    postForm("https://codesandbox.io/api/v1/sandboxes/define", { parameters });
  };

  const buttonClass =
    "rounded-md border border-fd-border px-2 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:text-fd-foreground";

  return (
    <div className="flex gap-1.5">
      <button type="button" className={buttonClass} onClick={openStackBlitz}>
        Open in StackBlitz
      </button>
      <button type="button" className={buttonClass} onClick={openCodeSandbox}>
        Open in CodeSandbox
      </button>
    </div>
  );
}
