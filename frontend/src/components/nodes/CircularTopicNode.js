import React, { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { Brain, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CircularTopicNode = ({ data, selected }) => {
  const isExpanded = data.isExpanded || false;

  const baseSize = 120; // Base diameter for collapsed state
  const expandedSize = 300; // Expanded diameter

  return (
    <motion.div
      className={`relative cursor-pointer ${selected ? "z-50" : "z-10"}`}
      animate={{
        width: isExpanded ? expandedSize : baseSize,
        height: isExpanded ? expandedSize : baseSize,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Connection Handles - positioned at edges of circle */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)", zIndex: -1 }}
      />

      {/* Circular Node Container */}
      <motion.div
        className={`
          w-full h-full rounded-full
          flex flex-col items-center justify-center
          border-4 transition-all duration-300
          ${selected 
            ? "border-blue-400 shadow-2xl ring-4 ring-blue-200" 
            : "border-blue-300 shadow-lg hover:shadow-xl"
          }
        `}
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        }}
        whileHover={{ scale: isExpanded ? 1 : 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {!isExpanded ? (
          // Collapsed State
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Brain size={32} className="text-white mb-2" />
            <div className="text-white font-semibold text-sm leading-tight line-clamp-2">
              {data.title || data.label || "Topic"}
            </div>
            {data.category && (
              <div className="text-blue-100 text-xs mt-1 truncate max-w-full">
                {data.category}
              </div>
            )}
          </div>
        ) : (
          // Expanded State
          <div className="w-full h-full p-6 overflow-y-auto text-white relative">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Brain size={24} />
              <div className="font-bold text-base leading-tight">
                {data.title || data.label || "Topic"}
              </div>
            </div>

            {/* Category */}
            {data.category && (
              <div className="text-sm bg-white/20 rounded px-2 py-1 mb-2 inline-block">
                {data.category}
              </div>
            )}

            {/* Description */}
            {data.description && (
              <div className="text-sm leading-relaxed mb-3">
                {data.description}
              </div>
            )}

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-blue-800/50 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {data.goals && data.goals.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Goals:</div>
                <ul className="text-sm space-y-1">
                  {data.goals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-blue-300">•</span>
                      <span className="flex-1">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {data.notes && (
              <div className="text-xs bg-white/10 rounded p-2">
                <div className="font-semibold mb-1">Notes:</div>
                <div className="leading-relaxed">{data.notes}</div>
              </div>
            )}
          </div>
        )}

        {/* Delete button - only in collapsed state */}
        {!isExpanded && data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CircularTopicNode;
