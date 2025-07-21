// Enhanced Literature Modal with tabbed interface and advanced animations
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Eye, 
  StickyNote, 
  Link2, 
  FileText, 
  Tag, 
  Calendar,
  User,
  Search,
  Filter,
  ExternalLink,
  Download
} from 'lucide-react';

// Animation variants for Framer Motion
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    y: 50,
    rotate: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.6,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: 30,
    rotate: -3,
    transition: {
      type: "easeInOut",
      duration: 0.4,
    }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.4 }
  }
};

const tabContentVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "easeOut",
      duration: 0.3,
      delay: 0.1,
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 1.02,
    transition: {
      type: "easeIn",
      duration: 0.2,
    }
  }
};

const literatureCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "easeOut",
      duration: 0.5,
      delay: index * 0.05, // Staggered animation
    }
  }),
  hover: {
    y: -2,
    scale: 1.02,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    transition: {
      type: "easeOut",
      duration: 0.2,
    }
  }
};

const tabButtonVariants = {
  inactive: {
    scale: 1,
    backgroundColor: "transparent",
  },
  active: {
    scale: 1.05,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    }
  },
  hover: {
    scale: 1.03,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    transition: {
      type: "easeOut",
      duration: 0.2,
    }
  }
};

const LiteratureModal = ({ 
  isOpen, 
  onClose, 
  literatureData, 
  allNodes = [], 
  connections = [],
  onAnimationStart,
  onAnimationEnd
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Enhanced tab switching with smooth animation
  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab || isAnimating) return;
    
    setIsAnimating(true);
    if (onAnimationStart) onAnimationStart();
    
    // Brief pause for exit animation, then switch
    setTimeout(() => {
      setActiveTab(newTab);
      // Animation completes after content loads
      setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 350); // Total animation duration
    }, 50);
  };

  // Enhanced close handler with proper animation sequencing
  const handleClose = () => {
    if (onAnimationStart) onAnimationStart();
    setIsVisible(false);
    setIsAnimating(true);
    
    // Call onClose after exit animation completes
    setTimeout(() => {
      onClose();
      if (onAnimationEnd) onAnimationEnd();
      setIsAnimating(false);
    }, 400); // Match exit animation duration
  };

  // Get connected nodes for this literature item
  const connectedNodes = useMemo(() => {
    if (!literatureData?.id) return [];
    
    const literatureNodeId = `literature-${literatureData.id}`;
    const connectedNodeIds = connections
      .filter(conn => 
        conn.source === literatureNodeId || conn.target === literatureNodeId
      )
      .map(conn => 
        conn.source === literatureNodeId ? conn.target : conn.source
      );
    
    return allNodes.filter(node => connectedNodeIds.includes(node.id));
  }, [literatureData, allNodes, connections]);

  // Extract keywords from connected nodes
  const extractedKeywords = useMemo(() => {
    const keywords = new Set();
    
    connectedNodes.forEach(node => {
      const data = node.data;
      
      // Extract from different node types
      if (node.type === 'case') {
        if (data.primary_diagnosis) keywords.add(data.primary_diagnosis.toLowerCase());
        if (data.secondary_diagnoses) {
          data.secondary_diagnoses.forEach(diag => keywords.add(diag.toLowerCase()));
        }
        if (data.chief_complaint) {
          // Extract key terms from chief complaint
          const terms = data.chief_complaint.toLowerCase().match(/\b\w{4,}\b/g) || [];
          terms.forEach(term => keywords.add(term));
        }
      } else if (node.type === 'topic') {
        if (data.title) keywords.add(data.title.toLowerCase());
        if (data.category) keywords.add(data.category.toLowerCase());
        if (data.tags) {
          data.tags.forEach(tag => keywords.add(tag.toLowerCase()));
        }
      }
    });
    
    return Array.from(keywords).filter(keyword => keyword.length > 3);
  }, [connectedNodes]);

  // Find related literature based on keywords
  const relatedLiterature = useMemo(() => {
    if (extractedKeywords.length === 0) return [];
    
    return allNodes
      .filter(node => 
        node.type === 'literature' && 
        node.data.id !== literatureData?.id
      )
      .map(node => {
        const data = node.data;
        let relevanceScore = 0;
        
        // Check title, abstract, keywords for matches
        const searchText = [
          data.title || '',
          data.abstract || '',
          data.keywords || '',
          data.authors || ''
        ].join(' ').toLowerCase();
        
        extractedKeywords.forEach(keyword => {
          if (searchText.includes(keyword)) {
            relevanceScore++;
          }
        });
        
        return { ...data, relevanceScore };
      })
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Limit to top 8 results
  }, [extractedKeywords, allNodes, literatureData]);

  // Filter related literature
  const filteredRelatedLiterature = useMemo(() => {
    let filtered = relatedLiterature;
    
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(item => 
        item.type?.toLowerCase() === filterType.toLowerCase()
      );
    }
    
    return filtered;
  }, [relatedLiterature, searchQuery, filterType]);

  // Get publication type color
  const getTypeColor = (type) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800 border-red-200',
      'guideline': 'bg-blue-100 text-blue-800 border-blue-200',
      'rct': 'bg-green-100 text-green-800 border-green-200',
      'review': 'bg-purple-100 text-purple-800 border-purple-200',
      'meta-analysis': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'case-study': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'pdf', label: 'PDF Viewer', icon: Eye },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'related', label: 'Related', icon: Link2, badge: relatedLiterature.length }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
      {isVisible && (
        <motion.div 
          key={`modal-${literatureData?.id || 'default'}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div 
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalVariants}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onAnimationStart={() => {
              setIsAnimating(true);
              if (onAnimationStart) onAnimationStart();
            }}
            onAnimationComplete={() => {
              setIsAnimating(false);
              if (onAnimationEnd) onAnimationEnd();
            }}
          >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{literatureData.title || 'Literature Item'}</h2>
              <div className="flex items-center gap-4 text-purple-100">
                {literatureData.authors && (
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span className="text-sm">{literatureData.authors}</span>
                  </div>
                )}
                {literatureData.year && (
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span className="text-sm">{literatureData.year}</span>
                  </div>
                )}
                {literatureData.type && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(literatureData.type)}`}>
                    {literatureData.type.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-purple-200 hover:text-white transition-all duration-200 p-2 hover:bg-purple-600 rounded-lg transform hover:scale-110 active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  variants={tabButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.badge > 0 && (
                    <motion.span 
                      className="bg-purple-100 text-purple-600 text-xs font-medium px-2 py-1 rounded-full"
                      whileHover={{ scale: 1.1 }}
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Animation */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={tabContentVariants}
              className="space-y-6"
            >
              {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Abstract */}
              {literatureData.abstract && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                  <p className="text-gray-700 leading-relaxed">{literatureData.abstract}</p>
                </div>
              )}

              {/* Keywords */}
              {literatureData.keywords && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {literatureData.keywords.split(',').map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Publication Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Publication Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {literatureData.journal && (
                    <div>
                      <span className="font-medium text-gray-600">Journal:</span>
                      <span className="ml-2 text-gray-900">{literatureData.journal}</span>
                    </div>
                  )}
                  {literatureData.doi && (
                    <div>
                      <span className="font-medium text-gray-600">DOI:</span>
                      <span className="ml-2 text-gray-900">{literatureData.doi}</span>
                    </div>
                  )}
                  {literatureData.volume && (
                    <div>
                      <span className="font-medium text-gray-600">Volume:</span>
                      <span className="ml-2 text-gray-900">{literatureData.volume}</span>
                    </div>
                  )}
                  {literatureData.pages && (
                    <div>
                      <span className="font-medium text-gray-600">Pages:</span>
                      <span className="ml-2 text-gray-900">{literatureData.pages}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Nodes */}
              {connectedNodes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Connected To</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {connectedNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          node.type === 'case' ? 'bg-indigo-500' :
                          node.type === 'topic' ? 'bg-blue-500' :
                          node.type === 'task' ? 'bg-amber-500' : 'bg-purple-500'
                        }`} />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{node.data.label || node.data.title}</div>
                          <div className="text-xs text-gray-500 capitalize">{node.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="text-center py-8">
              <Eye size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Viewer</h3>
              <p className="text-gray-600 mb-4">PDF viewing functionality will be implemented here</p>
              {literatureData.pdf_url && (
                <div className="space-y-3">
                  <a
                    href={literatureData.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="enhanced-button inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
                  >
                    <ExternalLink size={16} />
                    Open PDF in New Tab
                  </a>
                  <div className="text-sm text-gray-500">
                    Or implement an embedded PDF viewer here
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Notes</h3>
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Add your notes about this literature item..."
                defaultValue={literatureData.notes || ''}
              />
              <div className="mt-4 flex justify-end">
                <button className="enhanced-button bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium">
                  Save Notes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Related Literature</h3>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search related..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48"
                    />
                  </div>
                  
                  {/* Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="guideline">Guideline</option>
                    <option value="rct">RCT</option>
                    <option value="review">Review</option>
                    <option value="meta-analysis">Meta-Analysis</option>
                  </select>
                </div>
              </div>

              {/* Keywords used for matching */}
              {extractedKeywords.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Matching based on connected nodes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {extractedKeywords.slice(0, 10).map((keyword, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                    {extractedKeywords.length > 10 && (
                      <span className="text-blue-600 text-xs">+{extractedKeywords.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Related Literature List */}
              {filteredRelatedLiterature.length > 0 ? (
                <div className="space-y-4">
                  {filteredRelatedLiterature.map((item, index) => (
                    <motion.div
                      key={index}
                      variants={literatureCardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      custom={index}
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.authors} • {item.year}</p>
                          {item.abstract && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {item.abstract.substring(0, 150)}...
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {item.type && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                                {item.type.toUpperCase()}
                              </span>
                            )}
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                              {item.relevanceScore} match{item.relevanceScore !== 1 ? 'es' : ''}
                            </span>
                          </div>
                        </div>
                        <button className="ml-4 p-2 text-gray-400 hover:text-purple-600 transition-colors">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link2 size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Related Literature Found</h4>
                  <p className="text-gray-600">
                    {extractedKeywords.length === 0 
                      ? "Connect this literature to topics or cases to find related items"
                      : "No literature found matching the keywords from connected nodes"
                    }
                  </p>
                </div>
              )}
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiteratureModal;
