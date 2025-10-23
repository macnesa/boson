'use client'

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function BosonStoryCinematic() {
  const canvasRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [winSize, setWinSize] = useState({ width: 0, height: 0 })

  // ✅ Ambil ukuran window hanya di client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWinSize({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [])

  // ✅ Motion tilt (parallax mouse)
  const rotateX = useSpring(
    useTransform(mouseY, [0, winSize.height || 1000], [8, -8]),
    { stiffness: 80, damping: 20 }
  )
  const rotateY = useSpring(
    useTransform(mouseX, [0, winSize.width || 1000], [-8, 8]),
    { stiffness: 80, damping: 20 }
  )

  // 🎞️ Animated grain shimmer — dengan pengecekan aman
  useEffect(() => {
    let frame
    const start = () => {
      const canvas = canvasRef.current
      if (!canvas) return // 🚫 amanin null
      const ctx = canvas.getContext('2d')
      if (!ctx) return // 🚫 jaga-jaga null context

      const render = () => {
        const w = (canvas.width = window.innerWidth)
        const h = (canvas.height = window.innerHeight)
        const imageData = ctx.createImageData(w, h)
        const buffer = new Uint32Array(imageData.data.buffer)
        for (let i = 0; i < buffer.length; i++) {
          const shade = (Math.random() * 255) | 0
          buffer[i] = (255 << 24) | (shade << 16) | (shade << 8) | shade
        }
        ctx.putImageData(imageData, 0, 0)
        frame = requestAnimationFrame(render)
      }

      // 🚀 jalanin render setelah 1 frame, pastikan DOM siap
      requestAnimationFrame(render)
    }

    // 🧭 Tunggu canvas mount baru mulai
    const timeout = setTimeout(start, 100)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
    }
  }, [])

  // Render sementara sebelum window siap
  if (!winSize.width) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-black text-neutral-700 text-sm font-mono">
        Initializing scene...
      </div>
    )
  }

  return (
    <section
      className="relative w-full min-h-[95vh] bg-black overflow-hidden flex flex-col justify-between"
      onMouseMove={(e) => {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
      }}
    >
      {/* 🌌 Background glows */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 90%, rgba(255,90,40,0.12), transparent 60%), radial-gradient(circle at 90% 20%, rgba(255,40,10,0.12), transparent 60%), radial-gradient(circle at 50% 10%, rgba(255,80,40,0.08), transparent 70%)',
            filter: 'blur(120px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(800px 400px at 60% 40%, rgba(255,255,255,0.05), transparent 70%)',
            mixBlendMode: 'overlay',
            opacity: 0.4,
            filter: 'blur(80px)',
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 opacity-[0.05] mix-blend-soft-light"
        />
      </motion.div>

      {/* 🧭 Header */}
      <div className="relative z-10 flex justify-between text-[0.8vw] text-white uppercase font-medium px-[6vw] pt-[3vw] tracking-wider">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          BOSON
        </motion.span>
        <motion.span
          className="opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Brand Guidelines
        </motion.span>
        <motion.span
          className="opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Introduction
        </motion.span>
      </div>

      {/* ⚛ Title + Description */}
      <motion.div
        className="relative z-10 flex flex-col justify-center flex-1 px-[6vw] will-change-transform"
        style={{ perspective: 1000 }}
      >
        <motion.h1
          className="text-white text-[3.8vw] font-light leading-[1.15]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          THE <span className="font-semibold">STORY</span> OF <br />
          THE <span className="font-semibold">UNIVERSE</span>
        </motion.h1>

        <motion.p
          className="max-w-[32vw] text-neutral-300 text-[0.85vw] leading-relaxed mt-[6vw] ml-auto tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.3, ease: 'easeOut' }}
        >
          In the beginning, there was only potential — unseen forces shaping
          everything we know. A silence before form, a universe of infinite
          outcomes waiting to be defined. <br />
          <br />
          Every pulse, every decision, every spark — a ripple through the void.
          This is not the story of creation. This is the <strong>moment before</strong> it.
          This is <span className="text-white/90 font-semibold">the world of Boson.</span>
        </motion.p>
      </motion.div>

      {/* 🧩 Footer */}
      <div className="relative z-10 flex justify-between items-end px-[6vw] pb-[2vw] text-[0.75vw] text-white">
        <motion.span
          className="opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          01
        </motion.span>
        <motion.span
          className="opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          Copyright © 2025
        </motion.span>
      </div>
    </section>
  )
}
