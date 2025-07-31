// Central export for all node components
export { default as TopicNode } from './TopicNode';
export { default as CaseNode } from './CaseNode';
export { default as TaskNode } from './TaskNode';
export { default as LiteratureNode } from './LiteratureNode';

// Node types configuration
import TopicNode from './TopicNode';
import CaseNode from './CaseNode';
import TaskNode from './TaskNode';
import LiteratureNode from './LiteratureNode';

export const nodeTypes = {
  topic: TopicNode,
  case: CaseNode,
  task: TaskNode,
  literature: LiteratureNode,
};