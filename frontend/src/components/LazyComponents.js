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
export const LazyTemplateManager = lazy(() => import('./TemplateManager'));
export const LazyLiteratureModal = lazy(() => import('./LiteratureModal'));

// HOC for wrapping lazy components with suspense
export const withLazyLoading = (LazyComponent, fallbackMessage) => (props) => (
  <Suspense fallback={<LoadingSpinner message={fallbackMessage} />}>
    <LazyComponent {...props} />
  </Suspense>
);

// Pre-wrapped components ready to use
export const RichTextEditor = withLazyLoading(LazyRichTextEditor, "Loading editor...");
export const TemplateManager = withLazyLoading(LazyTemplateManager, "Loading templates...");
export const LiteratureModal = withLazyLoading(LazyLiteratureModal, "Loading literature viewer...");
