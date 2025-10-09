import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

const EdgeLabelModal = ({ isOpen, edge, onSave, onClose }) => {
  const [label, setLabel] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    console.log('🏷️ Modal state changed:', { isOpen, edge: edge?.id });
    if (isOpen && edge) {
      setLabel(edge.label || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, edge]);

  const handleSave = () => {
    onSave(edge, label.trim());
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && edge && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] w-full max-w-sm px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl rounded-xl -z-10" />
              
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Edit Connection Label</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {edge.sourceLabel} → {edge.targetLabel}
                </p>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., leads to, causes, related to..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mb-3"
                maxLength={50}
              />

              <div className="flex items-center justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium text-sm transition-colors flex items-center gap-1.5"
                >
                  <X size={14} />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={!label.trim()}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                    label.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check size={14} />
                  Save
                </motion.button>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 text-center">
                Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400 font-mono">Enter</kbd> to save • <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400 font-mono">ESC</kbd> to cancel
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EdgeLabelModal;
