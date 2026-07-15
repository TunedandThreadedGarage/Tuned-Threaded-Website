"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GarageIntro } from "@/components/garage/GarageIntro";
import { WelcomeToast } from "@/components/garage/WelcomeToast";
import {
  createGarageDoorAudio,
  type GarageDoorAudio,
} from "@/lib/garage-audio";
import {
  GARAGE_DOOR_DURATION_S,
  GARAGE_LOGO_HANDOFF_DELAY_MS,
  hasEnteredGarageThisSession,
  hasVisitedGarageBefore,
  markGarageEnteredThisSession,
  markGarageVisited,
  prefersReducedMotion,
} from "@/lib/garage-storage";

type GaragePhase = "booting" | "intro" | "opening" | "open";

type GarageContextValue = {
  phase: GaragePhase;
  logoInNav: boolean;
  scrollUnlocked: boolean;
};

const GarageContext = createContext<GarageContextValue>({
  phase: "open",
  logoInNav: true,
  scrollUnlocked: true,
});

export function useGarage() {
  return useContext(GarageContext);
}

type GarageExperienceProps = {
  children: ReactNode;
};

type WelcomeState = {
  show: boolean;
  returning: boolean;
};

export function GarageExperience({ children }: GarageExperienceProps) {
  const [phase, setPhase] = useState<GaragePhase>("booting");
  const [logoInNav, setLogoInNav] = useState(true);
  const [welcome, setWelcome] = useState<WelcomeState>({
    show: false,
    returning: false,
  });
  const completedRef = useRef(false);
  const audioRef = useRef<GarageDoorAudio | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const startWelcome = useCallback(() => {
    const returning = hasVisitedGarageBefore();
    if (!returning) {
      markGarageVisited();
    }
    setWelcome({ show: true, returning });
  }, []);

  const dismissWelcome = useCallback(() => {
    setWelcome((prev) => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const reduce = prefersReducedMotion();
      const alreadyEntered = hasEnteredGarageThisSession();

      if (alreadyEntered || reduce) {
        markGarageEnteredThisSession();
        setLogoInNav(true);
        setPhase("open");
        if (!alreadyEntered && reduce) {
          startWelcome();
        }
        return;
      }

      setLogoInNav(false);
      setPhase("intro");
    });

    return () => window.cancelAnimationFrame(id);
  }, [startWelcome]);

  useEffect(() => {
    if (phase === "booting") return;

    const lock = phase !== "open";
    if (lock) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [phase]);

  useEffect(
    () => () => {
      clearTimers();
      audioRef.current?.stop();
    },
    [clearTimers],
  );

  const finishEntrance = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();

    audioRef.current?.playClunk();
    const stopId = window.setTimeout(() => {
      audioRef.current?.stop();
      audioRef.current = null;
    }, 280);
    timersRef.current.push(stopId);

    markGarageEnteredThisSession();
    startWelcome();
    setLogoInNav(true);
    setPhase("open");
  }, [clearTimers, startWelcome]);

  const handleEnter = useCallback(() => {
    if (phase !== "intro") return;

    if (prefersReducedMotion()) {
      markGarageEnteredThisSession();
      setLogoInNav(true);
      setPhase("open");
      startWelcome();
      return;
    }

    setPhase("opening");

    audioRef.current = createGarageDoorAudio();
    audioRef.current?.startMotor();

    const handoffId = window.setTimeout(() => {
      setLogoInNav(true);
    }, GARAGE_LOGO_HANDOFF_DELAY_MS);
    timersRef.current.push(handoffId);

    const completeId = window.setTimeout(() => {
      finishEntrance();
    }, GARAGE_DOOR_DURATION_S * 1000 + 40);
    timersRef.current.push(completeId);
  }, [finishEntrance, phase, startWelcome]);

  const contextValue = useMemo<GarageContextValue>(
    () => ({
      phase,
      logoInNav,
      scrollUnlocked: phase === "open",
    }),
    [logoInNav, phase],
  );

  const siteRevealed = phase === "opening" || phase === "open";
  const introActive = phase === "intro" || phase === "opening";

  if (phase === "booting") {
    return (
      <div className="min-h-[100svh] bg-bg" aria-busy="true">
        <span className="sr-only">Loading Tuned &amp; Threaded</span>
      </div>
    );
  }

  return (
    <GarageContext.Provider value={contextValue}>
      <div className="relative flex min-h-[100svh] flex-1 flex-col">
        <motion.div
          aria-hidden={!siteRevealed}
          initial={false}
          animate={{
            opacity: siteRevealed ? 1 : 0,
          }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={
            siteRevealed
              ? "relative flex min-h-[100svh] flex-1 flex-col"
              : "pointer-events-none invisible absolute inset-0 flex min-h-[100svh] flex-1 flex-col select-none"
          }
        >
          {children}
        </motion.div>

        <AnimatePresence>
          {introActive ? (
            <GarageIntro
              key="garage-intro"
              opening={phase === "opening"}
              showLogo={!logoInNav}
              onEnter={handleEnter}
              onOpenComplete={finishEntrance}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {welcome.show ? (
            <WelcomeToast
              key="welcome-toast"
              returning={welcome.returning}
              onDone={dismissWelcome}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </GarageContext.Provider>
  );
}
