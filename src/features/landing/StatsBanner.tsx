import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { statsItems } from "./landingPageData";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

const AnimatedCounter = ({ value }: { value: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  const match = value.match(/^([\d,]+)(.*)$/);
  const numberPart = match ? match[1].replace(/,/g, "") : "0";
  const target = parseInt(numberPart) || 0;
  const suffix = match ? match[2] : "";
  const hasComma = match ? match[1].includes(",") : false;

  useEffect(() => {
    if (isInView && target > 0) {
      let start = 0;
      const duration = 1500; // 1.5 seconds animation
      const frameRate = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameRate);
      const increment = target / totalFrames;

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(start));
        }
      }, frameRate);

      return () => clearInterval(timer);
    } else if (isInView && target === 0) {
      setCount(0);
    }
  }, [isInView, target]);

  const formattedCount = hasComma ? count.toLocaleString() : count.toString();

  return <span ref={ref}>{formattedCount}{suffix}</span>;
};

export const StatsBanner = () => {
  const { settings } = useWebsiteSettings();

  return (
    <div className="relative z-20 -mt-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-2xl shadow-2xl px-6 py-8"
          style={{ backgroundColor: 'var(--theme-accent)' }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {settings.statsData.map((stat, index) => {
              const Icon = statsItems[index]?.icon || statsItems[0].icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-4 justify-center"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Icon className="w-5 h-5 text-white/80" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white leading-none">
                      <AnimatedCounter value={stat.value} />
                    </p>
                    <p className="text-xs text-white/70 font-medium mt-0.5">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatsBanner;
