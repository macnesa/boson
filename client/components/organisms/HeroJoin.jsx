import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import * as THREE from "three";
import GradientBg from '../../components/organisms/GradientBg'

/* ==========================================
   WEBGL BACKGROUND
========================================== */
function Webglbg() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isMobile =
      typeof window !== "undefined" && window.innerWidth <= 768;

    const webgl = new GradientBg({
      rendererEl: containerRef.current,
      background: {
        color1: [0.796, 0.294, 0.243],
        color2: [0.914, 0.412, 0.349],
        color3: [0, 0, 0],
        colorAccent: new THREE.Color(0, 0, 0),

        uLinesBlur: isMobile ? 0.13 : 0.33,
        uNoise: isMobile ? 0.03 : 0.03,
        uOffsetX: isMobile ? -3.96 : 0.05,
        uOffsetY: isMobile ? -3.77 : -2.46,
        uLinesAmount: isMobile ? 1.89 : 1.36,
      },
    });

    return () => webgl.destroy();
  }, []);

  return (
    <motion.div
      ref={containerRef}
      id="webgl"
      className="absolute inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1.2, ease: "easeOut" }}
    />
  );
}

/* ==========================================
   HERO
========================================== */
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 80]);

  const BOSON_DELAY = 3.1;
  const TEXT_DELAY = BOSON_DELAY + 1.5;

  // BASE COORDINATES
  const BASE_LAT = { deg: 6, min: 10, sec: 0, dir: "S" };
  const BASE_LON = { deg: 106, min: 49, sec: 0, dir: "E" };

  const [latText, setLatText] = useState(`06°10'00"S`);
  const [lonText, setLonText] = useState(`106°49'00"E`);

  useEffect(() => {
    function updateCoordinatesFromPointer(e) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const nx = e.clientX / w; // 0–1
      const ny = e.clientY / h; // 0–1

      // offset seconds (beda sumbu)
      let lonSec = (nx - 0.5) * 60;
      let latSec = (ny - 0.5) * 60;

      // clamp
      lonSec = Math.min(Math.max(lonSec, -59), 59);
      latSec = Math.min(Math.max(latSec, -59), 59);

      const lonS = Math.abs(Math.round(lonSec)).toString().padStart(2, "0");
      const latS = Math.abs(Math.round(latSec)).toString().padStart(2, "0");

      setLonText(`${BASE_LON.deg}°${BASE_LON.min}'${lonS}"${BASE_LON.dir}`);
      setLatText(`${BASE_LAT.deg}°${BASE_LAT.min}'${latS}"${BASE_LAT.dir}`);
    }

    window.addEventListener("mousemove", updateCoordinatesFromPointer);
    return () =>
      window.removeEventListener("mousemove", updateCoordinatesFromPointer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden flex justify-center items-center text-gray/80">
      <Webglbg />

      <motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 0.75, y: 0 }}
  transition={{ delay: TEXT_DELAY, duration: 0.6, ease: "easeOut" }}
  className="absolute top-0 left-0 w-full z-20 font-[Code_Pro]"
>
  <div className="relative mx-auto px-6 sm:px-20 min-h-[64px] md:min-h-[72px] flex items-center justify-between text-xs font-medium tracking-wide text-white translate-y-1">
    
    <div className="flex gap-4 sm:gap-8">
      <Link href="/about" className="transition-opacity hover:opacity-100">
        About
      </Link>
    </div>

    <div className="flex gap-4 sm:gap-8">
      <Link href="/contact" className="transition-opacity hover:opacity-100">
        Contact
      </Link>
    </div>

  </div>
</motion.div>

      {/* SIDE LEFT */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: TEXT_DELAY, duration: 0.6, ease: "easeOut" }}
        className="absolute  bottom-[28%] sm:bottom-[22%] left-1/2 sm:left-20 
        -translate-x-1/2 sm:translate-x-0 text-[11px] sm:text-sm leading-relaxed 
        max-w-[240px] text-center sm:text-left z-20 text-white"
      >
        A system-driven studio
        <br />
        for modern identity & engineering
      </motion.div>

      {/* SIDE RIGHT */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: TEXT_DELAY, duration: 0.6, ease: "easeOut" }}
        className="absolute bottom-[20%] sm:bottom-[22%] right-1/2 sm:right-20 
        translate-x-1/2 sm:translate-x-0 text-[11px] sm:text-sm leading-relaxed 
        max-w-[240px] text-center sm:text-right z-20 text-white"
      >
        Focused on how to shape
        <br />
        the future, driving it forward
      </motion.div>

      {/* FOOTER — COORDINATES */}
      <motion.div
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 0.55, y: 0 }}
transition={{ delay: TEXT_DELAY, duration: 0.6, ease: "easeOut" }}
className="
  absolute bottom-6 sm:bottom-10 w-full px-6 sm:px-20
  grid grid-cols-[1fr_auto_1fr]
  items-center
  text-[10px] sm:text-xs tracking-wide
  z-20 text-white
"
>
{/* LEFT — LAT */}
<span className="justify-self-start font-light">
  {latText}
</span>

{/* CENTER — LOCATION (LOCKED) */}
<span className="justify-self-center font-[Code_Pro] font-medium ">
  Bali, Indonesia
</span>

{/* RIGHT — LON */}
<span className="justify-self-end font-light">
  {lonText}
</span>
</motion.div>


      {/* BOSON */}
      <motion.div
        initial={{ opacity: 0, scale: 1.9, filter: "blur(100px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ delay: BOSON_DELAY, duration: 2.3, ease: "easeOut" }}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        <div className="boson-chrome-v4" />
      </motion.div>

      <style jsx>{`
        .boson-chrome-v4 {
          position: absolute;
          inset: 0;
          margin: auto;
          width: min(90vw, 1250px);
          height: min(90vw, 1250px);
          mask-image: url("/boson-white.png");
          -webkit-mask-image: url("/boson-white.png");
          mask-size: contain;
          mask-position: center;
          mask-repeat: no-repeat;
          background: #000;
          filter: blur(0.6px);
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}

/* ==========================================
   INTRO OVERLAY
========================================== */
function IntroOverlay() {
  const IMAGES = [
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775817515/novo-ampang-2_dchmx2.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775810172/dwm-5_rgbom8.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775810184/dwm-4_osbswl.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775816870/little-soho-2_nvjlfy.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775823765/tender-touch-2_rgossm.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775816237/marroosh-12_s2six6.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775809562/hidden-city-ubud-2_fsutwf.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775824331/yolo-2_rauoff.webp",
    "https://res.cloudinary.com/djgu1bhef/image/upload/v1775809562/hidden-city-ubud-3_sbgr8s.webp",
  ];

  const OPTIMIZED_IMAGES = useMemo(() => {
    return IMAGES.map((src) => {
      if (!src.includes("/image/upload/")) return src;
      if (/\/upload\/.*(w_|f_|q_)/.test(src)) return src;
      return src.replace(
        "/image/upload/",
        "/image/upload/w_800,c_limit,f_auto,q_auto/"
      );
    });
  }, []);

  const [phase, setPhase] = useState("slides");
  const [visible, setVisible] = useState(
    Array(OPTIMIZED_IMAGES.length).fill("start")
  );

  const topIndex = useMemo(() => {
    for (let i = visible.length - 1; i >= 0; i--) {
      if (visible[i] === "open" || visible[i] === "soft") return i;
    }
    return 0;
  }, [visible]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const frameSize = isMobile
    ? { width: 240, height: 360 }
    : { width: 320, height: 480 };

  const scaleExpand = isMobile
    ? { scaleX: 4, scaleY: 4 }
    : { scaleX: 14, scaleY: 4.5 };

  const getDuration = (i) => (i === 0 ? 650 : 250);

  useEffect(() => {
    let timeCursor = 0;
    const timeoutIds = [];
    const schedule = (callback, delay) => {
      const timeoutId = window.setTimeout(callback, delay);
      timeoutIds.push(timeoutId);
    };

    OPTIMIZED_IMAGES.forEach((_, i) => {
      const duration = getDuration(i);
      const openTime = timeCursor;
      const softTime = i === 0 ? openTime + duration * 0.35 : openTime;
      const closeTime = softTime + duration;

      if (i === 0) {
        schedule(() => {
          setVisible((prev) => {
            const arr = [...prev];
            arr[i] = "soft";
            return arr;
          });
        }, openTime);
      }

      schedule(() => {
        setVisible((prev) => {
          const arr = [...prev];
          arr[i] = "open";
          return arr;
        });
      }, softTime);

      schedule(() => {
        setVisible((prev) => {
          const arr = [...prev];
          arr[i] = "close";
          return arr;
        });
      }, closeTime);

      timeCursor += duration;
    });

    const total = timeCursor;
    schedule(() => setPhase("hole"), total + 20);
    schedule(() => setPhase("expand"), total + 700);
    schedule(() => setPhase("done"), total + 2300);

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  /* ==================================================
     SCROLL ABSOLUTE LOCK — NO MISS
  ================================================== */
  useEffect(() => {
    if (phase === "done") return;

    const prevent = (e) => e.preventDefault();
    const preventKeys = (e) => {
      const keys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ];
      if (keys.includes(e.key)) e.preventDefault();
    };

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlStyles = {
      overflow: html.style.overflow,
      height: html.style.height,
      overscrollBehavior: html.style.overscrollBehavior,
    };
    const previousBodyStyles = {
      overflow: body.style.overflow,
      height: body.style.height,
      overscrollBehavior: body.style.overscrollBehavior,
    };

    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.overscrollBehavior = "none";

    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.overscrollBehavior = "none";

    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    window.addEventListener("keydown", preventKeys);

    return () => {
      html.style.overflow = previousHtmlStyles.overflow;
      html.style.height = previousHtmlStyles.height;
      html.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior;

      body.style.overflow = previousBodyStyles.overflow;
      body.style.height = previousBodyStyles.height;
      body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior;

      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] pointer-events-none"
      animate={phase === "expand" ? scaleExpand : { scaleX: 1, scaleY: 1 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
      style={{
        height: "100dvh",
        display: "grid",
        placeItems: "center",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="relative"
        style={{
          width: frameSize.width,
          height: frameSize.height,
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {OPTIMIZED_IMAGES.map((src, i) => (
            <img
              key={i}
              src={src}
              draggable="false"
              className="absolute w-full h-full object-cover"
              style={{
                zIndex: i === topIndex ? 1000 : i,
                transitionProperty: "clip-path",
                transitionDuration: i === 0 ? "650ms" : "250ms",
                transitionTimingFunction:
                  i === 0
                    ? "cubic-bezier(0.3, 0, 0.2, 1)"
                    : "ease-in-out",
                clipPath:
                  visible[i] === "soft"
                    ? "inset(92% 0% 0% 0%)"
                    : visible[i] === "open"
                    ? "inset(0% 0% 0% 0%)"
                    : visible[i] === "close"
                    ? "inset(0% 0% 100% 0%)"
                    : "inset(100% 0% 0% 0%)",
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 spotlight pointer-events-none" />
      </div>

      <style jsx>{`
        .spotlight {
          box-shadow: 0 0 0 9999px white;
        }
      `}</style>
    </motion.div>
  );
}


/* ==========================================
   HERO JOIN (EXPORT UTAMA)
========================================== */
export default function HeroJoin() {
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 800], [0, -80]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          zIndex: 1,
          background: "white",
        }}
      >
        {/* HERO FULLSCREEN DI BELAKANG */}
        <Hero />

        {/* BOSON — DEAD CENTER → REVEAL SCALE */}
        <motion.div
          style={{ y: titleY }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="
            absolute
            left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            z-[65]
            flex items-center justify-center
            select-none pointer-events-none
          "
        >
         <motion.img
          src="/png/boson-white.png"
          alt="Boson Collective"
          draggable="false"
          className="object-contain"
          style={{ width: 250 }}
        />

        </motion.div>

        {/* INTRO OVERLAY */}
        <IntroOverlay />
      </div>

      <style jsx global>{`
        body {
          background: white;
        }
      `}</style>
    </div>
  );
}
