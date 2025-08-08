import React, { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { Brain, Tag, Clock, X, BookOpen, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const TopicNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);

  // Entry animation - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  const completionPercentage =
    data.flashcard_count > 0
      ? ((data.completed_flashcards || 0) / data.flashcard_count) * 100
      : 0;

  return (
    <motion.div
      initial={
        data.skipAnimation
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.8, y: 20 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: data.skipAnimation ? 0 : 0.1,
      }}
      whileHover={{
        scale: 1.06,
        y: -3,
        transition: { duration: 0.2 },
      }}
      className={`group relative min-w-[260px] max-w-[300px] cursor-pointer ${
        selected ? "z-10" : "z-0"
      }`}
    >
      {/* 🎨 ARTISTIC TOPIC CONTAINER with midnight blue → indigo gradient */}
      <div
        className={`
          relative px-6 py-5 rounded-2xl backdrop-blur-sm
          border-2 transition-all duration-400 overflow-hidden
          shadow-lg hover:shadow-2xl
          ${
            selected
              ? "border-indigo-300 shadow-indigo-500/30 ring-4 ring-indigo-200/60"
              : "border-indigo-200/40 hover:border-indigo-300/70"
          }
        `}
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 20%, #312e81 60%, #4338ca 85%, #6366f1 100%)",
          boxShadow: selected
            ? "0 12px 28px -8px rgba(67, 56, 202, 0.4), 0 8px 16px -8px rgba(67, 56, 202, 0.3)"
            : "0 6px 20px -6px rgba(67, 56, 202, 0.25), 0 4px 8px -4px rgba(67, 56, 202, 0.1)",
        }}
      >
        {/* 🌟 KNOWLEDGE GLOW EFFECT */}
        <div
          className={`
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
            transition-opacity duration-400 pointer-events-none
          `}
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)",
          }}
        />

        {/* 🔗 ENHANCED CONNECTION HANDLES with indigo theme */}
        {/* Top handles */}
        <Handle
          id="top"
          type="source"
          position={Position.Top}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Right handles */}
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Bottom handles */}
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Left handles */}
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-indigo-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-indigo-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(67, 56, 202, 0.4)",
          }}
          isConnectable={true}
        />

        {/* 📚 TOPIC HEADER with knowledge icons */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Lightbulb size={20} className="text-yellow-300" />
              </motion.div>
              <BookOpen size={18} className="text-indigo-200" />
            </div>
            <div className="font-bold text-xl text-white leading-tight">
              {data.label}
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
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <X size={16} className="text-indigo-100" />
            </motion.button>
          )}
        </div>

        {/* 📝 TOPIC DESCRIPTION */}
        {data.description && (
          <div className="text-sm text-indigo-100 mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm leading-relaxed">
            {data.description}
          </div>
        )}

        {/* 🏷️ CATEGORY TAG */}
        {data.category && (
          <div className="flex items-center gap-2 mb-4">
            <Tag size={14} className="text-indigo-200" />
            <span className="text-xs font-semibold text-indigo-200 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
              {data.category.toUpperCase()}
            </span>
          </div>
        )}

        {/* 📊 PROGRESS VISUALIZATION */}
        {data.flashcard_count > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-indigo-100">
              <span className="font-medium">Learning Progress</span>
              <span className="font-bold">
                {Math.round(completionPercentage)}%
              </span>
            </div>

            {/* Enhanced progress bar */}
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm border border-white/30">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="text-xs text-indigo-200 mt-1 flex justify-between">
                <span>{data.completed_flashcards || 0} completed</span>
                <span>{data.flashcard_count} total</span>
              </div>
            </div>
          </div>
        )}

        {/* 🧠 BRAIN ACTIVITY INDICATOR */}
        <div className="absolute bottom-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <Brain size={16} className="text-indigo-200" />
          </motion.div>
        </div>

        {/* 🕐 LAST UPDATED with enhanced styling */}
        {data.updated_at && (
          <div className="absolute bottom-2 left-3 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Clock size={12} className="text-indigo-100" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TopicNode;
