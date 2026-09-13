"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { SkillCornerEvent } from "@pitchkit/data-providers/skillcorner";
import { eventHeadline, eventTime } from "./skillcorner-derive";

/**
 * The dynamic events either side of wherever the clip is now, scrolling itself
 * along as the tracking plays.
 *
 * The alignment is exact rather than approximate: an event's `frame_start` is
 * a tracking frame number — the two files share one counter — so "the event
 * happening at this moment" needs no timestamp matching.
 */

const stripStyle: CSSProperties = {
  display: "flex",
  gap: "0.4rem",
  overflowX: "auto",
  padding: "0.2rem 0 0.5rem",
  scrollbarWidth: "thin",
};

const cardBase: CSSProperties = {
  flex: "0 0 auto",
  width: "10.5rem",
  // Longhand throughout: React warns when a shorthand (`border`, `borderLeft`)
  // and a longhand (`borderColor`) for the same property are both updated on
  // a rerender, which is exactly what the per-card colours below do.
  borderStyle: "solid",
  borderWidth: "1px 1px 1px 3px",
  borderRadius: 5,
  padding: "0.4rem 0.5rem",
  background: "#151515",
  fontSize: "0.7rem",
  lineHeight: 1.35,
  cursor: "pointer",
  textAlign: "left",
  color: "#ccc",
  transition: "opacity 120ms, border-color 120ms",
  borderTopColor: "#333",
  borderRightColor: "#333",
  borderBottomColor: "#333",
  borderLeftColor: "#333",
};

export function SkillCornerEventCarousel({
  events,
  activeIndex,
  colorOfTeam,
  onSelect,
}: {
  events: readonly SkillCornerEvent[];
  activeIndex: number;
  colorOfTeam: (teamId: number | null) => string;
  onSelect: (event: SkillCornerEvent) => void;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // `block: "nearest"` matters — without it this scrolls the whole page
    // every time playback advances to the next event.
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  if (events.length === 0) {
    return <p style={{ fontSize: "0.75rem", color: "#777" }}>No dynamic events in this clip.</p>;
  }

  return (
    <div style={stripStyle}>
      {events.map((event, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        const teamColor = colorOfTeam(event.team_id);
        return (
          <button
            key={event.event_id}
            type="button"
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(event)}
            aria-current={isActive ? "true" : undefined}
            style={{
              ...cardBase,
              borderTopColor: isActive ? teamColor : "#333",
              borderRightColor: isActive ? teamColor : "#333",
              borderBottomColor: isActive ? teamColor : "#333",
              borderLeftColor: teamColor,
              // Past events dim, future ones dim further: the strip reads as a
              // timeline running through "now" rather than a flat list.
              opacity: isActive ? 1 : isPast ? 0.65 : 0.4,
              background: isActive ? "#1e1e1e" : "#151515",
            }}
          >
            <div style={{ fontVariantNumeric: "tabular-nums", color: "#888" }}>
              {eventTime(event)}
            </div>
            <div style={{ color: isActive ? "#fff" : "#ccc" }}>{eventHeadline(event)}</div>
            <div style={{ color: "#999" }}>{event.player_name ?? "—"}</div>
            <div style={{ color: teamColor }}>{event.team_shortname ?? ""}</div>
          </button>
        );
      })}
    </div>
  );
}
