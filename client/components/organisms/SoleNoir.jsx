"use client";
import { useRef, useEffect, useLayoutEffect } from "react";
import { gsap } from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Home() {
  const glowRef = useRef(null);
  const blackCircleRef = useRef(null);
  const textRef = useRef(null);
  const imageLoaded = useRef(false);

  const log = (msg) => console.log(`🧠 [Boson Debug] ${msg}`);

  useIsomorphicLayoutEffect(() => {
    log("Effect mounted (client side)");

    const ctx = gsap.context(() => {
      const safeMount = () => {
        log("Safe mount start — setting initial state");

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

        const rect = textRef.current.getBoundingClientRect();
        log("Initial set complete. DOM rect:");
        log(JSON.stringify(rect, null, 2));

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.to(glowRef.current, {
          y: 150,
          scale: 0.7,
          opacity: 0.9,
          filter: "blur(20px)",
          duration: 1,
          ease: "power1.in",
        })
          .to(glowRef.current, {
            y: 10,
            scale: 0.9,
            opacity: 1,
            filter: "blur(70px)",
            duration: 1,
          })
          .to(blackCircleRef.current, { y: 150, duration: 1 }, 0)
          .to(blackCircleRef.current, { y: 10, opacity: 1, duration: 1 }, 1)
          .fromTo(
            textRef.current,
            { y: 250 },
            {
              y: 90,
              duration: 1,
              ease: "power1.in",
              onStart: () => log("Text entering scene"),
            },
            0
          )
          .to(
            textRef.current,
            {
              y: 20,
              duration: 1,
              ease: "power4.out",
              onComplete: () => {
                const rect = textRef.current.getBoundingClientRect();
                log(`Text reached top-phase. Y: ${rect.top.toFixed(2)}px`);
              },
            },
            ">"
          )
          .to(
            blackCircleRef.current,
            {
              scale: 20,
              filter: "blur(120px)",
              duration: 2,
              ease: "power3.inOut",
            },
            "+=0.6"
          )
          .to(glowRef.current, { scale: 20, duration: 2 }, "-=2")
          .to(
            textRef.current,
            {
              top: "4%",
              left: "50%",
              transform: "translate(-50%, 0%)",
              scale: 0.3,
              duration: 2,
              ease: "power3.inOut",
            },
            "-=2"
          )
          .to(glowRef.current, { opacity: 0, duration: 0.4 }, "-=0.4")
          .to(blackCircleRef.current, { opacity: 0, duration: 0.4 }, "<");

        return tl;
      };

      const startAnimation = () => {
        log("Attempting to start animation...");
        if (imageLoaded.current) {
          log("✅ Image already loaded, starting animation now");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => safeMount());
          });
        } else {
          log("⏳ Waiting for image to load...");
        }
      };

      if (document.readyState === "complete") startAnimation();
      else window.addEventListener("load", startAnimation);

      return () => {
        window.removeEventListener("load", startAnimation);
      };
    });

    return () => {
      log("Cleaning up GSAP context");
      ctx.revert();
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
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
        onLoad={() => {
          imageLoaded.current = true;
          const rect = textRef.current.getBoundingClientRect();
          log("🧠 Image fully loaded — rect after load:");
          log(JSON.stringify(rect, null, 2));
        }}
      />
    </main>
  );
}
