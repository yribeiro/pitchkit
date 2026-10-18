import { fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pitch } from "./Pitch.js";
import {
  PlayerAvatar,
  defaultAvatarSize,
  describePlayerEvents,
  playerInitials,
} from "./PlayerAvatar.js";

function renderOnPitch(avatar: React.ReactNode) {
  return render(
    <Pitch type="statsbomb" width={600} height={400}>
      {avatar}
    </Pitch>,
  );
}

const avatarIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-pitchkit-mark="player-avatar"]');

describe("PlayerAvatar", () => {
  it("renders into the HTML overlay, not the SVG", () => {
    const { container } = renderOnPitch(<PlayerAvatar x={60} y={40} name="Bono" />);
    const avatar = avatarIn(container);

    expect(avatar).not.toBeNull();
    expect(avatar?.closest("svg")).toBeNull();
    expect(avatar?.parentElement?.getAttribute("data-pitchkit-layer")).toBe("html-overlay");
  });

  it("centres the photo on the point, as a percentage of the pitch", () => {
    // statsbomb 120x80 into 600x400: (30, 20) is pixel (150, 100).
    const { container } = renderOnPitch(<PlayerAvatar x={30} y={20} name="Bono" />);
    const style = avatarIn(container)!.style;

    expect(style.left).toBe("25%");
    expect(style.top).toBe("25%");
  });

  it("shows the number before the name", () => {
    const { container } = renderOnPitch(<PlayerAvatar x={60} y={40} name="B. Díaz" number={10} />);
    const label = container.querySelector('[data-pitchkit-part="avatar-label"]');

    expect(label?.querySelector('[data-pitchkit-part="avatar-number"]')?.textContent).toBe("10 ");
    expect(label?.querySelector('[data-pitchkit-part="avatar-name"]')?.textContent).toBe("B. Díaz");
  });

  it("draws a badge for each card, substitution, goal and assist, and none without them", () => {
    const { container: bare } = renderOnPitch(<PlayerAvatar x={60} y={40} name="Bono" />);
    for (const part of ["avatar-card", "avatar-sub", "avatar-goals", "avatar-assists"]) {
      expect(bare.querySelector(`[data-pitchkit-part="${part}"]`)).toBeNull();
    }

    const { container } = renderOnPitch(
      <PlayerAvatar
        x={60}
        y={40}
        name="A. Ounahi"
        card="yellow"
        subbed="off"
        goals={2}
        assists={1}
      />,
    );
    for (const part of ["avatar-card", "avatar-sub", "avatar-goals", "avatar-assists"]) {
      expect(container.querySelector(`[data-pitchkit-part="${part}"]`)).not.toBeNull();
    }
  });

  it("shows a count from two up", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="A. Ounahi" goals={2} assists={1} />,
    );

    expect(container.querySelector('[data-pitchkit-part="avatar-goals"]')?.textContent).toBe("2");
    expect(container.querySelector('[data-pitchkit-part="avatar-assists"]')?.textContent).toBe("");
  });

  it("ignores zero, negative and non-finite counts", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="Bono" goals={0} assists={Number.NaN} />,
    );

    expect(container.querySelector('[data-pitchkit-part="avatar-goals"]')).toBeNull();
    expect(container.querySelector('[data-pitchkit-part="avatar-assists"]')).toBeNull();
  });

  it("says in words what the badges show", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="A. Ounahi" card="yellow" subbed="off" goals={2} />,
    );

    expect(avatarIn(container)?.textContent).toContain("2 goals, yellow card, substituted off");
  });

  it("falls back to initials with no photo", () => {
    const { container } = renderOnPitch(<PlayerAvatar x={60} y={40} name="N. El Aynaoui" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-pitchkit-part="avatar-initials"]')?.textContent).toBe(
      "NA",
    );
  });

  it("lazy-loads src, and falls back to initials when it fails", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="Bono" src="/bono.png" size={48} />,
    );
    const img = container.querySelector("img")!;

    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("width")).toBe("48");

    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-pitchkit-part="avatar-initials"]')?.textContent).toBe(
      "B",
    );
  });

  it("puts children in the photo's place, in a positioned box for fill-style images", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="Bono" src="/ignored.png">
        <picture data-testid="custom" />
      </PlayerAvatar>,
    );

    const custom = container.querySelector('[data-testid="custom"]');
    expect(custom).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect((custom!.parentElement as HTMLElement).style.position).toBe("absolute");
  });

  it("draws one substitution icon, colouring only the arrow that happened", () => {
    const strokes = (subbed: "on" | "off") => {
      const { container } = renderOnPitch(
        <PlayerAvatar x={60} y={40} name="Bono" subbed={subbed} />,
      );
      return Array.from(container.querySelectorAll('[data-pitchkit-part="avatar-sub"] path')).map(
        (p) => p.getAttribute("stroke"),
      );
    };

    expect(strokes("on")).toEqual([
      "var(--pitch-sub-on, #22c55e)",
      "var(--pitch-sub-idle, #ffffff)",
    ]);
    expect(strokes("off")).toEqual([
      "var(--pitch-sub-idle, #ffffff)",
      "var(--pitch-sub-off, #ef4444)",
    ]);
  });

  it("treats false or empty children as no photo", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="Bono">
        {false}
      </PlayerAvatar>,
    );

    expect(container.querySelector('[data-pitchkit-part="avatar-initials"]')?.textContent).toBe(
      "B",
    );
  });

  it("draws the goal and assist glyphs as filled paths", () => {
    const { container } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="Bono" goals={1} assists={1} />,
    );

    for (const part of ["avatar-goals", "avatar-assists"]) {
      const path = container.querySelector(`[data-pitchkit-part="${part}"] path`);
      expect(path?.getAttribute("fill")).toBe("currentColor");
      expect(path?.getAttribute("d")?.length).toBeGreaterThan(100);
    }
  });

  it("takes its size from the prop, else the CSS variable, else the pitch", () => {
    const { container: fixed } = renderOnPitch(
      <PlayerAvatar x={60} y={40} name="Bono" size={50} />,
    );
    expect(avatarIn(fixed)!.style.getPropertyValue("--pk-avatar-size")).toBe("50px");

    const { container: auto } = renderOnPitch(<PlayerAvatar x={60} y={40} name="Bono" />);
    expect(avatarIn(auto)!.style.getPropertyValue("--pk-avatar-size")).toBe(
      "var(--pitch-avatar-size, 40px)",
    );
  });

  it("passes HTML attributes through to its root", () => {
    let clicked = false;
    const { container } = renderOnPitch(
      <PlayerAvatar
        x={60}
        y={40}
        name="Bono"
        className="ring"
        aria-describedby="x"
        onClick={() => (clicked = true)}
      />,
    );
    const avatar = avatarIn(container)!;

    expect(avatar.className).toBe("ring");
    expect(avatar.getAttribute("aria-describedby")).toBe("x");
    fireEvent.click(avatar);
    expect(clicked).toBe(true);
  });

  it("renders nothing on the server, without throwing", () => {
    const html = renderToString(
      <Pitch type="statsbomb" width={600} height={400}>
        <PlayerAvatar x={60} y={40} name="Bono" />
      </Pitch>,
    );

    expect(html).toContain('data-pitchkit-layer="html-overlay"');
    expect(html).not.toContain("player-avatar");
  });

  it("throws outside a Pitch", () => {
    expect(() => render(<PlayerAvatar x={0} y={0} name="Bono" />)).toThrow(/inside <Pitch>/);
  });
});

describe("defaultAvatarSize", () => {
  it("is a tenth of the shorter side, within 24 to 72 px", () => {
    expect(defaultAvatarSize({ width: 600, height: 400 })).toBe(40);
    expect(defaultAvatarSize({ width: 400, height: 600 })).toBe(40);
    expect(defaultAvatarSize({ width: 150, height: 100 })).toBe(24);
    expect(defaultAvatarSize({ width: 2000, height: 1300 })).toBe(72);
  });
});

describe("playerInitials", () => {
  it("takes the first and last word's first letters, skipping punctuation", () => {
    expect(playerInitials("B. Díaz")).toBe("BD");
    expect(playerInitials("Bono")).toBe("B");
    expect(playerInitials("  ")).toBe("");
    expect(playerInitials("(c) A. Hakimi")).toBe("CH");
  });
});

describe("describePlayerEvents", () => {
  it("lists every event in order and pluralises counts", () => {
    expect(
      describePlayerEvents({ goals: 1, assists: 2, card: "second-yellow", subbed: "on" }),
    ).toBe("1 goal, 2 assists, second yellow card, substituted on");
    expect(describePlayerEvents({ card: "red" })).toBe("red card");
    expect(describePlayerEvents({})).toBe("");
  });
});
