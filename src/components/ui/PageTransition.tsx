import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  initial: { opacity: 0, y: 15, scale: 0.99 },
  enter: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // Premium smooth easing
      when: "beforeChildren",
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.99,
    transition: {
      duration: 0.3,
      ease: [0.7, 0, 0.84, 0]
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
