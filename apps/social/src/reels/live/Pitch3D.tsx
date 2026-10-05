/**
 * The 360 scene in 3D: a dark pitch seen at a broadcast tilt, with the space
 * each visible player controls painted on the grass (Voronoi cells, clipped
 * to the camera's visible area), every player standing on it as a lit sphere
 * in their team's colour, and the ball. The actor and the keepers, the only
 * players 360 data can name, carry their shirt numbers.
 *
 * Everything is a pure function of the frame, so the texture and the scene
 * are rebuilt per frame.
 */
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { computeVoronoiCells } from "@pitchkit/core";
import { CanvasTexture, SRGBColorSpace, Vector3 } from "three";
import type { Player } from "./scene360";
import { ARG, FRA, FRAMES, sceneAt } from "./scene360";

export { ARG, FRA };

/** Texture pixels per StatsBomb unit. */
const PX = 12;
const R = 2.3;

function drawPitch(ctx: CanvasRenderingContext2D, u: number, win: number) {
  const scene = sceneAt(u);
  const W = 120 * PX;
  const H = 80 * PX;
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let i = 0; i < 12; i += 2) ctx.fillRect(i * 10 * PX, 0, 10 * PX, H);

  // Where the camera has been looking: a fading wash.
  for (const f of FRAMES.filter((f) => f.u <= u && f.u > u - 0.8)) {
    ctx.fillStyle = `rgba(255,255,255,${0.014 * (1 - (u - f.u) / 0.8)})`;
    ctx.beginPath();
    f.area.forEach(([x, y], i) => (i ? ctx.lineTo(x * PX, y * PX) : ctx.moveTo(x * PX, y * PX)));
    ctx.fill();
  }

  // The space each visible player controls, inside the camera's view only.
  const visible = scene.players.filter((p) => p.opacity > 0.5);
  const cells = computeVoronoiCells(
    visible.map((p) => [p.x, p.y] as const),
    { x: 0, y: 0, width: 120, height: 80 },
  );
  const area = new Path2D();
  scene.area.forEach(([x, y], i) =>
    i ? area.lineTo(x * PX, y * PX) : area.moveTo(x * PX, y * PX),
  );
  area.closePath();
  ctx.save();
  ctx.clip(area);
  cells.forEach((cell, i) => {
    if (cell.length < 3) return;
    ctx.beginPath();
    cell.forEach(([x, y], j) => (j ? ctx.lineTo(x * PX, y * PX) : ctx.moveTo(x * PX, y * PX)));
    ctx.closePath();
    ctx.fillStyle = visible[i]!.argentina ? ARG : FRA;
    ctx.globalAlpha = 0.62;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(5,8,16,0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
  ctx.restore();
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 3;
  ctx.stroke(area);
  ctx.setLineDash([]);

  // Markings.
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(2, 2, W - 4, H - 4);
  ctx.moveTo(60 * PX, 0);
  ctx.lineTo(60 * PX, H);
  ctx.moveTo(70 * PX, 40 * PX);
  ctx.arc(60 * PX, 40 * PX, 10 * PX, 0, Math.PI * 2);
  for (const side of [0, 1]) {
    const x = (v: number) => (side === 0 ? v : 120 - v) * PX;
    ctx.moveTo(x(0), 18 * PX);
    ctx.lineTo(x(18), 18 * PX);
    ctx.lineTo(x(18), 62 * PX);
    ctx.lineTo(x(0), 62 * PX);
    ctx.moveTo(x(0), 30 * PX);
    ctx.lineTo(x(6), 30 * PX);
    ctx.lineTo(x(6), 50 * PX);
    ctx.lineTo(x(0), 50 * PX);
  }
  ctx.stroke();

  if (win > 0) {
    ctx.fillStyle = ARG;
    ctx.globalAlpha = 0.6 * win;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  return scene;
}

/** A shirt number drawn once per team and number, for a camera-facing sprite. */
function useNumberTextures() {
  return useMemo(() => {
    const cache = new Map<string, CanvasTexture>();
    return (n: number, argentina: boolean) => {
      const key = `${n}-${argentina}`;
      let t = cache.get(key);
      if (!t) {
        const c = document.createElement("canvas");
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext("2d")!;
        ctx.font = "92px Anton, Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = argentina ? "#0b1830" : "#ffffff";
        ctx.fillText(String(n), 64, 68);
        t = new CanvasTexture(c);
        t.colorSpace = SRGBColorSpace;
        cache.set(key, t);
      }
      return t;
    };
  }, []);
}

function Camera({ position, target }: { position: Vector3; target: Vector3 }) {
  const camera = useThree((s) => s.camera);
  camera.position.copy(position);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return null;
}

function PlayerSphere({
  p,
  cam,
  number,
}: {
  p: Player;
  cam: Vector3;
  number: (n: number, a: boolean) => CanvasTexture;
}) {
  const pos = new Vector3(p.x - 60, R, p.y - 40);
  const color = p.argentina ? ARG : FRA;
  const toCam = cam
    .clone()
    .sub(pos)
    .normalize()
    .multiplyScalar(R * 1.02);
  return (
    <group>
      {/* Contact shadow, then the ring that marks the player on the ball. */}
      <mesh position={[pos.x, 0.03, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R * 1.15, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5 * p.opacity} />
      </mesh>
      {p.actor && (
        <mesh position={[pos.x, 0.05, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R * 1.45, R * 1.8, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95 * p.opacity} />
        </mesh>
      )}
      <mesh position={pos}>
        <sphereGeometry args={[R, 32, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.05}
          transparent
          opacity={p.opacity}
        />
      </mesh>
      {p.number !== null && p.opacity > 0.5 && (
        <sprite position={pos.clone().add(toCam)} scale={[R * 1.6, R * 1.6, 1]} renderOrder={10}>
          <spriteMaterial map={number(p.number, p.argentina)} transparent depthTest={false} />
        </sprite>
      )}
    </group>
  );
}

export function Pitch3D({
  u,
  width,
  height,
  azimuth,
  elevation,
  distance,
  target = [0, 0, 0],
  win = 0,
}: {
  u: number;
  width: number;
  height: number;
  /** Camera angle around the pitch, radians. */
  azimuth: number;
  elevation: number;
  distance: number;
  /** Where the camera looks, in pitch units from the centre spot ([x, 0, y]). */
  target?: [number, number, number];
  /** 0..1: Argentina's colour taking the whole pitch at the end. */
  win?: number;
}) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 120 * PX;
    c.height = 80 * PX;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 16;
    return t;
  }, [canvas]);
  const number = useNumberTextures();

  const scene = drawPitch(canvas.getContext("2d")!, u, win);
  texture.needsUpdate = true;

  // Follow play gently: lean towards where the ball has been over the last
  // minute played, averaged so cuts between frames never jerk the camera.
  const recent = FRAMES.filter((f) => f.u <= u && f.u > u - 1.5);
  const follow = recent.length
    ? recent.reduce((sum, f) => sum + f.ball.x, 0) / recent.length - 60
    : 0;
  const look = new Vector3(target[0] + 0.3 * follow, target[1], target[2]);
  const cam = new Vector3(
    distance * Math.sin(azimuth) * Math.cos(elevation),
    distance * Math.sin(elevation),
    distance * Math.cos(azimuth) * Math.cos(elevation),
  ).add(look);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 24, near: 1, far: 3000 }}
      flat
      style={{ position: "absolute", inset: 0 }}
    >
      <Camera position={cam} target={look} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[-60, 140, 60]} intensity={1.6} />
      <directionalLight position={[80, 40, -80]} intensity={0.4} color="#9dd9ff" />
      {/* The pitch, with a thin slab under it so it reads as an object. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 80]} />
        <meshStandardMaterial map={texture} roughness={0.9} />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[120, 2.3, 80]} />
        <meshStandardMaterial color="#050810" roughness={1} />
      </mesh>
      {scene.players
        .filter((p) => p.opacity > 0.05)
        .map((p, i) => (
          <PlayerSphere key={i} p={p} cam={cam} number={number} />
        ))}
      <mesh position={[scene.ball.x - 60, 0.03, scene.ball.y - 40]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
      <mesh position={[scene.ball.x - 60, 0.9, scene.ball.y - 40]}>
        <sphereGeometry args={[0.9, 24, 16]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#fde047"
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>
    </ThreeCanvas>
  );
}
