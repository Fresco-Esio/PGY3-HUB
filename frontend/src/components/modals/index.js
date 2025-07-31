// Modal System - Central export for all modal components
export { default as BaseModal } from './BaseModal';
export { default as TabbedModal } from './TabbedModal';
export { 
  EditableSection, 
  InfoCard, 
  StatusBadge, 
  LoadingState, 
  EmptyState 
} from './ModalContent';

// Export animation variants for consistency
export { modalVariants, backdropVariants, contentVariants } from './BaseModal';