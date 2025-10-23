'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaInstagram, FaLinkedin, FaYoutube, FaBehance } from 'react-icons/fa'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Our Story', href: '/story' },
    { name: 'Services', href: '/services' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <footer className="relative bg-black border-t border-neutral-800 overflow-hidden text-neutral-400">
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/70 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-gradient-radial from-yellow-200/10 via-transparent to-transparent blur-[180px]" />

      {/* Container */}
      <div className="relative max-w-7xl mx-auto px-8 py-20 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {/* Brand + Philosophy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-6"
          >
            <Link href="/home" className="flex items-center space-x-3 group">
              <motion.img
                src="/boson-white.png"
                alt="Boson Collective"
                className="w-9 h-9"
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              />
              <span className="text-white font-light tracking-[0.15em] text-lg group-hover:tracking-[0.25em] transition-all duration-300">
                BOSON COLLECTIVE
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-neutral-400 max-w-sm">
              We architect meaning from chaos — merging technology, design, and emotion
              to create timeless digital experiences.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="space-y-6"
          >
            <h3 className="text-white uppercase tracking-wide text-sm font-semibold">Quick Links</h3>
            <div className="flex flex-col space-y-2">
              {quickLinks.map((link, i) => (
                <motion.div key={i} whileHover={{ x: 5 }}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 hover:text-white text-sm transition-all duration-200"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Social Media Icons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="space-y-6"
          >
            <h3 className="text-white uppercase tracking-wide text-sm font-semibold">Connect</h3>
            <div className="flex space-x-5">
              {[
                { name: 'Instagram', icon: FaInstagram, href: 'https://instagram.com/' },
                { name: 'LinkedIn', icon: FaLinkedin, href: 'https://linkedin.com/' },
                { name: 'YouTube', icon: FaYoutube, href: 'https://youtube.com/' },
                { name: 'Behance', icon: FaBehance, href: 'https://behance.net/' },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-neutral-500 hover:text-white transition-all duration-300"
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider Line */}
        <div className="my-12 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

        {/* Footer Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 tracking-wide"
        >
          <p className="mb-2 md:mb-0">© {currentYear} BOSON COLLECTIVE — All Rights Reserved.</p>
          <p className="text-neutral-600 hover:text-neutral-300 transition-colors duration-200">
            Crafted with precision & chaos.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
