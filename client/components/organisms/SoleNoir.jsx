
"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Home() {
  const glowRef = useRef(null);
  const blackCircleRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Glow biru: 2 tahap kecepatan
    tl.fromTo(
      glowRef.current,
      { y: 350, scale: 0.5, opacity: 0.5, filter: "blur(20px)" },
      { y: 80, scale: 0.7, opacity: 0.7, duration: 1, ease: "power1.in" }
    ).to(glowRef.current, {
      y: 10,
      scale: 1.05,
      filter: "blur(70px)",
      opacity: 1,
      duration: 1,
      ease: "power4.out",
    });

    // Lingkaran hitam sinkron dengan glow
    tl.fromTo(
      blackCircleRef.current,
      { y: 350 },
      { y: 80, duration: 1, ease: "power1.in" },
      0
    ).to(
      blackCircleRef.current,
      { y: 10, opacity: 1, duration: 1, ease: "power4.out" },
      1
    );

    // Logo teks — sedikit delay biar muncul dramatis
    tl.fromTo(
      textRef.current,
      { y: 150},
      { y: 80,  duration: 1, ease: "power1.in", delay: 0.1 },
      0.2
    ).to(
      textRef.current,
      { y: 20, duration: 1, ease: "power4.out" },
      1.2
    );
  }, []);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Glow biru */}
      <div
        ref={glowRef}
        className="absolute w-64 h-64 bg-blue-900 rounded-full "
        style={{
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(20px)",
          zIndex: 5,
        }}
      />

      {/* Lingkaran hitam */}
      <div
        ref={blackCircleRef}
        className="absolute w-32 h-32 bg-black rounded-full"
        style={{
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}
      />

      {/* Logo teks */}
      <h1
        ref={textRef}
        className="absolute text-white font-extrabold text-9xl lowercase tracking-tight"
        style={{
          top: "55%", // posisinya di bawah lingkaran
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
        }}
      >
        boson
      </h1>
    </main>
  );
}
