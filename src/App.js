import "./styles.css";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import { Color, Object3D } from "three";
import { ParticlesA } from "./PartcilesA";
import { OrbitControls } from "@react-three/drei";

import {
  Bloom,
  EffectComposer,
  DepthOfField,
  Noise,
} from "@react-three/postprocessing";

export default function App() {
  return (
    <Canvas>
      <group rotation={[Math.PI * -0.35, Math.PI * -0.05, 0]}>
        <ParticlesA />
      </group>

      <BG />

      <Cam />

      <EffectComposer>
        <DepthOfField
          focusDistance={0.85}
          focalLength={0.6}
          bokehScale={2}
          height={480}
        />
        <Bloom
          luminanceThreshold={0.4}
          luminanceSmoothing={1.3}
          height={960}
          opacity={2}
        />
        <Noise opacity={0.1} />
      </EffectComposer>

      <OrbitControls />
    </Canvas>
  );
}

function Cam() {
  let { camera } = useThree();
  useEffect(() => {
    camera.position.z = 50;
  });
  //
  return <group></group>;
}

function BG() {
  let { scene } = useThree();
  useEffect(() => {
    scene.background = new Color("#000000");
  });
  //
  return <group></group>;
}

//
