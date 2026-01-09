
export enum DataType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

export enum NodeStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Port {
  id: string;
  type: DataType;
  label: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  name_zh: string;
  category: string;
  category_zh: string;
  description: string;
  description_zh: string;
  inputs: Port[];
  outputs: Port[]; // Static outputs
  icon: string;
  models?: { id: string; name: string }[];
}

export interface WorkflowNode {
  id: string;
  toolId: string;
  x: number;
  y: number;
  status: NodeStatus;
  data: Record<string, any>; // For internal settings
  outputValue?: any; // For multi-output nodes, this is a Record<portId, value>
  error?: string;
  executionTime?: number; // In milliseconds
  startTime?: number; // performance.now() when node starts running
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface GenerationRun {
  id: string;
  timestamp: number;
  outputs: Record<string, any>;
  nodesSnapshot: WorkflowNode[];
  totalTime?: number; // In milliseconds
}

export interface WorkflowState {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  isDirty: boolean;
  isRunning: boolean;
  globalInputs: Record<string, any>; // Maps nodeID-portID to values
  env: {
    lightx2v_url: string;
    lightx2v_token: string;
  };
  history: GenerationRun[];
  updatedAt: number;
  showIntermediateResults: boolean;
}
