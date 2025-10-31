"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function EaseDemoPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(".ease-item");

    const eases = [
      "none",
      "power1.in",
      "power1.out",
      "power1.inOut",
      "power2.in",
      "power2.out",
      "power2.inOut",
      "power3.in",
      "power3.out",
      "power3.inOut",
      "power4.in",
      "power4.out",
      "power4.inOut",
      "back.in",
      "back.out",
      "back.inOut",
      "elastic.in",
      "elastic.out",
      "elastic.inOut",
      "bounce.in",
      "bounce.out",
      "bounce.inOut",
      "slow(0.7, 0.7, false)",
      "steps(5)",
      "rough({strength:1, points:20})"
    ];

    items.forEach((item, i) => {
      const easeType = eases[i % eases.length];
      gsap.fromTo(
        item,
        { x: -300 },
        {
          x: 300,
          opacity: 1,
          duration: 2.5,
          ease: easeType,
          delay: i * 0.4,
        }
      );
    });
  }, []);

  const eases = [
    "none",
    "power1.in",
    "power1.out",
    "power1.inOut",
    "power2.in",
    "power2.out",
    "power2.inOut",
    "power3.in",
    "power3.out",
    "power3.inOut",
    "power4.in",
    "power4.out",
    "power4.inOut",
    "back.in",
    "back.out",
    "back.inOut",
    "elastic.in",
    "elastic.out",
    "elastic.inOut",
    "bounce.in",
    "bounce.out",
    "bounce.inOut",
    "slow(0.7, 0.7, false)",
    "steps(5)",
    "rough({strength:1, points:20})"
  ];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-bold mb-10 text-center">GSAP Ease Comparison</h1>
      <div ref={containerRef} className="space-y-3 w-full max-w-xl">
        {eases.map((ease, i) => (
          <div
            key={i}
            className="ease-item text-lg font-mono px-4 py-2 rounded-lg bg-gray-800"
          >
            {ease}
          </div>
        ))}
      </div>
      <p className="mt-10 text-sm text-gray-400 text-center">
        Setiap baris menunjukkan gaya pergerakan berbeda — semua bergerak dari kiri ke kanan.
      </p>
    </main>
  );
}
