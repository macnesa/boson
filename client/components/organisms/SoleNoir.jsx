"use client";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Home() {
  const glowRef = useRef(null);
  const blackCircleRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const tl = gsap.timeline();

    // === PHASE 1: Glow biru (2 tahap kecepatan) ===
    tl.fromTo(
      glowRef.current,
      { y: 250, scale: 0.5, opacity: 0.5, filter: "blur(20px)" },
      { y: 150, scale: 0.7, opacity: 0.9, duration: 1, ease: "power1.in" }
    ).to(glowRef.current, {
      y: 10,
      scale: 0.9,
      filter: "blur(70px)",
      opacity: 1,
      duration: 2,
      ease: "power4.out",
    });

    // === PHASE 2: Lingkaran hitam sinkron dengan glow ===
    tl.fromTo(
      blackCircleRef.current,
      { y: 250 },
      { y: 150, duration: 1, ease: "power1.in" },
      0
    ).to(
      blackCircleRef.current,
      { y: 10, opacity: 1, duration: 2, ease: "power4.out" },
      1
    );

    // === PHASE 3: Logo teks — muncul dramatis ===
    tl.fromTo(
      textRef.current,
      { y: 150, scale: 1 },
      { y: 20, duration: 1, ease: "power1.in", delay: 0.1 },
      0.2
    ).to(
      textRef.current,
      { y: 20, duration: 1, ease: "power4.out" },
      1.2
    );

    // === PHASE 4: Lingkaran & glow membesar bersamaan ===
    tl.to(
      blackCircleRef.current,
      {
        scale: 8,
        filter: "blur(120px)",
        duration: 2,
        ease: "power3.inOut",
      },
      "+=0.6"
    );

    tl.to(
      glowRef.current,
      {
        scale: 8,
        duration: 2,
        ease: "power3.inOut",
      },
      "-=2"
    );

    // === PHASE 4.5: Logo naik ke top center & mengecil ===
    tl.to(
      textRef.current,
      {
        top: "4%", // margin kecil dari atas
        left: "50%",
        // xPercent: -50, // pastikan tetap center horizontal
        // yPercent: 0,   // reset vertical translate
        scale: 0.3,    // sedikit mengecil
        duration: 2,
        ease: "power3.inOut",
      },
      "-=2" // bersamaan dengan glow & circle membesar
    );

    // === PHASE 5: Fade out lingkaran & glow ===
    tl.to(
      glowRef.current,
      {
        filter: "blur(200px)",
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      },
      "-=0.4"
    );

    tl.to(
      blackCircleRef.current,
      {
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      },
      "<"
    );

    return () => tl.kill();
  }, []);

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      {/* Glow biru */}
      <div
        ref={glowRef}
        className="absolute w-64 h-64 bg-[#0d4de0] rounded-full"
        style={{
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(10px)",
          zIndex: 5,
        }}
      />

      {/* Lingkaran hitam */}
      <div
        ref={blackCircleRef}
        className="absolute w-32 h-32 bg-black rounded-full"
        style={{
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(0px)",
          zIndex: 10,
        }}
      />

      {/* Logo gambar */}
      <img
        ref={textRef}
        src="/png/boson-white.png"
        alt="Boson Logo"
        className="absolute w-[400px]"
        style={{
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
        }}
      />
    </main>
  );
}
