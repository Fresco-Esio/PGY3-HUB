import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotesEditor Component
 * 
 * Collapsible rich text editor for personal notes and reflections.
 * Designed to be compact and unobtrusive in the Related tab.
 * 
 * @param {string} value - Current HTML content of notes
 * @param {function} onChange - Callback when notes change (html) => void
 * @param {string} placeholder - Placeholder text for empty notes
 */
const NotesEditor = ({ value, onChange, placeholder = "Add your notes here..." }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Check if there are notes
  const hasNotes = value && value.trim().length > 0;
  const notePreview = value ? value.substring(0, 100).replace(/<[^>]*>/g, '') : '';

  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={16} className="text-slate-400" />
          ) : (
            <ChevronRight size={16} className="text-slate-400" />
          )}
          <FileText size={16} className="text-cyan-400" />
          <span className="text-sm font-medium text-slate-300">
            Personal Notes
          </span>
          {hasNotes && !isExpanded && (
            <span className="text-xs text-slate-500 italic">
              ({notePreview}...)
            </span>
          )}
        </div>
        {hasNotes && (
          <span className="text-xs bg-cyan-600/20 text-cyan-300 px-2 py-1 rounded">
            {value.length} chars
          </span>
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <textarea
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                rows={6}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2 italic">
                Add clinical notes, reflections, or personal observations about this case.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesEditor;
