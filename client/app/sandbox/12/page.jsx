'use client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { Perf } from 'r3f-perf'
import * as THREE from 'three'
import { useRef, useMemo, Suspense } from 'react'

// ---------------------------
// Global time + tempo system
// ---------------------------
const GlobalTime = { t: 0, speed: 1, update(delta) { this.t += delta * this.speed } }
const Tempo = {
  bpm: 28,
  phase: 0,
  update(delta) { this.phase += delta * (this.bpm / 60) },
  beat() { return (Math.sin(this.phase * Math.PI * 2) * 0.5 + 0.5) }
}

function hueCascade(baseHue, phase, offset) {
  return (baseHue + Math.sin(phase * 0.5) * offset + 1.0) % 1.0;
}

// ---------------------------
// Shared global uniforms container
// ---------------------------
const GlobalUniforms = {
  uTime: { value: 0 },
  uHue: { value: 0 },       // base hue 0..1
  uHueCore: { value: 0 },
  uHueShell: { value: 0 },
  uHueSwarm: { value: 0 },
  uPower: { value: 1.0 },
  uBeat: { value: 0 },      // 0..1
  uCollapse: { value: 0 },
  uPhaseCore : { value: 0 },
  uPhaseShell : { value: 0 },
  uPhaseSwarm : { value: 0 }
}

// ---------------------------
// Global phase system (Resonance Propagation) — Phase 12.6.3
// - core is the driver oscillator
// - shell chases core (coupling + damping)
// - swarm chases shell (coupling + damping)
// - this produces causal traveling ripple
// ---------------------------
const GlobalPhase = {
  core: 0.0,
  shell: 0.0,
  swarm: 0.0,
  // coupling/damping tunables
  coreRate: 1.0,     // speed of core oscillator
  shellCouple: 0.12, // how strongly shell chases core
  shellDamp: 0.92,   // damping for shell (0..1)
  swarmCouple: 0.09, // how strongly swarm chases shell
  swarmDamp: 0.94,   // damping for swarm
  update(time, dt) {
    // core is an explicit oscillator (source)
    // we can use a composite oscillator for richer behaviour
    const base = Math.sin(time * this.coreRate * 1.0) * 0.9
      + 0.25 * Math.sin(time * this.coreRate * 2.7 + 0.8)
      + 0.12 * Math.sin(time * this.coreRate * 4.2 + 1.9)

    // normalize-ish
    const coreTarget = Math.tanh(base * 1.0)
    // simple integrate core (small smoothing)
    this.core += (coreTarget - this.core) * 0.28

    // propagation: shell chases core with coupling and damping
    const shellDrive = this.core - this.shell
    this.shell = this.shell * this.shellDamp + shellDrive * this.shellCouple

    // propagation: swarm chases shell
    const swarmDrive = this.shell - this.swarm
    this.swarm = this.swarm * this.swarmDamp + swarmDrive * this.swarmCouple

    // tiny drift for slight unpredictability
    const drift = 0.08 * Math.sin(time * 0.4)
    this.shell += drift * 0.02
    this.swarm += drift * 0.015
  }
}

// ---------------------------
// Dynamic lighting & global updates
// ---------------------------
function DynamicLighting() {
  const key = useRef(), rim = useRef(), fill = useRef()
  useFrame((_, delta) => {
    GlobalTime.update(delta)
    Tempo.update(delta)
    GlobalPhase.update(GlobalTime.t, delta)

    const t = GlobalTime.t
    const beat = Tempo.beat()

    // update global time/beat/phase (push to GlobalUniforms)
    GlobalUniforms.uTime.value = t
    GlobalUniforms.uBeat.value = beat
    GlobalUniforms.uPhaseCore.value = GlobalPhase.core
    GlobalUniforms.uPhaseShell.value = GlobalPhase.shell
    GlobalUniforms.uPhaseSwarm.value = GlobalPhase.swarm
    GlobalUniforms.uCollapse.value = Math.pow(beat, 2.2) // smooth collapse variable

    // base hue slowly drifting
    const baseHue = (Math.sin(t * 0.08) * 0.5 + 0.5) // 0..1
    GlobalUniforms.uHue.value = baseHue

    // compute cascaded hues based on propagated phase (makes color "travel")
    GlobalUniforms.uHueCore.value = hueCascade(baseHue, GlobalPhase.core, 0.14)
    GlobalUniforms.uHueShell.value = hueCascade(baseHue, GlobalPhase.shell, 0.10)
    GlobalUniforms.uHueSwarm.value = hueCascade(baseHue, GlobalPhase.swarm, 0.18)

    // lights move & breathe
    if (key.current && rim.current && fill.current) {
      key.current.position.x = Math.sin(t * 0.45) * 3
      key.current.position.y = Math.cos(t * 0.35) * 2
      rim.current.position.z = Math.cos(t * 0.4) * 3.5
      const breathe = 0.5 + Math.sin(t * 0.8) * 0.3
      key.current.intensity = 1.0 + breathe * 0.45 * (0.6 + beat * 0.8)
      rim.current.intensity = 0.8 + breathe * 0.35
      fill.current.intensity = 0.22 + breathe * 0.14
    }
  })

  return (
    <>
      <pointLight ref={key} intensity={1.6} distance={10} decay={2} position={[2, 1.5, 3]} />
      <pointLight ref={rim} intensity={1.2} distance={10} decay={2} position={[-3, 1, -2]} />
      <pointLight ref={fill} color="#88aaff" intensity={0.45} distance={8} decay={2} position={[0, -2, 3]} />
      <ambientLight intensity={0.06} />
    </>
  )
}

// ---------------------------
// Volumetric spherical shell (kept soft)
// ---------------------------
function VolumetricShell({ radius = 4.2 }) {
  const matRef = useRef()
  const { camera } = useThree()

  useFrame(() => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = GlobalUniforms.uTime.value
    // use base hue for volumetric shell but nudge with propagated shell phase for color flow
    matRef.current.uniforms.uHue.value = GlobalUniforms.uHue.value + 0.02 * Math.sin(GlobalPhase.shell * 1.4)
    matRef.current.uniforms.uBeat.value = GlobalUniforms.uBeat.value
    matRef.current.uniforms.uCamPos.value = camera.position
    if (matRef.current.uniforms.uCollapse) matRef.current.uniforms.uCollapse.value = GlobalUniforms.uCollapse.value
  })

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[radius, 64, 48]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uHue: { value: 0 },
          uBeat: { value: 0 },
          uCamPos: { value: new THREE.Vector3() },
          uRadius: { value: radius },
          uCollapse: { value: 0 },
        }}
        vertexShader={`
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uHue;
          uniform float uBeat;
          uniform vec3 uCamPos;
          uniform float uRadius;
          uniform float uCollapse;
          varying vec3 vWorldPos;
          varying vec3 vNormal;

          vec3 hsl2rgb(vec3 hsl) {
            vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
            return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0*hsl.z - 1.0));
          }

          void main() {
            float dist = length(vWorldPos);
            float shellEdge = smoothstep(uRadius * 0.98, uRadius * 0.6, dist);
            float camDist = length(uCamPos - vWorldPos);
            float viewFade = smoothstep(0.0, 8.0, camDist);
            float ripple = 0.06 * sin(uTime * 2.0 + dist * 6.0) * (0.5 + 0.5 * uBeat);

            float hue = mod(uHue + (dist / uRadius) * 0.12 + uBeat * 0.04, 1.0);

            vec3 col = hsl2rgb(vec3(hue, 0.82, 0.6));

            float strength = (1.0 - shellEdge) * (0.9 + ripple) * (1.0 - clamp(viewFade, 0.0, 0.9));
            strength *= mix(0.7, 1.0, smoothstep(uRadius * 0.2, uRadius * 0.6, dist));
            strength *= (1.0 + uCollapse * 0.3);
            gl_FragColor = vec4(col * strength, strength * 0.55);
          }
        `}
      />
    </mesh>
  )
}

// ---------------------------
// Orbiting Swarm Behavior (uses propagated phase for pulse & hue)
// ---------------------------
function OrbitingSwarmBehavior({ count = 1600, baseRadius = 8 }) {
  const ref = useRef()

  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const layer = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const r = baseRadius * (0.6 + Math.random() * 0.5)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      seed[i] = Math.random() * 10
      layer[i] = Math.random()
    }

    return { pos, seed, layer }
  }, [count, baseRadius])

  useFrame(() => {
    if (!ref.current) return
    const t = GlobalUniforms.uTime.value
    const beat = GlobalUniforms.uBeat.value
    const hue = GlobalUniforms.uHueSwarm.value
    const collapse = GlobalUniforms.uCollapse.value

    const attr = ref.current.geometry.attributes.position
    const positions = attr.array

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const s = particles.seed[i]
      const layerVal = particles.layer[i]

      const collapseLocal = collapse
      const radius = baseRadius * (0.8 + 0.25 * Math.sin(t * 0.6 + s) * (0.8 + beat * 0.6))
                    * (1.0 - 0.22 * collapseLocal)

      const theta = t * (0.18 + layerVal * 0.35) + s + 0.35 * GlobalPhase.swarm
      const phi = Math.sin(t * 0.2 + s * 4.0) * 0.4 + layerVal * Math.PI

      positions[ix] = radius * Math.sin(phi) * Math.cos(theta)
      positions[ix + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[ix + 2] = radius * Math.cos(phi)
    }

    attr.needsUpdate = true

    if (ref.current.material && ref.current.material.uniforms) {
      ref.current.material.uniforms.uTime.value = t
      ref.current.material.uniforms.uHue.value = hue
      ref.current.material.uniforms.uBeat.value = beat
      ref.current.material.uniforms.uPhaseSwarm.value = GlobalPhase.swarm
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={particles.pos} count={particles.pos.length / 3} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uHue: { value: 0 },
          uBeat: { value: 0 },
          uPhaseSwarm: { value: 0 },
        }}
        vertexShader={`
          uniform float uTime;
          varying float vSeed;
          varying float vDepth;
          void main() {
            vSeed = position.x + position.y + position.z;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vDepth = length(position);
            float size = (22.0 / (length(mvPosition.xyz) + 2.5)) * (1.0 + 0.8 * sin(uTime * 3.0 + vSeed * 4.0));
            gl_PointSize = clamp(size, 2.0, 42.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uHue;
          uniform float uBeat;
          uniform float uPhaseSwarm;
          varying float vSeed;
          varying float vDepth;

          vec3 hsl2rgb(vec3 hsl) {
            vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
            return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0*hsl.z - 1.0));
          }

          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float alpha = smoothstep(0.45, 0.0, d);

            float hue = mod(uHue + fract(sin(vSeed) * 43758.5453) * 0.25 + uBeat * 0.05 + 0.08 * sin(uPhaseSwarm * 0.9), 1.0);
            vec3 color = hsl2rgb(vec3(hue, 0.9, 0.55));

            float bright = smoothstep(9.0, 0.4, vDepth);
            float pulse = 0.44 + sin(uTime * 2.0 + vSeed + uPhaseSwarm) * 0.32;
            float finalAlpha = alpha * (0.18 + bright * 0.45 + pulse * 0.2);

            gl_FragColor = vec4(color * (0.8 + bright * 0.9), finalAlpha);
          }
        `}
      />
    </points>
  )
}

// ---------------------------
// AuroraSphere (core + shell + overlay)
// - core & shell shaders read propagated phase + cascaded hue values
// ---------------------------
function InnerCore() {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.uniforms.uTime.value = GlobalUniforms.uTime.value
    ref.current.uniforms.uPower.value = 1.0 + GlobalUniforms.uBeat.value * 0.9
    // map propagated hue/phase into core shader
    ref.current.uniforms.uHueShift.value = GlobalUniforms.uHueCore.value
    ref.current.uniforms.uPhaseCore.value = GlobalPhase.core
  })

  return (
    <mesh>
      <sphereGeometry args={[0.92, 128, 64]} />
      <shaderMaterial ref={ref} blending={THREE.AdditiveBlending} transparent depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uPower: { value: 1.0 },
          uHueShift: { value: 0.5 },
          uPhaseCore: { value: 0 }
        }}
        vertexShader={`
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uPower;
          uniform float uHueShift;
          uniform float uPhaseCore;
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          float cheapNoise(vec3 p) {
            float n = 0.0;
            n += sin(p.x*3.0 + p.y*1.7 + p.z*2.3 + uTime*0.8);
            n += sin(p.x*6.3 + p.y*3.1 + p.z*1.9 + uTime*1.2)*0.5;
            n += sin(p.x*12.7 + p.y*6.2 + p.z*3.7 + uTime*1.9)*0.25;
            return n * 0.5 + 0.5;
          }
          vec3 hsl2rgb(vec3 hsl) {
            vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
            return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0*hsl.z - 1.0));
          }
          void main() {
            float r = length(vWorldPos);
            float fall = smoothstep(1.0, 0.2, r);
            float n = cheapNoise(vWorldPos * 1.6);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float f = pow(1.0 - max(0.0, dot(normalize(vNormal), viewDir)), 2.0);

            // hue uses propagated core hue
            float hue = mod(uHueShift * 0.6 + n * 0.35 + f * 0.2, 1.0);
            vec3 color = hsl2rgb(vec3(hue, 0.95, 0.6));

            // pulse from propagated core phase (stronger, warm flash)
            float pulse = abs(sin(uPhaseCore * 1.2)) * 0.92 + 0.18;

            float intensity = clamp(uPower * (0.6 + n * 0.6) * fall + f * 0.25, 0.0, 2.6);
            gl_FragColor = vec4(color * intensity * pulse, clamp(intensity * 0.85, 0.0, 1.0));
          }
        `}
      />
    </mesh>
  )
}

function Shell() {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.uniforms.uTime.value = GlobalUniforms.uTime.value
    ref.current.uniforms.uDispersion.value = 0.018 + GlobalUniforms.uBeat.value * 0.01
    ref.current.uniforms.uRough.value = 0.06
    // pass propagated shell phase & cascaded hue
    if (ref.current.uniforms.uPhaseShell) ref.current.uniforms.uPhaseShell.value = GlobalPhase.shell
    if (ref.current.uniforms.uHueTint) ref.current.uniforms.uHueTint.value = GlobalUniforms.uHueShell.value
  })
  return (
    <mesh>
      <sphereGeometry args={[1.0, 128, 64]} />
      <shaderMaterial ref={ref} transparent depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uDispersion: { value: 0.015 },
          uRough: { value: 0.06 },
          uPhaseShell: { value: 0 },
          uHueTint: { value: 0 }, // tint controlled by cascaded hue
        }}
        vertexShader={`
          varying vec3 vNormal; varying vec3 vWorldPos; varying vec3 vView;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vView = normalize(cameraPosition - vWorldPos);
            gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime; uniform float uDispersion; uniform float uRough; uniform float uPhaseShell; uniform float uHueTint;
          varying vec3 vNormal; varying vec3 vWorldPos; varying vec3 vView;
          vec3 spectrum(float t) {
            return vec3(
              smoothstep(0.0, 1.0, sin((t + 0.0) * 6.2831) * 0.5 + 0.5),
              smoothstep(0.0, 1.0, sin((t + 0.33) * 6.2831) * 0.5 + 0.5),
              smoothstep(0.0, 1.0, sin((t + 0.66) * 6.2831) * 0.5 + 0.5)
            );
          }
          vec3 hsl2rgb(vec3 hsl) {
            vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
            return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0*hsl.z - 1.0));
          }
          void main() {
            float F = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(vView))), 3.0);
            vec3 refractDir = normalize(vView + vNormal * 0.2);
            vec3 rColor = spectrum(dot(refractDir, vec3(1.0))*0.5) * (0.7 + F * 0.8);
            vec3 gColor = spectrum(dot(refractDir, vec3(0.9))*0.5) * (0.6 + F * 0.7);
            vec3 bColor = spectrum(dot(refractDir, vec3(0.8))*0.5) * (0.5 + F * 0.6);
            float flick = 0.98 + sin(uTime * 1.2 + length(vWorldPos) * 3.0) * 0.02;
            vec3 color = vec3(rColor.r, gColor.g, bColor.b) * flick;

            // tint from cascaded hue (uHueTint) blended in
            float hue = mod(uHueTint, 1.0);
            vec3 tint = hsl2rgb(vec3(hue, 0.6, 0.55));
            float mixAmt = 0.25 + 0.35 * abs(sin(uPhaseShell * 0.9));
            color = mix(color, tint, mixAmt);

            float dark = 1.0 - clamp(uRough * 5.0 * (1.0 - F), 0.0, 0.6);
            float pulse = abs(sin(uPhaseShell)) * 0.7 + 0.3;
            gl_FragColor = vec4(color * dark * (0.25 + F * 0.85) * pulse, 0.95);
          }
        `}
      />
    </mesh>
  )
}

function Overlay() {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.uniforms.uTime.value = GlobalUniforms.uTime.value
    ref.current.uniforms.uHue.value = GlobalUniforms.uHue.value
  })
  return (
    <mesh>
      <sphereGeometry args={[1.01, 128, 64]} />
      <shaderMaterial ref={ref} uniforms={{ uTime: { value: 0 }, uHue: { value: 0 } }}
        vertexShader={`
          varying vec3 vNormal; varying vec3 vViewDir;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(cameraPosition - worldPos.xyz);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `}
        fragmentShader={`
          uniform float uTime; uniform float uHue;
          varying vec3 vNormal; varying vec3 vViewDir;
          vec3 hsl2rgb(vec3 hsl) {
            vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0*hsl.z - 1.0));
          }
          void main() {
            float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
            float hue = mod(uHue + fresnel * 0.3, 1.0);
            vec3 color = hsl2rgb(vec3(hue, 0.88, 0.6));
            gl_FragColor = vec4(color, fresnel * 0.92);
          }
        `} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </mesh>
  )
}

function AuroraSphere() {
  const group = useRef()
  useFrame(() => {
    const t = GlobalUniforms.uTime.value
    const collapse = GlobalUniforms.uCollapse.value
    if (group.current) {
      group.current.scale.setScalar(1.0 + collapse * 0.06) // grow on beat
      // slight rotation modulated by propagated phases to feel alive
      group.current.rotation.y = t * 0.06 + 0.12 * GlobalPhase.shell
      group.current.rotation.x = Math.sin(t * 0.03 + GlobalPhase.core * 0.08) * 0.04
    }
  })
  return (
    <group ref={group}>
      <InnerCore />
      <Shell />
      <Overlay />
    </group>
  )
}

// ---------------------------
// Scene & FX
// ---------------------------
function Scene() {
  return (
    <>
      <Perf position="top-left" />
      <fog attach="fog" args={['#000000', 3.5, 14]} />

      <Suspense fallback={null}>
        <Environment preset="studio" background={false} blur={0} />
      </Suspense>

      <DynamicLighting />
      <VolumetricShell radius={4.2} />
      <OrbitingSwarmBehavior count={1400} baseRadius={4.8} />

      <AuroraSphere />

      <EffectComposer disableNormalPass>
        <Bloom intensity={0.55} luminanceThreshold={0.32} />
        <ChromaticAberration offset={[0.0016, 0.0012]} />
        <Vignette eskil={false} offset={0.12} darkness={0.74} />
      </EffectComposer>
    </>
  )
}

// ---------------------------
// Entry
// ---------------------------
export default function Page() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
          outputEncoding: THREE.sRGBEncoding,
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            console.warn('⚠️ WebGL context lost — restarting...')
            window.location.reload()
          })
        }}
      >
        <Scene />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  )
}
