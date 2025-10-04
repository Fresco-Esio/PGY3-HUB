import React from "react";
import { Handle, Position } from "@xyflow/react";
import { BookOpen, X, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const CircularLiteratureNode = ({ data, selected }) => {
  const isExpanded = data.isExpanded || false;

  const baseSize = 115; // Medium size for literature
  const expandedSize = 290;

  return (
    <motion.div
      className={`relative cursor-pointer ${selected ? "z-50" : "z-10"}`}
      animate={{
        width: isExpanded ? expandedSize : baseSize,
        height: isExpanded ? expandedSize : baseSize,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)", zIndex: -1 }}
      />

      {/* Circular Node Container */}
      <motion.div
        className={`
          w-full h-full rounded-full
          flex flex-col items-center justify-center
          border-4 transition-all duration-300
          ${selected 
            ? "border-purple-400 shadow-2xl ring-4 ring-purple-200" 
            : "border-purple-300 shadow-lg hover:shadow-xl"
          }
        `}
        style={{
          background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
        }}
        whileHover={{ scale: isExpanded ? 1 : 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {!isExpanded ? (
          // Collapsed State
          <div className="flex flex-col items-center justify-center text-center p-3">
            <BookOpen size={30} className="text-white mb-2" />
            <div className="text-white font-semibold text-xs leading-tight line-clamp-2 max-w-full px-2">
              {data.label || data.title || "Literature"}
            </div>
            {data.year && (
              <div className="text-purple-100 text-xs mt-1">
                ({data.year})
              </div>
            )}
          </div>
        ) : (
          // Expanded State
          <div className="w-full h-full p-5 overflow-y-auto text-white relative">
            {/* Hint text */}
            <div className="absolute top-2 right-2 text-xs text-purple-200">
              Click to collapse
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={20} />
              <div className="font-bold text-sm leading-tight">
                {data.label || data.title || "Literature"}
              </div>
            </div>

            {/* Authors */}
            {data.authors && (
              <div className="mb-3 flex items-start gap-2">
                <Users size={14} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  {Array.isArray(data.authors) ? data.authors.join(', ') : data.authors}
                </div>
              </div>
            )}

            {/* Year & Publication */}
            <div className="mb-3 space-y-1">
              {data.year && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} />
                  <span>{data.year}</span>
                </div>
              )}
              {data.publication && (
                <div className="text-sm italic text-purple-100">
                  {data.publication}
                </div>
              )}
            </div>

            {/* Abstract/Description */}
            {(data.abstract || data.description) && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Abstract:</div>
                <div className="text-xs bg-white/10 rounded p-2 leading-relaxed">
                  {data.abstract || data.description}
                </div>
              </div>
            )}

            {/* Keywords/Tags */}
            {data.keywords && data.keywords.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Keywords:</div>
                <div className="flex flex-wrap gap-1">
                  {data.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-purple-800/50 px-2 py-0.5 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DOI/Link */}
            {data.doi && (
              <div className="text-xs bg-white/10 rounded p-2">
                <span className="font-semibold">DOI: </span>
                <span className="break-all">{data.doi}</span>
              </div>
            )}

            {/* PDF Available */}
            {data.pdf_path && (
              <div className="mt-2 text-xs text-green-300">
                📄 PDF Available
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

export default CircularLiteratureNode;
