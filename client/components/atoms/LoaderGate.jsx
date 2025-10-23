'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function LoaderGate({ children }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handleReady = () => setReady(true)
    if (document.readyState === 'complete') handleReady()
    else window.addEventListener('load', handleReady)
    return () => window.removeEventListener('load', handleReady)
  }, [])

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-neutral-600 font-mono text-sm z-[9999]">
        Loading Boson...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
