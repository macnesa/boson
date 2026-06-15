import { useRef, useEffect, useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";

/* =========================
   VIDEO OPTIMIZER (INJECTED)
========================= */
const VIDEO_CONFIG = {
  quality: "auto",
  format: "auto",
  codec: "auto",
  width: {
    mobile: 720,
    desktop: 1280,
  },
};

const buildVideoUrl = (url, { isMobile }) => {
  if (!url.includes("cloudinary")) return url;

  const width = isMobile
    ? VIDEO_CONFIG.width.mobile
    : VIDEO_CONFIG.width.desktop;

  const transform = [
    `f_${VIDEO_CONFIG.format}`,
    `q_${VIDEO_CONFIG.quality}`,
    `vc_${VIDEO_CONFIG.codec}`,
    `w_${width}`,
  ].join(",");

  return url.replace("/upload/", `/upload/${transform}/`);
};

function VideoSection() {
  const isMobile =
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 768px)").matches
      : false;

  /* =====================================================
     MOBILE — VIDEO LANDSCAPE ONLY (16:9 FIXED)
  ===================================================== */
  if (isMobile) {
    return (
      <section
        data-theme="dark"
        style={{
          width: "100%",
          backgroundColor: "#000",
          padding: "0",
          margin: "0",
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#000",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <video
            src={buildVideoUrl(
              "https://res.cloudinary.com/djgu1bhef/video/upload/v1775831236/profile_bofjlj.mov",
              { isMobile }
            )}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      </section>
    );
  }

  /* =====================================================
     DESKTOP — FULL CINEMATIC
  ===================================================== */
  const outerRef = useRef(null);
  const sectionRef = useRef(null);
  const holeRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const processRef = useRef(null);

  const sigilDiscoverRef = useRef(null);
  const sigilCreateRef = useRef(null);
  const sigilDeliverRef = useRef(null);

  const rafRef = useRef(null);
  const tRef = useRef(0);

  const holeBaseW = 300;
  const holeBaseH = 450;
  const holeMaxScale = 10;

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const section = sectionRef.current;
    const hole = holeRef.current;
    const video = videoRef.current;
    const text = textRef.current;
    const process = processRef.current;

    if (!outer || !section || !hole || !video || !text || !process) return;

    hole.style.width = `${holeBaseW}px`;
    hole.style.height = `${holeBaseH}px`;

    gsap.set(section, { backgroundColor: "#000" });
    gsap.set(video, { scale: 1.6 });
    gsap.set(text, { opacity: 0 });

    gsap.set(hole, {
      scale: 1,
      boxShadow: "0 0 0 9999px #000",
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: outer,
        start: "top top",
        end: "+=140%",
        scrub: 0.8,
      },
    });

    tl.to(hole, { scale: holeMaxScale, ease: "none" }, 0).to(
      video,
      { scale: 1, ease: "none" },
      0
    );

    tl.to(text, { opacity: 1, ease: "power1.out" }, 0.9).fromTo(
      process.children,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        ease: "power2.out",
      },
      0.92
    );

    const loop = () => {
      tRef.current += 0.01;

      if (sigilDiscoverRef.current) {
        sigilDiscoverRef.current.style.transform = `rotate(${Math.sin(
          tRef.current
        )}deg)`;
      }
      if (sigilCreateRef.current) {
        sigilCreateRef.current.style.transform = `scale(${
          1 + Math.sin(tRef.current * 0.8) * 0.01
        })`;
      }
      if (sigilDeliverRef.current) {
        sigilDeliverRef.current.style.transform = `translateY(${Math.sin(
          tRef.current * 1.1
        )}px)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div
      ref={outerRef}
      data-theme="dark"
      style={{ height: "300vh", position: "relative" }}
    >
      <section
        ref={sectionRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          src={buildVideoUrl(
            "https://res.cloudinary.com/djgu1bhef/video/upload/v1775831236/profile_bofjlj.mov",
            { isMobile }
          )}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
        />

        <div
          ref={holeRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderTopLeftRadius: "100rem",
            borderTopRightRadius: "100rem",
            zIndex: 10,
          }}
        />

        <div
          ref={textRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "10vh",
            paddingLeft: "clamp(20px, 6vw, 120px)",
            paddingRight: "clamp(20px, 6vw, 120px)",
            color: "white",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div style={{ width: "100%", maxWidth: "1080px" }}>
            <div
              ref={processRef}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
                gap: "56px",
              }}
            >
              {/* DISCOVER */}
              <div>
                <svg
                  ref={sigilDiscoverRef}
                  width="36"
                  height="36"
                  viewBox="0 0 100 100"
                  style={{ marginBottom: "14px" }}
                >
                  <circle cx="50" cy="50" r="36" fill="none" stroke="white" strokeWidth="1" />
                  <circle cx="50" cy="50" r="6" fill="none" stroke="white" strokeWidth="1" />
                  <line x1="50" y1="14" x2="50" y2="34" stroke="white" strokeWidth="1" />
                  <line x1="86" y1="50" x2="66" y2="50" stroke="white" strokeWidth="1" />
                  <line x1="50" y1="86" x2="50" y2="66" stroke="white" strokeWidth="1" />
                  <line x1="14" y1="50" x2="34" y2="50" stroke="white" strokeWidth="1" />
                </svg>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", marginBottom: "20px" }} />

                <h3 className="font-[Code_Pro]" style={{ fontSize: "18px", marginBottom: "8px" }}>
                  Discover
                </h3>

                <p style={{ fontSize: "14px", lineHeight: "1.6", opacity: 0.8 }}>
                  Most projects fail because no one really looks at what’s happening day to day. We start by understanding how your content is actually used and where things begin to slip.
                </p>
              </div>

              {/* CREATE */}
              <div>
                <svg
                  ref={sigilCreateRef}
                  width="36"
                  height="36"
                  viewBox="0 0 100 100"
                  style={{ marginBottom: "14px" }}
                >
                  <rect x="20" y="20" width="60" height="60" rx="8" fill="none" stroke="white" strokeWidth="1" />
                  <circle cx="35" cy="35" r="3" fill="white" />
                  <circle cx="65" cy="35" r="3" fill="white" />
                  <circle cx="50" cy="65" r="3" fill="white" />
                  <line x1="35" y1="35" x2="65" y2="35" stroke="white" strokeWidth="0.8" />
                  <line x1="65" y1="35" x2="50" y2="65" stroke="white" strokeWidth="0.8" />
                  <line x1="50" y1="65" x2="35" y2="35" stroke="white" strokeWidth="0.8" />
                </svg>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", marginBottom: "20px" }} />

                <h3 className="font-[Code_Pro]" style={{ fontSize: "18px", marginBottom: "8px" }}>
                  Create
                </h3>

                <p style={{ fontSize: "14px", lineHeight: "1.6", opacity: 0.85 }}>
                  Once things are clear, we focus on structure. We turn ideas into content that’s easier to manage, repeat, and grow without starting from zero every time.
                </p>
              </div>

              {/* DELIVER */}
              <div>
                <svg
                  ref={sigilDeliverRef}
                  width="36"
                  height="36"
                  viewBox="0 0 100 100"
                  style={{ marginBottom: "14px" }}
                >
                  <rect x="26" y="30" width="48" height="36" rx="4" fill="none" stroke="white" strokeWidth="1" />
                  <line x1="20" y1="70" x2="80" y2="70" stroke="white" strokeWidth="1.2" />
                </svg>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", marginBottom: "20px" }} />

                <h3 className="font-[Code_Pro]" style={{ fontSize: "18px", marginBottom: "8px" }}>
                  Deliver
                </h3>

                <p style={{ fontSize: "14px", lineHeight: "1.6", opacity: 0.8 }}>
                  Publishing is only part of the work. We test, adjust, and keep things moving so your content stays consistent as platforms and needs change.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VideoSection;