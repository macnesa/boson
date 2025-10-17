'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Logo3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)  // Background hitam

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10  // Posisi kamera agak jauh

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Light setup: SpotLight dengan cahaya dari bawah ke atas
    const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 1)
    spotLight.position.set(0, -5, 10)  // Posisi di bawah dan cahaya diarahkan ke atas
    spotLight.target.position.set(0, 0, 0)  // Arahkan cahaya ke tengah
    scene.add(spotLight)

    // Ambient light untuk pencahayaan lembut
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)  // Pencahayaan lembut
    scene.add(ambientLight)

    // Handle window resizing
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    // Animation loop (untuk efek cahaya atau transisi)
    const animate = () => {
      requestAnimationFrame(animate)

      // Render the scene with the camera
      renderer.render(scene, camera)
    }

    animate()

    // Cleanup on unmount
    return () => {
      mountRef.current.removeChild(renderer.domElement)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <div ref={mountRef} />
}
