'use client'

/**
 * Boson Hero — v1.1.2 (Visible Energy Pass)
 * Single-file Next.js client component (drop into app/page.jsx or a client route)
 * Dependencies:
 *   three, @react-three/fiber, @react-three/drei, gsap, @react-three/postprocessing, postprocessing
 * Tailwind optional — this file includes inline CSS for the hero specifics.
 *
 * Features (Full Cinematic):
 *  - Triple-layer breathing radial energy background
 *  - Two particle layers (cool back / warm front) with rotation + sinusoidal drift
 *  - Torus logo with emissive copper glow + bloom intensity 1.0 + front point light
 *  - Soft parallax (pointer-driven) across scene + gradient
 *  - Vignette + grain overlays tuned for cinematic visibility
 *  - GSAP timeline for staggered reveal and subtle overshoot
 *  - Prefers-reduced-motion fallback (instant visible)
 */

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect'
import { Canvas, useFrame } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/* ---------------- Helper: reduced motion ---------------- */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const listener = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', listener)
    return () => mq.removeEventListener?.('change', listener)
  }, [])
  return reduced
}

/* ---------------- CTA Button (subtle magnetic) ---------------- */
function CTAButton({ onClick }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let rafId = null
    const state = { tx: 0, ty: 0, vx: 0, vy: 0 }

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      state.tx = dx * 0.03
      state.ty = dy * 0.02
      if (!rafId) loop()
    }
    function onLeave() {
      state.tx = 0
      state.ty = 0
      if (!rafId) loop()
    }
    function loop() {
      state.vx += (state.tx - state.vx) * 0.12
      state.vy += (state.ty - state.vy) * 0.12
      el.style.transform = `translate3d(${state.vx.toFixed(2)}px, ${state.vy.toFixed(2)}px, 0) scale(1)`
      rafId = requestAnimationFrame(loop)
      if (Math.abs(state.vx - state.tx) < 0.01 && Math.abs(state.vy - state.ty) < 0.01 && state.tx === 0 && state.ty === 0) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="cta-btn px-6 py-3 rounded-full text-sm font-medium"
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(245,185,114,0.08))',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        color: 'white'
      }}
    >
      Begin the transformation
    </button>
  )
}

/* ---------------- Particles (improved visibility + drift) ---------------- */
function Particles({ count = 400, radius = 2.5, baseSpeed = 0.015, size = 3.0, color = '#f7d59a' }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const r = 1.0 + Math.random() * radius
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      arr[i3] = Math.sin(phi) * Math.cos(theta) * r
      arr[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.6
      arr[i3 + 2] = Math.cos(phi) * r * 0.8
    }
    return arr
  }, [count, radius])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.y = t * baseSpeed
      ref.current.position.y = Math.sin(t * 0.3) * 0.05
    }
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attachObject={['attributes', 'position']}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={4.0}
        sizeAttenuation={true}
        opacity={0.7}
        transparent
      />

    </points>
  )
}


/* ---------------- Logo Torus with stronger emissive + ring glow ---------------- */
function LogoTorus({ position = [0, -0.6, 0] }) {
  const ref = useRef()
  const bgRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.z = Math.sin(t * 0.6) * 0.018
      ref.current.rotation.y += 0.002
      ref.current.position.y = -0.45 + Math.sin(t * 0.28) * 0.015
    }
    if (bgRef.current) {
      // pulsate background ring subtly
      const scale = 1 + Math.sin(t * 0.9) * 0.02
      bgRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group position={position}>
      {/* soft copper ring behind for silhouette */}
      <mesh ref={bgRef} position={[0, -0.08, -0.6]}>
        <ringGeometry args={[1.4, 2.0, 64]} />
        <meshBasicMaterial color={'#d8a56a'} transparent opacity={0.035} />
      </mesh>

      <mesh ref={ref}>
        <torusGeometry args={[0.85, 0.06, 64, 200]} />
        <meshStandardMaterial color={'#ffffff'} metalness={0.92} roughness={0.38} emissive={'#d79a57'} emissiveIntensity={0.42} />
      </mesh>

      {/* faint ring highlight */}
      <mesh rotation={[Math.PI * 0.5, 0, 0]} position={[0, -0.08, 0]}>
        <ringGeometry args={[1.62, 1.9, 64]} />
        <meshBasicMaterial color={'#f5b972'} transparent opacity={0.06} />
      </mesh>
    </group>
  )
}

/* ---------------- Scene assemble with better lights & bloom ---------------- */
function BosonScene({ pointer = { x: 0, y: 0 }, allowPost = true }) {
  const group = useRef()

  useFrame(() => {
    if (!group.current) return
    // micro parallax: respond to normalized pointer but smooth via lerp
    group.current.rotation.y += (pointer.x * 0.006 - group.current.rotation.y) * 0.06
    group.current.rotation.x += (pointer.y * 0.004 - group.current.rotation.x) * 0.06
  })

  return (
    <group ref={group}>
      <Particles
  count={400}
  radius={6}
  baseSpeed={0.008}
  color={'#e0e5ff'}
/>
      <LogoTorus /> 
      {allowPost && (
        <EffectComposer>
          <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.3} />

          <Vignette eskil={false} offset={0.3} darkness={0.45} />
        </EffectComposer>
      )}
    </group>
  )
}

/* ---------------- Main Page Component (v1.1.2) ---------------- */
export default function Page() {
  const reduced = usePrefersReducedMotion()
  const [isReady, setIsReady] = useState(false)
  const pointer = useRef({ x: 0, y: 0 })
  const headlineA = useRef(null)
  const headlineB = useRef(null)
  const logoWrap = useRef(null)
  const subtext = useRef(null)
  const cta = useRef(null)

  // limit DPR
  function onCreated({ gl }) {
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  }

  // pointer for gradient micro-parallax
  useEffect(() => {
    function onMove(e) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = -(e.clientY / window.innerHeight) * 2 + 1
      pointer.current.x = nx
      pointer.current.y = ny
      const breathEl = document.querySelector('.breath')
      if (breathEl) {
        // translate slightly in opposite direction for depth
        const px = (nx * 8).toFixed(2)
        const py = (ny * 6).toFixed(2)
        breathEl.style.transform = `translate3d(${px}px, ${py}px, 0) scale(1)`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ready simulation
  useEffect(() => {
    if (reduced) {
      setIsReady(true)
      return
    }
    const t = setTimeout(() => setIsReady(true), 600)
    return () => clearTimeout(t)
  }, [reduced])

  // timeline
  useIsomorphicLayoutEffect(() => {
    if (!isReady || reduced) {
      if (reduced) {
        ;[headlineA, headlineB, logoWrap, subtext, cta].forEach((r) => {
          if (r.current) r.current.style.opacity = 1
        })
      }
      return
    }

    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

    // ambience fade in (ambience overlay is .ambience)
    tl.to('.ambience', { opacity: 1, duration: 1.0 }, 0)

    // headline staggered
    tl.fromTo(headlineA.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out' }, 0.9)
    tl.fromTo(headlineB.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out' }, 1.85)

    // subtle highlight pulse on breath backdrop when headline lands
    tl.to('.breath', { filter: 'blur(26px) saturate(1.05)', duration: 1.2, ease: 'sine.inOut' }, 2.2)

    // logo emergence + overshoot
    tl.fromTo(logoWrap.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1.04, duration: 0.9, ease: 'expo.out' }, 2.9)
    tl.to(logoWrap.current, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.6)' }, 3.6)

    // subtext and CTA
    tl.fromTo(subtext.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 3.7)
    tl.fromTo(cta.current, { opacity: 0, y: 12, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'back.out(1.2)' }, 4.3)

    return () => tl.kill()
  }, [isReady, reduced])

  function handleCTAClick() {
    const el = document.querySelector('#contact')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className="relative w-screen h-screen bg-black overflow-hidden">
        {/* BREATHING ENERGY: 3 radial layers (warm, deep copper, white core) */}
        <div className="absolute inset-0 -z-20">
          <div
            className="breath absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(760px 420px at 18% 38%, rgba(245,185,114,0.18), transparent 24%), radial-gradient(760px 420px at 82% 62%, rgba(155,70,28,0.08), transparent 24%), radial-gradient(420px 260px at 50% 52%, rgba(255,255,255,0.03), transparent 35%)',
              filter: 'blur(26px) brightness(1)',
              transform: 'translate3d(0,0,0)'
            }}
          />
        </div>

        {/* CANVAS */}
        <div className="absolute inset-0 -z-10">
          <Canvas
            frameloop="demand"
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, 5], fov: 55 }}
            onCreated={onCreated}
          >
            {/* <ambientLight intensity={0.42} color={'#ffdcb8'} />
            <ambientLight intensity={0.7} color={'#dcd7ff'} /> */}
            <ambientLight intensity={1.0} color={'#fff8e7'} />


            {/* warm key light */}
            <pointLight position={[ -4, 6, 4 ]} intensity={0.9} color={'#ffe9d6'} />
            {/* small frontal rim light to add specular on torus */}
            <pointLight position={[0, 0, 4]} intensity={0.25} color={'#fff1e6'} />
            <BosonScene pointer={pointer.current} allowPost={true} />
            <Preload all />
          </Canvas>
        </div>

        {/* ambience overlay (dark tint that fades in) */}
        <div className="pointer-events-none ambience absolute inset-0 opacity-0">
          <div className="absolute inset-0 bg-black/36 mix-blend-screen" />
        </div>

        {/* grain overlay */}
        <div
          className="grain pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.02), transparent 20%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.01), transparent 20%)',
            opacity: 0.06
          }}
        />

        {/* DOM overlay: headline, logo fallback, subtext, CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
          <h1 className="headline text-center leading-none max-w-[82ch]">
            <div ref={headlineA} className="partA opacity-0 translate-y-6 text-[clamp(32px,7vw,104px)] font-[700] tracking-[0.14em]">WE SHAPE</div>
            <div ref={headlineB} className="partB opacity-0 translate-y-6 text-[clamp(32px,7vw,104px)] font-[700] tracking-[0.14em]">UNCERTAINTY</div>
          </h1>

          <div ref={logoWrap} className="logo-wrap opacity-0 scale-[0.96] pointer-events-none mt-6">
            {/* SVG fallback */}
            <svg width="160" height="160" viewBox="0 0 200 200" className="mx-auto">
              <circle cx="100" cy="100" r="48" stroke="white" strokeWidth="1.2" fill="none" opacity="0.08" />
            </svg>
          </div>

          <p ref={subtext} className="subtext opacity-0 translate-y-4 text-sm mt-8 max-w-xl text-center text-white/85">
            From concept to content to conversion — your brand’s creative partner.
          </p>

          <div ref={cta} className="cta opacity-0 translate-y-4 mt-8">
            <CTAButton onClick={handleCTAClick} />
          </div>
        </div>

        {/* inline styles for breathing + utilities */}
        <style jsx>{`
          :root { color-scheme: dark }
          html,body { height: 100% }
          .breath { animation: breathMove 14s ease-in-out infinite alternate; will-change: transform, filter }
          @keyframes breathMove {
            0% { transform: translate3d(-14px, -8px, 0) scale(1); }
            100% { transform: translate3d(14px, 8px, 0) scale(1.02); }
          }
          .translate-y-6 { transform: translateY(1.5rem) }
          .translate-y-4 { transform: translateY(1rem) }
          h1, p { -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale }
          .cta-btn:hover { box-shadow: 0 14px 48px rgba(214,142,70,0.14); transform: translate3d(0,-2px,0) }
        `}</style>
      </section>
 
    </>
  )
}
