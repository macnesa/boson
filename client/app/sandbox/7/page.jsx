"use client"

import React, { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, ContactShadows, Html, Environment } from "@react-three/drei"
import { EffectComposer, Vignette } from "@react-three/postprocessing"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { useLoader } from "@react-three/fiber"
import { motion } from "framer-motion"

// -------------------- MODEL --------------------
function TreeModel() {
  const gltf = useLoader(GLTFLoader, "/models/iphone.glb")
  const group = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    group.current.rotation.y = Math.sin(t * 0.15) * 0.1
    group.current.position.y = Math.sin(t * 0.8) * 0.03
  })

  return (
    <group ref={group}>
      <primitive object={gltf.scene} scale={1.4} position={[0, -1.1, 0]} />
    </group>
  )
}

// -------------------- LIGHTING --------------------
function SoftGlobalLight() {
  return (
    <>
      {/* Hemisphere: cahaya global dari atas & bawah */}
      <hemisphereLight skyColor={"#ffffff"} groundColor={"#e0e0e0"} intensity={1.2} />

      {/* Directional light lembut dari depan */}
      <directionalLight
        position={[2, 3, 5]}
        intensity={1.4}
        color={"#ffffff"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Fill light kanan */}
      <directionalLight position={[5, 1, -2]} intensity={0.9} color={"#ffffff"} />
      {/* Fill light kiri */}
      <directionalLight position={[-5, 2, 1]} intensity={0.9} color={"#f6f6f6"} />
      {/* Backlight halus */}
      <directionalLight position={[0, 3, -5]} intensity={0.7} color={"#fefefe"} />

      {/* Sedikit ambient tambahan */}
      <ambientLight intensity={0.4} color={"#ffffff"} />
    </>
  )
}

// -------------------- MAIN SCENE --------------------
export default function TreeScene() {
  return (
    <main className="w-screen h-screen bg-[#f2f2f2] overflow-hidden relative">
      {/* === TITLE OVERLAY === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[220%] text-center z-10"
      >
        <h1 className="text-[3rem] md:text-[5rem] font-light tracking-tight leading-none bg-gradient-to-br from-gray-800 via-gray-500 to-gray-400 bg-clip-text text-transparent">
          Digital Object
        </h1>
        <p className="text-gray-500 text-sm tracking-[0.25em] uppercase mt-4">
          Rooted in Code · Touched by Light
        </p>
      </motion.div>

      {/* === CANVAS === */}
      <Canvas
        shadows
        camera={{ position: [2.8, 2.2, 4.5], fov: 42 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputEncoding: THREE.sRGBEncoding,
        }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#f3f3f3")
          scene.fog = new THREE.FogExp2("#f3f3f3", 0.08)
        }}
      >
        <Suspense fallback={<Html center>Loading Model...</Html>}>
          <SoftGlobalLight />
          {/* Lingkungan reflektif alami */}
          <Environment preset="city" />
          <TreeModel />
          <ContactShadows
            position={[0, -1.25, 0]}
            opacity={0.3}
            scale={12}
            blur={2.5}
            far={4}
            color="#b0b0b0"
          />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
        />

        <EffectComposer>
          {/* vignette kecil biar ada depth walau terang */}
          <Vignette eskil={false} offset={0.1} darkness={0.2} />
        </EffectComposer>
      </Canvas>

      {/* === FOOTER === */}
      <motion.footer
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 w-full text-center text-xs text-gray-500 tracking-[0.2em] uppercase"
      >
        © {new Date().getFullYear()} Boson · Rendered with Soft Global Light
      </motion.footer>
    </main>
  )
}
