"use client";

import React from "react";

interface PlatformIconProps extends React.SVGProps<SVGSVGElement> {
  type: string;
}

export function PlatformIcon({ type, ...props }: PlatformIconProps) {
  switch (type) {
    case "steam":
      return (
        <svg viewBox="0 0 65 65" fill="#fff" {...props}>
          <use href="#SteamSymbolB" x=".5" y=".5"/>
          <defs>
            <linearGradient id="SteamGradientA" x2="50%" x1="50%" y2="100%" y1="0%">
              <stop stopColor="#111d2e" offset="0%"/>
              <stop stopColor="#051839" offset="21.2%"/>
              <stop stopColor="#0a1b48" offset="40.7%"/>
              <stop stopColor="#132e62" offset="58.1%"/>
              <stop stopColor="#144b7e" offset="73.8%"/>
              <stop stopColor="#136497" offset="87.3%"/>
              <stop stopColor="#1387b8" offset="100%"/>
            </linearGradient>
          </defs>
          <g id="SteamSymbolB">
            <path d="M1.305 41.202C5.259 54.386 17.488 64 31.959 64c17.673 0 32-14.327 32-32s-14.327-32-32-32C15.001 0 1.124 13.193.028 29.874c2.074 3.477 2.879 5.628 1.275 11.328z" fill="url(#SteamGradientA)"/>
            <path d="M30.31 23.985l.003.158-7.83 11.375c-1.268-.058-2.54.165-3.748.662a8.14 8.14 0 0 0-1.498.8L.042 29.893s-.398 6.546 1.26 11.424l12.156 5.016c.6 2.728 2.48 5.12 5.242 6.27a8.88 8.88 0 0 0 11.603-4.782 8.89 8.89 0 0 0 .684-3.656L42.18 36.16l.275.005c6.705 0 12.155-5.466 12.155-12.18s-5.44-12.16-12.155-12.174c-6.702 0-12.155 5.46-12.155 12.174zm-1.88 23.05c-1.454 3.5-5.466 5.147-8.953 3.694a6.84 6.84 0 0 1-3.524-3.362l3.957 1.64a5.04 5.04 0 0 0 6.591-2.719 5.05 5.05 0 0 0-2.715-6.601l-4.1-1.695c1.578-.6 3.372-.62 5.05.077 1.7.703 3 2.027 3.696 3.72s.692 3.56-.01 5.246M42.466 32.1a8.12 8.12 0 0 1-8.098-8.113 8.12 8.12 0 0 1 8.098-8.111 8.12 8.12 0 0 1 8.1 8.111 8.12 8.12 0 0 1-8.1 8.113m-6.068-8.126a6.09 6.09 0 0 1 6.08-6.095c3.355 0 6.084 2.73 6.084 6.095a6.09 6.09 0 0 1-6.084 6.093 6.09 6.09 0 0 1-6.081-6.093z"/>
          </g>
        </svg>
      );
    case "discord":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
        </svg>
      );
    case "epic":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          <path d="M12 22V12" />
          <path d="M12 12 22 8.5" />
          <path d="M12 12 2 8.5" />
        </svg>
      );
    case "gog":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v6" />
          <path d="M12 16v6" />
          <path d="M2 12h6" />
          <path d="M16 12h6" />
        </svg>
      );
    case "battle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </svg>
      );
    case "ea":
      return (
        <svg viewBox="0 0 1000 1000.001" fill="currentColor" {...props}>
          <g transform="matrix(1.1510805,0,0,1.1510666,-75.547713,-75.547537)" fill="#ff4747">
            <g fill="#ff4747">
              <path d="m500.006 934.393c-239.516 0-434.374-194.862-434.374-434.379 0-239.52 194.858-434.381 434.374-434.381 239.513 0 434.375 194.862 434.375 434.381 0 239.516-194.861 434.379-434.375 434.379zm73.521-602.394h-245.486l-37.247 59.858h245.204zm50.168 0.571-150.071 238.963h-166.464l38.405-59.909h99.771l38.112-59.88h-230.654l-38.104 59.88h54.641l-75.812 119.611h316.389l116.86-184.295 42.609 64.684h-38.42l-36.385 59.909h113.773l39.506 59.702h72.576z" clipRule="evenodd" fill="#ff4747" fillRule="evenodd"/>
            </g>
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
  }
}

export function getPlatformPreset(claimUrl: string | null): { name: string; iconType: string } | null {
  if (!claimUrl) return null;
  const url = claimUrl.toLowerCase();
  if (url.includes("steampowered.com") || url.includes("steam")) {
    return { name: "Steam", iconType: "steam" };
  }
  if (url.includes("gog.com")) {
    return { name: "GOG", iconType: "gog" };
  }
  if (url.includes("epicgames.com")) {
    return { name: "Epic Games", iconType: "epic" };
  }
  if (url.includes("discord.com") || url.includes("discord.gift")) {
    return { name: "Discord", iconType: "discord" };
  }
  if (url.includes("battle.net")) {
    return { name: "Battle.Net", iconType: "battle" };
  }
  if (url.includes("ea.com") || url.includes("origin.com")) {
    return { name: "EA Desktop", iconType: "ea" };
  }
  return null;
}
