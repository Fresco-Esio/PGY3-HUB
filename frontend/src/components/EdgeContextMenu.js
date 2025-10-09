import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Tag } from 'lucide-react';

/**
 * EdgeContextMenu - Beautiful right-click context menu for edges
 * 
 * Features:
 * - Smooth fade-in/scale animation
 * - Backdrop blur effect
 * - Hover animations on menu items
 * - Auto-closes on click outside
 * - Keyboard support (Escape to close)
 */
const EdgeContextMenu = ({ 
  position, 
  edge, 
  onEditLabel, 
  onDelete, 
  onClose 
}) => {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Close on escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!position || !edge) return null;

  const menuItems = [
    {
      icon: Edit2,
      label: 'Edit Label',
      description: 'Add or change connection label',
      onClick: () => {
        console.log('🏷️ [EdgeContextMenu] Edit Label clicked, calling onEditLabel');
        onEditLabel(edge);
        console.log('🏷️ [EdgeContextMenu] Closing context menu');
        onClose();
      },
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Trash2,
      label: 'Delete Connection',
      description: 'Remove this edge',
      onClick: () => {
        onDelete(edge);
        onClose();
      },
      color: 'red',
      gradient: 'from-red-500 to-rose-500',
      danger: true,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ 
          duration: 0.2, 
          ease: [0.16, 1, 0.3, 1] // Custom easing for smooth feel
        }}
        className="fixed z-[9999] min-w-[240px]"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transformOrigin: 'top left',
        }}
      >
        {/* Backdrop blur container */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl rounded-2xl" />
          
          {/* Main menu container */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
            {/* Header with edge info */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-300">
                  Connection Options
                </span>
              </div>
              {edge.label && (
                <div className="mt-1 text-xs text-slate-500 truncate">
                  "{edge.label}"
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    onClick={item.onClick}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      x: 4,
                      transition: { duration: 0.2, ease: 'easeOut' }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full px-4 py-3 flex items-start gap-3 transition-all duration-200
                      ${item.danger 
                        ? 'hover:bg-red-500/10 active:bg-red-500/20' 
                        : 'hover:bg-blue-500/10 active:bg-blue-500/20'
                      }
                      group
                    `}
                  >
                    {/* Icon with gradient background */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                      bg-gradient-to-br ${item.gradient}
                      shadow-lg shadow-${item.color}-500/20
                      group-hover:shadow-${item.color}-500/40
                      group-hover:scale-110
                      transition-all duration-200
                    `}>
                      <Icon size={16} className="text-white" />
                    </div>

                    {/* Text content */}
                    <div className="flex-1 text-left">
                      <div className={`
                        text-sm font-medium transition-colors duration-200
                        ${item.danger ? 'text-red-300 group-hover:text-red-200' : 'text-slate-200 group-hover:text-white'}
                      `}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className={`
                        w-1 h-8 rounded-full self-center
                        bg-gradient-to-b ${item.gradient}
                      `}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/30">
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400 font-mono">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EdgeContextMenu;
