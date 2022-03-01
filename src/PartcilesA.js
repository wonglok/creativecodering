import "./styles.css";
import { useRef, useEffect, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Object3D,
  Points,
  ShaderMaterial,
  Vector3,
  DoubleSide,
  Color,
  InstancedBufferAttribute,
  CircleBufferGeometry,
  InstancedBufferGeometry,
  Mesh,
  PlaneBufferGeometry,
  SphereBufferGeometry,
  IcosahedronBufferGeometry,
} from "three";
import { getCurlNoise } from "./curlNosie";
import { useFrame } from "@react-three/fiber";

import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { BlurPass, Resizer, KernelSize } from "postprocessing";

export function ParticlesA() {
  //
  let pointRef = useRef();
  let [prim, setPrim] = useState(null);

  let works = useRef({});
  useFrame((st, dt) => {
    Object.values(works.current).forEach((e) => e(st, dt));
  });
  useEffect(() => {
    let run = async () => {
      let o3d = new Object3D();

      const layerData = [];
      const orbitAngle = [];
      const rand4 = [];
      const colorData = [];
      const sizeData = [];
      let variations = [
        { size: 0.333 * 1.0, color: new Color("#ffffff") },
        { size: 0.333 * 1.0, color: new Color("#ffffff") },
        { size: 0.333 * 1.5, color: new Color("#ffffff") },
        { size: 0.333 * 2.0, color: new Color("#ff00ff").offsetHSL(0, 0, 0.1) },
        { size: 0.333 * 4.0, color: new Color("#ff00ff").offsetHSL(0, 0, 0.1) },
        { size: 0.333 * 4.0, color: new Color("#00ffff") },
        { size: 0.333 * 5.0, color: new Color("#00ffff") },
      ];

      let tubularSegments = 128;
      let arc = Math.PI * 2.0;

      let radius = 10;

      let ptCounter = 0;
      let sphere = new Vector3();

      let rv = () => Math.random() * 2.0 - 1.0;

      let totalLayers = 15;
      let up = new Vector3(0, 1, 0);

      //
      for (let layer = 0; layer < totalLayers; layer++) {
        for (let t = 0; t < tubularSegments; t++) {
          sphere.setFromSphericalCoords(radius, (t / tubularSegments) * arc, 0);
          sphere.applyAxisAngle(up, Math.PI * 0.5);

          orbitAngle.push((t / tubularSegments) * arc, t, tubularSegments, arc);

          layerData.push(layer / totalLayers, layer, totalLayers);

          rand4.push(rv(), rv(), rv(), rv());

          let variation =
            variations[Math.floor(variations.length * Math.random())];
          colorData.push(
            variation.color.r,
            variation.color.g,
            variation.color.b
          );

          sizeData.push(variation.size);
          ptCounter++;
        }
      }

      let geo = new InstancedBufferGeometry();
      geo.copy(new IcosahedronBufferGeometry(0.1, 1));

      geo.setAttribute(
        "dotSize",
        new InstancedBufferAttribute(new Float32Array(sizeData), 1)
      );

      geo.setAttribute(
        "color",
        new InstancedBufferAttribute(new Float32Array(colorData), 3)
      );

      geo.setAttribute(
        "orbitAngle",
        new InstancedBufferAttribute(new Float32Array(orbitAngle), 4)
      );

      geo.setAttribute(
        "layers",
        new InstancedBufferAttribute(new Float32Array(layerData), 3)
      );

      geo.setAttribute(
        "rand4",
        new InstancedBufferAttribute(new Float32Array(rand4), 4)
      );

      geo.instanceCount = ptCounter;

      //
      let uniforms = {
        time: { value: 0 },
      };

      //
      works.current.time = (st, dt) => {
        let t = st.clock.getElapsedTime();
        uniforms.time.value = t;
      };

      //
      let shader = new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          #include <common>

          ${getCurlNoise()}

          mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
            vec3 rr = vec3(sin(roll), cos(roll), 0.0);
            vec3 ww = normalize(target - origin);
            vec3 uu = normalize(cross(ww, rr));
            vec3 vv = normalize(cross(uu, ww));

            return mat3(uu, vv, ww);
          }

        attribute vec4 orbitAngle;
        attribute vec3 layers;
        attribute vec3 color;
        attribute vec4 rand4;
        attribute float dotSize;

        uniform float time;
        varying float vProgress;
        varying vec4 vRand4;
        varying vec3 vColor;

        void main (void) {
          float PIE = 3.14159265;
          vRand4 = rand4;
          vColor = color;
          vProgress = sin(time + rand4.x) * sin(time + rand4.y);// * cos(time + orbitAngle.x * PIE * 2.0);

          float radius = 18.0 + 6.0 * layers.x;
          float angle1  = orbitAngle.x + time * 0.0025 + rand(layers.xy) * PIE * 2.0 * 0.01;
          float x1 = radius * sin(PIE * 2.0 * angle1);
          float y1 = radius * cos(PIE * 2.0 * angle1);
          float z1 =  0.0;

          float angle2  = orbitAngle.x + rand(layers.xy) * PIE * 2.0 * 0.01;
          float x2 = radius * sin(PIE * 2.0 * angle2);
          float y2 = radius * cos(PIE * 2.0 * angle2);
          float z2 =  0.0;

          vec3 center = vec3(x1,y1,z1);
          vec3 center2 = vec3(x2,y2,z2);

          //
          vec4 vert = vec4(
            position * dotSize
            + center
            + 2.0 * curlNoise(center2 + time * 0.02)
          , 1.0);

          // gl_PointSize= 1.0 * ;
          gl_Position = projectionMatrix * modelViewMatrix * vert;
        }
        `,
        fragmentShader: `
        varying float vProgress;
        varying vec4 vRand4;
        varying vec3 vColor;
        uniform float time;

        void main (void) {
          gl_FragColor = vec4(vColor, mod(vProgress * sin(vRand4.x + time), 1.0));
        }
        `,
        transparent: true,
        side: DoubleSide,
      });

      let points = new Mesh(geo, shader);

      points.frustumCulled = false;
      o3d.add(points);

      setPrim(<primitive ref={pointRef} object={o3d} />);
    };
    run();
  }, []);

  return (
    <group>
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} luminanceSmoothing={1.3} height={960} />
        {/* <SelectiveBloom
          lights={[]} // ⚠️ REQUIRED! all relevant lights
          selection={[pointRef]} // selection of objects that will have bloom effect
          selectionLayer={10} // selection layer
          intensity={1.0} // The bloom intensity.
          blurPass={undefined} // A blur pass.
          width={Resizer.AUTO_SIZE} // render width
          height={Resizer.AUTO_SIZE} // render height
          kernelSize={KernelSize.LARGE} // blur kernel size
          luminanceThreshold={0.9} // luminance threshold. Raise this value to mask out darker elements in the scene.
          luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
        /> */}
      </EffectComposer>

      {prim}
    </group>
  );
}
