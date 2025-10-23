'use client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { Perf } from 'r3f-perf'
import * as THREE from 'three'
import { useRef, useMemo, Suspense, useEffect } from 'react'


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

// === Core GPU Orbit Simulation ===

function useOrbitGPU_VelPos(renderer, size = 512, baseRadius = 8.0, GlobalUniforms, GlobalPhase) {
  const simRef = useRef({})

  useEffect(() => {
    const res = size
    const count = res * res
    const format = THREE.RGBAFormat
    const type = THREE.FloatType

    // --- initial pos / vel / seed / layer textures (CPU-side once) ---
    const posArr = new Float32Array(count * 4)
    const velArr = new Float32Array(count * 4).fill(0)
    const seedArr = new Float32Array(count * 4)
    const layerArr = new Float32Array(count * 4)

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const i = y * res + x
        // seed + layer random
        const s = Math.random() * 10.0
        const l = Math.random()

        // parametric starting position (outside sphere)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = baseRadius * (0.9 + Math.random() * 0.2)
        const px = r * Math.sin(phi) * Math.cos(theta)
        const py = r * Math.sin(phi) * Math.sin(theta)
        const pz = r * Math.cos(phi)

        posArr[i * 4 + 0] = px
        posArr[i * 4 + 1] = py
        posArr[i * 4 + 2] = pz
        posArr[i * 4 + 3] = 1.0

        velArr[i * 4 + 0] = 0
        velArr[i * 4 + 1] = 0
        velArr[i * 4 + 2] = 0
        velArr[i * 4 + 3] = 1.0

        seedArr[i * 4 + 0] = s
        seedArr[i * 4 + 1] = s * 0.123
        seedArr[i * 4 + 2] = s * 0.321
        seedArr[i * 4 + 3] = 1.0

        layerArr[i * 4 + 0] = l
        layerArr[i * 4 + 1] = l * 2.0
        layerArr[i * 4 + 2] = l * 3.0
        layerArr[i * 4 + 3] = 1.0
      }
    }

    const posInit = new THREE.DataTexture(posArr, res, res, format, type)
    const velInit = new THREE.DataTexture(velArr, res, res, format, type)
    const seedInit = new THREE.DataTexture(seedArr, res, res, format, type)
    const layerInit = new THREE.DataTexture(layerArr, res, res, format, type)
    posInit.needsUpdate = velInit.needsUpdate = seedInit.needsUpdate = layerInit.needsUpdate = true

    // create render targets (pingpong)
    const createRT = () => new THREE.WebGLRenderTarget(res, res, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format, type, depthBuffer: false, stencilBuffer: false
    })
    const posRT1 = createRT(), posRT2 = createRT()
    const velRT1 = createRT(), velRT2 = createRT()

    // common fullscreen vertex
    const passVert = `
      precision highp float;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `

    // --- velocity fragment (curl noise + gravity toward parametric target) ---
    const velFrag = `
    precision highp float;
    varying vec2 vUv;

    uniform sampler2D uPosTex;
    uniform sampler2D uVelTex;
    uniform sampler2D uSeedTex;
    uniform sampler2D uLayerTex;

    uniform float uTime;
    uniform float uBeat;
    uniform float uCollapse;
    uniform float uPhaseSwarm;

    uniform float uBaseRadius;
    uniform float uTurbulence;
    uniform float uDamping;
    uniform float uSimSpeed;
    uniform float uDelta;

    // Simple curl noise based on position
    vec3 curlNoise(vec3 p) {
      float e = 0.1;
      float n1 = sin(p.y + uTime * 0.15);
      float n2 = sin(p.z + uTime * 0.17);
      float n3 = sin(p.x + uTime * 0.19);
      return normalize(vec3(n1, n2, n3));
    }

    void main() {
      vec3 pos = texture2D(uPosTex, vUv).xyz;
      vec3 vel = texture2D(uVelTex, vUv).xyz;
      vec4 seedv = texture2D(uSeedTex, vUv);
      vec4 layerv = texture2D(uLayerTex, vUv);

      float s = seedv.x;
      float layer = layerv.x;

      // --- orbit target seperti sebelumnya ---
      float radius = uBaseRadius *
        (0.8 + 0.25 * sin(uTime * 0.6 + s) * (0.8 + uBeat * 0.6)) *
        (1.0 - 0.22 * uCollapse);

      float theta = uTime * (0.18 + layer * 0.35) + s + 0.35 * uPhaseSwarm;
      float phi = sin(uTime * 0.2 + s * 4.0) * 0.4 + layer * 3.14159265;

      vec3 target = vec3(
        radius * sin(phi) * cos(theta),
        radius * sin(phi) * sin(theta),
        radius * cos(phi)
      );

      // --- gaya utama (spring ke target) ---
      vec3 toTarget = target - pos;
      float dist = length(toTarget);
      vec3 spring = normalize(toTarget) * (dist * 0.02); // 0.045 → 0.02

      // --- curl noise turbulen tapi lembut ---
      vec3 curl = curlNoise(pos * 0.25 + uTime * 0.15) * (uTurbulence * 0.7);

      // --- gaya repulsion ke pusat (biar nggak clump) ---
      vec3 repel = normalize(pos) * -0.08;

      // --- total percepatan ---
      vec3 acc = spring + curl + repel;

      // --- integrasi kecepatan dengan waktu & damping ---
      vel += acc * (uDelta * 60.0 * uSimSpeed);
      vel *= pow(uDamping, uDelta * 60.0 * (1.0 + (1.0 - uSimSpeed) * 0.5));

      gl_FragColor = vec4(vel, 1.0);
    }
    `;


    // --- position fragment integrates vel into pos ---
    const posFrag = `
    precision highp float;
    varying vec2 vUv;
    
    uniform sampler2D uPosTex;
    uniform sampler2D uVelTex;
    
    uniform float uDelta;
    uniform float uSimSpeed;
    
    void main() {
      vec3 pos = texture2D(uPosTex, vUv).xyz;
      vec3 vel = texture2D(uVelTex, vUv).xyz;
    
      // gerak lebih lambat → kurangi faktor 60.0 → 20.0 dan kali simSpeed
      vec3 newPos = pos + vel * uDelta * 20.0 * uSimSpeed;
    
      gl_FragColor = vec4(newPos, 1.0);
    }
    `;
    

    // create materials
    const velMat = new THREE.ShaderMaterial({
      vertexShader: passVert,
      fragmentShader: velFrag,
      uniforms: {
        uPosTex: { value: null },
        uVelTex: { value: null },
        uSeedTex: { value: seedInit },
        uLayerTex: { value: layerInit },
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uCollapse: { value: 0 },
        uPhaseSwarm: { value: 0 },
        uBaseRadius: { value: baseRadius },
        uTurbulence: { value: 0.35 },
        uDamping: { value: 0.985 },
        uSimSpeed: { value: 0.25 },  // 🌿 faktor perlambatan
        uDelta: { value: 1 / 60 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    })

    
    const posMat = new THREE.ShaderMaterial({
      vertexShader: passVert,
      fragmentShader: posFrag,
      uniforms: {
        uPosTex: { value: null },
        uVelTex: { value: null },
        uDelta: { value: 1 / 60 },
        uSimSpeed: { value: 0.45 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    })

    // scenes & quads
    const sceneVel = new THREE.Scene()
    const quadVel = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), velMat)
    quadVel.frustumCulled = false
    sceneVel.add(quadVel)
    const scenePos = new THREE.Scene()
    const quadPos = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), posMat)
    quadPos.frustumCulled = false
    scenePos.add(quadPos)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // initial bake: write initial pos into RTs so posTex exists
    // copy posInit into posRT1 & posRT2, velInit into velRT1 & velRT2
    // reuse a simple copy material
    const copyMat = new THREE.ShaderMaterial({
      vertexShader: passVert,
      fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uTex; void main(){ gl_FragColor = texture2D(uTex, vUv); }`,
      uniforms: { uTex: { value: null } },
      depthTest: false, depthWrite: false, blending: THREE.NoBlending
    })
    const copyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), copyMat)
    copyQuad.frustumCulled = false
    const copyScene = new THREE.Scene()
    copyScene.add(copyQuad)

    // helper render-copy
    copyMat.uniforms.uTex.value = posInit
    renderer.setRenderTarget(posRT1); renderer.render(copyScene, camera)
    renderer.setRenderTarget(posRT2); renderer.render(copyScene, camera)
    copyMat.uniforms.uTex.value = velInit
    renderer.setRenderTarget(velRT1); renderer.render(copyScene, camera)
    renderer.setRenderTarget(velRT2); renderer.render(copyScene, camera)
    renderer.setRenderTarget(null)

    // store sim
    simRef.current = {
      res, sceneVel, quadVel, scenePos, quadPos, camera,
      posMat, velMat,
      posRT1, posRT2, velRT1, velRT2,
      seedInit, layerInit,
      posTex: posRT1.texture,
      velTex: velRT1.texture,
      layerTex: layerInit,    
      write: 0
    }

    // cleanup on unmount
    return () => {
      posRT1.dispose(); posRT2.dispose(); velRT1.dispose(); velRT2.dispose()
      posInit.dispose(); velInit.dispose(); seedInit.dispose(); layerInit.dispose()
      velMat.dispose(); posMat.dispose(); copyMat.dispose()
    }
  }, [renderer, size, baseRadius])

  // per-frame: vel pass -> pos pass (ping-pong)
  useFrame((state, delta) => {
    const sim = simRef.current
    if (!sim || !sim.sceneVel) return
    const {
      posRT1, posRT2, velRT1, velRT2,
      sceneVel, scenePos, camera, velMat, posMat
    } = sim

    const writeEven = (sim.write % 2 === 0)
    const posRead = writeEven ? posRT1 : posRT2
    const velRead = writeEven ? velRT1 : velRT2
    const posWrite = writeEven ? posRT2 : posRT1
    const velWrite = writeEven ? velRT2 : velRT1

    // update uniforms
    const t = (GlobalUniforms && GlobalUniforms.uTime) ? GlobalUniforms.uTime.value : state.clock.getElapsedTime()
    const beat = (GlobalUniforms && GlobalUniforms.uBeat) ? GlobalUniforms.uBeat.value : 0
    const phase = (GlobalPhase) ? GlobalPhase.swarm : 0

    velMat.uniforms.uPosTex.value = posRead.texture
    velMat.uniforms.uVelTex.value = velRead.texture
    velMat.uniforms.uTime.value = t
    velMat.uniforms.uBeat.value = beat
    velMat.uniforms.uPhaseSwarm.value = phase
    velMat.uniforms.uDelta.value = delta

    // velocity pass
    renderer.setRenderTarget(velWrite)
    renderer.render(sceneVel, camera)

    // position pass (reads velWrite)
    posMat.uniforms.uPosTex.value = posRead.texture
    posMat.uniforms.uVelTex.value = velWrite.texture
    posMat.uniforms.uDelta.value = delta

    renderer.setRenderTarget(posWrite)
    renderer.render(scenePos, camera)

    renderer.setRenderTarget(null)

    // publish
    sim.posTex = posWrite.texture
    sim.velTex = velWrite.texture
    sim.write++
  })

  return simRef
}

// === Main Orbiting Swarm Component ===
// === Main Orbiting Swarm Component — Phase 1.4: Depth Blending & Visual Hierarchy ===
function OrbitingSwarmBehavior({ texRes = 512, baseRadius = 8.0 }) {
  const ref = useRef()
  const { gl, camera } = useThree()
  const sim = useOrbitGPU_VelPos(gl, texRes, baseRadius, GlobalUniforms, GlobalPhase)
  const count = texRes * texRes

  // geometry setup
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const uvs = new Float32Array(count * 2)
    let ptr = 0
    for (let y = 0; y < texRes; y++) {
      for (let x = 0; x < texRes; x++) {
        const i = y * texRes + x
        positions[i * 3 + 0] = 0
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = 0
        uvs[ptr++] = (x + 0.5) / texRes
        uvs[ptr++] = (y + 0.5) / texRes
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    return g
  }, [texRes])

  // update simulation binding
  useFrame(() => {
    if (!ref.current || !sim.current?.posTex) {
      if (ref.current) ref.current.visible = false
      return
    }
    ref.current.visible = true
    const mat = ref.current.material
    mat.uniforms.uPosTex.value = sim.current.posTex
    mat.uniforms.uTime.value = GlobalUniforms.uTime.value
    mat.uniforms.uHue.value = GlobalUniforms.uHueSwarm.value
    mat.uniforms.uBeat.value = GlobalUniforms.uBeat.value
    mat.uniforms.uPhase.value = GlobalPhase.swarm
    mat.uniforms.uCamPos.value = camera.position
  })

  return (
    <points ref={ref} geometry={geom} frustumCulled={false}>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          uPosTex: { value: null },
          uTime: { value: 0 },
          uHue: { value: 0 },
          uBeat: { value: 0 },
          uPhase: { value: 0 },
          uCamPos: { value: new THREE.Vector3() },
        }}
        vertexShader={`
          precision highp float;
          uniform sampler2D uPosTex;
          uniform float uTime;
          uniform vec3 uCamPos;
          varying float vDepth;
          varying vec2 vUv;
          varying float vLayer;

          void main() {
            vUv = uv;
            vec3 pos = texture2D(uPosTex, uv).xyz;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            vDepth = length(pos - uCamPos);

            // visual layer separation
            vLayer = smoothstep(2.0, 14.0, vDepth);

            float pulse = 0.8 + 0.4 * sin(uTime * 2.0 + pos.x + pos.y);
            float size = (42.0 / (vDepth + 6.0)) * pulse;
            gl_PointSize = clamp(size, 0.5, 26.0);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          precision highp float;
          uniform float uTime;
          uniform float uHue;
          uniform float uBeat;
          uniform float uPhase;
          varying float vDepth;
          varying float vLayer;
          varying vec2 vUv;

          vec3 hsl2rgb(vec3 hsl) {
            vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);
            return hsl.z + hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
          }

          void main() {
            vec2 p = gl_PointCoord - 0.5;
            float d = length(p);
            if (d > 0.5) discard;

            float alpha = 1.0 - smoothstep(0.35, 0.5, d);
            float hue = mod(uHue + 0.05*sin(uTime*0.5) + uBeat*0.02 + vLayer*0.12, 1.0);
            vec3 col = hsl2rgb(vec3(hue, 0.9, 0.55));

            // === Depth-aware blending & layering ===
            float nearFog = smoothstep(0.0, 3.5, vDepth);
            float farFade = smoothstep(20.0, 55.0, vDepth);
            float emissive = 0.5 + 0.5 * sin(uPhase * 2.2 + vDepth * 0.12);
            float beatGlow = pow(uBeat, 1.6) * 0.8;

            // layer tint: near fog (soft), mid dust (neutral), far stars (cool)
            vec3 nearTint = vec3(1.0, 0.8, 0.7);
            vec3 midTint  = vec3(0.8, 0.9, 1.0);
            vec3 farTint  = vec3(0.6, 0.8, 1.2);
            vec3 layerTint = mix(mix(nearTint, midTint, vLayer), farTint, farFade);

            float depthAlpha = (1.0 - farFade) * nearFog;

            vec3 finalCol = col * layerTint * (0.6 + emissive * 0.4 + beatGlow);
            float finalAlpha = alpha * depthAlpha * (0.7 + beatGlow * 0.4);

            gl_FragColor = vec4(finalCol, finalAlpha);
          }
        `}
      />
    </points>
  )
}


function ScreenSpaceVolumetricPass({
  samples = 12,            // raymarch sample count (perf ↔ quality)
  scattering = 0.85,      // overall scattering intensity
  extinction = 0.22,      // light absorption
  stepSize = 1.0,         // multiplier for march step length
  lightPos = new THREE.Vector3(2.0, 1.5, 3.0), // world-space light
  lightColor = new THREE.Color(1.0, 0.9, 0.8),
  enabled = true
}) {
  const meshRef = useRef()
  const quadSceneRef = useRef()
  const quadCamRef = useRef()
  const rtRef = useRef()
  const { gl, scene, camera, size } = useThree()
  const pixelRatio = Math.min(1.5, gl.getPixelRatio ? gl.getPixelRatio() : 1)
  const prevCamRef = useRef({
    proj: new THREE.Matrix4(),
    view: new THREE.Matrix4(),
    camPos: new THREE.Vector3()
  })
  

  // --- shader (GLSL) ---
  const vert = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `
  // fragment: reconstruct view ray, raymarch from camera into scene sampling depth
  const frag = `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D tScene;
  uniform sampler2D tDepth;
  uniform sampler2D tPrevAccum;

  uniform mat4 uProjectionMatrix;
  uniform mat4 uProjectionMatrix_inv;
  uniform mat4 uViewMatrix;
  uniform mat4 uViewMatrix_inv;
  uniform mat4 uPrevProjectionMatrix;
  uniform mat4 uPrevViewMatrix;
  uniform vec3 uPrevCamPos;

  uniform vec3 uCamPos;
  uniform vec3 uLightPos;
  uniform vec3 uLightColor;

  uniform float uTime;
  uniform float uScattering;
  uniform float uExtinction;
  uniform float uStepSize;
  uniform float uBlendFactor;
  uniform float uMotionMin;
  uniform float uMotionMax;
  uniform float uAnisotropy;
  uniform int uSamples;
  uniform int uFrameIndex;

  uniform sampler2D tNoise;
  uniform float uFogDensity;
  uniform float uNoiseScale;
  uniform float uFlowSpeed;
  uniform vec3 uFlowDir;
  uniform float uPhasePulse;
  uniform int uZoneCount;
  uniform vec3 uZonePos[2];
  uniform float uZoneRadius[2];
  uniform float uZoneStrength[2];
  
  // --- directional anisotropy uniforms ---
  uniform float uAnisoBase;
  uniform float uAnisoAmp;
  uniform vec3 uLightWarm;
  uniform vec3 uLightCool;
  uniform float uColorShift;


float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }

vec3 viewPosFromDepth(vec2 uv, float depth){
  float z = depth * 2.0 - 1.0;
  vec4 clip = vec4(uv * 2.0 - 1.0, z, 1.0);
  vec4 view = uProjectionMatrix_inv * clip;
  view /= view.w;
  return view.xyz;
}

float hgPhase(float cosTheta, float g){
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * 3.14159265 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

float sampleNoise(vec3 p, sampler2D tex, float scale, float t){
  vec2 uv = p.xy * scale + vec2(t * 0.05, t * 0.03);
  return texture2D(tex, uv).r;
}

float computeZoneMask(vec3 samplePos, int zoneCount, vec3 zonePos[2], float zoneRadius[2], float zoneStrength[2]) {
  float mask = 0.0;
  for (int i = 0; i < 2; i++) {
    if (i >= zoneCount) break;
    float d = length(samplePos - zonePos[i]);
    float z = smoothstep(zoneRadius[i], zoneRadius[i] * 0.6, d);
    mask += (1.0 - z) * zoneStrength[i];
  }
  return clamp(mask, 0.0, 1.0);
}

float densityField(vec3 samplePos, float t){
  float n = sampleNoise(samplePos, tNoise, uNoiseScale, t * uFlowSpeed);
  float m = computeZoneMask(samplePos, uZoneCount, uZonePos, uZoneRadius, uZoneStrength);
  float breathing = (1.0 + 0.3 * sin(uPhasePulse * 2.0 + samplePos.y * 0.2));
  return clamp(n * m * uFogDensity * breathing, 0.0, 1.0);
}

vec3 directionalTint(vec3 rayDir, vec3 Ldir, vec3 warm, vec3 cool, float shift){
  float cosT = dot(rayDir, Ldir);
  float bias = pow(1.0 - max(cosT, 0.0), 2.2);
  vec3 tint = mix(warm, cool, bias);
  // optional artistic hue shift
  tint = mix(tint, vec3(tint.b, tint.r, tint.g), shift * 0.2);
  return tint;
}

void main(){
  vec3 sceneCol = texture2D(tScene, vUv).rgb;
  float depth = texture2D(tDepth, vUv).x;
  if(depth >= 0.9999){ gl_FragColor = vec4(sceneCol, 1.0); return; }

  vec3 viewPos = viewPosFromDepth(vUv, depth);
  vec3 worldPos = (uViewMatrix_inv * vec4(viewPos, 1.0)).xyz;

  vec3 rayOrigin = uCamPos;
  vec3 rayDir = normalize(worldPos - rayOrigin);
  float maxDist = length(worldPos - rayOrigin);

  float jitter = (rand(vUv + float(uFrameIndex)) - 0.5);
  float step = maxDist / float(max(1,uSamples)) * uStepSize;
  float t0 = jitter * step;

  vec3 Lpos = uLightPos;
  vec3 Lcolor = uLightColor;
  vec3 acc = vec3(0.0);
  float trans = 1.0;

  for(int i=0;i<64;i++){
    if(i>=uSamples) break;
    float sT = t0 + float(i)*step;
    vec3 samplePos = rayOrigin + rayDir*sT;

    vec4 viewSample = uViewMatrix * vec4(samplePos,1.0);
    vec4 clip = uProjectionMatrix * viewSample;
    clip /= clip.w;
    vec2 uv = clip.xy*0.5+0.5;

    float sd = 1.0;
    if(uv.x>=0.0 && uv.x<=1.0 && uv.y>=0.0 && uv.y<=1.0) sd = texture2D(tDepth,uv).x;

    float occlusion = smoothstep(0.0,1.0,sd - (sT/maxDist));
    vec3 Ldir = normalize(Lpos - samplePos);
    float cosT = dot(rayDir, Ldir);
    float phase = hgPhase(cosT, uAnisotropy);

    float lightDist = length(Lpos - samplePos);
    float att = 1.0 / (1.0 + 0.09 * lightDist * lightDist);

    // compute density (already from 2.4)
    float localDensity = densityField(samplePos, uTime);

    // directional tint between warm & cool tones
    vec3 tint = directionalTint(rayDir, Ldir, uLightWarm, uLightCool, uColorShift);

    float scatter = uScattering * phase * att * occlusion * localDensity;
    float extF = exp(-uExtinction * step * (0.5 + localDensity * 1.2));

    acc += trans * tint * Lcolor * scatter * (1.0 - extF);
    trans *= extF;
    if (trans < 0.001) break;


    
    if(trans<0.001) break;
  }

  vec3 currVol = acc;

  // reprojection to previous frame
  vec4 prevClip = uPrevProjectionMatrix * uPrevViewMatrix * vec4(worldPos,1.0);
  prevClip /= prevClip.w;
  vec2 prevUV = prevClip.xy * 0.5 + 0.5;
  bool valid = prevUV.x>=0.0 && prevUV.x<=1.0 && prevUV.y>=0.0 && prevUV.y<=1.0;
  vec3 prevVol = valid ? texture2D(tPrevAccum, prevUV).rgb : vec3(0.0);

  float motion = valid ? length(prevUV - vUv) : 1.0;
  float motionF = smoothstep(uMotionMin, uMotionMax, motion);
  float blend = uBlendFactor * (1.0 - motionF);
  if(!valid) blend = 0.0;

  vec3 blendedVol = mix(currVol, prevVol, blend);
  vec3 finalCol = sceneCol + blendedVol;
  gl_FragColor = vec4(finalCol, 1.0);
}

  
  `

  // --- create render target with depth texture ---
  useEffect(() => {
    const rt = new THREE.WebGLRenderTarget(Math.max(1, Math.floor(size.width * pixelRatio)), Math.max(1, Math.floor(size.height * pixelRatio)), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      stencilBuffer: false
    })
    rt.depthTexture = new THREE.DepthTexture(rt.width, rt.height)
    rt.depthTexture.type = THREE.UnsignedShortType
    rtRef.current = rt
    
    // --- temporal accumulation ping-pong RTs ---
    const accumA = new THREE.WebGLRenderTarget(rt.width, rt.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false
    })
    const accumB = accumA.clone()
    accumA.texture.name = 'VolumAccum_A'
    accumB.texture.name = 'VolumAccum_B'

    rtRef.current.accumRead = accumA
    rtRef.current.accumWrite = accumB

    
    // --- temporal accumulation render target (for frame blending) ---
    const accumRT = new THREE.WebGLRenderTarget(
      rt.width,
      rt.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
        stencilBuffer: false
      }
    )
    accumRT.texture.name = 'VolumetricAccumulation'
    rtRef.current.accum = accumRT


    // fullscreen quad scene
    const quadScene = new THREE.Scene()
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    quadCam.position.z = 0
    quadCamRef.current = quadCam
    quadSceneRef.current = quadScene
    
    prevCamRef.current.proj.copy(camera.projectionMatrix)
    prevCamRef.current.view.copy(camera.matrixWorldInverse)
    prevCamRef.current.camPos.copy(camera.position)

    // geometry + material placeholder; material will be created in next step
    const quadGeo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        tScene: { value: null },
        tDepth: { value: null },
        tPrevFrame: { value: null },
        uProjectionMatrix: { value: new THREE.Matrix4() },
        uProjectionMatrix_inv: { value: new THREE.Matrix4() },
        uViewMatrix: { value: new THREE.Matrix4() },
        uViewMatrix_inv: { value: new THREE.Matrix4() },
        uCamPos: { value: new THREE.Vector3() },
        uLightPos: { value: lightPos.clone() },
        uLightColor: { value: lightColor.clone() },
        uTime: { value: 0 },
        uScattering: { value: scattering },
        uExtinction: { value: extinction },
        uStepSize: { value: stepSize },
        uSamples: { value: samples },
        uAnisotropy: { value: 0.4 },   // 0 = isotropic, >0 = forward scatter
        uTemporalBlend: { value: 0.1 },// blending weight antar frame
        uFrameIndex: { value: 0 },      // untuk jitter pattern
        tPrevAccum: { value: null },
        uPrevProjectionMatrix: { value: new THREE.Matrix4() },
        uPrevViewMatrix: { value: new THREE.Matrix4() },
        uPrevCamPos: { value: new THREE.Vector3() },
        uBlendFactor: { value: 0.92 },
        uMotionMin: { value: 0.002 },
        uMotionMax: { value: 0.06 },
        uFrameIndex: { value: 0 },
        uAnisotropy: { value: 0.4 },
        tNoise: { value: null },
        uFogDensity: { value: 0.8 },
        uNoiseScale: { value: 0.45 },
        uFlowSpeed: { value: 0.25 },
        uFlowDir: { value: new THREE.Vector3(0.3, 0.1, 0.0) },
        uPhasePulse: { value: 0.0 },
        uZoneCount: { value: 2 },
        uZonePos: { value: [new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(-2.0, 0.8, -1.5)] },
        uZoneRadius: { value: [3.2, 2.6] },
        uZoneStrength: { value: [0.9, 0.7] },
        uAnisoBase: { value: 0.35 },
        uAnisoAmp: { value: 0.25 },
        uLightWarm: { value: new THREE.Color(1.0, 0.86, 0.72) },
        uLightCool: { value: new THREE.Color(0.6, 0.75, 1.1) },
        uColorShift: { value: 0.4 },
      }
    })
    const quadMesh = new THREE.Mesh(quadGeo, mat)
    quadMesh.frustumCulled = false
    quadScene.add(quadMesh)
    meshRef.current = quadMesh

    // cleanup
    return () => {
      rt.dispose()
      accumRT.dispose()
      accumA.dispose()
      accumB.dispose()
      quadGeo.dispose()
      mat.dispose()
    }    
  }, []) // one-time

  // resize RT on canvas resize
  useEffect(() => {
    const rt = rtRef.current
    if (!rt) return
    const w = Math.max(1, Math.floor(size.width * pixelRatio))
    const h = Math.max(1, Math.floor(size.height * pixelRatio))
    if (rt.width !== w || rt.height !== h) {
      rt.setSize(w, h)
      rt.depthTexture.image.width = w
      rt.depthTexture.image.height = h
      rt.depthTexture.needsUpdate = true
    }
  }, [size.width, size.height, pixelRatio])

  
  // === Localized Fog Noise Setup ===
useEffect(() => {
  const noiseSize = 64
  const noiseData = new Float32Array(noiseSize * noiseSize * 4)
  for (let i = 0; i < noiseData.length; i += 4) {
    noiseData[i + 0] = Math.random()
    noiseData[i + 1] = Math.random()
    noiseData[i + 2] = Math.random()
    noiseData[i + 3] = 1.0
  }
  const noiseTex = new THREE.DataTexture(noiseData, noiseSize, noiseSize, THREE.RGBAFormat, THREE.FloatType)
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
  noiseTex.needsUpdate = true

  rtRef.current.noiseTex = noiseTex

  return () => noiseTex.dispose()
}, [])

  
  // per-frame: render scene into RT (hiding the volumetric mesh), then draw quad to screen
  useFrame((state) => {
    if (!enabled) return
    const rt = rtRef.current
    const quadScene = quadSceneRef.current
    const quadCam = quadCamRef.current
    const quadMesh = meshRef.current
    if (!rt || !quadScene || !quadMesh) return
  
    const accumRead = rt.accumRead
    const accumWrite = rt.accumWrite
    if (!accumRead || !accumWrite) return
  
    // hide volumetric mesh in main scene
    const prevVisibility = quadMesh.visible
    quadMesh.visible = false
  
    // render scene to RT
    const oldTarget = gl.getRenderTarget()
    gl.setRenderTarget(rt)
    gl.clear(true, true, true)
    gl.render(scene, camera)
    gl.setRenderTarget(oldTarget)
    quadMesh.visible = prevVisibility
  
    // uniforms
    const mat = quadMesh.material
    mat.uniforms.tScene.value = rt.texture
    mat.uniforms.tDepth.value = rt.depthTexture
  
    // current camera
    mat.uniforms.uProjectionMatrix.value.copy(camera.projectionMatrix)
    mat.uniforms.uProjectionMatrix_inv.value.copy(
      new THREE.Matrix4().copy(camera.projectionMatrix).invert()
    )
    mat.uniforms.uViewMatrix.value.copy(camera.matrixWorldInverse)
    mat.uniforms.uViewMatrix_inv.value.copy(camera.matrixWorld)
    mat.uniforms.uCamPos.value.copy(camera.position)
  
    // previous camera
    mat.uniforms.uPrevProjectionMatrix.value.copy(prevCamRef.current.proj)
    mat.uniforms.uPrevViewMatrix.value.copy(prevCamRef.current.view)
    mat.uniforms.uPrevCamPos.value.copy(prevCamRef.current.camPos)
  
    // temporal accumulation texture
    mat.uniforms.tPrevAccum.value = accumRead.texture
  
    // others
    mat.uniforms.uFrameIndex.value = state.clock.frame % 65536
    mat.uniforms.uLightPos.value.copy(lightPos)
    mat.uniforms.uLightColor.value.copy(lightColor)
    mat.uniforms.uTime.value = state.clock.getElapsedTime()
    mat.uniforms.uScattering.value = scattering
    mat.uniforms.uExtinction.value = extinction
    mat.uniforms.uStepSize.value = stepSize
    mat.uniforms.uSamples.value = samples
    
    mat.uniforms.uLightWarm.value.setHSL(GlobalUniforms.uHueShell.value, 0.6, 0.55)
    mat.uniforms.uLightCool.value.setHSL(GlobalUniforms.uHueSwarm.value, 0.5, 0.6)
  
    // --- localized fog uniforms update ---
    mat.uniforms.tNoise.value = rt.noiseTex
    mat.uniforms.uPhasePulse.value = 1.0 + 0.25 * Math.sin(GlobalPhase.shell * 2.0)
    mat.uniforms.uFlowDir.value.set(Math.sin(state.clock.elapsedTime * 0.1), 0.1, Math.cos(state.clock.elapsedTime * 0.1))
    
    // --- anisotropy dynamic control ---
    const gDynamic = mat.uniforms.uAnisoBase.value + mat.uniforms.uAnisoAmp.value * Math.sin(GlobalPhase.core * 2.0)
    mat.uniforms.uAnisotropy.value = THREE.MathUtils.clamp(gDynamic, -0.8, 0.9)
    mat.uniforms.uColorShift.value = 0.3 + 0.25 * Math.sin(GlobalPhase.shell * 1.5)
    
    // render to screen (uses tPrevAccum)
    const prevAutoClear = gl.autoClear
    gl.autoClear = false
    gl.render(quadScene, quadCam)
    gl.autoClear = prevAutoClear
  
    // render to accumWrite for next frame
    gl.setRenderTarget(accumWrite)
    gl.clear(true, true, true)
    gl.render(quadScene, quadCam)
    gl.setRenderTarget(null)
  
    // swap buffers
    rtRef.current.accumRead = accumWrite
    rtRef.current.accumWrite = accumRead
  
    // update previous camera state
    prevCamRef.current.proj.copy(camera.projectionMatrix)
    prevCamRef.current.view.copy(camera.matrixWorldInverse)
    prevCamRef.current.camPos.copy(camera.position)
  }, 999)
  

  // nothing in the React tree (this component only does render passes)
  return null
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

function ShellPBR({ radius = 1.0 }) {
  const ref = useRef()
  const { camera } = useThree()

  useFrame(() => {
    if (!ref.current) return
    // update dynamic uniforms from global systems
    ref.current.uniforms.uTime.value = GlobalUniforms.uTime.value
    ref.current.uniforms.uPhaseShell.value = GlobalPhase.shell
    ref.current.uniforms.uHueTint.value = GlobalUniforms.uHueShell.value
    ref.current.uniforms.uBeat.value = GlobalUniforms.uBeat.value
    ref.current.uniforms.uCamPos.value.copy(camera.position)

    // optionally sync light colors from DynamicLighting (if you expose them)
    // ref.current.uniforms.uLightPos.value.copy(someLightPosition)
    // ref.current.uniforms.uLightColor.value.copy(someLightColor)
  })

  return (
    <mesh>
      <sphereGeometry args={[radius, 128, 64]} />
      <shaderMaterial
        ref={ref}
        transparent={false}
        depthWrite={true}
        uniforms={{
          // dynamics / hue
          uTime: { value: 0 },
          uPhaseShell: { value: 0 },
          uHueTint: { value: 0 },
          uBeat: { value: 0 },

          // camera + lighting
          uCamPos: { value: new THREE.Vector3() },
          uLightPos: { value: new THREE.Vector3(2.0, 1.5, 3.0) },
          uLightColor: { value: new THREE.Color(1.0, 0.95, 0.9) },

          // PBR params
          uBaseColor: { value: new THREE.Color(0.85, 0.9, 1.0) },
          uRoughness: { value: 0.28 },
          uMetalness: { value: 0.0 },

          // simple environment approximation (replace with envMap later)
          uEnvColor: { value: new THREE.Vector3(0.03, 0.04, 0.06) },

          // artistic controls
          uIridescenceMix: { value: 0.22 } // small iridescent tint mixing
        }}
        vertexShader={`
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(cameraPosition - vWorldPos);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `}
        fragmentShader={`
          precision highp float;
          varying vec3 vWorldPos;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          uniform float uTime;
          uniform float uPhaseShell;
          uniform float uHueTint;
          uniform float uBeat;

          uniform vec3 uCamPos;
          uniform vec3 uLightPos;
          uniform vec3 uLightColor;

          uniform vec3 uBaseColor;
          uniform float uRoughness;
          uniform float uMetalness;

          uniform vec3 uEnvColor;

          uniform float uIridescenceMix;

          const float PI = 3.14159265359;

          // clamp helpers
          float saturate(float x){ return clamp(x, 0.0, 1.0); }
          vec3 saturateV(vec3 v){ return clamp(v, vec3(0.0), vec3(1.0)); }

          // GGX NDF (Trowbridge-Reitz)
          float D_GGX(float NdotH, float alpha) {
            float a2 = alpha * alpha;
            float denom = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
            return a2 / (PI * denom * denom + 1e-6);
          }

          // Schlick-GGX geometry helper
          float G_SchlickGGX(float NdotV, float k) {
            return NdotV / (NdotV * (1.0 - k) + k + 1e-6);
          }
          float G_Smith(float NdotV, float NdotL, float k) {
            return G_SchlickGGX(NdotV, k) * G_SchlickGGX(NdotL, k);
          }

          // Fresnel Schlick
          vec3 F_Schlick(vec3 F0, float VdotH) {
            return F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
          }

          // small hue->rgb tint (cheap)
          vec3 hueToRGB(float h) {
            float r = clamp(abs(h * 6.0 - 3.0) - 1.0, 0.0, 1.0);
            float g = clamp(2.0 - abs(h * 6.0 - 2.0), 0.0, 1.0);
            float b = clamp(2.0 - abs(h * 6.0 - 4.0), 0.0, 1.0);
            return vec3(r, g, b);
          }

          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(uCamPos - vWorldPos);
            vec3 L = normalize(uLightPos - vWorldPos);
            vec3 H = normalize(V + L);

            float NdotL = saturate(dot(N, L));
            float NdotV = saturate(dot(N, V));
            float NdotH = saturate(dot(N, H));
            float VdotH = saturate(dot(V, H));

            // perceptual roughness mapping
            float rough = clamp(uRoughness, 0.02, 1.0);
            float alpha = rough * rough;

            // base reflectance at normal incidence
            vec3 F0 = mix(vec3(0.04), uBaseColor, uMetalness);

            // NDF, geometry, Fresnel
            float D = D_GGX(NdotH, alpha);
            float k = (rough + 1.0);
            k = (k * k) / 8.0; // remap similar to UE4/Schlick tweak
            float G = G_Smith(NdotV, NdotL, k);
            vec3 F = F_Schlick(F0, VdotH);

            // specular
            vec3 numerator = D * F * G;
            float denom = max(1e-5, 4.0 * NdotV * NdotL);
            vec3 specular = numerator / denom;

            // diffuse (energy conserving lambert)
            vec3 kd = (1.0 - F) * (1.0 - uMetalness);
            vec3 diffuse = (uBaseColor / PI) * kd;

            // direct lighting contribution
            vec3 Lo = (diffuse + specular) * uLightColor * NdotL;

            // simple environment approx:
            // envSpec: tinted by Fresnel and reduced by roughness
            vec3 envSpec = F * uEnvColor * (1.0 - rough);
            vec3 envDiff = uBaseColor * 0.02; // subtle ambient

            // add a subtle iridescent tint controlled by phase/hue
            float iridescence = uIridescenceMix;
            float hue = fract(uHueTint + 0.05 * sin(uPhaseShell * 1.2 + uTime * 0.2));
            vec3 iridescentTint = hueToRGB(hue);
            // mix in gently so it doesn't break energy conservation strongly
            vec3 color = Lo + envSpec + envDiff;
            color = mix(color, color * (0.8 + 0.4 * iridescentTint), iridescence * 0.6);

            // apply simple beat-driven emissive shimmer on shell
            float beatPulse = pow(uBeat, 1.2) * 0.35;
            color += envSpec * beatPulse * 0.6;

            // tone mapping/clamp (to keep display safe)
            color = saturateV(color);
            color = pow(color, vec3(1.0 / 2.2)); // gamma-ish

            gl_FragColor = vec4(color, 1.0);
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
      <ShellPBR radius={1.0} />
      {/* <Shell /> */}
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
      <OrbitingSwarmBehavior texRes={100} baseRadius={8.0} />

      <AuroraSphere />

      <EffectComposer disableNormalPass>
        <Bloom intensity={0.55} luminanceThreshold={0.32} />
        <ChromaticAberration offset={[0.0016, 0.0012]} />
        <Vignette eskil={false} offset={0.12} darkness={0.74} />
      </EffectComposer>
      
      <ScreenSpaceVolumetricPass
        samples={12}
        scattering={1.0}
        extinction={0.25}
        stepSize={1.2}
        lightPos={new THREE.Vector3(2,1.5,3)}
        lightColor={new THREE.Color(1.0,0.9,0.8)}
      />

      
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
        camera={{ position: [0, 0, 20.5], fov: 120 }}
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
