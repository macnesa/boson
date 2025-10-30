'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function BosonClientsOrbit() {
  const mountRef = useRef(null)

  useEffect(() => {
    // === SETUP DASAR ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 1)
    renderer.outputEncoding = THREE.sRGBEncoding
    mountRef.current.appendChild(renderer.domElement)

    // === LIGHTING ===
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)
    const pointLight = new THREE.PointLight(0x88ccff, 2, 50)
    scene.add(pointLight)

    // === BOSON CORE (inti energi) ===
    const coreGeo = new THREE.SphereGeometry(0.6, 64, 64)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    // Layer glow tambahan
    const glowGeo = new THREE.SphereGeometry(0.8, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#66ccff'),
      transparent: true,
      opacity: 0.2,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    scene.add(glow)

    // === LOGO CLIENTS ===
    const logoCount = 8
    const orbitLayers = 3
    const logos = []
    const loader = new THREE.TextureLoader()

    // ganti path logo sesuai aset lo (PNG putih transparan)
    const logoPaths = [
      '/logos/nvidia.png',
      '/logos/tesla.png',
      '/logos/meta.png',
      '/logos/openai.png',
      '/logos/ibm.png',
      '/logos/sony.png',
      '/logos/spacex.png',
      '/logos/mit.png',
    ]

    const logoGeo = new THREE.PlaneGeometry(0.7, 0.35)

    logoPaths.forEach((path, i) => {
      const tex = loader.load(path)
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(logoGeo, mat)

      const layer = i % orbitLayers
      const radius = 2.5 + layer * 1.2
      const angle = (i / logoCount) * Math.PI * 2

      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      mesh.userData = { angle, radius, speed: 0.2 + 0.1 * layer }
      scene.add(mesh)
      logos.push(mesh)
    })

    // === PARTICLE FIELD AROUND ===
    const particleCount = 3000
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 5 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i] = r * Math.sin(phi) * Math.cos(theta)
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i + 2] = r * Math.cos(phi)
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color('#88b7ff'),
      size: 0.03,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // === CAMERA CONTROLS ===
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // === RAYCASTER UNTUK HOVER ===
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hovered = null

    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove)

    // === ANIMATE ===
    const clock = new THREE.Clock()
    function animate() {
      const t = clock.getElapsedTime()

      // Orbit logo berputar
      logos.forEach((logo, i) => {
        if (hovered !== logo) {
          logo.userData.angle += 0.002 * logo.userData.speed
        }
        logo.position.x = Math.cos(logo.userData.angle) * logo.userData.radius
        logo.position.y = Math.sin(logo.userData.angle) * logo.userData.radius
        logo.lookAt(camera.position)
      })

      // Hover detection
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(logos)
      if (intersects.length > 0) {
        const hit = intersects[0].object
        if (hovered !== hit) {
          if (hovered) hovered.material.opacity = 0.8
          hovered = hit
          hovered.material.opacity = 1.0
          gsap.to(hovered.scale, { x: 1.2, y: 1.2, duration: 0.4, ease: 'power2.out' })
        }
      } else if (hovered) {
        gsap.to(hovered.scale, { x: 1, y: 1, duration: 0.5 })
        hovered.material.opacity = 0.8
        hovered = null
      }

      glow.material.opacity = 0.25 + Math.sin(t * 2.0) * 0.05
      particles.rotation.y += 0.0005
      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // === HANDLE RESIZE ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          width: '100%',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#ffffffa0',
          letterSpacing: '2px',
          fontSize: '14px',
          textTransform: 'uppercase',
        }}
      >
        Entities in Our Field
      </div>
    </div>
  )
}
