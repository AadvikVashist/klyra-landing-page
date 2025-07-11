"use client";

import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { AsciiRenderer, Center, OrbitControls } from "@react-three/drei";
import { SVGLoader } from "three-stdlib";
import * as THREE from "three";
import { Suspense, useMemo } from "react";
import React from "react";

interface AsciiExtrudedSvgProps {
  /** Path to the SVG file – should be accessible by the browser (e.g. from /public). */
  src: string;
  /** Depth of the extrusion in world units. Default: 10. */
  depth?: number;
  /** ASCII effect resolution (smaller = chunkier, larger = finer). Default: 0.15 */
  resolution?: number;
  /** Foreground colour of the ASCII characters. Default: "white" */
  fgColor?: string;
  /** Background colour behind the ASCII characters. Default: "black" */
  bgColor?: string;
  /** Custom ASCII character ramp from dark→light. */
  characters?: string;
  /** Rotation speed in radians per second around the Y-axis. Default: 0.5 */
  spinSpeed?: number;
  /** Optional vertical offset for the whole Canvas (e.g. "-10vh", "50px"). Does not affect the camera-object relationship. */
  yOffset?: string | number;
  /** Optional camera nudge in world units – [x, y, z]. Helps visually centre the ASCII raster. Default: [-25, 25, 0] */
  cameraNudge?: [number, number, number];
}

/**
 * Renders an SVG as a 3D extruded mesh and feeds the scene through an ASCII post-processing effect.
 * The result is centred and fills the entire viewport.
 */
export default function AsciiExtrudedSvg({
  src,
  depth = 10,
  resolution = 0.14,
  fgColor = "white",
  bgColor = "black",
  characters = " .:-=+*#%@",
  spinSpeed = 0.2,
  yOffset = 0,
  cameraNudge = [0, 0, 0],
}: AsciiExtrudedSvgProps) {
  const [nudgeX, nudgeY, nudgeZ] = cameraNudge;
  return (
    <Canvas
      style={{
        width: "100vh",
        height: "100vh",
        transform: `translateY(${typeof yOffset === "number" ? `${yOffset}px` : yOffset})`,
      }}
      camera={{ position: [nudgeX, 100 + nudgeY, 1000 + nudgeZ], fov: 60, near: 1, far: 5000 }}
      gl={{ alpha: false }}
    >
      {/* Basic lighting so the ASCII effect has something to shade */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 20]} intensity={0.7} />

      <Suspense fallback={null}>
        <SvgMesh src={src} depth={depth} spinSpeed={spinSpeed} />
      </Suspense>

      {/* Allow users to rotate the scene with their mouse */}
      <OrbitControls enableZoom={false} enablePan={false} />

      {/* Post-process the whole scene into ASCII */}
      <AsciiRenderer
        resolution={resolution}
        fgColor={fgColor}
        bgColor={bgColor}
        characters={characters}
        invert={true}
        renderIndex={1}
      />
    </Canvas>
  );
}

function SvgMesh({ src, depth, spinSpeed }: { src: string; depth: number; spinSpeed: number }) {
  // Load and parse the SVG on the client.
  const svgData = useLoader(SVGLoader, src);

  // Convert SVG paths to a single THREE.ExtrudeGeometry.
  const geometry = useMemo<THREE.BufferGeometry>(() => {
    const shapes: THREE.Shape[] = [];
    // Cast to the expected type to avoid excessive compile-time comparisons
    (svgData.paths as unknown as THREE.ShapePath[]).forEach((path) => {
      shapes.push(...path.toShapes(true));
    });

    const geom = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
    }) as unknown as THREE.BufferGeometry;

    // Centre the geometry so it sits at the origin.
    geom.center();
    return geom;
  }, [svgData, depth]);

  const meshRef = React.useRef<THREE.Mesh>(null!);

  // Rotate the mesh every frame.
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += spinSpeed * delta;
    }
  });

  return (
    <Center>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore – geometry is compatible at runtime */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <mesh ref={meshRef} geometry={geometry as any} rotation={[Math.PI, 0, 0]}>
        <meshNormalMaterial />
      </mesh>
    </Center>
  );
} 