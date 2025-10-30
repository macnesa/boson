'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function BosonParticleLogo() {
  const mountRef = useRef(null)

  useEffect(() => {
    let rafId = null
    let resolved = false

    // === Scene / Camera / Renderer ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    // safe append
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement)

    // subtle ambient + core rim for looks
    const ambient = new THREE.AmbientLight(0xffffff, 0.25)
    scene.add(ambient)
    const rim = new THREE.PointLight(0xfff3c6, 0.8)
    rim.position.set(3, 3, 6)
    scene.add(rim)

    // === buffers for particle system ===
    let points = null
    let particleGeometry = null
    let particleMaterial = null
    let finalPlane = null

    // settings
    const TARGET_WIDTH = 2.6 // width of the logo in scene units
    const MAX_PARTICLES = 7000 // cap for performance
    const FORM_TIME = 2.4 // seconds to form

    // load image into canvas to sample pixels
    const img = new Image()
    img.src = '/boson-white.png' // make sure file exists in public/
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // draw to offscreen canvas
      const cw = img.width
      const ch = img.height
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, cw, ch)
      const imgData = ctx.getImageData(0, 0, cw, ch).data

      // choose sampling step to limit number of particles
      const totalPixels = cw * ch
      const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / MAX_PARTICLES)))
      const positionsTarget = []
      const colors = []

      // centre and scale mapping
      const aspect = cw / ch
      const targetHeight = TARGET_WIDTH / aspect

      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          const idx = (y * cw + x) * 4
          const r = imgData[idx] / 255
          const g = imgData[idx + 1] / 255
          const b = imgData[idx + 2] / 255
          const a = imgData[idx + 3] / 255
          // sample only opaque/bright pixels
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
          if (a > 0.15 && luminance > 0.05) {
            // map x,y into centered plane coordinates
            const nx = (x / cw - 0.5) * TARGET_WIDTH
            const ny = -(y / ch - 0.5) * targetHeight // invert Y for canvas->three
            positionsTarget.push(nx, ny, 0)
            colors.push(r, g, b)
          }
        }
      }

      // cap if still too many
      const totalTargets = Math.min(Math.floor(positionsTarget.length / 3), MAX_PARTICLES)
      const targetPositions = new Float32Array(totalTargets * 3)
      const startPositions = new Float32Array(totalTargets * 3)
      const colorArray = new Float32Array(totalTargets * 3)

      // pick evenly if we oversampled
      const stepIdx = Math.max(1, Math.floor((positionsTarget.length / 3) / totalTargets))
      let ti = 0
      for (let i = 0; i < positionsTarget.length; i += 3 * stepIdx) {
        if (ti >= totalTargets) break
        targetPositions[ti * 3 + 0] = positionsTarget[i + 0]
        targetPositions[ti * 3 + 1] = positionsTarget[i + 1]
        targetPositions[ti * 3 + 2] = positionsTarget[i + 2]

        // start positions random in a loose sphere
        startPositions[ti * 3 + 0] = (Math.random() - 0.5) * 8
        startPositions[ti * 3 + 1] = (Math.random() - 0.5) * 8
        startPositions[ti * 3 + 2] = (Math.random() - 0.5) * 8 + 6 * Math.random()

        // color from image or tint slightly
        const ci = (i / 3) * 3
        colorArray[ti * 3 + 0] = colors[ci + 0] ?? 1.0
        colorArray[ti * 3 + 1] = colors[ci + 1] ?? 1.0
        colorArray[ti * 3 + 2] = colors[ci + 2] ?? 1.0

        ti++
      }

      // === create BufferGeometry for particles ===
      particleGeometry = new THREE.BufferGeometry()
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(startPositions, 3))
      particleGeometry.setAttribute('target', new THREE.BufferAttribute(targetPositions, 3))
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

      // PointsMaterial with size attenuation and vertex colors
      particleMaterial = new THREE.PointsMaterial({
        size: 0.035,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

      points = new THREE.Points(particleGeometry, particleMaterial)
      scene.add(points)

      // final plane (logo) — initially invisible, will fade in after formation
      const texture = new THREE.Texture(img)
      texture.needsUpdate = true
      const planeGeo = new THREE.PlaneGeometry(TARGET_WIDTH, targetHeight, 1, 1)
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        toneMapped: false,
      })
      finalPlane = new THREE.Mesh(planeGeo, planeMat)
      finalPlane.position.z = 0
      scene.add(finalPlane)

      // start animation loop
      let startTime = null
      function animate(ts) {
        if (!startTime) startTime = ts
        const elapsed = (ts - startTime) / 1000 // seconds
        const progress = Math.min(1, elapsed / FORM_TIME)
        // ease (smoothstep-ish cubic)
        const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2

        // lerp each particle from start -> target
        const posAttr = particleGeometry.getAttribute('position')
        const tgtAttr = particleGeometry.getAttribute('target')
        for (let i = 0; i < posAttr.count; i++) {
          const sx = startPositions[i * 3 + 0]
          const sy = startPositions[i * 3 + 1]
          const sz = startPositions[i * 3 + 2]
          const tx = targetPositions[i * 3 + 0]
          const ty = targetPositions[i * 3 + 1]
          const tz = targetPositions[i * 3 + 2]

          // some overshoot + springy effect
          const overshoot = Math.sin(eased * Math.PI) * 0.06
          posAttr.array[i * 3 + 0] = THREE.MathUtils.lerp(sx, tx + (Math.random() - 0.5) * 0.001, eased) * (1 - overshoot * 0.02)
          posAttr.array[i * 3 + 1] = THREE.MathUtils.lerp(sy, ty + (Math.random() - 0.5) * 0.001, eased)
          posAttr.array[i * 3 + 2] = THREE.MathUtils.lerp(sz, tz - overshoot, eased)
        }
        posAttr.needsUpdate = true

        // subtle particle size pulse as it forms
        particleMaterial.size = 0.035 + Math.sin(eased * Math.PI) * 0.02
        particleMaterial.opacity = 1 - eased * 0.35

        // when fully formed, fade in final plane and slowly fade out points
        if (progress >= 1 && !resolved) {
          resolved = true
          // start a short fade: plane opacity 0 -> 1, particles opacity -> 0.08
          const fadeStart = performance.now()
          const fadeDur = 900
          function fadeLoop(now) {
            const p = Math.min(1, (now - fadeStart) / fadeDur)
            finalPlane.material.opacity = p
            particleMaterial.opacity = THREE.MathUtils.lerp(1 - 0.35, 0.06, p)
            if (p < 1) {
              requestAnimationFrame(fadeLoop)
            } else {
              // keep particles subtle but present (gives organic edge)
              particleMaterial.opacity = 0.06
            }
          }
          requestAnimationFrame(fadeLoop)
        }

        // small rotation/drift for scene life
        scene.rotation.y = Math.sin(elapsed * 0.2) * 0.02
        rim.position.x = Math.cos(elapsed * 0.6) * 3

        renderer.render(scene, camera)
        rafId = requestAnimationFrame(animate)
      }
      rafId = requestAnimationFrame(animate)
    }

    // === RESIZE ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    return () => {
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
      // dispose geometries / materials / textures if created
      try {
        if (particleGeometry) {
          particleGeometry.dispose()
        }
        if (particleMaterial) {
          particleMaterial.dispose()
        }
        if (points) {
          scene.remove(points)
        }
        if (finalPlane) {
          if (finalPlane.material.map) finalPlane.material.map.dispose()
          finalPlane.geometry.dispose()
          finalPlane.material.dispose()
          scene.remove(finalPlane)
        }
        renderer.dispose()
      } catch (e) {
        // ignore disposal errors
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'block',
        overflow: 'hidden',
      }}
    />
  )
}
