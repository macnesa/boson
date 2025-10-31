'use client'

import dynamic from "next/dynamic"; 
import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import HeroPage from '../../components/organisms/HeroPage'
import WhyBoson from '../../components/organisms/WhyBoson'
import WhoWeAre from '../../components/organisms/WhoWeAre'
import BosonWorld from '../../components/organisms/WorldOfBoson'
const SoleNoir = dynamic(() => import("../../components/organisms/SoleNoir"), { ssr: false });
import Beginning from '../sandbox/13/page'

export default function Page() {
  return (
    <>
    <SoleNoir/>
    </>
  )
}
