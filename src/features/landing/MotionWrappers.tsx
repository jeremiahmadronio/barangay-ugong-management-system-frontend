import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollReveal = ({ children, className = "", delay = 0 }: ScrollRevealProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export const HoverCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);
