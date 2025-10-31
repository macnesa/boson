"use client";
import { useRef, useEffect, useLayoutEffect } from "react";
import { gsap } from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Home() {
  const glowRef = useRef(null);
  const blackCircleRef = useRef(null);
  const textRef = useRef(null);

  const log = (msg) => console.log(`🧠 [Boson Debug] ${msg}`);

  useIsomorphicLayoutEffect(() => {
    log("Effect mounted (client side)");

    const ctx = gsap.context(() => {
      const safeMount = () => {
        // Reset posisi awal setiap kali
        gsap.set(glowRef.current, {
          y: 350,
          scale: 0.5,
          opacity: 0.5,
          filter: "blur(20px)",
        });
        gsap.set(blackCircleRef.current, {
          y: 350,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
        });
        gsap.set(textRef.current, {
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          scale: 1,
          zIndex: 20,
          position: "absolute",
        });
  
        const tl = gsap.timeline();
  
        // === PHASE 1 ===
        tl.to(glowRef.current, {
          y: 150,
          scale: 0.7,
          opacity: 0.9,
          filter: "blur(20px)",
          duration: 1,
          ease: "power1.in",
        }).to(glowRef.current, {
          y: 10,
          scale: 0.9,
          opacity: 1,
          filter: "blur(70px)",
          duration: 1,
          ease: "power4.out",
        });
  
        // === PHASE 2 ===
        tl.to(
          blackCircleRef.current,
          { y: 150, duration: 1, ease: "power1.in" },
          0
        ).to(
          blackCircleRef.current,
          { y: 10, opacity: 1, duration: 1, ease: "power4.out" },
          1
        );
  
        // === PHASE 3 ===
        tl.fromTo(
          textRef.current,
          { y: 250 },
          { y: 90, duration: 1, ease: "power1.in" },
          0
        ).to(
          textRef.current,
          { y: 20, duration: 1, ease: "power4.out" },
          ">"
        );
  
        // === PHASE 4 ===
        tl.to(
          blackCircleRef.current,
          {
            scale: 20,
            filter: "blur(120px)",
            duration: 2,
            ease: "power3.inOut",
          },
          "+=0.6"
        );
  
        tl.to(
          glowRef.current,
          {
            scale: 20,
            duration: 2,
            ease: "power3.inOut",
          },
          "-=2"
        );
  
        // === PHASE 4.5 ===
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
  
        // === PHASE 5 ===
        tl.to(
          glowRef.current,
          {
            filter: "blur(200px)",
            opacity: 0,
            duration: 0,
            ease: "power4.out",
          },
          "-=0.4"
        );
  
        tl.to(
          blackCircleRef.current,
          {
            opacity: 0,
            duration: 0,
            ease: "power4.out",
          },
          "<"
        );
  
        return tl;
      };

      const tryStartAnimation = () => {
        const img = textRef.current;
        if (img && img.complete && img.naturalHeight > 0) {
          log("✅ Image already cached — starting animation instantly");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => safeMount());
          });
        } else {
          log("⏳ Waiting for image load event...");
          img.addEventListener("load", () => {
            log("✅ Image just finished loading — starting animation");
            requestAnimationFrame(() => {
              requestAnimationFrame(() => safeMount());
            });
          });
        }
      };

      if (document.readyState === "complete") tryStartAnimation();
      else window.addEventListener("load", tryStartAnimation);

      return () => {
        window.removeEventListener("load", tryStartAnimation);
      };
    });

    return () => {
      log("Cleaning up GSAP context");
      ctx.revert();
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      {/* Glow merah */}
      <div
        ref={glowRef}
        className="absolute w-64 h-64 bg-[#BC4A29] rounded-full"
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
          zIndex: 10,
        }}
      />

      {/* Logo */}
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
