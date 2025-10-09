// Enhanced Task Modal with tabbed interface and advanced animations
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAnimatedModalHeight from "../hooks/useAnimatedModalHeight";
import {
  X,
  CheckSquare,
  Clock,
  AlertTriangle,
  Flag,
  Calendar,
  Link2,
  Target,
  Edit3,
  Trash2,
  Save,
  Loader2,
  Star,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Tag,
  Brain,
  Pill,
} from "lucide-react";

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

const contentVariants = {
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
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 1.02,
    transition: {
      type: "easeIn",
      duration: 0.2,
    },
  },
};

const TaskModal = ({
  isOpen,
  data,
  onClose,
  onAnimationStart,
  onAnimationEnd,
  setMindMapData,
  autoSaveMindMapData,
  addToast,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);

  // Unified animated height management for modal content
  const {
    headerRef,
    tabsRef,
    contentWrapperRef,
    getPanelRef,
    saveScrollFor,
    restoreScrollFor,
    animateProps,
  } = useAnimatedModalHeight({ isOpen, activeTab, viewportMaxVH: 0.85 });

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      setEditData({
        ...data,
        status: data.status || "pending",
        priority: data.priority || "medium",
      });
      setHasInitialized(true);
      setIsAnimating(true);
      if (onAnimationStart) onAnimationStart();

      setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 600);
    } else if (!isOpen && hasInitialized) {
      setHasInitialized(false);
    }
  }, [isOpen, hasInitialized, onAnimationStart, onAnimationEnd]);

  // Separate effect for data updates when modal is already open
  useEffect(() => {
    if (
      isOpen &&
      data &&
      hasInitialized &&
      !isEditing &&
      !isLoading &&
      !isTabTransitioning &&
      !isAnimating
    ) {
      setEditData({
        ...data,
        status: data.status || "pending",
        priority: data.priority || "medium",
      });
    }
  }, [
    data?.id,
    isOpen,
    hasInitialized,
    isEditing,
    isLoading,
    isTabTransitioning,
    isAnimating,
  ]);

  const priorityConfig = useMemo(
    () => ({
      low: { color: "green", label: "Low Priority", icon: Flag },
      medium: { color: "yellow", label: "Medium Priority", icon: Flag },
      high: { color: "red", label: "High Priority", icon: Flag },
      urgent: { color: "purple", label: "Urgent", icon: AlertTriangle },
    }),
    []
  );

  const statusConfig = useMemo(
    () => ({
      pending: { color: "gray", label: "Pending", icon: Clock },
      in_progress: { color: "blue", label: "In Progress", icon: Play },
      completed: { color: "green", label: "Completed", icon: CheckSquare },
      paused: { color: "orange", label: "Paused", icon: Pause },
    }),
    []
  );

  const isOverdue = useMemo(() => {
    if (!editData.due_date) return false;
    const dueDate = new Date(editData.due_date);
    const today = new Date();
    return dueDate < today && editData.status !== "completed";
  }, [editData.due_date, editData.status]);

  const handleClose = useCallback(() => {
    if (isAnimating || isClosing) return;

    setIsAnimating(true);
    setIsClosing(true);
    if (onAnimationStart) onAnimationStart();

    // Set visibility to false to trigger exit animation
    setIsVisible(false);
  }, [onAnimationStart, isAnimating, isClosing]);

  const handleSave = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      setMindMapData((prevData) => {
        const updatedTasks = prevData.tasks.map((task) =>
          String(task.id) === String(data?.id) ? { ...task, ...editData } : task
        );
        const newData = { ...prevData, tasks: updatedTasks };
        autoSaveMindMapData(newData);
        return newData;
      });

      setIsEditing(false);
      addToast("Task updated successfully", "success");
    } catch (error) {
      console.error("Error saving task:", error);
      addToast("Failed to save task", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    data?.id,
    editData,
    setMindMapData,
    autoSaveMindMapData,
    addToast,
    isLoading,
  ]);

  const handleDelete = useCallback(async () => {
    if (isLoading) return;

    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setIsLoading(true);
    try {
      setMindMapData((prevData) => {
        const updatedTasks = prevData.tasks.filter(
          (task) => String(task.id) !== String(data?.id)
        );
        const newData = { ...prevData, tasks: updatedTasks };
        autoSaveMindMapData(newData);
        return newData;
      });

      addToast("Task deleted successfully", "success");
      handleClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      addToast("Failed to delete task", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    data?.id,
    setMindMapData,
    autoSaveMindMapData,
    addToast,
    handleClose,
    isLoading,
  ]);

  const handleStatusChange = useCallback((newStatus) => {
    setEditData((prev) => ({ ...prev, status: newStatus }));
  }, []);

  const updateField = useCallback((field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const renderField = (label, field, type = "text", options = {}) => {
    const value = editData[field] || "";

    if (!isEditing) {
      if (type === "textarea") {
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {label}
            </label>
            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 min-h-[2.5rem] text-slate-200">
              {value || (
                <span className="text-slate-500 italic">Not specified</span>
              )}
            </div>
          </div>
        );
      }

      if (type === "select") {
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {label}
            </label>
            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-slate-200">
              {value || (
                <span className="text-slate-500 italic">Not specified</span>
              )}
            </div>
          </div>
        );
      }

      if (type === "date") {
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {label}
            </label>
            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-slate-200">
              {value ? (
                new Date(value).toLocaleDateString()
              ) : (
                <span className="text-slate-500 italic">Not set</span>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
          <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-slate-200">
            {value || (
              <span className="text-slate-500 italic">Not specified</span>
            )}
          </div>
        </div>
      );
    }

    // Editing mode
    if (type === "textarea") {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
          <textarea
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            rows={options.rows || 3}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      );
    }

    if (type === "select" && options.choices) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {options.choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "date") {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) =>
            updateField(
              field,
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        setIsAnimating(false);
        setIsClosing(false);
        setHasInitialized(false);
        onClose();
        if (onAnimationEnd) onAnimationEnd();
      }}
    >
      {isVisible && (
        <motion.div
          key={`task-modal-${data?.id || "default"}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          style={{
            willChange: "backdrop-filter, opacity",
            backfaceVisibility: "hidden",
            transform: "translate3d(0, 0, 0)",
          }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden"
            style={{
              willChange: "transform, opacity, scale",
              backfaceVisibility: "hidden",
            }}
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
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between"
              ref={headerRef}
            >
              <div className="flex items-center gap-3">
                <CheckSquare size={24} />
                <h2 className="text-xl font-semibold">Task Details</h2>
                {isOverdue && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full text-xs font-medium"
                  >
                    <AlertTriangle size={12} />
                    Overdue
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && !isLoading && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={20} />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-white hover:text-red-200 p-2 rounded-full hover:bg-red-500 hover:bg-opacity-30 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <button
                  onClick={handleClose}
                  className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div
              className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600"
              ref={tabsRef}
            >
              <nav className="flex flex-wrap gap-2 px-6 py-4">
                {[
                  { key: "overview", label: "Overview", icon: CheckSquare },
                  { key: "progress", label: "Progress", icon: TrendingUp },
                  { key: "connections", label: "Connections", icon: Link2 },
                  { key: "details", label: "Details", icon: FileText },
                ].map(({ key, label, icon: Icon }) => (
                  <motion.button
                    key={key}
                    onClick={() => {
                      if (isTabTransitioning) return;
                      // save current scroll before switching
                      saveScrollFor(activeTab);
                      setIsTabTransitioning(true);
                      setActiveTab(key);
                      // restore scroll for new tab after mount
                      setTimeout(() => {
                        restoreScrollFor(key);
                        setIsTabTransitioning(false);
                      }, 320);
                    }}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                      activeTab === key
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md"
                    }`}
                    whileHover={{ scale: activeTab === key ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={false}
                    animate={{
                      scale: activeTab === key ? 1.05 : 1,
                      boxShadow:
                        activeTab === key
                          ? "0 8px 25px rgba(245, 158, 11, 0.3), 0 0 20px rgba(251, 191, 36, 0.2)"
                          : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Icon
                      size={16}
                      className={activeTab === key ? "drop-shadow-sm" : ""}
                    />
                    {label}

                    {activeTab === key && (
                      <motion.div
                        layoutId="taskTabGlow"
                        className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-amber-500/20 rounded-xl blur-sm"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Outer animates height (no scroll), inner scroll has stable scrollbar gutter */}
            <motion.div
              className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
              {...animateProps}
            >
              <div
                className="h-full w-full overflow-y-auto"
                ref={contentWrapperRef}
                style={{ scrollbarGutter: "stable both-edges" }}
              >
                <AnimatePresence
                  mode="wait"
                  initial={false}
                  onExitComplete={() => setIsTabTransitioning(false)}
                >
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      layout="position"
                      layoutId="tabContent"
                      className="p-6"
                      ref={getPanelRef("overview")}
                    >
                      <div className="space-y-6">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Target size={20} className="text-emerald-400" />
                            Task Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderField("Title", "title")}
                            {renderField("Priority", "priority", "select", {
                              choices: [
                                { value: "low", label: "Low Priority" },
                                { value: "medium", label: "Medium Priority" },
                                { value: "high", label: "High Priority" },
                                { value: "urgent", label: "Urgent" },
                              ],
                            })}
                          </div>
                          <div className="mt-6">
                            {renderField(
                              "Description",
                              "description",
                              "textarea",
                              { rows: 4 }
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-blue-400" />
                            Status & Timeline
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderField("Status", "status", "select", {
                              choices: [
                                { value: "pending", label: "Pending" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "completed", label: "Completed" },
                                { value: "paused", label: "Paused" },
                              ],
                            })}
                            {renderField("Due Date", "due_date", "date")}
                          </div>

                          {/* Status Change Buttons */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-300 mb-3">
                              Quick Status Update
                            </label>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(statusConfig).map(
                                ([status, config]) => {
                                  const Icon = config.icon;
                                  const isActive = editData.status === status;
                                  return (
                                    <motion.button
                                      key={status}
                                      onClick={() => handleStatusChange(status)}
                                      disabled={!isEditing}
                                      whileHover={
                                        isEditing ? { scale: 1.05 } : {}
                                      }
                                      whileTap={
                                        isEditing ? { scale: 0.95 } : {}
                                      }
                                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                        isActive
                                          ? `bg-${config.color}-600/20 text-${config.color}-300 border-2 border-${config.color}-600/50`
                                          : `bg-slate-700/50 text-slate-400 border-2 border-slate-600 ${
                                              isEditing
                                                ? "hover:bg-slate-600/50"
                                                : "cursor-not-allowed opacity-50"
                                            }`
                                      }`}
                                    >
                                      <Icon size={16} />
                                      {config.label}
                                    </motion.button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Progress Tab */}
                  {activeTab === "progress" && (
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      layout="position"
                      layoutId="tabContent"
                      className="p-6"
                      ref={getPanelRef("progress")}
                    >
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                          <TrendingUp size={20} className="text-blue-400" />
                          Task Progress
                        </h3>

                        {/* Status Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 ${
                              editData.status === "completed"
                                ? "bg-green-600/10 border-green-600/30"
                                : "bg-slate-700/50 border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <CheckSquare
                                size={20}
                                className={
                                  editData.status === "completed"
                                    ? "text-green-400"
                                    : "text-slate-500"
                                }
                              />
                              <span
                                className={`font-medium ${
                                  editData.status === "completed"
                                    ? "text-green-300"
                                    : "text-slate-400"
                                }`}
                              >
                                Completion
                              </span>
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                editData.status === "completed"
                                  ? "text-green-300"
                                  : "text-slate-300"
                              }`}
                            >
                              {editData.status === "completed" ? "100%" : "0%"}
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 ${
                              isOverdue
                                ? "bg-red-600/10 border-red-600/30"
                                : "bg-blue-600/10 border-blue-600/30"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar
                                size={20}
                                className={
                                  isOverdue ? "text-red-400" : "text-blue-400"
                                }
                              />
                              <span
                                className={`font-medium ${
                                  isOverdue ? "text-red-300" : "text-blue-300"
                                }`}
                              >
                                Due Date
                              </span>
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                isOverdue ? "text-red-300" : "text-blue-300"
                              }`}
                            >
                              {editData.due_date
                                ? new Date(
                                    editData.due_date
                                  ).toLocaleDateString()
                                : "Not set"}
                            </div>
                            {isOverdue && (
                              <div className="text-sm text-red-300 mt-1">
                                Overdue
                              </div>
                            )}
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 ${
                              editData.priority === "urgent" ||
                              editData.priority === "high"
                                ? "bg-amber-600/10 border-amber-600/30"
                                : "bg-slate-700/50 border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Flag
                                size={20}
                                className={
                                  editData.priority === "urgent" ||
                                  editData.priority === "high"
                                    ? "text-amber-400"
                                    : "text-slate-400"
                                }
                              />
                              <span
                                className={`font-medium ${
                                  editData.priority === "urgent" ||
                                  editData.priority === "high"
                                    ? "text-amber-300"
                                    : "text-slate-300"
                                }`}
                              >
                                Priority
                              </span>
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                editData.priority === "urgent" ||
                                editData.priority === "high"
                                  ? "text-amber-300"
                                  : "text-slate-300"
                              }`}
                            >
                              {priorityConfig[editData.priority]?.label ||
                                "Not set"}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Connections Tab */}
                  {activeTab === "connections" && (
                    <motion.div
                      key="connections"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      layout="position"
                      layoutId="tabContent"
                      className="p-6"
                      ref={getPanelRef("connections")}
                    >
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                          <Link2 size={20} className="text-cyan-400" />
                          Related Content
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {renderField("Linked Case ID", "linked_case_id")}
                          {renderField("Linked Topic ID", "linked_topic_id")}
                        </div>

                        {/* Notes Section */}
                        <div className="mb-6">
                          <NotesEditor
                            value={editData.notes || ''}
                            onChange={(notes) => setEditData(prev => ({ ...prev, notes }))}
                            placeholder="Add notes, context, or details about this task..."
                          />
                        </div>

                        {/* Tags Section */}
                        <div className="mb-6">
                          <TagManager
                            tags={editData.tags || []}
                            onChange={(tags) => setEditData(prev => ({ ...prev, tags }))}
                            suggestions={[
                              'urgent',
                              'follow-up',
                              'documentation',
                              'research',
                              'assessment',
                              'consultation',
                              'administrative',
                              'clinical',
                              'education',
                              'supervision',
                            ]}
                          />
                        </div>

                        <div className="mt-4 p-4 bg-slate-700/20 rounded-lg border border-slate-600">
                          <p className="text-slate-400 text-sm italic">
                            Link this task to cases or topics using the connection manager in the mind map view.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Details Tab */}
                  {activeTab === "details" && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      layout="position"
                      layoutId="tabContent"
                      className="p-6"
                      ref={getPanelRef("details")}
                    >
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                          <FileText size={20} className="text-slate-400" />
                          Additional Details
                        </h3>

                        <div className="space-y-6">
                          <div className="text-sm text-slate-300 bg-slate-700/50 border border-slate-600 p-4 rounded-lg">
                            <p className="font-medium mb-2 text-slate-200">Task Details</p>
                            <div className="space-y-2">
                              <p>
                                <span className="font-medium">Created:</span>{" "}
                                {data?.created_at
                                  ? new Date(data.created_at).toLocaleString()
                                  : "Unknown"}
                              </p>
                              <p>
                                <span className="font-medium">
                                  Last Updated:
                                </span>{" "}
                                {data?.updated_at
                                  ? new Date(data.updated_at).toLocaleString()
                                  : "Unknown"}
                              </p>
                              <p>
                                <span className="font-medium">Task ID:</span>{" "}
                                {data?.id || "Unknown"}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/30">
                            <h4 className="font-medium text-blue-300 mb-2">
                              Task Management Tips
                            </h4>
                            <ul className="text-blue-200 text-sm space-y-1">
                              <li>
                                • Break large tasks into smaller, manageable
                                subtasks
                              </li>
                              <li>
                                • Set realistic due dates to maintain
                                accountability
                              </li>
                              <li>
                                • Link tasks to relevant cases or topics for
                                better organization
                              </li>
                              <li>
                                • Update status regularly to track progress
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {isEditing && (
              <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Changes will be auto-saved
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...data });
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(TaskModal, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.data?.updated_at === nextProps.data?.updated_at
  );
});
