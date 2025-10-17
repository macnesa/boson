"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

export default function SkullParticles() {
  const mountRef = useRef(null);

  useEffect(() => {
    // === BASIC SETUP ===
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(renderer.domElement);

    // Postprocessing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.25, // subtle bloom
      0.1,
      0.9
    );
    composer.addPass(bloom);

    // Controls (debug)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.enablePan = false;

    // Light
    const light = new THREE.PointLight(0x99ccff, 2, 100);
    light.position.set(0, 5, 15);
    scene.add(light);

    // GPU Compute renderer setup
    if (!renderer.capabilities.isWebGL2) {
      console.error("WebGL2 required for GPUComputationRenderer");
      return;
    }

    const gpuCompute = new GPUComputationRenderer(256, 256, renderer);
    const loader = new GLTFLoader();

    let gpuInitialized = false;
    let particleSystem = null;
    let computeVars = {};
    let texWidth = 0;
    let PARTICLE_COUNT = 0;

    loader.load(
      "../models/skull.glb",
      (gltf) => {
        const skull = gltf.scene;
        const geos = [];
        skull.traverse((child) => {
          if (child.isMesh) {
            const geo = child.geometry.clone();
            child.updateWorldMatrix(true, false);
            geo.applyMatrix4(child.matrixWorld);
            geos.push(geo);
          }
        });
        if (geos.length === 0) {
          console.error("No meshes in skull.glb");
          return;
        }

        const merged = mergeGeometries(geos, true);
        const posArray = merged.attributes.position.array;
        const totalVerts = posArray.length / 3;

        // Sampling (optional for perf)
        const SAMPLE = 2;
        const sampled = [];
        for (let i = 0; i < totalVerts; i += SAMPLE) {
          sampled.push(posArray[i * 3 + 0]);
          sampled.push(posArray[i * 3 + 1]);
          sampled.push(posArray[i * 3 + 2]);
        }

        PARTICLE_COUNT = sampled.length / 3;
        texWidth = Math.ceil(Math.sqrt(PARTICLE_COUNT));
        const texSize = texWidth;

        // rebuild GPU renderer with correct size
        gpuCompute.dispose();
        const gpu = new GPUComputationRenderer(texSize, texSize, renderer);

        // Create textures
        const dtPosition = gpu.createTexture();
        const dtVelocity = gpu.createTexture();
        const dtTarget = gpu.createTexture();

        const posData = dtPosition.image.data;
        const velData = dtVelocity.image.data;
        const targetData = dtTarget.image.data;

        // Fill textures — no scatter version
        let ptr = 0;
        for (let i = 0; i < texSize * texSize; i++) {
          if (i < PARTICLE_COUNT) {
            const si = i * 3;
            const sx = sampled[si + 0];
            const sy = sampled[si + 1];
            const sz = sampled[si + 2];

            posData[ptr + 0] = sx;
            posData[ptr + 1] = sy;
            posData[ptr + 2] = sz;
            posData[ptr + 3] = 1.0;

            velData[ptr + 0] = 0.0;
            velData[ptr + 1] = 0.0;
            velData[ptr + 2] = 0.0;
            velData[ptr + 3] = 1.0;

            targetData[ptr + 0] = sx;
            targetData[ptr + 1] = sy;
            targetData[ptr + 2] = sz;
            targetData[ptr + 3] = 1.0;
          } else {
            posData[ptr + 0] = 0;
            posData[ptr + 1] = 0;
            posData[ptr + 2] = 0;
            posData[ptr + 3] = 1.0;
            velData[ptr + 0] = 0;
            velData[ptr + 1] = 0;
            velData[ptr + 2] = 0;
            velData[ptr + 3] = 1.0;
            targetData[ptr + 0] = 0;
            targetData[ptr + 1] = 0;
            targetData[ptr + 2] = 0;
            targetData[ptr + 3] = 1.0;
          }
          ptr += 4;
        }

        // Velocity shader (gentle breathing only)
        const velocityFragmentShader = `
precision highp float;
uniform float uTime;
uniform sampler2D textureTarget;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  // texturePosition and textureVelocity are injected by GPUComputationRenderer
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec3 target = texture2D(textureTarget, uv).xyz;

  vec3 dir = pos - target;
  float len = length(dir);
  vec3 n = (len > 0.0001) ? (dir / len) : vec3(0.0);

  // Small breathing motion — use safe normalized vector
  vec3 offset = n * sin(uTime * 0.5 + pos.y * 0.2) * 0.003;
  vec3 newVel = mix(vel, offset, 0.05);

  gl_FragColor = vec4(newVel, 1.0);
}
`;


        // Position shader
        const positionFragmentShader = `
          precision highp float;
          uniform float uDelta;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            vec3 pos = texture2D(texturePosition, uv).xyz;
            vec3 vel = texture2D(textureVelocity, uv).xyz;
            pos += vel * uDelta * 60.0;
            gl_FragColor = vec4(pos, 1.0);
          }
        `;

        // Create GPU vars
        const velVar = gpu.addVariable(
          "textureVelocity",
          velocityFragmentShader,
          dtVelocity
        );
        const posVar = gpu.addVariable(
          "texturePosition",
          positionFragmentShader,
          dtPosition
        );

        // GPUComputationRenderer butuh tahu dependency antar variable
        gpu.setVariableDependencies(velVar, [velVar, posVar]);
        gpu.setVariableDependencies(posVar, [velVar, posVar]);

        // === Tambahkan semua uniform yang dipakai di velocityFragmentShader ===
        velVar.material.uniforms = {
          texturePosition: { value: null }, // posisi dari previous pass
          textureVelocity: { value: null }, // velocity dari previous pass
          textureTarget: { value: dtTarget }, // target skull vertex
          uTime: { value: 0.0 }, // waktu animasi
          uDelta: { value: 0.0 }, // delta time (optional tapi aman)
        };

        // === Untuk position shader ===
        posVar.material.uniforms = {
          texturePosition: { value: null },
          textureVelocity: { value: null },
          uDelta: { value: 0.0 },
        };

        const gpuDefaultVertexShader = `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `;
        velVar.material.vertexShader = gpuDefaultVertexShader;
        posVar.material.vertexShader = gpuDefaultVertexShader;

        const error = gpu.init();
        velVar.material.uniforms.texturePosition.value = gpu.getCurrentRenderTarget(posVar).texture;
velVar.material.uniforms.textureVelocity.value = gpu.getCurrentRenderTarget(velVar).texture;
posVar.material.uniforms.texturePosition.value = gpu.getCurrentRenderTarget(posVar).texture;
posVar.material.uniforms.textureVelocity.value = gpu.getCurrentRenderTarget(velVar).texture;
        if (error !== null) {
          console.error("GPUComputationRenderer init error:", error);
          return;
        }

        // === Particle Render Geometry ===
        const particles = texSize * texSize;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particles * 3);
        const uvs = new Float32Array(particles * 2);
        const colors = new Float32Array(particles * 3);

        for (let i = 0; i < texSize; i++) {
          for (let j = 0; j < texSize; j++) {
            const id = i * texSize + j;
            positions[id * 3 + 0] = 0;
            positions[id * 3 + 1] = 0;
            positions[id * 3 + 2] = 0;
            uvs[id * 2 + 0] = (j + 0.5) / texSize;
            uvs[id * 2 + 1] = (i + 0.5) / texSize;

            const c = new THREE.Color().setHSL(
              0.6 + Math.random() * 0.1,
              1.0,
              0.6
            );
            colors[id * 3 + 0] = c.r;
            colors[id * 3 + 1] = c.g;
            colors[id * 3 + 2] = c.b;
          }
        }

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );
        geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        // === Particle Material ===
        const particleMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uPositionTex: { value: null },
            uPointScale: { value: window.innerHeight / 2 },
            uTime: { value: 0 },
          },
          vertexShader: `
            uniform sampler2D uPositionTex;
            uniform float uPointScale;
            uniform float uTime;
            varying vec3 vColor;
            void main(){
              vec3 pos = texture2D(uPositionTex, uv).xyz;
              vColor = color;
              vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
              gl_Position = projectionMatrix * mvPos;
              float size = 1.2 * (uPointScale / max(-mvPos.z, 1.0));
              gl_PointSize = clamp(size, 1.0, 5.0);
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main(){
              vec2 pc = gl_PointCoord - vec2(0.5);
              float d = length(pc);
              if (d > 0.48) discard;
              float alpha = 1.0 - step(0.46, d);
              gl_FragColor = vec4(vColor, alpha);
            }
          `,
          blending: THREE.NormalBlending,
          depthWrite: true,
          transparent: true,
          vertexColors: true,
        });

        // === Add to scene ===
        particleSystem = new THREE.Points(geometry, particleMaterial);
        particleSystem.frustumCulled = false;
        particleSystem.scale.set(10, 10, 10);
        particleSystem.position.set(0, -1.2, 0);
        scene.add(particleSystem);

        computeVars = { gpu, velVar, posVar, particleMaterial, texSize };
        gpuInitialized = true;
      },
      undefined,
      (err) => console.error("Failed to load skull:", err)
    );

    // === ANIMATION LOOP ===
    const clock = new THREE.Clock();
    let rafId;
    function animate() {
      const t = clock.getElapsedTime();
      const dt = Math.min(0.03, clock.getDelta());

      if (gpuInitialized && computeVars.gpu) {
        const { gpu, velVar, posVar, particleMaterial } = computeVars;
        velVar.material.uniforms.uTime.value = t;
        posVar.material.uniforms.uDelta.value = dt;
        gpu.compute();
        particleMaterial.uniforms.uPositionTex.value =
          gpu.getCurrentRenderTarget(posVar).texture;
        particleMaterial.uniforms.uTime.value = t;
        particleMaterial.uniforms.uPointScale.value = window.innerHeight / 2;
      }

      controls.update();
      composer.render();
      rafId = requestAnimationFrame(animate);
    }
    animate();

    // === RESIZE ===
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // === CLEANUP ===
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      if (computeVars.gpu) computeVars.gpu.dispose();
      if (particleSystem) scene.remove(particleSystem);
      composer.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement)
        mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-screen h-screen" />;
}
