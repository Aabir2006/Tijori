"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useTheme, type Theme } from "@/lib/theme-context";

export function ThemeSlideTransition() {
  const { registerAnimationTrigger } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCurtainRef = useRef<HTMLDivElement>(null);
  const accentCurtainRef = useRef<HTMLDivElement>(null);
  const [targetTheme, setTargetTheme] = useState<Theme>("dark");

  useEffect(() => {
    registerAnimationTrigger((nextTheme, onMidpoint, onComplete) => {
      setTargetTheme(nextTheme);

      const isToDark = nextTheme === "dark";
      const curtainColor = isToDark ? "#060608" : "#FFFFF0";

      const container = containerRef.current;
      const mainCurtain = mainCurtainRef.current;
      const accentCurtain = accentCurtainRef.current;

      if (!container || !mainCurtain || !accentCurtain) {
        onMidpoint();
        onComplete();
        return;
      }

      // Kill any in-flight tweens
      gsap.killTweensOf([container, mainCurtain, accentCurtain]);

      // Set initial positions
      gsap.set(container, { display: "block", opacity: 1 });
      gsap.set(mainCurtain, {
        xPercent: -100,
        backgroundColor: curtainColor,
      });
      gsap.set(accentCurtain, {
        xPercent: -100,
      });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(container, { display: "none" });
          onComplete();
        },
      });

      // Phase 1: Slide in from Left to Right (-100% -> 0%)
      tl.to(accentCurtain, {
        xPercent: 0,
        duration: 0.4,
        ease: "power3.inOut",
      })
      .to(
        mainCurtain,
        {
          xPercent: 0,
          duration: 0.44,
          ease: "power3.inOut",
        },
        "<+=0.04"
      )
      // Screen is 100% covered — switch theme at midpoint
      .call(() => {
        onMidpoint();
      })
      // Phase 2: Slide out from Left to Right (0% -> 100%)
      .to(accentCurtain, {
        xPercent: 100,
        duration: 0.4,
        ease: "power3.inOut",
      })
      .to(
        mainCurtain,
        {
          xPercent: 100,
          duration: 0.44,
          ease: "power3.inOut",
        },
        "<+=0.04"
      );
    });
  }, [registerAnimationTrigger]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden hidden"
    >
      {/* Accent Curtain (leads slightly with emerald aura) */}
      <div
        ref={accentCurtainRef}
        className="absolute inset-0 w-full h-full bg-emerald-500/20 backdrop-blur-[2px] will-change-transform"
      >
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_25px_rgba(16,185,129,0.9)]" />
      </div>

      {/* Main Solid Curtain */}
      <div
        ref={mainCurtainRef}
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          backgroundColor: targetTheme === "dark" ? "#060608" : "#FFFFF0",
        }}
      >
        {/* Leading edge glow during entry */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-emerald-500/80 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
        {/* Trailing edge glow during exit */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-emerald-500/80 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
      </div>
    </div>
  );
}

// Keep export alias for backwards compatibility
export const VenomThemeTransition = ThemeSlideTransition;
