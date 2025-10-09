// Lazy loading component wrapper for performance optimization
import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  </div>
);

// Lazy load components that aren't needed immediately
export const LazyRichTextEditor = lazy(() => import('./RichTextEditor'));
export const LazyLiteratureModal = lazy(() => import('./LiteratureModal'));

// Lazy load modals for better initial load performance
export const LazyCaseModal = lazy(() => import('./CaseModal'));
export const LazyTopicModal = lazy(() => import('./TopicModal'));
export const LazyTaskModal = lazy(() => import('./TaskModal'));

// HOC for wrapping lazy components with suspense
export const withLazyLoading = (LazyComponent, fallbackMessage) => (props) => (
  <Suspense fallback={<LoadingSpinner message={fallbackMessage} />}>
    <LazyComponent {...props} />
  </Suspense>
);

// Pre-wrapped components ready to use
export const RichTextEditor = withLazyLoading(LazyRichTextEditor, "Loading editor...");
export const LiteratureModal = withLazyLoading(LazyLiteratureModal, "Loading literature viewer...");

// Pre-wrapped modal components
export const CaseModal = withLazyLoading(LazyCaseModal, "Loading case details...");
export const TopicModal = withLazyLoading(LazyTopicModal, "Loading topic details...");
export const TaskModal = withLazyLoading(LazyTaskModal, "Loading task details...");
