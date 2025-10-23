'use client'

import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function WhoWeAre() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Generate random particles on client
    const generated = Array.from({ length: 40 }).map(() => ({
      cx: Math.random() * 1920,
      cy: Math.random() * 1080,
      r: Math.random() * 2 + 0.5,
      duration: 5 + Math.random() * 3,
      delay: Math.random() * 3,
    }))
    setParticles(generated)

    const updateDimensions = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    updateDimensions()

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', updateDimensions)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [mouseX, mouseY])

  const rotateX = useTransform(mouseY, [0, dimensions.height || 1], [8, -8])
  const rotateY = useTransform(mouseX, [0, dimensions.width || 1], [-8, 8])

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden bg-black text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {/* Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-800" />

      {/* Parallax Layer */}
      <motion.div
        style={{ rotateX, rotateY }}
        className="absolute inset-0 opacity-70 will-change-transform"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1920 1080"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="softLight" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="circleStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>

          {/* Subtle Light Overlay */}
          <rect width="1920" height="1080" fill="url(#softLight)" />

          {/* Glowing Circles */}
          <circle
            cx="600"
            cy="540"
            r="360"
            fill="none"
            stroke="url(#circleStroke)"
            strokeWidth="1.2"
            filter="drop-shadow(0 0 6px rgba(255,255,255,0.1))"
          />
          <circle
            cx="600"
            cy="540"
            r="520"
            fill="none"
            stroke="url(#circleStroke)"
            strokeWidth="1"
            filter="drop-shadow(0 0 10px rgba(255,255,255,0.15))"
          />
          <circle
            cx="600"
            cy="540"
            r="700"
            fill="none"
            stroke="url(#circleStroke)"
            strokeWidth="0.8"
            filter="drop-shadow(0 0 15px rgba(255,255,255,0.12))"
          />

          {/* Floating Particles */}
          <g>
            {particles.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r={p.r}
                fill="rgba(255,255,255,0.15)"
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: p.delay,
                }}
              />
            ))}
          </g>
        </svg>
      </motion.div>

      {/* Glow Accent */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 2, delay: 0.4, ease: 'easeOut' }}
        className="absolute inset-0 mix-blend-overlay pointer-events-none"
      >
        <div className="absolute w-[500px] h-[500px] bg-gradient-radial from-yellow-200/25 via-transparent to-transparent blur-[150px] top-[20%] left-[40%] animate-pulse" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="absolute inset-0 flex justify-between items-center px-24"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, delay: 0.6, ease: 'easeOut' }}
      >
        {/* Left paragraph */}
        <div className="max-w-md text-sm leading-relaxed text-gray-300">
          <p>
            Boson is a multicultural collective of creatives, strategists, and designers. We blend global
            perspectives with local expertise to craft brands, stories, and digital experiences that stand out
            in a noisy world.
            <br />
            <br />
            Our values: loyalty, dedication, and building long-term partnerships rooted in success.
          </p>
        </div>

        {/* Right title */}
        <div className="text-right">
          <h2 className="text-[8rem] font-light leading-none tracking-tight">WHO</h2>
          <h1 className="text-[11rem] font-bold leading-none -mt-8 tracking-tight">WE ARE</h1>
        </div>
      </motion.div>
 
    </motion.div>
  )
}
