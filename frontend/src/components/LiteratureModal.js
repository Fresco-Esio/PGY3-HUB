// Enhanced Literature Modal with tabbed interface and advanced animations
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Download,
  Edit3,
  Save,
  Trash2,
  Plus,
  Brain,
  Users,
  Target,
} from "lucide-react";

import useAnimatedModalHeight from "../hooks/useAnimatedModalHeight";
// Import Notes and Tags components
import NotesEditor from "./NotesEditor";
import TagManager from "./TagManager";

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
    },
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: 30,
    rotate: -3,
    transition: {
      type: "easeInOut",
      duration: 0.4,
    },
  },
};

const backdropVariants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    backdropFilter: "blur(8px)",
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

const tabVariants = {
  hidden: {
    opacity: 0,
    x: -30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const LiteratureModal = ({
  isOpen,
  onClose,
  literatureData,
  allNodes = [],
  connections = [],
  setMindMapData,
  autoSaveMindMapData,
  addToast,
  onAnimationStart,
  onAnimationEnd,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const {
    headerRef,
    tabsRef,
    contentWrapperRef,
    getPanelRef,
    saveScrollFor,
    restoreScrollFor,
    animateProps,
  } = useAnimatedModalHeight({ isOpen, activeTab });

  // Editable form data
  const [formData, setFormData] = useState({
    title: "",
    authors: [],
    year: "",
    journal: "",
    abstract: "",
    keywords: "",
    doi: "",
    volume: "",
    pages: "",
    notes: "",
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && literatureData && !hasInitialized) {
      setFormData({
        title: literatureData.title || "",
        authors: Array.isArray(literatureData.authors)
          ? literatureData.authors
          : literatureData.authors
          ? [literatureData.authors]
          : [],
        year: literatureData.year || "",
        journal: literatureData.journal || "",
        abstract: literatureData.abstract || "",
        keywords: literatureData.keywords || "",
        doi: literatureData.doi || "",
        volume: literatureData.volume || "",
        pages: literatureData.pages || "",
        notes: literatureData.notes || "",
      });
      setActiveTab("overview");
      setHasInitialized(true);

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else if (!isOpen) {
      setIsVisible(false);
      setHasInitialized(false);
      setIsEditing(false);
    }
  }, [isOpen, literatureData, hasInitialized]);

  // Save changes to literature data
  const handleSave = useCallback(() => {
    if (!literatureData || !setMindMapData) return;

    const updatedLiterature = {
      ...literatureData,
      title: formData.title,
      authors: formData.authors,
      year: formData.year,
      journal: formData.journal,
      abstract: formData.abstract,
      keywords: formData.keywords,
      doi: formData.doi,
      volume: formData.volume,
      pages: formData.pages,
      notes: formData.notes,
    };

    setMindMapData((prevData) => {
      const newData = {
        ...prevData,
        literature: (prevData.literature || []).map((lit) =>
          lit.id === literatureData.id ? updatedLiterature : lit
        ),
      };

      // Auto-save with the updated data
      if (autoSaveMindMapData) {
        autoSaveMindMapData(newData);
      }

      return newData;
    });

    if (addToast) {
      addToast("Literature updated successfully!", "success");
    }

    setIsEditing(false);
  }, [formData, literatureData, setMindMapData, autoSaveMindMapData, addToast]);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle authors array changes
  const handleAuthorsChange = (authorsString) => {
    const authorsArray = authorsString
      .split(",")
      .map((author) => author.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      authors: authorsArray,
    }));
  };

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
    if (!literatureData || !connections) return [];

    // Create the full node ID for this literature item
    const fullNodeId = `literature-${literatureData.id}`;

    const relatedConnections = connections.filter(
      (conn) =>
        conn.source === fullNodeId || conn.target === fullNodeId
    );

    const nodeIds = relatedConnections.map((conn) =>
      conn.source === fullNodeId ? conn.target : conn.source
    );

    return allNodes.filter((node) => nodeIds.includes(node.id));
  }, [literatureData, connections, allNodes]);

  // Extract keywords from connected nodes for search relevance
  const extractedKeywords = useMemo(() => {
    const keywords = new Set();

    connectedNodes.forEach((node) => {
      const data = node.data;

      if (node.type === "case") {
        if (data.primary_diagnosis)
          keywords.add(data.primary_diagnosis.toLowerCase());
        if (data.secondary_diagnoses) {
          data.secondary_diagnoses.forEach((diag) =>
            keywords.add(diag.toLowerCase())
          );
        }
        if (data.chief_complaint) {
          // Extract key terms from chief complaint
          const terms =
            data.chief_complaint.toLowerCase().match(/\b\w{4,}\b/g) || [];
          terms.forEach((term) => keywords.add(term));
        }
      } else if (node.type === "topic") {
        if (data.title) keywords.add(data.title.toLowerCase());
        if (data.category) keywords.add(data.category.toLowerCase());
        if (data.tags) {
          data.tags.forEach((tag) => keywords.add(tag.toLowerCase()));
        }
      }
    });

    return Array.from(keywords).filter((keyword) => keyword.length > 3);
  }, [connectedNodes]);

  // Find related literature based on keywords
  const relatedLiterature = useMemo(() => {
    if (extractedKeywords.length === 0) return [];

    return allNodes
      .filter(
        (node) =>
          node.type === "literature" && node.data.id !== literatureData?.id
      )
      .map((node) => {
        const data = node.data;
        let relevanceScore = 0;

        // Check title, abstract, keywords for matches
        const searchText = [
          data.title || "",
          data.abstract || "",
          data.keywords || "",
          data.authors || "",
        ]
          .join(" ")
          .toLowerCase();

        extractedKeywords.forEach((keyword) => {
          if (searchText.includes(keyword)) {
            relevanceScore++;
          }
        });

        return { ...data, relevanceScore };
      })
      .filter((item) => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Limit to top 8 results
  }, [extractedKeywords, allNodes, literatureData]);

  // Filter related literature
  const filteredRelatedLiterature = useMemo(() => {
    let filtered = relatedLiterature;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.authors
            ?.join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.journal?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    return filtered;
  }, [relatedLiterature, searchQuery, filterType]);

  // Get type-specific styling
  const getTypeColor = (type) => {
    const colors = {
      "clinical-trial": "bg-blue-100 text-blue-800 border-blue-200",
      rct: "bg-green-100 text-green-800 border-green-200",
      review: "bg-purple-100 text-purple-800 border-purple-200",
      "meta-analysis": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "case-study": "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return (
      colors[type?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "pdf", label: "PDF Viewer", icon: Eye },
    { id: "notes", label: "Notes", icon: StickyNote },
    {
      id: "related",
      label: "Related",
      icon: Link2,
      badge: relatedLiterature.length,
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
      {isVisible && (
        <motion.div
          key={`modal-${literatureData?.id || "default"}`}
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
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
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
            {/* Enhanced Header with Dark Theme */}
            <div
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6"
              ref={headerRef}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleFieldChange("title", e.target.value)
                      }
                      className="text-2xl font-bold mb-2 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      placeholder="Literature title..."
                    />
                  ) : (
                    <h2 className="text-2xl font-bold mb-2">
                      {formData.title || "Literature Item"}
                    </h2>
                  )}

                  <div className="flex items-center gap-4 text-slate-300">
                    {isEditing ? (
                      <div className="flex flex-wrap gap-4">
                        <input
                          type="text"
                          value={formData.authors.join(", ")}
                          onChange={(e) => handleAuthorsChange(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          placeholder="Authors (comma separated)..."
                        />
                        <input
                          type="number"
                          value={formData.year}
                          onChange={(e) =>
                            handleFieldChange("year", e.target.value)
                          }
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white w-20 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          placeholder="Year"
                        />
                        <input
                          type="text"
                          value={formData.journal}
                          onChange={(e) =>
                            handleFieldChange("journal", e.target.value)
                          }
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          placeholder="Journal..."
                        />
                      </div>
                    ) : (
                      <>
                        {formData.authors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <User size={16} />
                            <span>
                              {formData.authors.slice(0, 3).join(", ")}
                              {formData.authors.length > 3 ? " et al." : ""}
                            </span>
                          </div>
                        )}
                        {formData.year && (
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{formData.year}</span>
                          </div>
                        )}
                        {formData.journal && (
                          <div className="flex items-center gap-1">
                            <BookOpen size={16} />
                            <span>{formData.journal}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      >
                        <Save size={16} />
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X size={16} />
                        Cancel
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Edit3 size={16} />
                      Edit
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </motion.button>
                </div>
              </div>

              {literatureData?.type && (
                <div className="mt-4">
                  <div className="inline-flex items-center px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm">
                    {literatureData.type.toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div
              className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600"
              ref={tabsRef}
            >
              <nav className="flex flex-wrap gap-2 px-6 py-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        saveScrollFor(activeTab);
                        handleTabSwitch(tab.id);
                        setTimeout(() => restoreScrollFor(tab.id), 320);
                      }}
                      disabled={isAnimating}
                      className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md"
                      }`}
                      whileHover={{ scale: activeTab === tab.id ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={false}
                    >
                      <Icon
                        size={16}
                        className={activeTab === tab.id ? "drop-shadow-sm" : ""}
                      />
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="ml-1 bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full">
                          {tab.badge}
                        </span>
                      )}

                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="literatureActiveTab"
                          className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-500/20 rounded-xl blur-sm"
                          initial={false}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Outer animates height (no scroll). Inner scroll div uses stable gutter to avoid flicker */}
            <motion.div className="p-6 overflow-hidden" {...animateProps}>
              <div
                className="h-full w-full overflow-y-auto"
                ref={contentWrapperRef}
                style={{ scrollbarGutter: "stable both-edges" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabVariants}
                    layout="position"
                    layoutId="tabContent"
                    ref={getPanelRef(activeTab)}
                  >
                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        {/* Abstract Section */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Abstract
                          </h3>
                          {isEditing ? (
                            <textarea
                              value={formData.abstract}
                              onChange={(e) =>
                                handleFieldChange("abstract", e.target.value)
                              }
                              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                              rows={6}
                              placeholder="Enter abstract..."
                            />
                          ) : (
                            <p className="text-slate-200 leading-relaxed bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                              {formData.abstract || "No abstract provided"}
                            </p>
                          )}
                        </div>

                        {/* Keywords Section */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Keywords
                          </h3>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.keywords}
                              onChange={(e) =>
                                handleFieldChange("keywords", e.target.value)
                              }
                              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Enter keywords (comma separated)..."
                            />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {formData.keywords ? (
                                formData.keywords
                                  .split(",")
                                  .map((keyword, index) => (
                                    <span
                                      key={index}
                                      className="bg-purple-600/20 text-purple-300 border border-purple-600/30 px-3 py-1 rounded-full text-sm"
                                    >
                                      {keyword.trim()}
                                    </span>
                                  ))
                              ) : (
                                <span className="text-slate-400 italic">
                                  No keywords provided
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Publication Details */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">
                            Publication Details
                          </h3>
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                  DOI
                                </label>
                                <input
                                  type="text"
                                  value={formData.doi}
                                  onChange={(e) =>
                                    handleFieldChange("doi", e.target.value)
                                  }
                                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="DOI..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                  Volume
                                </label>
                                <input
                                  type="text"
                                  value={formData.volume}
                                  onChange={(e) =>
                                    handleFieldChange("volume", e.target.value)
                                  }
                                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Volume..."
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                  Pages
                                </label>
                                <input
                                  type="text"
                                  value={formData.pages}
                                  onChange={(e) =>
                                    handleFieldChange("pages", e.target.value)
                                  }
                                  className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Pages..."
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                              {formData.doi && (
                                <div>
                                  <span className="font-medium text-slate-400">
                                    DOI:
                                  </span>
                                  <span className="ml-2 text-slate-200">
                                    {formData.doi}
                                  </span>
                                </div>
                              )}
                              {formData.volume && (
                                <div>
                                  <span className="font-medium text-slate-400">
                                    Volume:
                                  </span>
                                  <span className="ml-2 text-slate-200">
                                    {formData.volume}
                                  </span>
                                </div>
                              )}
                              {formData.pages && (
                                <div className="col-span-2">
                                  <span className="font-medium text-slate-400">
                                    Pages:
                                  </span>
                                  <span className="ml-2 text-slate-200">
                                    {formData.pages}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Connected Nodes */}
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <Link2 size={18} className="text-purple-400" />
                            Connected Nodes
                            {connectedNodes.length > 0 && (
                              <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                                {connectedNodes.length}
                              </span>
                            )}
                          </h3>
                          {connectedNodes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {connectedNodes.map((node) => {
                                const Icon = node.type === "case" ? Users : 
                                            node.type === "topic" ? Brain : 
                                            node.type === "task" ? Target : 
                                            BookOpen;
                                const colorClass = node.type === "case" 
                                  ? "bg-green-600/10 border-green-600/30 text-green-700 hover:bg-green-600/20"
                                  : node.type === "topic"
                                  ? "bg-blue-600/10 border-blue-600/30 text-blue-700 hover:bg-blue-600/20"
                                  : node.type === "task"
                                  ? "bg-amber-600/10 border-amber-600/30 text-amber-700 hover:bg-amber-600/20"
                                  : "bg-purple-600/10 border-purple-600/30 text-purple-700 hover:bg-purple-600/20";
                                
                                return (
                                  <div
                                    key={node.id}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md transition-colors cursor-pointer text-sm ${colorClass}`}
                                  >
                                    <Icon size={14} className="flex-shrink-0" />
                                    <span>
                                      {node.data.label || node.data.title || 'Untitled'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-sm italic text-center py-4 bg-slate-700/20 rounded-lg border border-slate-600">
                              No connected nodes. Use the connection manager to link related content.
                            </p>
                          )}
                        </div>

                        {/* Tags Section */}
                        <div className="mb-4">
                          <TagManager
                            tags={formData.tags || []}
                            onChange={(tags) => handleFieldChange("tags", tags)}
                            suggestions={[
                              'meta-analysis',
                              'randomized-controlled-trial',
                              'systematic-review',
                              'case-study',
                              'clinical-guidelines',
                              'neuroscience',
                              'psychotherapy',
                              'pharmacology',
                              'diagnostic-criteria',
                              'evidence-based',
                              'treatment-efficacy',
                              'epidemiology',
                            ]}
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === "notes" && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Personal Notes
                        </h3>
                        {isEditing ? (
                          <textarea
                            value={formData.notes}
                            onChange={(e) =>
                              handleFieldChange("notes", e.target.value)
                            }
                            className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            rows={12}
                            placeholder="Add your personal notes about this literature..."
                          />
                        ) : (
                          <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-lg min-h-64">
                            {formData.notes ? (
                              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {formData.notes}
                              </p>
                            ) : (
                              <p className="text-slate-400 italic">
                                No notes yet. Click Edit to add your thoughts
                                about this literature.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "pdf" && (
                      <div className="text-center py-8">
                        <Eye
                          size={48}
                          className="mx-auto text-slate-400 mb-4"
                        />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          PDF Viewer
                        </h3>
                        <p className="text-slate-600 mb-4">
                          PDF viewing functionality will be implemented here
                        </p>
                        {literatureData?.pdf_url && (
                          <a
                            href={literatureData.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink size={16} />
                            Open PDF
                          </a>
                        )}
                      </div>
                    )}

                    {activeTab === "related" && (
                      <div className="space-y-4">
                        {/* Search and Filter Controls */}
                        <div className="flex gap-4 mb-6">
                          <div className="flex-1 relative">
                            <Search
                              size={18}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="text"
                              placeholder="Search related literature..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            />
                          </div>

                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          >
                            <option value="all">All Types</option>
                            <option value="rct">RCT</option>
                            <option value="review">Review</option>
                            <option value="meta-analysis">Meta-Analysis</option>
                            <option value="case-study">Case Study</option>
                          </select>
                        </div>

                        {/* Related Literature Grid */}
                        {filteredRelatedLiterature.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {filteredRelatedLiterature.map((item, index) => (
                              <motion.div
                                key={`${item.id}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-slate-900 flex-1">
                                    {item.title}
                                  </h4>
                                  {item.type && (
                                    <span
                                      className={`ml-2 px-2 py-1 text-xs rounded border ${getTypeColor(
                                        item.type
                                      )}`}
                                    >
                                      {item.type.toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                <div className="text-sm text-slate-600 mb-2">
                                  {Array.isArray(item.authors)
                                    ? item.authors.slice(0, 3).join(", ")
                                    : item.authors}
                                  {item.year && ` (${item.year})`}
                                </div>

                                {item.journal && (
                                  <div className="text-sm text-slate-500 italic mb-2">
                                    {item.journal}
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Relevance: {item.relevanceScore}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BookOpen
                              size={48}
                              className="mx-auto text-slate-400 mb-4"
                            />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                              No Related Literature
                            </h3>
                            <p className="text-slate-600">
                              {extractedKeywords.length === 0
                                ? "Connect this literature to cases or topics to find related content"
                                : "No literature matches the current search criteria"}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiteratureModal;
