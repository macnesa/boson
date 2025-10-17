'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function ParticleLogo3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const scene = new THREE.Scene()

    // Kamera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
    const camStart = new THREE.Vector3(2, 2, 14)
    const camEnd = new THREE.Vector3(4, 4, 28)
    camera.position.copy(camStart)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000)
    mountRef.current.appendChild(renderer.domElement)

    // === LIGHT ===
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const point = new THREE.PointLight(0xffffff, 1.2)
    point.position.set(8, 8, 10)
    scene.add(point)

    // === LOAD IMAGE ===
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/boson.png'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const w = img.width
      const h = img.height
      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, 0, 0)

      const data = ctx.getImageData(0, 0, w, h).data
      const targetPositions = []
      const currentPositions = []
      const startPositions = []
      const velocity = []
      const density = 3

      // --- LOGO PARTICLES ---
      for (let y = 0; y < h; y += density) {
        for (let x = 0; x < w; x += density) {
          const index = (y * w + x) * 4
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]
          const a = data[index + 3]
          if (a > 50 && (r + g + b) / 3 < 240) {
            const px = (x - w / 2) / 120
            const py = -(y - h / 2) / 120
            const pz = THREE.MathUtils.randFloatSpread(0.4)
            const pos = new THREE.Vector3(px, py, pz)
            targetPositions.push(pos.clone())
            currentPositions.push(pos.clone())
            startPositions.push(
              new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(25),
                THREE.MathUtils.randFloatSpread(25),
                THREE.MathUtils.randFloatSpread(25)
              )
            )
            velocity.push(new THREE.Vector3(0, 0, 0))
          }
        }
      }

      // === MAIN PARTICLES ===
      const particleGeo = new THREE.SphereGeometry(0.012, 6, 6)
      const particleMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#b7d4ff'),
        emissive: new THREE.Color('#88b7ff'),
        emissiveIntensity: 1.2,
        metalness: 0.7,
        roughness: 0.25,
        transparent: true,
        opacity: 0.9,
      })
      const particles = new THREE.InstancedMesh(particleGeo, particleMat, targetPositions.length)
      const dummy = new THREE.Object3D()
      scene.add(particles)

      // === BACKGROUND DUST HALO ===
      const haloCount = 2000
      const haloGeo = new THREE.BufferGeometry()
      const haloPos = new Float32Array(haloCount * 3)
      for (let i = 0; i < haloCount * 3; i += 3) {
        const radius = 15 + Math.random() * 20
        const theta = Math.random() * 2 * Math.PI
        const phi = Math.random() * Math.PI
        haloPos[i] = radius * Math.sin(phi) * Math.cos(theta)
        haloPos[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
        haloPos[i + 2] = radius * Math.cos(phi)
      }
      haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3))
      const halo = new THREE.Points(
        haloGeo,
        new THREE.PointsMaterial({
          color: '#9acbff',
          size: 0.04,
          transparent: true,
          opacity: 0.4,
        })
      )
      scene.add(halo)

      // === ANIMATION CONTROL ===
      const clock = new THREE.Clock()
      let progress = 0
      const duration = 5

      function animate() {
        const delta = clock.getDelta()
        progress = Math.min(progress + delta / duration, 1)

        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2

        // === CAMERA ===
        camera.position.lerpVectors(camStart, camEnd, ease)

        // === PARTICLES ===
        for (let i = 0; i < targetPositions.length; i++) {
          const target = targetPositions[i]
          const start = startPositions[i]
          const current = currentPositions[i]
          current.lerpVectors(start, target, ease)

          dummy.position.copy(current)
          dummy.scale.setScalar(THREE.MathUtils.randFloat(0.7, 1))
          dummy.updateMatrix()
          particles.setMatrixAt(i, dummy.matrix)
        }

        particles.instanceMatrix.needsUpdate = true
        halo.rotation.y += delta * 0.02

        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
        requestAnimationFrame(animate)
      }

      animate()
    }

    // === CAMERA CONTROL ===
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = true
    controls.rotateSpeed = 0.8
    controls.dampingFactor = 0.08

    // === RESIZE ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      mountRef.current.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} />
}
