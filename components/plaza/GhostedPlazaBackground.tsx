"use client";

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
        className="absolute right-4 sm:right-10 top-6 bottom-6 w-[360px] sm:w-[480px] lg:w-[580px] opacity-[0.14] transition-all duration-1000"
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
    </div>
  );
}
