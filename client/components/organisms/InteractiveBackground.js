// components/InteractiveBackground.js
'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Vertex shader tetap sama
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader yang sudah dimodifikasi untuk efek blur gradasi dan grainy
const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
varying vec2 vUv;

// Fungsi noise 2D (Simplex-like bilinear interpolation noise)
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f*f*(3.0-2.0*f);

    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

// Layered turbulence noise (fractal noise)
float turbulence(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Warna utama (jangan diubah!)
vec3 orange = vec3(0.86, 0.33, 0.09);
vec3 darkOrange = vec3(0.7, 0.2, 0.05);
vec3 blueLight = vec3(0.6, 0.7, 0.85);
vec3 blueDark = vec3(0.1, 0.12, 0.2);
vec3 blackColor = vec3(0.0);

// Weighted blur untuk efek smooth blur ringan
vec3 blur(vec2 uv) {
    vec3 col = vec3(0.0);
    float total = 0.0;

    float offset = 0.002; // kecil supaya blur ringan
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            float weight = 1.0 - length(vec2(float(x), float(y))) * 0.5;
            vec2 sampleUV = uv + vec2(float(x), float(y)) * offset;
            float t = uTime * 0.5;
            float n = turbulence(sampleUV * 3.0 + vec2(t, t));
            float n2 = turbulence(sampleUV * 3.0 + vec2(-t * 0.5, t * 0.7));
            float combined = (n + n2) * 0.5;

            vec3 c = mix(blueDark, orange, smoothstep(0.2, 0.8, combined));
            c = mix(c, blueLight, smoothstep(0.5, 1.0, combined));
            col += c * weight;
            total += weight;
        }
    }
    return col / total;
}

void main() {
    vec2 uv = vUv;

    // Buat distorsi dinamis yang halus (flowing)
    float t = uTime * 0.3;
    float distortion = 0.1 * sin(uv.y * 10.0 + t) * cos(uv.x * 10.0 - t * 1.5);
    vec2 distortedUV = uv + vec2(distortion, distortion * 0.5);

    // Layered turbulence noise untuk pola flowing lebih kompleks
    float n = turbulence(distortedUV * 3.0 + vec2(t, t));
    float n2 = turbulence(distortedUV * 3.0 + vec2(-t * 0.5, t * 0.7));
    float combined = (n + n2) * 0.5;

    // Warna dengan blur
    vec3 color = blur(distortedUV);

    // Grain dinamis halus
    float grain = (random(vUv * uResolution.xy + uTime) - 0.5) * 0.025;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
}

`;

const GradientMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1.0, 1.0),
  },
  vertexShader,
  fragmentShader
);

extend({ GradientMaterial });

const BackgroundPlane = () => {
  const ref = useRef();

  useFrame(({ clock, mouse, size }) => {
    if (ref.current) {
      ref.current.uTime = clock.getElapsedTime();
      ref.current.uMouse.set(mouse.x * 0.5 + 0.5, 1 - (mouse.y * 0.5 + 0.5));
      ref.current.uResolution.set(size.width, size.height);
    }
  });

  return (
    <mesh scale={[2, 2, 1]}>
      <planeGeometry args={[2, 2]} />
      <gradientMaterial ref={ref} />
    </mesh>
  );
};

export default function InteractiveBackground() {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ position: [0, 0, 1], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, width: '100%', height: '100%' }}
    >
      <BackgroundPlane />
    </Canvas>
  );
}