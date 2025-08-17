import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Plus, 
  FolderOpen, 
  Sparkles, 
  Activity,
  Zap,
  Network,
  Play
} from 'lucide-react';

// Neural Network Background Animation Component
const NeuralNetworkBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create neural network nodes
    const createNodes = () => {
      const nodes = [];
      const nodeCount = 25;
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 3 + 1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.6 + 0.2
        });
      }
      return nodes;
    };

    const nodes = createNodes();
    nodesRef.current = nodes;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw nodes
      nodes.forEach((node, index) => {
        // Update position with gentle movement
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;
        
        // Boundary collision
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        // Keep within bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
        
        // Draw connections to nearby nodes
        nodes.forEach((otherNode, otherIndex) => {
          if (index !== otherIndex) {
            const distance = Math.sqrt(
              Math.pow(node.x - otherNode.x, 2) + 
              Math.pow(node.y - otherNode.y, 2)
            );
            
            if (distance < 150) {
              const opacity = (1 - distance / 150) * 0.3;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(otherNode.x, otherNode.y);
              ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
        
        // Draw pulsing node
        const pulseIntensity = Math.sin(node.pulse) * 0.3 + 0.7;
        const nodeRadius = node.radius * pulseIntensity;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${node.opacity * pulseIntensity})`;
        ctx.fill();
        
        // Add glow effect for some nodes
        if (node.radius > 2) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${node.opacity * 0.1})`;
          ctx.fill();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-40"
      style={{ pointerEvents: 'none' }}
    />
  );
};

// Animated Menu Button Component
const MenuButton = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick, 
  delay = 0,
  variant = 'primary'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const variants = {
    primary: {
      bg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      hoverBg: 'from-indigo-500 to-purple-500',
      glow: 'shadow-indigo-500/25'
    },
    secondary: {
      bg: 'bg-gradient-to-r from-slate-700 to-slate-600',
      hoverBg: 'from-slate-600 to-slate-500', 
      glow: 'shadow-slate-500/25'
    }
  };
  
  const style = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div 
        className={`absolute inset-0 ${style.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500 ${style.glow} shadow-2xl`}
      />
      
      {/* Main button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-80 p-8 ${style.bg} hover:${style.hoverBg} rounded-2xl border border-slate-600 hover:border-slate-400 transition-all duration-300 text-left group overflow-hidden`}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center space-x-4">
          <motion.div
            animate={{ 
              rotate: isHovered ? 360 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
            className="p-3 bg-white/10 rounded-xl backdrop-blur-sm"
          >
            <Icon size={32} className="text-white" />
          </motion.div>
          
          <div className="flex-1">
            <motion.h3 
              className="text-xl font-bold text-white mb-1"
              animate={{ x: isHovered ? 5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h3>
            <motion.p 
              className="text-slate-300 text-sm"
              animate={{ x: isHovered ? 8 : 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          </div>
          
          {/* Arrow indicator */}
          <motion.div
            animate={{ x: isHovered ? 5 : 0, opacity: isHovered ? 1 : 0.6 }}
            transition={{ duration: 0.3 }}
            className="text-white/80"
          >
            <Play size={16} className="rotate-0" />
          </motion.div>
        </div>
        
        {/* Pulsing edge effect */}
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-2xl border-2 border-white/40 animate-pulse" />
        </div>
      </button>
    </motion.div>
  );
};

// Main HomeScreen Component
const HomeScreen = ({ onCreateNew, onOpenExisting, hasExistingData }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowOptions(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralNetworkBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-slate-800/30 to-indigo-900/20 z-10" />
      
      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* Header Section - Applying Proximity & Symmetry Gestalt Principles */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
        >
          {/* Logo/Brand - Using Closure Principle with partial neural network */}
          <motion.div 
            className="flex items-center justify-center mb-6 space-x-4"
            animate={{ 
              filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="relative">
              <Brain size={48} className="text-indigo-400" />
              <div className="absolute -top-1 -right-1">
                <Sparkles size={20} className="text-purple-400 animate-pulse" />
              </div>
            </div>
            <Network size={32} className="text-indigo-300 animate-pulse" />
            <Activity size={40} className="text-purple-400" />
          </motion.div>
          
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent mb-4"
            initial={{ letterSpacing: "0.1em" }}
            animate={{ letterSpacing: "0.05em" }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            PGY-3 HUB
          </motion.h1>
          
          <motion.p 
            className="text-slate-300 text-lg max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Advanced Mind Mapping for{" "}
            <span className="text-indigo-300 font-semibold">Psychiatry Residents</span>
          </motion.p>
          
          {/* Subtitle with continuity line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ duration: 1, delay: 1.2 }}
            className="h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto mt-6"
          />
        </motion.div>

        {/* Menu Options - Applying Similarity & Proximity Principles */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col space-y-6 items-center"
            >
              {/* Primary Action - Create New Map */}
              <MenuButton
                icon={Plus}
                title="Create New Map"
                subtitle="Start a fresh mind mapping session"
                onClick={onCreateNew}
                delay={0.3}
                variant="primary"
              />
              
              {/* Secondary Action - Open Existing (only show if has data) */}
              {hasExistingData && (
                <MenuButton
                  icon={FolderOpen}
                  title="Continue Existing Map"
                  subtitle="Resume your previous session"
                  onClick={onOpenExisting}
                  delay={0.5}
                  variant="secondary"
                />
              )}
              
              {/* Connecting line between options - Continuity Principle */}
              {hasExistingData && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "40px", opacity: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="w-0.5 bg-gradient-to-b from-indigo-400 to-slate-400 relative"
                >
                  {/* Animated pulse along the line */}
                  <motion.div
                    animate={{ 
                      y: [0, 40, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute w-2 h-2 bg-indigo-400 rounded-full -left-0.75 blur-sm"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        >
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <Zap size={14} />
            <span>Neural Network Powered</span>
            <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
            <span>Gestalt UX Design</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomeScreen;