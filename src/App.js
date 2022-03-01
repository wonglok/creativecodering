import "./styles.css";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import { Color, Object3D } from "three";
import { ParticlesA } from "./PartcilesA";
import { OrbitControls } from "@react-three/drei";

export default function App() {
  return (
    <Canvas onCreated={(st) => {}}>
      <ParticlesA />
      <BG />
      <Cam />
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
