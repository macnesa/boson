'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function Logo3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    // === SETUP DASAR ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      toneMapping: THREE.ACESFilmicToneMapping,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000)
    mountRef.current.appendChild(renderer.domElement)

    // === LIGHTING ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, 1.5)
    spotLight.position.set(10, 10, 10)
    scene.add(spotLight)

    const pointLight = new THREE.PointLight(0xffffff, 1.2)
    pointLight.position.set(-5, -5, -5)
    scene.add(pointLight)

    // === LOGO TORUS ===
    const geometry = new THREE.TorusGeometry(1, 0.3, 32, 128)
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#88b7ff'),
      metalness: 1,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.8,
      envMapIntensity: 2,
      clearcoat: 1.0,
      reflectivity: 1.0,
    })

    const torus = new THREE.Mesh(geometry, material)
    scene.add(torus)

    // === MINI SPHERICAL PARTICLES ===
    const particleCount = 1500
    const sphereGeo = new THREE.SphereGeometry(0.015, 10, 10) // bola lebih kecil
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#88b7ff'),
      metalness: 0.7,
      roughness: 0.15,
      emissive: new THREE.Color('#88b7ff'),
      emissiveIntensity: 0.4,
      transparent: true,
      transmission: 0.4,
      opacity: 0.9,
    })

    const particles = new THREE.InstancedMesh(sphereGeo, sphereMat, particleCount)
    const dummy = new THREE.Object3D()

    for (let i = 0; i < particleCount; i++) {
      const radius = THREE.MathUtils.randFloat(2.0, 6.5)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI - Math.PI / 2
      dummy.position.set(
        radius * Math.cos(theta) * Math.cos(phi),
        radius * Math.sin(phi) * 0.6,
        radius * Math.sin(theta) * Math.cos(phi)
      )
      const scale = THREE.MathUtils.randFloat(0.3, 0.7) // lebih kecil dari sebelumnya
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      particles.setMatrixAt(i, dummy.matrix)
    }
    scene.add(particles)

    // === ENVIRONMENT REFLECTION ===
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    new THREE.TextureLoader().load('/env/city.jpg', (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture
      scene.environment = envMap
      texture.dispose()
      pmremGenerator.dispose()
    })

    // === POST PROCESSING (BLOOM) ===
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2, // intensity
      0.4, // radius
      0.15 // threshold
    )
    composer.addPass(bloomPass)

    // === CAMERA CONTROLS ===
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // === ANIMATION LOOP ===
    const clock = new THREE.Clock()

    function animate() {
      const delta = clock.getDelta()
      torus.rotation.y += delta * 0.3
      torus.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.05

      particles.rotation.y += delta * 0.1
      particles.rotation.x += delta * 0.03

      controls.update()
      composer.render()
      requestAnimationFrame(animate)
    }

    animate()

    // === HANDLE RESIZE ===
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onResize)

    // === CLEANUP ===
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      window.removeEventListener('resize', onResize)
      sphereGeo.dispose()
      sphereMat.dispose()
      renderer.dispose()
      composer.dispose()
    }

  }, [])

  return <div ref={mountRef} />
}
