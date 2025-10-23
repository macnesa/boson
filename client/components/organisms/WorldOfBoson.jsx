'use client'

import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/* ✴️ Particle Layer — depth-controlled cosmic dust */
function ParticleLayer({ count, size, speed, spread, opacity }) {
  const ref = useRef()

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3 + 0] = (Math.random() - 0.5) * spread
      positions[i3 + 1] = (Math.random() - 0.5) * (spread * 0.7)
      positions[i3 + 2] = (Math.random() - 0.5) * spread
    }
    return positions
  }, [count, spread])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed
    if (ref.current) {
      ref.current.rotation.y = t * 0.3
      ref.current.rotation.x = Math.sin(t * 0.6) * 0.08
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color="#ffffff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* 🌌 Main Component */
export default function BosonWorld() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  // 🎮 Handle mouse parallax tilt
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setRotation({
        x: y * 5,
        y: -x * 5,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* 🌌 Dual Layer Particle Field */}
      <Canvas camera={{ position: [0, 0, 4], fov: 65 }}>
        <ambientLight intensity={0.25} />
        <ParticleLayer
          count={2000}
          size={0.015}
          speed={0.45}
          spread={12}
          opacity={0.18}
        />
        <ParticleLayer
          count={800}
          size={0.035}
          speed={0.2}
          spread={6}
          opacity={0.25}
        />
      </Canvas>

      {/* 🔮 Dynamic Glow Field */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(1200px 800px at 70% 35%, rgba(255,255,255,0.06), transparent 80%),
            radial-gradient(1000px 800px at 20% 80%, rgba(255,100,50,0.07), transparent 80%)
          `,
          filter: 'blur(160px)',
          opacity: 0.3,
        }}
      />

      {/* 🪐 Text Section (Tilt + Animation) */}
      <motion.div
        style={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          transformPerspective: 800,
        }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        className="relative z-10 text-right w-full max-w-[60vw] ml-auto pr-[8vw] transform -translate-y-[10vh]"
      >
        {/* BOSON Label */}
        <motion.div
          className="text-neutral-400 tracking-[0.35em] uppercase text-[0.8vw] mb-[1.5vw]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          BOSON
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-white font-light leading-[1.1] text-[4vw] sm:text-[4.5vw] md:text-[5vw] lg:text-[5.5vw]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.2 }}
        >
          THIS IS <br />
          <span className="font-semibold">THE WORLD OF BOSON</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-neutral-400 text-[0.9vw] leading-relaxed mt-[2.5vw] max-w-[28vw] ml-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1.4 }}
        >
          The closer we look, the more we understand certainty is an illusion.
          The uncertainty principle reveals a deeper truth — that reality itself
          is fluid. We cannot hold everything at once. Yet within this fluidity
          lies something greater: a universe alive with probabilities, choices,
          and creation.
        </motion.p>
      </motion.div>

      {/* 🌫 Bottom Fade for cinematic finish */}
      <div className="absolute bottom-0 left-0 right-0 h-[25vh] bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
    </section>
  )
}
