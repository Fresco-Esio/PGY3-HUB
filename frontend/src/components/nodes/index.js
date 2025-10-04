// Central export for all node components - Using Circular Design
export { default as TopicNode } from './CircularTopicNode';
export { default as CaseNode } from './CircularCaseNode';
export { default as TaskNode } from './CircularTaskNode';
export { default as LiteratureNode } from './CircularLiteratureNode';

// Node types configuration
import TopicNode from './CircularTopicNode';
import CaseNode from './CircularCaseNode';
import TaskNode from './CircularTaskNode';
import LiteratureNode from './CircularLiteratureNode';

export const nodeTypes = {
  topic: TopicNode,
  case: CaseNode,
  task: TaskNode,
  literature: LiteratureNode,
};