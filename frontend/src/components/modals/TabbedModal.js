// Tabbed Modal Component - Unified tab system for all modals
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BaseModal from './BaseModal';

// Tab animation variants
const tabContentVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    }
  }
};

// Tab component
const Tab = ({ id, label, icon: Icon, isActive, onClick, badge = null }) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ y: 0 }}
    onClick={() => onClick(id)}
    className={`
      relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
      ${isActive 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
      }
    `}
  >
    {Icon && <Icon size={16} />}
    <span>{label}</span>
    {badge && (
      <span className={`
        px-2 py-1 rounded-full text-xs font-bold
        ${isActive ? 'bg-blue-800 text-blue-200' : 'bg-slate-700 text-slate-300'}
      `}>
        {badge}
      </span>
    )}
    
    {/* Active indicator */}
    {isActive && (
      <motion.div
        className="absolute -bottom-2 left-1/2 w-2 h-2 bg-blue-400 rounded-full"
        layoutId="activeTab"
        style={{ transform: 'translateX(-50%)' }}
      />
    )}
  </motion.button>
);

// Tabbed Modal Component
const TabbedModal = ({
  isOpen,
  onClose,
  title,
  icon,
  tabs = [],
  defaultTab = null,
  size = 'large',
  className = '',
  onTabChange = null,
  ...modalProps
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const contentRefs = useRef({});

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  // Reset to default tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab || tabs[0]?.id);
    }
  }, [isOpen, defaultTab, tabs]);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      size={size}
      className={className}
      {...modalProps}
    >
      <div className="flex h-[calc(90vh-120px)]">
        {/* Tab Navigation */}
        <div className="w-64 bg-slate-800/50 border-r border-slate-700 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={handleTabChange}
                badge={tab.badge}
              />
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTabData && (
              <motion.div
                key={activeTab}
                ref={el => contentRefs.current[activeTab] = el}
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full overflow-y-auto"
              >
                {activeTabData.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BaseModal>
  );
};

export default TabbedModal;