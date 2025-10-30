'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function AuroraParticles() {
  const mountRef = useRef(null)

  useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.set(0, 0, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000)
    renderer.outputEncoding = THREE.sRGBEncoding
    mountRef.current.appendChild(renderer.domElement)

    // === CREATE PARTICLE POSITIONS ===
    const count = 60000
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      const r = Math.random() * 5.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      positions[i] = r * Math.sin(phi) * Math.cos(theta)
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i + 2] = r * Math.cos(phi)
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // === SHADERS ===
    const vertexShader = `
      uniform float uTime;

      // Simple 3D noise
      float hash(float n) { return fract(sin(n) * 43758.5453); }
      float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        float n = p.x + p.y*57.0 + 113.0*p.z;
        return mix(mix(mix(hash(n+0.0), hash(n+1.0), f.x),
                       mix(hash(n+57.0), hash(n+58.0), f.x), f.y),
                   mix(mix(hash(n+113.0), hash(n+114.0), f.x),
                       mix(hash(n+170.0), hash(n+171.0), f.x), f.y), f.z);
      }

      // Curl noise function
      vec3 curlNoise(vec3 p) {
        float e = 0.1;
        vec3 dx = vec3(e, 0.0, 0.0);
        vec3 dy = vec3(0.0, e, 0.0);
        vec3 dz = vec3(0.0, 0.0, e);

        float n1 = noise(p + dy) - noise(p - dy);
        float n2 = noise(p + dz) - noise(p - dz);
        float n3 = noise(p + dz) - noise(p - dz);
        float n4 = noise(p + dx) - noise(p - dx);
        float n5 = noise(p + dx) - noise(p - dx);
        float n6 = noise(p + dy) - noise(p - dy);

        vec3 curl = vec3(n1 - n2, n3 - n4, n5 - n6);
        return normalize(curl);
      }

      varying float vNoise;
      varying vec3 vPos;

      void main() {
        vec3 pos = position;
        vec3 curl = curlNoise(pos * 0.5 + uTime * 0.2);
        pos += curl * 0.8;

        vNoise = noise(pos + uTime * 0.1);
        vPos = pos;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 2.5;
      }
    `

    const fragmentShader = `
      varying float vNoise;
      varying vec3 vPos;
      void main() {
        float alpha = smoothstep(0.2, 1.0, vNoise);
        vec3 color = mix(vec3(0.05, 0.2, 0.6), vec3(0.1, 0.7, 1.0), vNoise);
        color += 0.15 * sin(vPos.y * 1.5 + vNoise * 5.0);
        gl_FragColor = vec4(color, alpha * 0.9);
      }
    `

    const particleMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // === LIGHT & ENV ===
    const ambient = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambient)

    // === CONTROLS ===
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = true

    // === ANIMATE ===
    const clock = new THREE.Clock()
    function animate() {
      const elapsed = clock.getElapsedTime()
      particleMat.uniforms.uTime.value = elapsed

      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    // === RESIZE ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      particleGeo.dispose()
      particleMat.dispose()
    }
    
  }, [])

  return <div ref={mountRef} />
}
