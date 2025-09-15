"use client"
import Image from "next/image";
import { useState, useRef } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
  FaMap
} from "react-icons/fa";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";


export default function Home() {
  
  const [hoverIdx, setHoverIdx] = useState<number | null>(null); // desktop hover
  const [activeIdx, setActiveIdx] = useState<number | null>(null); // mobile tap

  
  const markers = [
    { top: "23%", left: "10%", title: "Pepito Market", desc: "3 minutes to Zamaya Villas" },
    { top: "25%", left: "20%", title: "Nirvana Life Fitness", desc: "5 minutes to Zamaya Villas" },
    { top: "26%", left: "30%", title: "Montessori School", desc: "10 minutes to Zamaya Villas" },
    {
      top: "27%",
      left: "42%",
      title: "Siloam Hospital",
      desc: "30 minutes to Scorpia Villas\n30 minutes to Zamaya Villas",
    },
    {
      top: "24%",
      left: "54%",
      title: "Ngurah Rai Airport",
      desc: "25 minutes to Scorpia Villas\n40 minutes to Zamaya Villas",
    },
    { top: "25%", left: "66%", title: "Pepito Market", desc: "10 minutes to Scorpia Villas" },
    { top: "28%", left: "74%", title: "Bingin Beach", desc: "5 minutes to Scorpia Villas" },
    { top: "22%", left: "83%", title: "The Istana Wellness", desc: "10 minutes to Scorpia Villas" },
    { top: "24%", left: "90%", title: "Uluwatu Temple", desc: "15 minutes to Scorpia Villas" },
    { top: "60%", left: "25%", title: "Batu Bolong Beach", desc: "10 minutes to Zamaya Villas" },
  ];
   
  
  

  // fungsi bantu translate posisi label (center di desktop)
  const getTranslateX = (leftPercent: string) => {
    const left = parseFloat(leftPercent);
    if (left < 10) return "0";
    if (left > 90) return "-100%";
    return "-50%";
  };
  
   // Framer variants
   const tooltipVar = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };
  const bottomVar = {
    hidden: { y: 80, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

    
  return (
    <div className="relative">
      {/* FIXED HEADER */}
      
      <header style={{backgroundImage: 'url(https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/08/Elysium-.jpg)'}} className="fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-12 py-4 text-white text-xs md:text-sm tracking-widest z-50">
        <div className="uppercase">Project Zamaya</div>
        <div className="text-lg font-light">☰</div>
        <div className="uppercase">Project Scorpia</div>
      </header>

      {/* HERO SECTION */}
      <section style={{backgroundImage: 'url(https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/08/Elysium-.jpg)'}} className="relative min-h-screen overflow-hidden z-10">
        {/* Background image */}
        <img
          src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/08/Elysium-.jpg"
          alt="Elysium Hero"
          className="
      absolute inset-0 
      w-[200vh] h-[100vw] 
      md:w-full md:h-full 
      object-cover 
      rotate-90 md:rotate-0 
      origin-center md:origin-center
      top-1/2 left-1/2 
      -translate-x-1/2 -translate-y-1/2 
      md:top-0 md:left-0 md:translate-x-0 md:translate-y-0
    "
        />

        {/* Optional content */}
        <div className="relative z-10">
          {/* Put content here */}
        </div>
      </section>

      
       {/* VIDEO SECTION */}
      <section className="relative  z-10 min-h-screen w-full overflow-hidden ">
        <video
          className="absolute bg-white top-0 left-0 w-full h-full object-cover"
          src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/09/Lifestyle-with-Elysium.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 "></div>
      </section>


      {/* FOUNDER */}
      <div className="relative  z-10 bg-white text-gray-900">
      {/* HERO */}
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        {/* Tagline */}
        <h2 className="text-base md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-6">
          Family Developer With Australian Roots And Balinese Soul
        </h2>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight mb-12 max-w-4xl">
          Built By an Australian Family, <br />
          <span className="text-yellow-600 font-semibold">With Your Family In Mind</span>
        </h1>
      </div>

      {/* FOUNDERS */}
      <div className="relative py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-3 text-center">
            {/* Darrel */}
            <div className="flex flex-col items-center">
              <img
                src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/09/Darrel-Fayle.png"
                alt="Darrel Fayle"
                className="w-40 h-40 object-cover rounded-full shadow-lg mb-6"
              />
              <h3 className="text-2xl font-semibold">Darrel Fayle</h3>
              <p className="text-gray-500 mt-2">Executive Board Director</p>
            </div>

            {/* Brock */}
            <div className="flex flex-col items-center">
              <img
                src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/09/Brock-Fayle.png"
                alt="Brock Fayle"
                className="w-40 h-40 object-cover rounded-full shadow-lg mb-6"
              />
              <h3 className="text-2xl font-semibold">Brock Fayle</h3>
              <p className="text-gray-500 mt-2">Founder & Director</p>
            </div>

            {/* Brenton */}
            <div className="flex flex-col items-center">
              <img
                src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/09/Brenton-Fayle-.png"
                alt="Brenton Fayle"
                className="w-40 h-40 object-cover rounded-full shadow-lg mb-6"
              />
              <h3 className="text-2xl font-semibold">Brenton Fayle</h3>
              <p className="text-gray-500 mt-2">CEO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
      


      {/* ESTHETIC CONTENT SECTION */}
      <section className="bg-white text-gray-900 py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light mb-12 text-center tracking-wide">
            So, What’s Next?
          </h2>

          <div className="space-y-8 text-lg leading-relaxed font-light text-justify">
            <p>
              Right now, we’re building family-focused villa communities across
              the island. Built by Australian family for Australian Families.
            </p>

            <p>
              But our biggest project is still ahead — Bali’s first
              professionally built, independent living community for people who
              already achieved, who already built a legacy but who are ready to
              write a new chapter of their living – an independent living,
              living in paradise where summer never ends.
            </p>

            <p>
              A place designed to highest international standards — crafted by
              Australians for Australians who expect the very best.
            </p>

            <p className="italic text-gray-700 text-center text-xl">
              Somewhere that feels less like retirement… <br />
              and more like <span className="font-medium">finally living</span>.
            </p>
          </div>
        </div>
      </section>
      
      
      
      
        {/* Logo Zamaya */}
    {/* <div className="absolute top-[5%] left-[2%] flex flex-col items-center text-white select-none z-20">
      <img
        src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/08/Zamaya-2-1.png"
        alt="Zamaya Logo"
        className="w-16 h-auto mb-1 object-contain"
      />
      <span className="text-xs tracking-widest">ZAMAYA</span>
    </div> */}

    {/* Logo Scorpia */}
    {/* <div className="absolute top-[5%] right-[2%] flex flex-col items-center text-white select-none z-20">
      <img
        src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/08/elysium-final-logo-2.png"
        alt="Scorpia Logo"
        className="w-16 h-auto mb-1 object-contain"
      />
      <span className="text-xs tracking-widest">SCORPIA</span>
    </div> */}
      
     
     {/* MAP SECTION */}
     <section className="relative lg:h-[100vh] h-[120vh]">
        {/* map yang diam */}
        <div className="fixed inset-0">
          <div className="w-full h-full relative overflow-hidden shadow-2xl">
            {/* Background Image */}
            <img
              src="https://greenyellow-manatee-625566.hostingersite.com/wp-content/uploads/2025/08/ELysium-Bali-Maps-scaled.jpg"
              alt="Bali Map"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Desktop markers */}
            {markers.map((m, idx) => (
              <div
                key={idx}
                className="absolute hidden lg:block z-20"
                style={{
                  top: m.top,
                  left: m.left,
                  transform: `translateX(${getTranslateX(m.left)})`,
                }}
              >
                <div
                  className="flex flex-col items-center"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx((cur) => (cur === idx ? null : cur))}
                >
                  <motion.button
                    onClick={() => setActiveIdx(idx)}
                    aria-label={m.title}
                    className="relative w-6 h-6 flex items-center justify-center rounded-full"
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      className="absolute w-14 h-14 rounded-full bg-amber-400/20"
                      animate={
                        hoverIdx === idx
                          ? { scale: [1, 1.12, 1], opacity: [0.5, 0.25, 0.5] }
                          : { scale: 1, opacity: 0.35 }
                      }
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ pointerEvents: "none" }}
                    />
                    <motion.span
                      className="bg-white rounded-full shadow"
                      animate={hoverIdx === idx ? { scale: 1.12 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    />
                    <FaMap className="w-3.5 h-3.5" />
                  </motion.button>

                  {/* connector line */}
                  <div className="w-[2px] h-28 bg-white mt-2 rounded" />

                  {/* tooltip */}
                  <div className="mt-2 flex justify-center pointer-events-none">
                    <AnimatePresence>
                      {hoverIdx === idx && (
                        <motion.div
                          key={`tip-${idx}`}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={tooltipVar}
                          transition={{ duration: 0.18 }}
                          className="bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg text-xs text-white max-w-[220px] text-center whitespace-pre-line"
                        >
                          <p className="font-semibold text-amber-300">{m.title}</p>
                          <p className="text-[13px] text-gray-200">{m.desc}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile markers */}
            {markers.map((m, idx) => (
                <motion.button
                key={idx}
                className={`absolute lg:hidden w-6 h-6 rounded-full shadow-lg z-30
                  flex items-center justify-center overflow-hidden transition-colors duration-200
                  ${idx === activeIdx ? "bg-black text-white" : "bg-amber-400 border-2 border-white"}`}
                style={{
                  top: m.top,
                  left: m.left,
                  transform: "translate(-50%, -50%)",
                }}
                aria-label={`${m.title} info`}
                onClick={() => setActiveIdx(idx === activeIdx ? null : idx)}
              >
                {/* ICON WRAPPER - Always rendered */}
                <span className="w-3.5 h-3.5 relative">
                  {idx === activeIdx && (
                    <FaMap className="absolute inset-0 w-full h-full" />
                  )}
                </span>
              </motion.button>
            ))}

            {/* Mobile bottom info */}
            <AnimatePresence>
              {activeIdx !== null && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={bottomVar}
                  transition={{ type: "spring", stiffness: 120, damping: 16 }}
                  className="absolute bottom-30 lg:hidden left-1/2 -translate-x-1/2  backdrop-blur-md text-white rounded-xl p-4  whitespace-pre-line z-40 shadow-xl"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="flex items-start justify-between gap-4 text-center">
                    <div>
                      <h3 className="font-bold text-amber-300 text-3xl">
                        {markers[activeIdx].title}
                      </h3>
                      <p className="text-sm text-gray-200 mt-1">
                        {markers[activeIdx].desc}
                      </p>
                    </div> 
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
 
      </section>
 
 
      
       {/* CONTACT / FOOTER SECTION */}
       <footer className="bg-[#f8f7f4] text-gray-800 pt-24 pb-12 px-6 md:px-12 relative z-10 ">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          {/* Address */}
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold">Head Office Address</h3>
            <p>
              Jl. Pantai Berawa Raya, Br. Plambingan, Desa Tibubeneng, Kec. Kuta Utara, Bali 80361
            </p>

            <h3 className="font-semibold pt-6">Company Registered Address (PT Elysium Group Bali)</h3>
            <p>
              Istana Kuta Galeria BW 2 Nomor 3A, Jalan Patih Jelantik, Desa/Kelurahan Kuta, Kec. Kuta,<br />
              Kab. Badung, Provinsi Bali, 80361
            </p>
          </div>

          {/* Key Contacts */}
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold">Key Contacts</h3>

            <div>
              <p className="font-medium">Office Contact</p>
              <p>📞 +62 813 370 2072</p>
              <p>📞 +61 0123 0123</p>
              <p>✉️ hello@elysiumgroupbali.com</p>
            </div>

            <div className="pt-4">
              <p className="font-medium">Brock Fayle</p>
              <p>📞 +61 0451 164 461</p>
              <p>✉️ brock@elysiumgroupbali.com</p>
            </div>

            <div className="pt-4">
              <p className="font-medium">Brenton Fayle</p>
              <p>📞 +61 0405 059 717</p>
              <p>✉️ brenton@elysiumgroupbali.com</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Contact Us</h3>
            <form className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                className="w-full border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Website"
                className="w-full border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Message"
                className="w-full border border-gray-300 px-3 py-2 text-sm h-24 resize-none"
              />
              <button
                type="submit"
                className="bg-black text-white w-full py-2 text-sm tracking-widest"
              >
                SUBMIT
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-300 mt-16 pt-8 text-sm text-center text-gray-500 flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto">
          <div className="mb-4 md:mb-0">&copy;Elysium 2025. All rights reserved</div>

          <div className="text-2xl font-light text-gray-600">ELYSIUM</div>

          {/* <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📸</a>
            <a href="#" aria-label="YouTube">▶️</a>
            <a href="#" aria-label="WhatsApp">💬</a>
          </div> */}
          
          <div className="flex gap-4 mt-4 md:mt-0 text-gray-700 text-xl">
            <a href="#" aria-label="Facebook" className="hover:text-black transition">
              <FaFacebookF />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-black transition">
              <FaInstagram />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-black transition">
              <FaYoutube />
            </a>
            <a href="#" aria-label="WhatsApp" className="hover:text-black transition">
              <FaWhatsapp />
            </a>
          </div>

          
        </div>
      </footer>
      
    </div>
  );
}
