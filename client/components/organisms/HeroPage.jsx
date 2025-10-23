'use client'

import { motion } from 'framer-motion'

const panels = [
  {
    char: 'B',
    // soft metallic streak
    bg: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 10%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.9) 100%),
         radial-gradient(1200px 400px at 10% 25%, rgba(255,255,255,0.03), transparent 20%),
         linear-gradient(120deg, rgba(255,230,170,0.02), transparent 20%)`,
  },
  {
    char: 'O',
    // vertical ribbed gradient feel
    bg: `linear-gradient(90deg, rgba(0,0,0,0.9), rgba(30,30,30,0.88)),
         repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 8px)`,
  },
  {
    char: 'S',
    // swirling radial glow
    bg: `radial-gradient(600px 800px at 60% 20%, rgba(255,255,255,0.06), rgba(255,255,255,0.01) 10%, rgba(0,0,0,0.85) 50%),
         conic-gradient(from 120deg at 50% 40%, rgba(255,255,255,0.02), rgba(255,255,255,0.0) 40%)`,
  },
  {
    char: 'O',
    // soft satin fold
    bg: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.85) 40%),
         radial-gradient(400px 200px at 80% 20%, rgba(255,255,255,0.04), transparent 30%)`,
  },
  {
    char: 'N',
    // dark vignette with corner streak
    bg: `linear-gradient(180deg, rgba(0,0,0,0.95), rgba(8,8,8,0.88)),
         radial-gradient(500px 200px at 90% 10%, rgba(255,255,255,0.05), transparent 10%)`,
  },
]

export default function BosonCollectiveGradient() {
  return (
    <div className="relative w-full h-screen flex flex-col justify-center items-center bg-black overflow-hidden">
      {/* Global gradient / spotlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140vw] h-[140vh] pointer-events-none"
           style={{
             background:
               'radial-gradient(800px 200px at 50% 5%, rgba(255,255,255,0.06), transparent 10%)',
             filter: 'blur(120px)',
             opacity: 0.28,
           }} />

      {/* Panels row */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="flex space-x-6 z-10"
      >
        {panels.map((p, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, y: -10, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
            className="relative w-36 sm:w-44 md:w-52 h-[360px] sm:h-[380px] md:h-[420px] overflow-hidden rounded-sm"
            style={{
              // multiple layered gradients from the panel.bg string
              background: p.bg,
              backgroundBlendMode: 'normal, overlay, soft-light',
              border: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            {/* subtle inner vignette */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 70%)',
              mixBlendMode: 'multiply',
            }} />

            {/* center character */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.06, duration: 0.6 }}
                className="text-white text-5xl md:text-[4rem] font-extralight tracking-wide"
                style={{ textShadow: '0 6px 18px rgba(0,0,0,0.6)' }}
              >
                {p.char}
              </motion.span>
            </div>

            {/* faint top-right highlight stripe */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '60%',
              height: '40%',
              pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.00) 30%)',
              transform: 'translate(10%, -10%) rotate(6deg)',
              opacity: 0.8,
              mixBlendMode: 'screen',
            }} />
          </motion.div>
        ))}
      </motion.div>

      {/* COLLECTIVE label */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="mt-12 tracking-[1.2em] text-neutral-300 text-sm font-light z-10"
      >
        COLLECTIVE
      </motion.div>

      {/* bottom soft fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[36vh] bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
