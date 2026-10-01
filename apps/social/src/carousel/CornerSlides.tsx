/**
 * Corner-kick carousel, slides 2–8. Every position is a real SkillCorner
 * tracking frame from Auckland FC v Newcastle Jets; see scripts/snapshot-corners.mjs.
 */
import { Arrows, Comet, Scatter } from "@pitchkit/react";
import { InstallPill } from "../components/Chrome";
import { Code } from "../components/Code";
import { cornersData } from "../data";
import { C, FONT } from "../theme";
import { Chip, CornerPitch, DISPLAY, Slide, cornerAt, frameAt, segments, track } from "./Slide";

const SLIDE_PITCH_W = 960;
const GOLD = "#facc15";
const nameOf = (id: number) => cornersData.players[String(id)]?.name ?? "?";
const secs = (frames: number) => (frames / 10).toFixed(1);

/* 02 — the data ---------------------------------------------------------- */

export function SlideData() {
  const rows = [
    ["10", "matches", "A-League 2024/25"],
    ["10 fps", "every player and the ball", "22 players, 10 times a second"],
    ["$0", "SkillCorner open data", "Free on GitHub"],
  ] as const;
  return (
    <Slide label="THE KIT" title={<>Free tracking data</>}>
      <div
        style={{ position: "absolute", top: 560, left: 64, right: 64, display: "grid", gap: 44 }}
      >
        {rows.map(([big, what, sub]) => (
          <div key={big} style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div
              style={{
                whiteSpace: "nowrap",
                fontFamily: DISPLAY,
                fontSize: 150,
                lineHeight: 1,
                color: C.accent,
              }}
            >
              {big}
            </div>
            <div>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>{what}</div>
              <div style={{ fontSize: 30, color: C.muted, fontWeight: 600, marginTop: 6 }}>
                {sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

/* 03 — step 1: find the corners ------------------------------------------ */

const FIND_CODE = `import {
  fetchMatch,
  fetchDynamicEvents,
} from "@pitchkit/data-providers/skillcorner";

const match = await fetchMatch(1886347);
const events = await fetchDynamicEvents(match);

const corners = events.filter(
  (e) =>
    e.event_type === "player_possession" &&
    e.game_interruption_before === "corner_for" &&
    e.x_start > 44 && Math.abs(e.y_start) > 22,
);`;

export function SlideFind() {
  return (
    <Slide label="STEP 1" title={<>Find the corners</>}>
      <div style={{ position: "absolute", top: 520, left: 64, right: 64 }}>
        <Code code={FIND_CODE} size={23} title="corners.ts" />
      </div>
      <div style={{ position: "absolute", top: 1150, left: 64 }}>
        <Chip big={String(cornersData.corners.length)} label="corners, all Auckland FC" />
      </div>
    </Slide>
  );
}

/* 04 — step 2: freeze the kick ------------------------------------------- */

export function SlideFreeze() {
  const corner = cornerAt(62);
  const f = frameAt(corner, 0);
  const players = f.players.map(([, x, y, att, detected]) => ({ x, y, att, detected }));
  const { attackers, defenders } = corner.boxAtKick;
  return (
    <Slide label="STEP 2" title={<>Freeze the kick</>}>
      <div style={{ position: "absolute", top: 520, left: 60 }}>
        <CornerPitch crop={{ x0: 20, x1: 52, y0: -23, y1: 35 }} width={SLIDE_PITCH_W}>
          <Scatter
            data={players}
            x={(p) => p.x}
            y={(p) => p.y}
            r={13}
            fill={(p) => (p.att ? C.sky : C.orange)}
            fillOpacity={(p) => (p.detected ? 1 : 0.7)}
            stroke="rgba(6,16,11,0.9)"
            strokeWidth={2.5}
          />
          {f.ball && (
            <Scatter
              data={[f.ball]}
              x={(b) => b[0]}
              y={(b) => b[1]}
              r={9}
              fill="white"
              stroke="#111"
              strokeWidth={2.5}
            />
          )}
        </CornerPitch>
      </div>
      <div style={{ position: "absolute", top: 1130, left: 64 }}>
        <Chip big={`${attackers} v ${defenders}`} label="in the box · 62' corner" />
      </div>
    </Slide>
  );
}

/* 05 — step 3: follow one player ----------------------------------------- */

export function SlideFollow() {
  const picks = [
    { minute: 71, color: C.accent },
    { minute: 92, color: GOLD },
  ].map(({ minute, color }) => {
    const corner = cornerAt(minute);
    const shot = corner.shot!;
    const raw = track(corner, shot.playerId, 0, shot.frame);
    // Every third frame: tracking jitters at 10 fps and the trail reads cleaner.
    const pts = raw.filter((_, i) => i % 3 === 0 || i === raw.length - 1);
    return { minute, color, corner, shot, pts, trail: segments(pts) };
  });
  const hero = picks[0]!.shot.playerId;
  return (
    <Slide label="STEP 3" title={<>Follow one player</>}>
      <div style={{ position: "absolute", top: 545, left: 60 }}>
        <CornerPitch crop={{ x0: 20, x1: 52, y0: -37, y1: 37 }} width={SLIDE_PITCH_W}>
          {picks.map((p) => (
            <Comet
              key={p.minute}
              data={p.trail}
              x={(s) => s.from[0]}
              y={(s) => s.from[1]}
              x2={(s) => s.to[0]}
              y2={(s) => s.to[1]}
              color={p.color}
              gradient
              endWidth={10}
            />
          ))}
          {picks.map((p) => (
            <Scatter
              key={`start-${p.minute}`}
              data={[p.pts[0]!]}
              x={(d) => d[0]}
              y={(d) => d[1]}
              r={13}
              fill="none"
              stroke={p.color}
              strokeWidth={4}
            />
          ))}
          {picks.map((p) => (
            <Scatter
              key={`shot-${p.minute}`}
              data={[p.pts.at(-1)!]}
              x={(d) => d[0]}
              y={(d) => d[1]}
              r={14}
              fill={p.color}
              stroke="#000"
              strokeWidth={3}
            />
          ))}
        </CornerPitch>
      </div>
      <div style={{ position: "absolute", top: 1020, left: 64, right: 64 }}>
        <Chip big={nameOf(hero).replace("L. ", "")} label="shot both times" />
        <div style={{ display: "flex", gap: 36, marginTop: 22, fontSize: 30, fontWeight: 700 }}>
          {picks.map((p) => (
            <span key={p.minute} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.color }} />
              <span style={{ color: C.muted }}>
                {p.minute}' · shot after {secs(p.shot.frame)}s
              </span>
            </span>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 26, color: C.faint, fontWeight: 600 }}>
          Ring: where he stood at the kick. Dot: where he shot.
        </div>
      </div>
    </Slide>
  );
}

/* 06 — step 4: every corner ---------------------------------------------- */

export function SlideAll() {
  const corners = cornersData.corners;
  // Straight line from the kick to where the shooter shot from: the route the
  // ball took in between is a chain of passes, which would just be noise here.
  const links = corners.map((c) => {
    const kick = frameAt(c, 0).ball!;
    const spot = track(c, c.shot!.playerId, c.shot!.frame, c.shot!.frame)[0]!;
    return { x: kick[0], y: kick[1], endX: spot[0], endY: spot[1] };
  });
  const times = corners.map((c) => c.shot!.frame);
  return (
    <Slide label="STEP 4" title={<>Do it for every corner</>}>
      <div style={{ position: "absolute", top: 545, left: 60 }}>
        <CornerPitch crop={{ x0: 20, x1: 52, y0: -37, y1: 37 }} width={SLIDE_PITCH_W}>
          <Arrows
            data={links}
            x={(d) => d.x}
            y={(d) => d.y}
            x2={(d) => d.endX}
            y2={(d) => d.endY}
            stroke="white"
            strokeWidth={4}
            strokeOpacity={0.9}
            headSize={16}
          />
          <Scatter
            data={links}
            x={(d) => d.x}
            y={(d) => d.y}
            r={11}
            fill="none"
            stroke="white"
            strokeWidth={4}
          />
          <Scatter
            data={links}
            x={(d) => d.endX}
            y={(d) => d.endY}
            r={14}
            fill={C.accent}
            stroke="#000"
            strokeWidth={3}
          />
        </CornerPitch>
      </div>
      <div style={{ position: "absolute", top: 1020, left: 64, right: 64 }}>
        <Chip
          big={`${corners.length} → ${corners.filter((c) => c.shot).length}`}
          label="corners → shots"
        />
        <div style={{ marginTop: 22, fontSize: 30, fontWeight: 700, color: C.muted }}>
          Every one ended in a shot, {secs(Math.min(...times))}–{secs(Math.max(...times))}s after
          the kick.
        </div>
        <div style={{ marginTop: 14, fontSize: 26, color: C.faint, fontWeight: 600 }}>
          Ring: the kick. Dot: the shot. Line: straight kick-to-shot, not the ball's route.
        </div>
      </div>
    </Slide>
  );
}

/* 07 — step 5: the questions --------------------------------------------- */

export function SlideQuestions() {
  const cs = cornersData.corners;
  const boxA = cs.map((c) => c.boxAtKick.attackers);
  const boxD = cs.map((c) => c.boxAtKick.defenders);
  const left = cs.filter((c) => frameAt(c, 0).ball && frameAt(c, 0).ball![1] > 0).length;
  const shooters = new Set(cs.map((c) => c.shot!.playerId)).size;
  const range = (xs: number[]) =>
    Math.min(...xs) === Math.max(...xs) ? `${xs[0]}` : `${Math.min(...xs)}–${Math.max(...xs)}`;
  const times = cs.map((c) => c.shot!.frame / 10);
  const rows = [
    ["Who's in the box?", `${range(boxA)} attackers v ${range(boxD)} defenders`],
    ["Which side does it come from?", `Attacker's left ${left}×, right ${cs.length - left}×`],
    ["Who gets the shot?", `${cs.length} shots, ${shooters} players`],
    ["How fast?", `${Math.min(...times).toFixed(1)}–${Math.max(...times).toFixed(1)}s to the shot`],
    ["Where does the shooter start?", "Edge of the box, or out wide"],
  ];
  return (
    <Slide label="STEP 5" title={<>Ask the same 5 questions</>}>
      <div
        style={{ position: "absolute", top: 560, left: 64, right: 64, display: "grid", gap: 30 }}
      >
        {rows.map(([q, a], i) => (
          <div key={q} style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
            <div
              style={{
                flex: "none",
                width: 76,
                height: 76,
                background: C.accent,
                color: "#000",
                fontFamily: DISPLAY,
                fontSize: 56,
                lineHeight: "84px",
                textAlign: "center",
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>{q}</div>
              <div style={{ fontSize: 30, color: C.accent, fontWeight: 700, marginTop: 4 }}>
                {a}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

/* 08 — save it ----------------------------------------------------------- */

export function SlideSave() {
  return (
    <Slide label="SAVE THIS" title={<>Try it on your next match</>} credit={false}>
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 64,
          right: 64,
          display: "grid",
          gap: 44,
          justifyItems: "start",
        }}
      >
        <InstallPill size={46} />
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.15 }}>
          Free and open source.
          <br />
          React-first football pitches.
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 52, color: C.accent, fontWeight: 600 }}>
          pitchkitjs.com
        </div>
        <div style={{ fontSize: 28, color: C.muted, fontWeight: 600 }}>
          Follow for a new football chart every few days.
          <br />
          Data: SkillCorner open data.
        </div>
      </div>
    </Slide>
  );
}
