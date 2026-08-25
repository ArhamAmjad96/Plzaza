"use client";

import { Zap, CheckCircle2 } from "lucide-react";

export default function GhostedPlazaBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      {/* ─── Radial Depth Glows ─── */}
      <div
        className="absolute -right-20 -top-20 w-[550px] h-[550px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(231, 212, 190, 0.65) 0%, rgba(221, 228, 207, 0.3) 50%, transparent 75%)",
        }}
      />
      <div
        className="absolute right-1/4 -bottom-24 w-[400px] h-[400px] rounded-full opacity-40 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(143, 166, 107, 0.25) 0%, transparent 70%)",
        }}
      />

      {/* ─── Subtle Architectural Coordinate Grid & Ticks ─── */}
      <div className="absolute inset-0 opacity-15">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="archGrid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#17211D"
                strokeWidth="0.5"
                strokeDasharray="2 4"
              />
              <circle cx="0" cy="0" r="1.5" fill="#17211D" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#archGrid)" />
        </svg>
      </div>

      {/* ─── Large Ghosted 3D Plaza / Building Massing (Right Side) ─── */}
      <div
        className="absolute right-4 sm:right-10 top-6 bottom-6 w-[360px] sm:w-[480px] lg:w-[580px] opacity-[0.15] transition-all duration-1000"
        style={{
          animation: "heroBuildingDrift 16s ease-in-out infinite alternate",
        }}
      >
        <svg
          viewBox="0 0 500 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          {/* Parapet Roof Structure */}
          <polygon
            points="250,30 430,110 250,170 70,100"
            fill="#CBD4BC"
            stroke="#17211D"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <polygon
            points="250,170 430,110 430,130 250,190"
            fill="#B8C3A7"
            stroke="#17211D"
            strokeWidth="1.5"
          />
          <polygon
            points="250,170 70,100 70,120 250,190"
            fill="#DDE4CF"
            stroke="#17211D"
            strokeWidth="1.5"
          />

          {/* Floor 4 / Residential Stacks */}
          <polygon
            points="70,120 250,190 250,250 70,180"
            fill="#E8EDD9"
            stroke="#17211D"
            strokeWidth="1.2"
          />
          <polygon
            points="250,190 430,130 430,190 250,250"
            fill="#CBD4BC"
            stroke="#17211D"
            strokeWidth="1.2"
          />

          {/* Floor 3 / Commercial 1st Floor */}
          <polygon
            points="70,180 250,250 250,310 70,240"
            fill="#DDE4CF"
            stroke="#17211D"
            strokeWidth="1.2"
          />
          <polygon
            points="250,250 430,190 430,250 250,310"
            fill="#B8C3A7"
            stroke="#17211D"
            strokeWidth="1.2"
          />

          {/* Floor 2 / Ground Storefront */}
          <polygon
            points="70,240 250,310 250,380 70,310"
            fill="#E8EDD9"
            stroke="#17211D"
            strokeWidth="1.4"
          />
          <polygon
            points="250,310 430,250 430,320 250,380"
            fill="#CBD4BC"
            stroke="#17211D"
            strokeWidth="1.4"
          />

          {/* Foundation / Basement Plinth */}
          <polygon
            points="50,310 250,390 450,320 450,370 250,440 50,360"
            fill="#A6B393"
            stroke="#17211D"
            strokeWidth="1.5"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* ─── Small Colorful Floating 3D Buildings ─── */}

      {/* Building 1: Coral & Warm Amber Plaza Tower (Top Left) */}
      <div
        className="absolute left-6 sm:left-12 top-6 sm:top-10 w-16 sm:w-20 h-20 sm:h-24 opacity-85 drop-shadow-md"
        style={{
          animation: "floatBuilding1 8s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* 3D Roof */}
          <polygon points="50,10 85,28 50,45 15,28" fill="#FF704D" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,45 85,28 85,34 50,51" fill="#E05432" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,45 15,28 15,34 50,51" fill="#FF8C70" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Main Facade */}
          <polygon points="15,34 50,51 50,105 15,88" fill="#F6BD60" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,51 85,34 85,88 50,105" fill="#E9A840" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Colorful Windows (Left side) */}
          <rect x="23" y="44" width="8" height="12" rx="1.5" fill="#38B2AC" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="35" y="50" width="8" height="12" rx="1.5" fill="#38B2AC" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="23" y="65" width="8" height="12" rx="1.5" fill="#38B2AC" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="35" y="71" width="8" height="12" rx="1.5" fill="#38B2AC" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />

          {/* Entrance Door */}
          <rect x="26" y="86" width="14" height="16" rx="2" fill="#17211D" transform="skewY(24)" />
          <line x1="50" y1="10" x2="50" y2="2" stroke="#FF704D" strokeWidth="2" />
          <circle cx="50" cy="2" r="2.5" fill="#FF704D" />
        </svg>
      </div>

      {/* Building 2: Sky Blue & Mint Commercial Glass Block (Top Right) */}
      <div
        className="absolute right-24 sm:right-36 top-4 sm:top-8 w-16 sm:w-20 h-22 sm:h-26 opacity-85 drop-shadow-md"
        style={{
          animation: "floatBuilding2 10s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Roof */}
          <polygon points="50,15 85,32 50,48 15,32" fill="#4EA8DE" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Walls */}
          <polygon points="15,32 50,48 50,115 15,98" fill="#52B788" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,48 85,32 85,98 50,115" fill="#40916C" stroke="#17211D" strokeWidth="1.5" />

          {/* Glowing Windows */}
          <rect x="22" y="44" width="9" height="11" rx="1.5" fill="#FFF3B0" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="35" y="50" width="9" height="11" rx="1.5" fill="#FFF3B0" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="22" y="64" width="9" height="11" rx="1.5" fill="#FFF3B0" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="35" y="70" width="9" height="11" rx="1.5" fill="#FFF3B0" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          
          {/* Right side window stripes */}
          <line x1="58" y1="56" x2="78" y2="46" stroke="#D8F3DC" strokeWidth="3" strokeLinecap="round" />
          <line x1="58" y1="74" x2="78" y2="64" stroke="#D8F3DC" strokeWidth="3" strokeLinecap="round" />
          <line x1="58" y1="92" x2="78" y2="82" stroke="#D8F3DC" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* Building 3: Terracotta & Gold Corner Shop (Mid Right) */}
      <div
        className="absolute right-4 sm:right-10 top-[35%] w-14 sm:w-18 h-18 sm:h-22 opacity-90 drop-shadow-md"
        style={{
          animation: "floatBuilding3 9s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Terracotta Slanted Roof */}
          <polygon points="50,12 85,28 50,44 15,28" fill="#E76F51" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="15,28 50,44 50,96 15,80" fill="#F4A261" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,44 85,28 85,80 50,96" fill="#E9C46A" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Striped Canopy Awning */}
          <polygon points="18,52 48,66 48,72 18,58" fill="#E76F51" stroke="#17211D" strokeWidth="1" />
          <polygon points="28,56 38,61 38,67 28,62" fill="#FFFFFF" />

          {/* Storefront Display */}
          <rect x="22" y="68" width="22" height="18" rx="2" fill="#2A9D8F" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
        </svg>
      </div>

      {/* Building 4: Pastel Rose & Teal Studio (Lower Left) */}
      <div
        className="absolute left-8 sm:left-20 bottom-10 sm:bottom-14 w-16 sm:w-20 h-20 sm:h-24 opacity-85 drop-shadow-md"
        style={{
          animation: "floatBuilding4 11s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Rose Roof */}
          <polygon points="50,14 85,30 50,46 15,30" fill="#F28482" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Teal Facade */}
          <polygon points="15,30 50,46 50,105 15,88" fill="#457B9D" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,46 85,30 85,88 50,105" fill="#1D3557" stroke="#17211D" strokeWidth="1.5" />

          {/* Pastel Windows */}
          <rect x="23" y="42" width="10" height="12" rx="2" fill="#A8DADC" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="35" y="48" width="10" height="12" rx="2" fill="#A8DADC" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="23" y="64" width="10" height="12" rx="2" fill="#F1FAEE" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="35" y="70" width="10" height="12" rx="2" fill="#F1FAEE" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
        </svg>
      </div>

      {/* Building 5: Emerald & Tangerine Mini Arcade (Lower Right) */}
      <div
        className="absolute right-12 sm:right-28 bottom-6 sm:bottom-10 w-16 sm:w-22 h-20 sm:h-26 opacity-85 drop-shadow-md"
        style={{
          animation: "floatBuilding5 12s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Emerald Roof */}
          <polygon points="50,12 85,28 50,44 15,28" fill="#2A9D8F" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Tangerine Facade */}
          <polygon points="15,28 50,44 50,102 15,86" fill="#F4A261" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,44 85,28 85,86 50,102" fill="#E76F51" stroke="#17211D" strokeWidth="1.5" />

          {/* Glass Windows */}
          <rect x="22" y="40" width="10" height="12" rx="2" fill="#E9C46A" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="34" y="46" width="10" height="12" rx="2" fill="#E9C46A" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />

          {/* Arched Entrance */}
          <path d="M 24 76 Q 32 70 40 74 L 40 94 L 24 86 Z" fill="#264653" stroke="#17211D" strokeWidth="1" />
        </svg>
      </div>

      {/* Building 6: Lavender & Ivory Mini Plaza (Upper Center-Left) */}
      <div
        className="hidden md:block absolute left-[38%] top-5 w-12 sm:w-16 h-16 sm:h-20 opacity-80 drop-shadow-sm"
        style={{
          animation: "floatBuilding2 14s ease-in-out infinite alternate",
        }}
      >
        <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Lavender Roof */}
          <polygon points="50,10 85,26 50,42 15,26" fill="#B5838D" stroke="#17211D" strokeWidth="1.5" />
          
          {/* Ivory & Sage Facade */}
          <polygon points="15,26 50,42 50,96 15,80" fill="#FFE8D6" stroke="#17211D" strokeWidth="1.5" />
          <polygon points="50,42 85,26 85,80 50,96" fill="#DDBEA9" stroke="#17211D" strokeWidth="1.5" />

          {/* Turquoise Windows */}
          <rect x="22" y="38" width="9" height="11" rx="1.5" fill="#84DCC6" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="34" y="44" width="9" height="11" rx="1.5" fill="#84DCC6" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="22" y="58" width="9" height="11" rx="1.5" fill="#84DCC6" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
          <rect x="34" y="64" width="9" height="11" rx="1.5" fill="#84DCC6" stroke="#17211D" strokeWidth="1" transform="skewY(24)" />
        </svg>
      </div>

      {/* ─── 3 Faint Product Micro-Chips (Atmospheric Depth) ─── */}
      {/* 1. Floor Status Chip */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CBD4BC]/70 bg-[#FAF6F0]/85 backdrop-blur-xs text-[10px] font-mono text-[#58655E] absolute right-12 top-14 shadow-xs"
        style={{
          animation: "heroChipFloat1 10s ease-in-out infinite alternate",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#8FA66B]" />
        <span>GF // G-01 OCCUPIED</span>
      </div>

      {/* 2. Utility Grid Node */}
      <div
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CBD4BC]/70 bg-[#FAF6F0]/85 backdrop-blur-xs text-[10px] font-mono text-[#58655E] absolute right-8 top-1/2 shadow-xs"
        style={{
          animation: "heroChipFloat2 12s ease-in-out infinite alternate",
        }}
      >
        <Zap size={11} className="text-[#FF704D]" />
        <span>IESCO // 14-DIGIT SYNC</span>
      </div>

      {/* 3. Financial Recovery Indicator */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CBD4BC]/70 bg-[#FAF6F0]/85 backdrop-blur-xs text-[10px] font-mono text-[#58655E] absolute right-24 bottom-14 shadow-xs"
        style={{
          animation: "heroChipFloat3 14s ease-in-out infinite alternate",
        }}
      >
        <CheckCircle2 size={11} className="text-[#2D5A43]" />
        <span>RECOVERY // 87% SETTLED</span>
      </div>
    </div>
  );
}
