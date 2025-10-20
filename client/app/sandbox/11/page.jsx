'use client'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useTexture } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'

// 🪨 Bola kanan: dengan texture PBR lengkap
function TexturedSphere() {
  const texture = useTexture({
    map: '/textures/seaside_rock_1k/seaside_rock_diff_1k.jpg',
    normalMap: '/textures/seaside_rock_1k/seaside_rock_nor_gl_1k.jpg',
    roughnessMap: '/textures/seaside_rock_1k/seaside_rock_rough_1k.jpg',
    aoMap: '/textures/seaside_rock_1k/seaside_rock_ao_1k.jpg',
    displacementMap: '/textures/seaside_rock_1k/seaside_rock_disp_1k.jpg',
  })

  return (
    <mesh position={[1.5, 0, 0]}>
      <sphereGeometry args={[1, 128, 64]} />
      <meshStandardMaterial
        {...texture}
        displacementScale={0.05}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

// ⚪ Bola kiri: polos (tanpa texture, hanya material dasar)
function PlainSphere() {
  return (
    <mesh position={[-1.5, 0, 0]}>
      <sphereGeometry args={[1, 64, 32]} />
      <meshPhysicalMaterial
        color="#d0d0d0"
        metalness={0.2}
        roughness={0.35}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        reflectivity={0.7}
      />
    </mesh>
  )
}

// 🚀 Scene utama
export default function Page() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#bcbcbc',
      }}
    >
      <Canvas
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 1.25]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          preserveDrawingBuffer: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
          outputEncoding: THREE.sRGBEncoding,
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        <fog attach="fog" args={['#bcbcbc', 2, 10]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[2, 2, 3]} intensity={0.3} />

        <Suspense fallback={null}>
          <Environment
            files="/hdr/studio_small_08_1k.hdr"
            background={false}
            environmentIntensity={1}
            environmentRotation={[0, Math.PI / 3, 0]}
          />
          <PlainSphere />
          <TexturedSphere />
        </Suspense>

        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  )
}
