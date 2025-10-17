
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export default function Logo3DPulse() {
  const mountRef = useRef(null)

  useEffect(() => {
    // ---------- CONFIG ----------
    const SIZE = { w: window.innerWidth, h: window.innerHeight }
    const BEAT_BPM = 60 // tempo lebih slow, biar detak santai
    const BEAT_FREQ = BEAT_BPM / 60 // beats per second
    const PARTICLE_COUNT = 3000
    const COLOR_CENTER = new THREE.Color(0x9ad7ff)
    const COLOR_OUTER = new THREE.Color(0x060912)
  
    // ---------- SCENE / CAMERA / RENDERER ----------
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x02030a)
  
    const camera = new THREE.PerspectiveCamera(45, SIZE.w / SIZE.h, 0.1, 200)
    camera.position.set(0, 1.6, 6)
  
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(SIZE.w, SIZE.h)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputEncoding = THREE.sRGBEncoding
    mountRef.current.appendChild(renderer.domElement)
  
    // ---------- CONTROLS ----------
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enableZoom = true
    controls.minDistance = 3.5
    controls.maxDistance = 12
  
    // ---------- LIGHTS ----------
    const ambient = new THREE.AmbientLight(0xffffff, 0.06)
    scene.add(ambient)
    const key = new THREE.PointLight(0xbfefff, 1.0, 30)
    key.position.set(4, 6, 6)
    scene.add(key)
  
    // ---------- LOGO ----------
    const torusGeom = new THREE.TorusGeometry(1.0, 0.22, 64, 256)
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x88b7ff),
      metalness: 0.9,
      roughness: 0.08,
      transmission: 0.65,
      thickness: 0.8,
      clearcoat: 1.0,
      reflectivity: 1.0,
      envMapIntensity: 1.3,
    })
    const logo = new THREE.Mesh(torusGeom, torusMat)
    logo.position.set(0, 0.4, 0)
    scene.add(logo)
  
    // ---------- VOLUMETRIC BEAM ----------
    const beamHeight = 3.5
    const beamRadius = 1.6
    const beamGeom = new THREE.ConeGeometry(beamRadius, beamHeight, 64, 1, true)
    beamGeom.translate(0, beamHeight / 2 - 1.5, 0)
    const beamMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      uniforms: {
        uColorCenter: { value: COLOR_CENTER.clone() },
        uColorOuter: { value: COLOR_OUTER.clone() },
        uTime: { value: 0 },
        uBeat: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorCenter;
        uniform vec3 uColorOuter;
        uniform float uTime;
        uniform float uBeat;
        varying vec3 vPos;
  
        void main() {
          float dist = length(vPos.xz);
          float flow = 0.5 + 0.5 * sin(uTime * 1.2 - dist * 2.5);
          flow = smoothstep(0.2, 0.9, flow);
          float beatWave = 0.4 + 0.6 * uBeat;
          vec3 col = mix(uColorOuter, uColorCenter, flow * beatWave);
          float alpha = (0.2 + 0.6 * flow) * (0.5 + 0.5 * uBeat);
          gl_FragColor = vec4(col, alpha);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
    })
    const beam = new THREE.Mesh(beamGeom, beamMat)
    beam.position.set(0, -0.8, 0)
    scene.add(beam)
  
    // ---------- POSTPROCESSING ----------
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(SIZE.w, SIZE.h), 0.8, 0.6, 0.1)
    bloomPass.threshold = 0.2
    bloomPass.strength = 0.9
    bloomPass.radius = 0.6
    composer.addPass(bloomPass)
  
    // ---------- BEAT ----------
    const startTime = performance.now() / 1000
    const getBeat = (t) => {
      // smooth curve — bukan spike
      const base = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * BEAT_FREQ)
      return Math.pow(base, 1.6)
    }
  
    // ---------- LOOP ----------
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime() + startTime
      const beat = getBeat(t)
  
      beamMat.uniforms.uTime.value = t
      beamMat.uniforms.uBeat.value = beat
  
      logo.rotation.y += 0.1 * clock.getDelta()
  
      composer.render()
      requestAnimationFrame(animate)
    }
    animate()
  
    // ---------- CLEANUP ----------
    return () => {
      mountRef.current.removeChild(renderer.domElement)
      renderer.dispose()
      composer.dispose()
    }
  }, [])
  

  return <div ref={mountRef} className="w-screen h-screen" />
}