export const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
};


