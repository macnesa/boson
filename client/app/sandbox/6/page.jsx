"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "@studio-freight/lenis";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

// ----------------- ENERGY FIELD (shader) -----------------
function EnergyField({ mouseRef }) {
  const mesh = useRef();
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0xff7a2b) },
      uColor2: { value: new THREE.Color(0x06060a) },
      uMouse: { value: new THREE.Vector3(0, 0, 0) }, // x,y,strength
      uResolution: {
        value: new THREE.Vector2(viewport.width, viewport.height),
      },
    }),
    [viewport.width, viewport.height]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t * 0.6;

    // Smooth mouse: mouseRef holds target; we lerp into uniform
    const target = mouseRef.current || { x: 0, y: 0, s: 0 };
    uniforms.uMouse.value.x += (target.x - uniforms.uMouse.value.x) * 0.08;
    uniforms.uMouse.value.y += (target.y - uniforms.uMouse.value.y) * 0.08;
    uniforms.uMouse.value.z += (target.s - uniforms.uMouse.value.z) * 0.08;
  });

  return (
    <mesh ref={mesh} position={[0, 0, -1]}>
      <planeGeometry args={[6, 3.6, 128, 128]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uMouse;
          void main() {
            vUv = uv;
            vec3 pos = position;
            // base slow field waves
            float a = sin((pos.x + uTime) * 1.8) * 0.08;
            float b = cos((pos.y - uTime) * 1.6) * 0.06;
            // mouse ripple - local distortion
            vec2 mc = vec2(uMouse.x - 0.5, uMouse.y - 0.5) * 2.0; // -1..1
            float dist = length(vec2(pos.x, pos.y) - mc);
            float ripple = exp(-dist * 2.5) * uMouse.z * 0.6;
            pos.z += a + b + ripple;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uMouse;
          void main() {
            // moving band pattern
            float band = sin(vUv.x * 6.0 + uTime * 0.8) * 0.5 + 0.5;
            // subtle radial highlight around mouse
            vec2 mc = (uMouse.xy - 0.5) * 2.0;
            float dist = length(vec2(vUv.x - (uMouse.x), vUv.y - (1.0 - uMouse.y)));
            float glow = exp(-dist * 8.0) * uMouse.z * 1.6;
            vec3 base = mix(uColor2, uColor1, smoothstep(0.2, 0.9, band));
            vec3 final = mix(base, vec3(1.0, 0.9, 0.7), glow);
            // alpha low for blending
            gl_FragColor = vec4(final, 0.07 + glow * 0.06);
          }
        `}
      />
    </mesh>
  );
}

// ----------------- PARTICLES -----------------
function Particles() {
  const pointsRef = useRef();
  const particlesCount = 600;
  const pos = useMemo(() => {
    const arr = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = -Math.random() * 6;
    }
    return arr;
  }, [particlesCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    // wobble particles slowly on z axis
    const positions = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 2] +=
        Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.0005;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={pos.length / 3}
          array={pos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.18}
        depthWrite={false}
      />
    </points>
  );
}

// ----------------- MAIN APP -----------------
export default function BosonCinematicV31() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, s: 0 }); // normalized 0..1, strength
  const { scrollYProgress } = useScroll({ target: containerRef });
  const fade = useTransform(scrollYProgress, [0, 0.25], [1, 0.15]);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // pointer handler for Canvas (global)
  useEffect(() => {
    const onMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = e.clientX / w;
      const ny = e.clientY / h;
      // strength based on proximity to center
      const dx = Math.abs(nx - 0.5);
      const dy = Math.abs(ny - 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const strength = Math.max(0, 1.0 - dist * 2.0); // 0..1
      mouseRef.current = { x: nx, y: ny, s: strength };
    };
    window.addEventListener("pointermove", onMove);
    // fade mouse to zero when leave
    const onLeave = () => (mouseRef.current.s = 0);
    window.addEventListener("pointerout", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    };
  }, []);

  return (
    <motion.main
      ref={containerRef}
      className="relative min-h-screen text-white overflow-x-hidden font-sans bg-[#050505]"
    >
      <section
        id="home"
        className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#050505]"
      >
        {/* === BACKGROUND 3D FIELD === */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 3.2], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            className="!absolute !inset-0"
          >
            <color attach="background" args={["#050505"]} />
            <ambientLight intensity={0.7} />
            <pointLight position={[3, 2, 2]} intensity={0.3} />
            <EnergyField mouseRef={mouseRef} />
            <Particles />
            <EffectComposer>
              <Bloom
                luminanceThreshold={0.25}
                luminanceSmoothing={0.9}
                intensity={1.1}
              />
              <ChromaticAberration
                offset={[0.0018, 0.0012]}
                blendFunction={BlendFunction.NORMAL}
              />
            </EffectComposer>
          </Canvas>
        </div>

        {/* === FOREGROUND CONTENT === */}
        <div className="relative z-10 text-center px-6">
          {/* subtle radial aura behind text */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-[40rem] h-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* BOSON TITLE */}
          <motion.h1
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
            whileHover={{ letterSpacing: "0.05em" }}
            className="text-[4.8rem] md:text-[7rem] font-light uppercase tracking-tight leading-none relative"
          >
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="bg-gradient-to-br from-white via-gray-300 to-gray-600 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(255,255,255,0.08)]"
            >
              Boson
            </motion.span>
          </motion.h1>

          {/* SUBTEXT */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1.2 }}
            className="text-gray-400 max-w-xl mx-auto mt-8 mb-12 text-sm tracking-[0.28em] uppercase"
          >
            Creativity · Transformation · Infinite Potential
          </motion.p>

          {/* CTA BUTTON */}
          <motion.a
            href="#philosophy"
            whileHover={{
              scale: 1.08,
              boxShadow: "0 0 40px rgba(255,255,255,0.3)",
              backgroundColor: "#f5f5f5",
            }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="inline-block px-10 py-3 rounded-full bg-white text-black font-medium tracking-widest uppercase text-sm shadow-[0_0_25px_rgba(255,255,255,0.12)]"
          >
            Enter
          </motion.a>
        </div>

        {/* === LIGHT PULSE OVERLAY === */}
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.04),transparent_80%)]"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* subtle bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 pointer-events-none z-[5]" />
      </section>

      {/* --- CONTENT: Philosophy / Principle --- */}
      <section
        id="philosophy"
        className="py-56 text-center relative z-10 border-t border-white/5"
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
            className="text-4xl md:text-5xl font-light uppercase tracking-tight mb-8"
          >
            The Story of the Universe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 1.1 }}
            className="text-gray-400 leading-relaxed max-w-3xl mx-auto text-base"
          >
            In the beginning, there was only potential — unseen waves shaping
            reality. <br />
            Boson emerged as the pulse between silence and creation, <br />
            <span className="text-gray-300 italic">
              a field of infinite transformation.
            </span>
          </motion.p>
        </div>
      </section>

      <section
        id="manifesto"
        className="py-48 text-center relative z-10 border-t border-white/5"
      >
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-5xl font-light mb-6 uppercase tracking-tight"
        >
          The Boson Principle
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1.1 }}
          className="text-gray-400 max-w-2xl mx-auto text-base leading-relaxed"
        >
          To translate chaos into form. <br />
          To refine motion into meaning. <br />
          To create systems that evolve — endlessly.
        </motion.p>
      </section>

      <footer className="py-16 text-center text-gray-500 text-xs border-t border-white/5 tracking-wider uppercase relative z-10">
        © {new Date().getFullYear()} Boson Collective — Creativity in Motion.
      </footer>
    </motion.main>
  );
}
