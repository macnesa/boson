'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export default function ReflectiveSphereSoftGlow() {
  const mountRef = useRef(null)

  useEffect(() => {
    // === SCENE SETUP ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 1)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.physicallyCorrectLights = true
    mountRef.current.appendChild(renderer.domElement)

    // === ENVIRONMENT HDR ===
    const loader = new RGBELoader()
    loader.load('/hdr/studio_small_08_1k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = texture
      scene.background = null

      // === MAIN SPHERE ===
      const sphereGeo = new THREE.SphereGeometry(1, 128, 128)
      const sphereMat = new THREE.MeshPhysicalMaterial({
        metalness: 1.0,
        roughness: 0.45,         // blur refleksi lebih lembut
        clearcoat: 1.0,
        clearcoatRoughness: 0.25, // efek blur tambahan di lapisan luar
        envMapIntensity: 1.3,     // buat tetap terang
      })
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      scene.add(sphere)

      // === SUBTLE LIGHTING (optional enhancement) ===
      const softLight = new THREE.PointLight(0xffffff, 0.4)
      softLight.position.set(2, 2, 2)
      scene.add(softLight)

      // === ORBIT CONTROLS ===
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.enablePan = false

      // === POST-PROCESSING ===
      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.85, // strength (semakin besar semakin dreamy)
        0.7,  // radius (semakin besar semakin menyebar)
        0.1   // threshold
      )
      composer.addPass(bloom)

      // === ANIMATION LOOP ===
      const animate = () => {
        controls.update()
        sphere.rotation.y += 0.002
        composer.render()
        requestAnimationFrame(animate)
      }
      animate()
    })

    // === RESIZE HANDLER ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    return () => {
      window.removeEventListener('resize', onResize)
      if (mountRef.current?.contains(renderer.domElement)) {
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
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    />
  )
}
