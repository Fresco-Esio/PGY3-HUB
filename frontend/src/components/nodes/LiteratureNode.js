import React, { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { BookOpen, X, FileText, Users, Calendar, Quote } from "lucide-react";
import { motion } from "framer-motion";

const LiteratureNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);

  // Entry animation with the longest delay for final polish - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 250);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  return (
    <motion.div
      initial={
        data.skipAnimation
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.9, x: 20, rotate: -1 }
      }
      animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -20, rotate: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.175, 0.885, 0.32, 1.275],
        delay: data.skipAnimation ? 0 : 0.25,
      }}
      whileHover={{
        scale: 1.03,
        y: -2,
        rotate: 0.5,
        transition: { duration: 0.2 },
      }}
      className={`group relative min-w-[180px] max-w-[220px] cursor-pointer ${
        selected ? "z-10" : "z-0"
      }`}
    >
      {/* 🎨 ARTISTIC PAPER CONTAINER with academic styling */}
      <div
        className={`
          relative px-3 py-3 rounded-lg backdrop-blur-sm
          border-2 transition-all duration-400 overflow-hidden
          shadow-lg hover:shadow-xl text-slate-800
          ${
            selected
              ? "border-amber-300 shadow-amber-200/40 ring-4 ring-amber-200/30"
              : "border-amber-200/60 hover:border-amber-300/80"
          }
        `}
        style={{
          background:
            "linear-gradient(145deg, #fefbf3 0%, #faf7f0 30%, #f7f3e9 70%, #f4f0e6 100%)",
          fontFamily: '"Crimson Text", "Times New Roman", serif',
          boxShadow: selected
            ? "0 8px 25px -5px rgba(217, 119, 6, 0.2), 0 6px 12px -6px rgba(217, 119, 6, 0.15)"
            : "0 4px 15px -3px rgba(217, 119, 6, 0.1), 0 2px 6px -3px rgba(217, 119, 6, 0.05)",
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.1))",
        }}
      >
        {/* 🌟 SUBTLE PAPER TEXTURE OVERLAY */}
        <div
          className={`
            absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 
            transition-opacity duration-400 pointer-events-none
          `}
          style={{
            background: `
              radial-gradient(circle at 20% 10%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
              url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d97706' fill-opacity='0.02'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5z'/%3E%3C/g%3E%3C/svg%3E")
            `,
          }}
        />

        {/* 🔗 ENHANCED CONNECTION HANDLES with amber theme */}
        {/* Top handles */}
        <Handle
          id="top"
          type="source"
          position={Position.Top}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Right handles */}
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Bottom handles */}
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Left handles */}
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-amber-500 !border-2 !border-slate-700 transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-amber-400"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.4)",
          }}
          isConnectable={true}
        />

        {/* 📚 COMPACT ACADEMIC HEADER */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1 bg-amber-100/80 rounded px-2 py-1 border border-amber-200/60">
              <FileText size={14} className="text-amber-800" />
              <BookOpen size={12} className="text-amber-700" />
            </div>
            <div
              className="font-bold text-sm text-slate-800 leading-tight line-clamp-2"
              style={{ fontFamily: '"Crimson Text", serif' }}
            >
              {data.title || data.label}
            </div>
          </div>

          {data.onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                const deleteTimeout = setTimeout(() => {
                  e.stopPropagation();
                  data.onDelete();
                }, 300);
                e.currentTarget.deleteTimeout = deleteTimeout;
              }}
              onDoubleClick={(e) => {
                if (e.currentTarget.deleteTimeout) {
                  clearTimeout(e.currentTarget.deleteTimeout);
                  e.currentTarget.deleteTimeout = null;
                }
              }}
              className="p-1 hover:bg-amber-100 rounded-lg transition-all duration-200"
            >
              <X size={14} className="text-slate-600" />
            </motion.button>
          )}
        </div>

        {/* 👨‍💼 COMPACT AUTHORS & YEAR */}
        {data.authors && (
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-700">
            <Users size={12} className="text-amber-700" />
            <span className="italic font-medium truncate">
              {(() => {
                const authors = Array.isArray(data.authors)
                  ? data.authors.join(", ")
                  : data.authors;
                return authors.length > 30
                  ? `${authors.substring(0, 30)}...`
                  : authors;
              })()}
            </span>
            {data.year && (
              <span className="text-slate-600 font-semibold">
                ({data.year})
              </span>
            )}
          </div>
        )}

        {/* � COMPACT JOURNAL INFO */}
        {data.journal && (
          <div className="text-xs text-slate-700 bg-amber-50/60 rounded px-2 py-1 mb-2 truncate">
            <span className="font-medium italic">{data.journal}</span>
            {data.volume && (
              <span className="ml-1 text-slate-600">Vol.{data.volume}</span>
            )}
          </div>
        )}

        {/* 🏷️ COMPACT KEYWORDS */}
        {(() => {
          const keywordsOrTags = data.keywords || data.tags || [];
          const keywords = Array.isArray(keywordsOrTags) ? keywordsOrTags : [];

          return (
            keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {keywords.slice(0, 2).map((keyword, index) => (
                  <span
                    key={index}
                    className="text-xs bg-slate-200/60 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300/40"
                  >
                    {keyword.length > 12
                      ? `${keyword.substring(0, 12)}...`
                      : keyword}
                  </span>
                ))}
                {keywords.length > 2 && (
                  <span className="text-xs bg-slate-200/60 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300/40">
                    +{keywords.length - 2}
                  </span>
                )}
              </div>
            )
          );
        })()}

        {/* 📊 COMPACT CITATION TOOLTIP */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.3 },
          }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 mt-2"
        >
          <div className="text-xs bg-slate-700 text-white rounded py-1 px-2 border border-slate-600">
            <div className="italic line-clamp-1">
              {data.authors && Array.isArray(data.authors)
                ? data.authors[0]
                : "Author"}{" "}
              et al.
              {data.year && ` (${data.year})`}
              {data.journal && `, ${data.journal.substring(0, 20)}...`}
            </div>
          </div>
        </motion.div>

        {/* 🕐 LAST UPDATED with academic styling */}
        {data.updated_at && (
          <div className="absolute bottom-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-6 h-6 bg-amber-100/80 rounded-full flex items-center justify-center border border-amber-200/60">
              <Calendar size={12} className="text-amber-700" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiteratureNode;
