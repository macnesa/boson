'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function SaturnusRingsFormation() {
  const mountRef = useRef(null)

  useEffect(() => {
    // === SETUP DASAR ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000)
    mountRef.current.appendChild(renderer.domElement)

    // === LIGHTING ===
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const pointLight = new THREE.PointLight(0xffffff, 1.2)
    pointLight.position.set(6, 4, 6)
    scene.add(pointLight)

    // === PLANET (Bola utama) ===
    const planetGeo = new THREE.SphereGeometry(1.2, 64, 64)
    const planetMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#7fb8ff'),
      metalness: 0.6,
      roughness: 0.25,
      transmission: 0.4,
      thickness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color('#3c78ff'),
      emissiveIntensity: 0.12,
    })
    const planet = new THREE.Mesh(planetGeo, planetMat)
    scene.add(planet)

    // === PARTIKEL CINCIN ===
    const particleCount = 4000
    const particleGeo = new THREE.SphereGeometry(0.02, 8, 8)
    const particleMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      metalness: 0.9,
      roughness: 0.1,
      emissive: new THREE.Color('#88aaff'),
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.95,
      transmission: 0.6,
      thickness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.2,
    })

    const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount)
    scene.add(particles)

    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    const palette = [
      '#833AB4', '#C13584', '#E1306C',
      '#F56040', '#F77737', '#405DE6',
    ]

    // === POSISI START & TARGET ===
    const startPositions = []
    const ringPositions = []

    for (let i = 0; i < particleCount; i++) {
      // posisi awal acak (chaos)
      const start = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(12),
        THREE.MathUtils.randFloatSpread(12),
        THREE.MathUtils.randFloatSpread(12)
      )
      startPositions.push(start)

      // posisi target (melingkar di cincin)
      const theta = Math.random() * Math.PI * 2
      const radius = THREE.MathUtils.randFloat(2.5, 5.2)
      const yOffset = THREE.MathUtils.randFloatSpread(0.15)
      const ring = new THREE.Vector3(
        Math.cos(theta) * radius,
        yOffset,
        Math.sin(theta) * radius
      )
      ringPositions.push(ring)

      // warna acak
      color.set(palette[Math.floor(Math.random() * palette.length)])
      particles.setColorAt(i, color)
    }
    particles.instanceColor.needsUpdate = true

    // === ROTASI RING ===
    particles.rotation.x = Math.PI / 6
    particles.rotation.z = Math.PI / 20

    // === ANIMASI FORMASI ===
    const clock = new THREE.Clock()
    let progress = 0 // dari 0 ke 1 selama transisi formasi
    const duration = 6 // detik untuk formasi penuh

    function animate() {
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
    
      // ease-in-out cubic
      progress = Math.min(progress + delta / duration, 1)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    
      for (let i = 0; i < particleCount; i++) {
        const start = startPositions[i]
        const target = ringPositions[i]
        const pos = start.clone().lerp(target, ease)
        dummy.position.copy(pos)
        dummy.scale.setScalar(0.4)
        dummy.updateMatrix()
        particles.setMatrixAt(i, dummy.matrix)
      }
    
      // rotasi mulai dari awal, makin cepat seiring progress formasi
      const rotationSpeed = THREE.MathUtils.lerp(0.002, 0.05, ease)
      particles.rotation.y += delta * rotationSpeed
    
      particles.instanceMatrix.needsUpdate = true
      planet.rotation.y += delta * 0.15
    
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    
    animate()

    // === CAMERA CONTROLS ===
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.enableZoom = false

    // === RESIZE ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    return () => {
      mountRef.current.removeChild(renderer.domElement)
      window.removeEventListener('resize', onResize)
      planetGeo.dispose()
      particleGeo.dispose()
    }
  }, [])

  return <div ref={mountRef} />
}
