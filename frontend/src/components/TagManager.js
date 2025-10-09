import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Tag, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TagManager Component
 * 
 * Compact tag management with add/remove functionality.
 * Collapsible to save space when not in use.
 * 
 * @param {string[]} tags - Array of tag strings
 * @param {function} onChange - Callback when tags change (tags) => void
 * @param {string[]} suggestions - Optional suggested tags based on node type
 */
const TagManager = ({ tags = [], onChange, suggestions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = useCallback(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  }, [inputValue, tags, onChange]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  }, [tags, onChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!tags.includes(suggestion)) {
      onChange([...tags, suggestion]);
    }
  };

  // Tag color variants for visual variety
  const tagColors = [
    'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'bg-purple-600/20 text-purple-300 border-purple-500/30',
    'bg-pink-600/20 text-pink-300 border-pink-500/30',
    'bg-orange-600/20 text-orange-300 border-orange-500/30',
    'bg-green-600/20 text-green-300 border-green-500/30',
    'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
  ];

  const getTagColor = (index) => tagColors[index % tagColors.length];

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
          <Tag size={16} className="text-purple-400" />
          <span className="text-sm font-medium text-slate-300">
            Tags
          </span>
          {tags.length > 0 && (
            <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
              {tags.length}
            </span>
          )}
        </div>
        {/* Mini tag preview when collapsed */}
        {!isExpanded && tags.length > 0 && (
          <div className="flex gap-1 flex-wrap max-w-[60%]">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded border bg-slate-700/50 text-slate-300 border-slate-600"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-slate-500">+{tags.length - 3}</span>
            )}
          </div>
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
            <div className="px-4 pb-4 space-y-3">
              {/* Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a tag and press Enter..."
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!inputValue.trim()}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                  <span className="text-sm">Add</span>
                </button>
              </div>

              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${getTagColor(idx)}`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Suggested Tags */}
              {suggestions.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions
                      .filter(s => !tags.includes(s))
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded border border-slate-600 hover:border-slate-500 transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {tags.length === 0 && (
                <p className="text-xs text-slate-500 italic">
                  No tags yet. Add tags to organize and categorize this case.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TagManager;
