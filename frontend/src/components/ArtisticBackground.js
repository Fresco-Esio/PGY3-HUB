import React, { memo } from "react";
import { motion } from "framer-motion";

/**
 * 🎨 ARTISTIC BACKGROUND COMPONENT
 *
 * Replaces the default ReactFlow grid with a sophisticated radial design
 * featuring concentric circles, radial lines, and subtle texture overlays
 * to create depth and visual interest for the mind map interface.
 */
const ArtisticBackground = memo(
  ({
    variant = "radial",
    gap = 50,
    size = 2,
    color = "#e2e8f0",
    style = {},
    className = "",
    showRadialLines = true,
    showConcentricCircles = true,
    enableParallax = false,
  }) => {
    const RadialGrid = () => (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
          radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 70%),
          radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.02) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.02) 0%, transparent 50%)
        `,
          ...style,
        }}
      >
        {/* 🎯 CONCENTRIC CIRCLES for depth */}
        {showConcentricCircles && (
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern
                id="concentricCircles"
                x="50%"
                y="50%"
                patternUnits="userSpaceOnUse"
                width="100%"
                height="100%"
              >
                {[200, 400, 600, 800, 1000, 1200].map((radius, index) => (
                  <circle
                    key={radius}
                    cx="50%"
                    cy="50%"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={index === 0 ? 2 : 1}
                    strokeOpacity={0.1 - index * 0.01}
                    strokeDasharray={index % 2 === 0 ? "none" : "4,8"}
                  />
                ))}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#concentricCircles)" />
          </svg>
        )}

        {/* ⚡ RADIAL LINES extending from center */}
        {showRadialLines && (
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern
                id="radialLines"
                x="50%"
                y="50%"
                patternUnits="userSpaceOnUse"
                width="100%"
                height="100%"
              >
                {Array.from({ length: 24 }, (_, index) => {
                  const angle = index * 15 * (Math.PI / 180); // 15 degree increments
                  const x1 = 50;
                  const y1 = 50;
                  const x2 = 50 + Math.cos(angle) * 100;
                  const y2 = 50 + Math.sin(angle) * 100;

                  return (
                    <line
                      key={index}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={color}
                      strokeWidth={index % 6 === 0 ? 2 : 1}
                      strokeOpacity={index % 6 === 0 ? 0.08 : 0.04}
                      strokeDasharray={index % 3 === 0 ? "none" : "2,6"}
                    />
                  );
                })}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#radialLines)" />
          </svg>
        )}

        {/* 🌊 SUBTLE TEXTURE OVERLAY */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${color.slice(
              1
            )}' fill-opacity='0.03'%3E%3Cpath d='M30 30c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
          }}
        />

        {/* ✨ FLOATING PARTICLES for extra visual interest */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }, (_, index) => (
            <motion.div
              key={index}
              className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20"
              style={{
                left: `${20 + index * 10}%`,
                top: `${30 + Math.sin(index) * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    );

    const DotGrid = () => (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${color} ${size}px, transparent ${size}px)`,
          backgroundSize: `${gap}px ${gap}px`,
          backgroundPosition: "0 0",
          opacity: 0.4,
          ...style,
        }}
      />
    );

    const LineGrid = () => (
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern
              id="grid"
              width={gap}
              height={gap}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${gap} 0 L 0 0 0 ${gap}`}
                fill="none"
                stroke={color}
                strokeWidth={size}
                strokeOpacity={0.3}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" style={style} />
        </svg>
      </div>
    );

    const renderBackground = () => {
      switch (variant) {
        case "radial":
          return <RadialGrid />;
        case "dots":
          return <DotGrid />;
        case "lines":
          return <LineGrid />;
        default:
          return <RadialGrid />;
      }
    };

    return (
      <motion.div
        className={`absolute inset-0 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {renderBackground()}
      </motion.div>
    );
  }
);

ArtisticBackground.displayName = "ArtisticBackground";

export default ArtisticBackground;
