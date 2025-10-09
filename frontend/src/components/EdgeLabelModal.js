import React, { useState, useEffect, useRef } from 'react';import React, { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';import { motion, AnimatePresence } from 'framer-motion';

import { Check, X } from 'lucide-react';import { Check, X, Tag } from 'lucide-react';



/**/**

 * EdgeLabelModal - Super simple inline label editor * EdgeLabelModal - Simplified inline label editor

 *  * 

 * Just a text input with save/cancel buttons - no complexity! * Features:

 */ * - Appears near center of screen

const EdgeLabelModal = ({  * - Simple input with save/cancel buttons

  isOpen,  * - Keyboard shortcuts (Enter to save, Escape to cancel)

  edge,  * - Auto-focus and auto-select existing label

  onSave,  */

  onClose const EdgeLabelModal = ({ 

}) => {  isOpen, 

  const [label, setLabel] = useState('');  edge, 

  const inputRef = useRef(null);  onSave, 

  onClose 

  useEffect(() => {}) => {

    if (isOpen && edge) {  const [label, setLabel] = useState('');

      setLabel(edge.label || '');  const inputRef = useRef(null);

      // Focus input after animation

      setTimeout(() => {  useEffect(() => {

        if (inputRef.current) {    if (isOpen && edge) {

          inputRef.current.focus();      setLabel(edge.label || '');

          inputRef.current.select();      // Focus input after animation

        }      setTimeout(() => {

      }, 50);        if (inputRef.current) {

    }          inputRef.current.focus();

  }, [isOpen, edge]);          inputRef.current.select();

        }

  const handleSave = () => {      }, 50);

    onSave(edge, label.trim());    }

    onClose();  }, [isOpen, edge]);

  };

  const handleSave = () => {

  const handleKeyDown = (e) => {    onSave(edge, label.trim());

    if (e.key === 'Enter') {    onClose();

      e.preventDefault();  };

      handleSave();

    } else if (e.key === 'Escape') {  const handleKeyDown = (e) => {

      onClose();    if (e.key === 'Enter') {

    }      e.preventDefault();

  };      handleSave();

    } else if (e.key === 'Escape') {

  if (!isOpen || !edge) return null;      onClose();

    }

  return (  };

    <AnimatePresence>

      {isOpen && (  if (!isOpen || !edge) return null;

        <>

          {/* Backdrop */}  return (

          <motion.div    <AnimatePresence>

            initial={{ opacity: 0 }}      {isOpen && (

            animate={{ opacity: 1 }}        <>

            exit={{ opacity: 0 }}          {/* Backdrop */}

            transition={{ duration: 0.15 }}          <motion.div

            className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm"            initial={{ opacity: 0 }}

            onClick={onClose}            animate={{ opacity: 1 }}

          />            exit={{ opacity: 0 }}

            transition={{ duration: 0.15 }}

          {/* Simple inline editor */}            className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm"

          <motion.div            onClick={onClose}

            initial={{ opacity: 0, scale: 0.95, y: -20 }}          />

            animate={{ opacity: 1, scale: 1, y: 0 }}

            exit={{ opacity: 0, scale: 0.95, y: -20 }}          {/* Inline Editor - Centered */}

            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}          <motion.div

            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] w-full max-w-sm px-4"            initial={{ opacity: 0, scale: 0.95, y: -20 }}

            onClick={(e) => e.stopPropagation()}            animate={{ opacity: 1, scale: 1, y: 0 }}

          >            exit={{ opacity: 0, scale: 0.95, y: -20 }}

            {/* Card */}            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}

            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-4">            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] w-full max-w-md px-4"

              {/* Glow effect */}            onClick={(e) => e.stopPropagation()}

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl rounded-xl -z-10" />          >

                          {/* Glow effect */}

              {/* Header */}            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl rounded-2xl" />

              <div className="mb-3">

                <h3 className="text-sm font-semibold text-white">          {/* Content */}

                  Edit Connection Label          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">

                </h3>            {/* Header */}

                <p className="text-xs text-slate-400 mt-0.5">            <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700/50">

                  {edge.sourceLabel} → {edge.targetLabel}              <div className="flex items-center justify-between">

                </p>                <div className="flex items-center gap-3">

              </div>                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">

                    <Tag size={20} className="text-white" />

              {/* Input */}                  </div>

              <input                  <div>

                ref={inputRef}                    <h3 className="text-lg font-bold text-white">

                type="text"                      Label Connection

                value={label}                    </h3>

                onChange={(e) => setLabel(e.target.value)}                    <p className="text-xs text-slate-400 mt-0.5">

                onKeyDown={handleKeyDown}                      Describe the relationship between nodes

                placeholder="e.g., leads to, causes, related to..."                    </p>

                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mb-3"                  </div>

                maxLength={50}                </div>

              />                <motion.button

                  whileHover={{ scale: 1.1, rotate: 90 }}

              {/* Buttons */}                  whileTap={{ scale: 0.9 }}

              <div className="flex items-center justify-end gap-2">                  onClick={onClose}

                <motion.button                  className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"

                  whileHover={{ scale: 1.05 }}                >

                  whileTap={{ scale: 0.95 }}                  <X size={18} />

                  onClick={onClose}                </motion.button>

                  className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium text-sm transition-colors flex items-center gap-1.5"              </div>

                >            </div>

                  <X size={14} />

                  Cancel            {/* Body */}

                </motion.button>            <div className="p-6 space-y-5">

                <motion.button              {/* Connection info */}

                  whileHover={{ scale: 1.05 }}              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">

                  whileTap={{ scale: 0.95 }}                <div className="flex-1 text-center">

                  onClick={handleSave}                  <div className="text-xs text-slate-500 mb-1">From</div>

                  disabled={!label.trim()}                  <div className="text-sm font-medium text-white truncate">

                  className={`                    {edge.sourceLabel || edge.source}

                    px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all                  </div>

                    ${label.trim()                </div>

                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'                <ArrowRight size={20} className="text-slate-600 flex-shrink-0" />

                      : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'                <div className="flex-1 text-center">

                    }                  <div className="text-xs text-slate-500 mb-1">To</div>

                  `}                  <div className="text-sm font-medium text-white truncate">

                >                    {edge.targetLabel || edge.target}

                  <Check size={14} />                  </div>

                  Save                </div>

                </motion.button>              </div>

              </div>

              {/* Input field */}

              {/* Helper text */}              <div className="space-y-2">

              <div className="mt-2 text-[10px] text-slate-500 text-center">                <label className="block text-sm font-medium text-slate-300">

                Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400 font-mono">Enter</kbd> to save • <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400 font-mono">ESC</kbd> to cancel                  Connection Label

              </div>                </label>

            </div>                <div className="relative">

          </motion.div>                  <input

        </>                    ref={inputRef}

      )}                    type="text"

    </AnimatePresence>                    value={label}

  );                    onChange={(e) => setLabel(e.target.value)}

};                    onKeyDown={handleKeyDown}

                    placeholder="e.g., leads to, triggers, related to..."

export default EdgeLabelModal;                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"

                    maxLength={50}
                  />
                  {label && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setLabel('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-600 hover:bg-slate-500 flex items-center justify-center text-white transition-colors"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 font-mono">Enter</kbd> to save
                  </span>
                  <span className={`font-medium ${label.length > 40 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {label.length}/50
                  </span>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Quick Suggestions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <motion.button
                        key={suggestion.text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className={`
                          px-3 py-2 rounded-lg border transition-all
                          bg-${suggestion.color}-500/10 border-${suggestion.color}-500/30
                          hover:bg-${suggestion.color}-500/20 hover:border-${suggestion.color}-500/50
                          flex items-center gap-2 group
                        `}
                      >
                        <Icon size={14} className={`text-${suggestion.color}-400 group-hover:text-${suggestion.color}-300 transition-colors`} />
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                          {suggestion.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!label.trim() || isSaving}
                className={`
                  px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all
                  ${label.trim() && !isSaving
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={16} />
                    </motion.div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Label</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EdgeLabelModal;
