'use client'
import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// -------------------- SHADERS --------------------
// Vertex shader (minimal — Three injects `position`)
const quadVert = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`

// Fragment shader for liquid column: height-field (fbm) -> normal -> refraction + specular
const liquidFrag = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_strength; // displacement strength
uniform float u_refraction; // refraction amount
uniform float u_brightness;

//
// simple hash / noise
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0,0.0));
  float c = hash(i + vec2(0.0,1.0));
  float d = hash(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v = 0.0;
  float amp = 0.6;
  for(int i=0;i<5;i++){
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

// background sky seen through liquid (we simulate a distant scene)
vec3 backgroundScene(vec2 uv){
  // vertical gradient + subtle grid shimmer to suggest UI behind
  vec3 top = vec3(0.03,0.06,0.14);
  vec3 mid = vec3(0.06,0.09,0.18);
  vec3 bot = vec3(0.02,0.02,0.04);
  float t = smoothstep(0.0,1.0, uv.y);
  vec3 col = mix(bot, mix(mid, top, smoothstep(0.4,1.0,uv.y)), t);
  // soft subtle vignette dots
  float dots = pow(abs(sin(uv.x * 120.0 + uv.y * 80.0 + u_time*0.1)) * 0.08, 1.5);
  col += vec3(0.02,0.025,0.03) * dots;
  // faint distant glow center
  col += vec3(0.06,0.08,0.14) * exp(-6.0 * length(uv - vec2(0.0, 0.15)));
  return col;
}

void main(){
  // uv in [-1,1] with aspect correction
  vec2 uv0 = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv0.x *= u_resolution.x / u_resolution.y;
  // compress vertical axis to shape like a tall column
  vec2 uv = uv0;
  // shift center a bit to the right like reference artwork
  uv.x -= 0.05;

  // scale coordinates for noise
  vec2 p = vec2(uv.x * 1.2, (uv.y - 0.1) * 2.2);

  // animated height-field (flow upward)
  float t = u_time * 0.9;
  float h = fbm(p * 1.6 + vec2(0.0, t * 0.8)) * 0.8 + fbm(p * 3.4 + vec2(-t*0.6, -t*0.4)) * 0.25;
  // sharpen flow (core brighter)
  float core = smoothstep(0.05, 0.75, 1.0 - abs(uv.x)*1.8);
  h *= core;

  // compute normals via screen-space derivative on height field
  float eps = 0.002;
  float hx = fbm((p + vec2(eps,0.0)) * 1.6 + vec2(0.0, -t*0.8)) - h;
  float hy = fbm((p + vec2(0.0,eps)) * 1.6 + vec2(0.0, -t*0.8)) - h;
  vec3 N = normalize(vec3(-hx, -hy, 0.08));

  // refraction of background by normal
  vec2 refractUV = uv * 0.5 + 0.5; // to [0,1]
  // apply refraction offset proportional to normal.x/y
  refractUV += N.xy * u_refraction * (0.5 - abs(uv.x)) * 0.12;

  // sample fake background
  vec3 bg = backgroundScene(refractUV);

  // add subsurface scatter glow along core (bright inner)
  float glow = pow(smoothstep(0.0, 0.9, core * (1.0 - abs(uv.x) * 1.1)), 1.6);
  vec3 baseColor = mix(vec3(0.95,0.98,1.0), vec3(0.2,0.45,0.86), 0.6); // white->blue tint
  vec3 liquid = baseColor * (0.6 + 1.8 * h) * glow;

  // specular highlight (wet glossy)
  vec3 L = normalize(vec3(0.3, 0.6, 0.8));
  float spec = pow(max(dot(N, L), 0.0), 28.0) * 1.6;
  vec3 specCol = vec3(1.0, 0.98, 0.95) * spec;

  // rim light along edges (purple-blue)
  vec3 rim = vec3(0.45,0.35,0.9) * pow(smoothstep(0.85, 0.2, abs(uv.x)), 1.8) * (0.5 + 0.5 * sin(t*1.2));

  // combine: background seen through + liquid color + specular + rim
  vec3 color = mix(bg, liquid + specCol + rim, clamp((h*1.2 + 0.25) * u_strength, 0.0, 1.0));

  // vertical soft falloff - fade outer horizontally
  float mask = smoothstep(0.9, 0.0, abs(uv.x) * 1.6);
  color *= mask;

  // final exposure and brightness control
  color = color * u_brightness;
  // small gamma correction
  color = pow(color, vec3(0.95));

  gl_FragColor = vec4(color, 1.0);
}
`

// Fragment + vertex for bubbles (points)
const bubbleVert = `
attribute float aSpeed;
attribute float aSize;
uniform float uTime;
uniform vec2 uResolution;
varying float vY;
varying float vSize;
void main(){
  vec3 pos = position;
  // make bubbles loop: they rise and wrap
  float rise = mod(-uTime * aSpeed + (pos.y + 10.0), 8.0) - 4.0;
  pos.y = rise;
  float d = length(pos.xz);
  // slight radial push to create two-flow interference
  pos.xz += normalize(vec2(pos.x, pos.z)) * (0.02 * (1.0 - smoothstep(0.0, 3.0, d)));
  vY = pos.y;
  vSize = aSize;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (vSize) * (200.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`
const bubbleFrag = `
precision mediump float;
varying float vY;
varying float vSize;
void main(){
  // round soft bubble
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float alpha = smoothstep(0.5, 0.0, r);
  // inner sheen
  float sheen = smoothstep(0.4, 0.0, r) * 0.6;
  vec3 col = vec3(0.85, 0.95, 1.0) * (0.6 + 0.4 * smoothstep(-1.0, 1.8, vY));
  // rim highlight
  vec3 rim = vec3(1.0, 0.98, 0.95) * sheen;
  float finalAlpha = alpha * (0.25 + 0.75 * (0.5 + 0.5 * cos(vY * 1.2)));
  if(finalAlpha < 0.01) discard;
  gl_FragColor = vec4(col + rim * 0.6, finalAlpha);
}
`

// -------------------- React Components --------------------
function FullscreenLiquid({ strength = 1.0, refraction = 0.9, brightness = 1.0 }) {
  const matRef = useRef()
  const { size, clock } = useThree()

  const uniforms = useMemo(() => ({
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_time: { value: 0 },
    u_strength: { value: strength },
    u_refraction: { value: refraction },
    u_brightness: { value: brightness },
  }), [strength, refraction, brightness])

  useFrame(() => {
    uniforms.u_time.value = clock.getElapsedTime()
    uniforms.u_resolution.value.set(size.width, size.height)
    if (matRef.current) {
      // sync uniforms to material (three inject)
      matRef.current.uniforms.u_time.value = uniforms.u_time.value
      matRef.current.uniforms.u_resolution.value.copy(uniforms.u_resolution.value)
      matRef.current.uniforms.u_strength.value = uniforms.u_strength.value
      matRef.current.uniforms.u_refraction.value = uniforms.u_refraction.value
      matRef.current.uniforms.u_brightness.value = uniforms.u_brightness.value
    }
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={quadVert}
        fragmentShader={liquidFrag}
        uniforms={uniforms}
        transparent={false}
        depthWrite={false}
      />
    </mesh>
  )
}

function Bubbles({ count = 800 }) {
  const geoRef = useRef()
  const matRef = useRef()
  const { clock } = useThree()

  // init attributes
  const { positions, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = THREE.MathUtils.lerp(0.02, 2.2, Math.pow(Math.random(), 1.5))
      positions[i * 3 + 0] = Math.cos(a) * r + (Math.random() - 0.5) * 0.05
      positions[i * 3 + 1] = THREE.MathUtils.lerp(-2.4, 2.6, Math.random())
      positions[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 0.05
      speeds[i] = 0.2 + Math.random() * 0.9
      sizes[i] = 3.0 + Math.random() * 9.0
    }
    return { positions, speeds, sizes }
  }, [count])

  useMemo(() => {
    if (!geoRef.current) return
    geoRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geoRef.current.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geoRef.current.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  }, [positions, speeds, sizes])

  useFrame(() => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <points>
      <bufferGeometry ref={geoRef} />
      <shaderMaterial
        ref={matRef}
        vertexShader={bubbleVert}
        fragmentShader={bubbleFrag}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(512, 512) }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// -------------------- Page Component --------------------
export default function Page() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000012' }}>
      <Canvas camera={{ position: [0, 0, 3.8], fov: 55 }}>
        {/* Background stars / subtle fog can be added via Drei Stars if wanted */}
        <FullscreenLiquid strength={1.05} refraction={0.85} brightness={1.05} />
        <Bubbles count={700} />
        <EffectComposer multisampling={4}>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.8} intensity={1.6} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
