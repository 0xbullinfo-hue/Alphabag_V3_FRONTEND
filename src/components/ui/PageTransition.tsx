import { motion, Variants } from 'framer-motion';
import React from 'react';
import { useLocation } from 'react-router-dom';

const variants: Variants = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1, 
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  exit: { 
    opacity: 0, 
    transition: {
      duration: 0.1,
      ease: [0.7, 0, 0.84, 0],
    }
  }
};

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={variants}
      className="w-full h-full relative"
    >
      {children}
    </motion.div>
  );
};
