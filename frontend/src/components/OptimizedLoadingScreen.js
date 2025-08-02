// Optimized loading screen component
import React from 'react';
import { Loader2, Brain, Sparkles } from 'lucide-react';

const OptimizedLoadingScreen = ({ message = "Loading your mind map...", progress = null }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated brain icon */}
        <div className="relative mb-6">
          <Brain className="w-16 h-16 text-blue-600 mx-auto animate-pulse" />
          <Sparkles className="w-6 h-6 text-purple-500 absolute -top-2 -right-2 animate-bounce" />
        </div>
        
        {/* Loading spinner */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">{message}</span>
        </div>
        
        {/* Progress bar if provided */}
        {progress !== null && (
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
        
        {/* Helpful tips during loading */}
        <div className="text-sm text-gray-500 max-w-md mx-auto mt-4">
          <p>💡 Tip: Use the force layout button to auto-arrange your nodes</p>
        </div>
      </div>
    </div>
  );
};

export default OptimizedLoadingScreen;
