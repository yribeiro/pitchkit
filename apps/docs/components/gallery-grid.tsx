"use client";

import { useState } from "react";
import Link from "next/link";
import { GALLERY_CATEGORIES, GALLERY_ENTRIES } from "@/lib/gallery";
import type { GalleryCategory, GalleryEntry } from "@/lib/gallery";
import { registry } from "./examples/registry";
import { CodeBlock } from "./code-block";
import { OpenInButtons } from "./open-in-buttons";
import "./examples/docs-pitch-theme.css";

/**
 * The category-tabbed gallery grid (issue #28; closest analogue is
 * ui.shadcn.com/charts). Live renders come from the same generated
 * example registry the docs' <PitchPreview> uses — one mechanism, two
 * surfaces. "View Code" toggles per card, unlike the docs preview's
 * one-way expand, since a grid of permanently-open code panels would bury
 * the visualisations the page exists to show off.
 */

function GalleryCard({ entry }: { entry: GalleryEntry }) {
  const [showCode, setShowCode] = useState(false);
  const item = registry[entry.name];
  if (!item) {
    throw new Error(`Gallery: unknown example "${entry.name}"`);
  }
  const { Component, source } = item;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-fd-foreground">
            <Link href={entry.docsHref} className="transition-colors hover:text-fd-primary">
              {entry.title}
            </Link>
          </h2>
          <p className="pt-1 text-xs leading-relaxed text-fd-muted-foreground">
            {entry.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-fd-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fd-muted-foreground">
          {entry.category}
        </span>
      </div>
      <div className="pitchkit-docs-pitch flex-1 px-4 pb-4">
        <Component />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-fd-border px-4 py-2.5">
        <button
          type="button"
          onClick={() => setShowCode((v) => !v)}
          aria-expanded={showCode}
          className="rounded-md border border-fd-border px-2 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:text-fd-foreground"
        >
          {showCode ? "Hide Code" : "View Code"}
        </button>
        <OpenInButtons name={entry.name} source={source} />
      </div>
      {showCode && (
        <div className="max-h-80 overflow-y-auto border-t border-fd-border">
          <CodeBlock code={source} lang="tsx" />
        </div>
      )}
    </article>
  );
}

export function GalleryGrid() {
  const [category, setCategory] = useState<GalleryCategory>("All");

  const entries =
    category === "All"
      ? GALLERY_ENTRIES
      : GALLERY_ENTRIES.filter((e) => e.category === category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Gallery categories">
        {GALLERY_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              category === c
                ? "border-fd-primary/50 bg-fd-primary/10 text-fd-primary"
                : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {entries.map((entry) => (
          <GalleryCard key={entry.name} entry={entry} />
        ))}
      </div>
    </div>
  );
}
