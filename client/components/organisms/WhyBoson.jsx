'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Suspense, useRef } from 'react'

export default function WhyBoson() {
  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <AnimatedSphere />
        </Suspense>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
      </Canvas>

      <div className="absolute inset-0 flex flex-col justify-center px-24">
        <div>
          <h2 className="text-[8rem] font-light leading-none tracking-tight">WHY</h2>
          <h1 className="text-[11rem] font-bold leading-none -mt-8 tracking-tight">BOSON</h1>
        </div>
        <p className="max-w-md mt-8 text-sm leading-relaxed text-gray-300">
          We go further than execution. We partner with you strategically — from concept to content to conversion.
          With proven experience across Bali, Qatar, and Malaysia, Boson ensures your brand rises above the crowd
          with measurable impact.
        </p>
      </div>

      <div className="absolute bottom-6 left-24 text-xs text-gray-500">© 2025</div>
      <div className="absolute top-6 right-24 text-xs text-gray-500">Company Profile</div>
    </div>
  )
}

function AnimatedSphere() {
  const mesh = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    mesh.current.rotation.y = t * 0.15
  })

  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#F19A39') },
  }

  return (
    <points ref={mesh}>
      <sphereGeometry args={[1, 100, 100]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPos;
          void main() {
            vPos = position;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 0.8 * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(uColor, 0.9 * (1.0 - d));
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
