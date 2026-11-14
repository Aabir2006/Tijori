"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useTheme, type Theme } from "@/lib/theme-context";

export function VenomThemeTransition() {
  const { registerAnimationTrigger } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Groups and elements
  const mainBlobsRef = useRef<SVGGElement>(null);
  const tendrilsGroupRef = useRef<SVGGElement>(null);
  const fullCoverRef = useRef<SVGRectElement>(null);
  const dropletsGroupRef = useRef<SVGGElement>(null);

  const [activeTheme, setActiveTheme] = useState<Theme>("dark");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Register trigger function with the context
    registerAnimationTrigger((targetTheme, onMidpoint, onComplete) => {
      setActiveTheme(targetTheme);
      setIsVisible(true);

      const isToDark = targetTheme === "dark";
      const fillColor = isToDark ? "#060608" : "#fbfcfd";
      const secondaryColor = isToDark ? "#0d0e12" : "#f1f3f6";

      // Colorize elements
      const elementsToColor = [
        mainBlobsRef.current,
        tendrilsGroupRef.current,
        fullCoverRef.current,
        dropletsGroupRef.current,
      ];
      elementsToColor.forEach((el) => {
        if (el) el.setAttribute("fill", fillColor);
      });

      const tendrilPaths = tendrilsGroupRef.current?.querySelectorAll("path") || [];
      tendrilPaths.forEach((p) => {
        p.setAttribute("stroke", fillColor);
      });

      // Kill any previous tween
      gsap.killTweensOf([
        mainBlobsRef.current,
        tendrilsGroupRef.current,
        fullCoverRef.current,
        dropletsGroupRef.current,
        containerRef.current,
      ]);

      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          onComplete();
        },
      });

      // Initial state
      gsap.set(containerRef.current, { opacity: 1, display: "block" });
      gsap.set(fullCoverRef.current, { opacity: 0 });

      // Animate tendril extensions (strokeDashoffset)
      tendrilPaths.forEach((p) => {
        const pathEl = p as SVGPathElement;
        const length = pathEl.getTotalLength ? pathEl.getTotalLength() : 1200;
        gsap.set(pathEl, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        });
      });

      // Blob scaling & positions
      const blobs = mainBlobsRef.current?.querySelectorAll("circle, path") || [];
      gsap.set(blobs, {
        scale: 0,
        transformOrigin: "100% 0%",
        opacity: 1,
      });

      const droplets = dropletsGroupRef.current?.querySelectorAll("circle") || [];
      gsap.set(droplets, {
        scale: 0,
        opacity: 0,
        transformOrigin: "center center",
      });

      // ─────────────────────────────────────────────────────────────
      // PHASE 1: Spreading & Expanding (0s -> ~0.75s)
      // 1. Tendrils burst from top-right corner across screen
      // 2. Main viscous blobs expand along the tendril web
      // 3. Screen becomes 100% covered at ~0.75s
      // ─────────────────────────────────────────────────────────────
      tl.to(
        tendrilPaths,
        {
          strokeDashoffset: 0,
          duration: 0.65,
          stagger: {
            amount: 0.25,
            from: "start",
          },
          ease: "power3.inOut",
        },
        0
      );

      // Droplets shoot out along the web
      tl.to(
        droplets,
        {
          scale: () => gsap.utils.random(1.2, 2.5),
          opacity: 1,
          duration: 0.55,
          stagger: {
            amount: 0.3,
            from: "random",
          },
          ease: "back.out(1.4)",
        },
        0.1
      );

      // Main liquid mass surges outward from top-right corner
      tl.to(
        blobs,
        {
          scale: 1,
          duration: 0.7,
          stagger: 0.04,
          ease: "power4.in",
        },
        0.05
      );

      // Full cover fade-in as tendrils fuse together into solid mass
      tl.to(
        fullCoverRef.current,
        {
          opacity: 1,
          duration: 0.25,
          ease: "power2.inOut",
        },
        0.65
      );

      // ─────────────────────────────────────────────────────────────
      // PHASE 2: Midpoint Climax (0.78s)
      // Screen is 100% covered! Flip the actual DOM theme here!
      // ─────────────────────────────────────────────────────────────
      tl.call(
        () => {
          onMidpoint();
        },
        undefined,
        0.78
      );

      // Hold covered state briefly (120ms) for seamless transition
      tl.to({}, { duration: 0.12 });

      // ─────────────────────────────────────────────────────────────
      // PHASE 3: Retraction & Dissolution (0.9s -> ~1.65s)
      // The organic substance pulls back, peels and dissolves away,
      // revealing the new theme underneath!
      // ─────────────────────────────────────────────────────────────
      tl.to(
        fullCoverRef.current,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power3.out",
        },
        0.9
      );

      tl.to(
        blobs,
        {
          scale: 0,
          opacity: 0.2,
          duration: 0.65,
          stagger: 0.05,
          ease: "expo.out",
          transformOrigin: "100% 0%",
        },
        0.92
      );

      tl.to(
        droplets,
        {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          stagger: 0.02,
          ease: "power3.in",
        },
        0.95
      );

      // Tendrils peel and retract backwards
      tl.to(
        tendrilPaths,
        {
          opacity: 0,
          strokeDashoffset: (i, target) => {
            const pathEl = target as SVGPathElement;
            return -(pathEl.getTotalLength ? pathEl.getTotalLength() : 1200);
          },
          duration: 0.55,
          stagger: {
            amount: 0.2,
            from: "end",
          },
          ease: "power4.out",
        },
        0.98
      );

      // Fade out container entirely
      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: "power1.out",
        },
        1.55
      );
    });
  }, [registerAnimationTrigger]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] pointer-events-none overflow-hidden ${
        isVisible ? "block" : "hidden"
      }`}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gooey Liquid Fusion Filter */}
          <filter id="venom-goo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 28 -11
              "
              result="goo"
            />
            {/* Organic Edge Turbulence */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="goo"
              in2="noise"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feComposite in="SourceGraphic" in2="displaced" operator="atop" />
          </filter>

          {/* Tendril Liquid Filter */}
          <filter id="tendril-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 24 -9
              "
              result="goo"
            />
          </filter>
        </defs>

        {/* ── Main Liquid Symbiote Mass (Gooey Filtered) ─────────────── */}
        <g filter="url(#venom-goo)">
          {/* Main Expanding Liquid Blobs from Top-Right (origin 1920, 0) */}
          <g ref={mainBlobsRef} fill="#060608">
            {/* Primary Center-Surge Blob */}
            <circle cx="1920" cy="0" r="1400" />
            <circle cx="1850" cy="80" r="1200" />
            <circle cx="1600" cy="200" r="1050" />
            <circle cx="1300" cy="350" r="950" />
            <circle cx="1000" cy="500" r="900" />
            <circle cx="600" cy="700" r="850" />
            <circle cx="200" cy="900" r="800" />
            <circle cx="0" cy="1080" r="850" />

            {/* Asymmetrical organic lobes */}
            <path d="M1920,0 Q1400,600 800,400 T0,1080 L1920,1080 Z" />
            <path d="M1920,0 Q1700,900 1100,850 T0,800 L0,0 Z" />
          </g>

          {/* Secondary Droplet Clusters along the Web */}
          <g ref={dropletsGroupRef} fill="#060608">
            <circle cx="1700" cy="150" r="55" />
            <circle cx="1550" cy="280" r="45" />
            <circle cx="1400" cy="220" r="60" />
            <circle cx="1320" cy="420" r="50" />
            <circle cx="1180" cy="310" r="65" />
            <circle cx="1050" cy="520" r="55" />
            <circle cx="920" cy="390" r="70" />
            <circle cx="850" cy="620" r="60" />
            <circle cx="720" cy="480" r="50" />
            <circle cx="640" cy="720" r="65" />
            <circle cx="510" cy="580" r="55" />
            <circle cx="430" cy="820" r="75" />
            <circle cx="320" cy="680" r="60" />
            <circle cx="240" cy="920" r="70" />
            <circle cx="150" cy="780" r="55" />
            <circle cx="80" cy="990" r="65" />
          </g>
        </g>

        {/* ── Branching Organic Tendrils (Living Web) ────────────────── */}
        <g ref={tendrilsGroupRef} filter="url(#tendril-filter)" fill="none" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round">
          {/* Primary Tendril 1: Shoots toward bottom-left corner */}
          <path d="M1920,0 C1650,200 1350,280 1080,450 C800,620 500,750 0,1080" strokeWidth="32" />
          {/* Sub-branch 1A */}
          <path d="M1350,280 C1150,420 950,480 600,550 C380,600 180,620 0,650" strokeWidth="18" />
          {/* Sub-branch 1B */}
          <path d="M800,620 C620,740 450,880 200,1080" strokeWidth="16" />

          {/* Primary Tendril 2: Shoots horizontally left across top-mid */}
          <path d="M1920,30 C1550,80 1200,120 850,220 C520,310 250,280 0,320" strokeWidth="28" />
          {/* Sub-branch 2A */}
          <path d="M1200,120 C1000,180 750,150 450,180 C220,200 100,190 0,180" strokeWidth="14" />
          {/* Sub-branch 2B */}
          <path d="M850,220 C700,340 550,420 300,480 C150,520 50,540 0,530" strokeWidth="16" />

          {/* Primary Tendril 3: Shoots downward along right-bottom */}
          <path d="M1890,0 C1820,300 1720,580 1550,800 C1380,1000 1100,1050 800,1080" strokeWidth="30" />
          {/* Sub-branch 3A */}
          <path d="M1720,580 C1580,720 1420,860 1200,950 C1000,1030 850,1050 650,1080" strokeWidth="18" />
          {/* Sub-branch 3B */}
          <path d="M1550,800 C1650,920 1720,1000 1800,1080" strokeWidth="14" />

          {/* Primary Tendril 4: Center-diagonal arc */}
          <path d="M1920,0 C1500,300 1150,550 750,750 C400,920 200,1000 0,1050" strokeWidth="26" />
          {/* Sub-branch 4A */}
          <path d="M1150,550 C950,700 780,850 500,1000 C350,1080 200,1080 50,1080" strokeWidth="16" />

          {/* Primary Tendril 5: High arc tendril */}
          <path d="M1900,0 C1680,140 1420,190 1150,260 C820,340 450,450 0,460" strokeWidth="22" />
          {/* Sub-branch 5A */}
          <path d="M1420,190 C1250,280 1050,360 800,460 C580,540 350,620 100,720" strokeWidth="14" />

          {/* Primary Tendril 6: Deep bottom sweep */}
          <path d="M1920,50 C1800,400 1620,700 1380,900 C1150,1050 850,1080 400,1080" strokeWidth="24" />
        </g>

        {/* ── 100% Solid Full Cover Rect (At Peak Midpoint) ──────────── */}
        <rect
          ref={fullCoverRef}
          x="0"
          y="0"
          width="1920"
          height="1080"
          fill="#060608"
          opacity="0"
        />
      </svg>
    </div>
  );
}
