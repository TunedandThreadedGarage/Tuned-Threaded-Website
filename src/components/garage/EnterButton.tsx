"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { playButtonClick } from "@/lib/garage-audio";

type EnterButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function EnterButton({ onPress, disabled = false }: EnterButtonProps) {
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setPressed(true);
        if (!reduceMotion) playButtonClick();
        window.setTimeout(() => {
          setPressed(false);
          onPress();
        }, reduceMotion ? 0 : 70);
      }}
      whileHover={reduceMotion ? undefined : { opacity: 0.92 }}
      animate={pressed && !reduceMotion ? { y: 1 } : { y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 inline-flex min-h-12 min-w-[min(100%,17rem)] items-center justify-center border border-white/30 bg-white/95 px-8 py-3.5 text-[11px] font-semibold tracking-[0.22em] text-[#111114] transition-[border-color,background-color] duration-300 hover:border-white hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-wait disabled:opacity-70"
    >
      ENTER THE GARAGE
    </motion.button>
  );
}
