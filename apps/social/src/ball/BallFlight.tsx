/**
 * A football kicked from the horizon straight at the camera, spinning, that
 * whips past just off to one side. Everything is a pure function of the frame
 * (Remotion renders frames independently), so there is no `useFrame`.
 */
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { ballTextures } from "./ballTexture";

const GROUND_Y = -1.6;
const RADIUS = 0.55;

/** Mowing stripes, repeated over a big plane that fades to black at the horizon. */
function useGrassTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#14532d";
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = "#166534";
    ctx.fillRect(0, 32, 64, 32);
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(30, 60);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 16;
    return t;
  }, []);
}

export function BallFlight({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const grass = useGrassTexture();
  const { color, bump } = useMemo(() => ballTextures(), []);

  const t = Math.min(frame / duration, 1);
  // Straight at the camera, then past it: z runs from far away to just behind
  // the camera plane, so perspective does the "coming at you" work.
  const z = interpolate(t, [0, 1], [-70, 3.2]);
  // Kicked off the ground, climbs, and arrives a little above the lens.
  const rise = Math.sin(Math.min(t * 1.0, 1) * Math.PI * 0.62);
  const y = GROUND_Y + RADIUS + rise * 2.7;
  // Drifts right so it passes beside the camera, not through it.
  const x = interpolate(t, [0, 1], [0, 1.15], { easing: (v) => v * v });

  const spin = frame * 0.42;
  const shadowOpacity = Math.max(0, 0.55 - (y - GROUND_Y) * 0.16);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0.2, 0], rotation: [0, 0, 0], fov: 52, near: 0.05, far: 400 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#07130d"]} />
      <fog attach="fog" args={["#07130d", 30, 230]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 3]} intensity={2.6} />
      <directionalLight position={[-5, 2, 6]} intensity={0.8} color="#9dd9ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, -100]}>
        <planeGeometry args={[220, 420]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>

      {/* A soft contact shadow that stays on the ground under the ball. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, GROUND_Y + 0.01, z]}>
        <circleGeometry args={[RADIUS * 1.5, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={shadowOpacity} />
      </mesh>

      <mesh position={[x, y, z]} rotation={[spin * 0.8, spin, spin * 0.45]}>
        <sphereGeometry args={[RADIUS, 64, 48]} />
        <meshStandardMaterial
          map={color}
          bumpMap={bump}
          bumpScale={0.6}
          roughness={0.38}
          metalness={0.02}
        />
      </mesh>
    </ThreeCanvas>
  );
}
