import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  DecisionGraph,
  DecisionNode,
  DecisionEdge,
  ExecutionLogEntry,
  ExecutionResultStatus
} from '@workspace/api-client-react';
import { applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react';
import {
  appendExecutionRun,
  EXECUTION_HISTORY_STORAGE_KEY,
  isExecutionRun,
  nextAttemptForRetry,
  type ExecutionRequestSnapshot,
  type ExecutionRun,
} from '@/lib/execution-history';

export type FlowNode = Node<DecisionNode & Record<string, unknown>>;
export type FlowEdge = Edge<{ branch: 'YES' | 'NO' }>;

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  executionLogs: ExecutionLogEntry[];
  executionStatus: ExecutionResultStatus | null;
  activeNodeIds: string[];
  executionHistory: ExecutionRun[];
  currentRunId: string | null;
  activeExecution: (ExecutionRequestSnapshot & { id: string; attempt: number; retryOf?: string; startedAt: string }) | null;
  retryRunId: string | null;
  
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  
  addNode: (position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<DecisionNode>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  
  setExecutionLogs: (logs: ExecutionLogEntry[], status: ExecutionResultStatus) => void;
  clearExecution: () => void;
  setActiveNodeIds: (ids: string[]) => void;
  beginExecution: (request: ExecutionRequestSnapshot, retryOf?: string) => { id: string; attempt: number };
  completeExecution: (result: {
    executionId?: string;
    logs: ExecutionLogEntry[];
    status: ExecutionResultStatus;
    visitedNodeIds: string[];
    error?: string;
    terminalNodeId?: string;
    terminalOutcome?: string;
  }) => void;
  getExecutionRun: (id: string) => ExecutionRun | undefined;
  
  getDecisionGraph: () => DecisionGraph;
  importGraph: (graph: DecisionGraph) => void;
  resetToSample: () => void;
  saveGraph: () => void;
  loadGraph: () => boolean;
}

function loadExecutionHistory(): ExecutionRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EXECUTION_HISTORY_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isExecutionRun) : [];
  } catch {
    return [];
  }
}

function persistExecutionHistory(history: ExecutionRun[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(EXECUTION_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }
}

const initialNodes: FlowNode[] = [
  {
    id: 'start-node',
    type: 'decision',
    position: { x: 300, y: 50 },
    data: {
      id: 'start-node',
      label: 'Check API Status',
      prompt: 'Is the API returning 200 OK?',
      context: 'Check recent logs for /health endpoint.'
    }
  },
  {
    id: 'yes-node',
    type: 'decision',
    position: { x: 100, y: 250 },
    data: {
      id: 'yes-node',
      label: 'Healthy service',
      prompt: 'Terminal outcome',
      terminalOutcome: 'CONTINUE_MONITORING',
    }
  },
  {
    id: 'no-node',
    type: 'decision',
    position: { x: 500, y: 250 },
    data: {
      id: 'no-node',
      label: 'Service needs attention',
      prompt: 'Terminal outcome',
      terminalOutcome: 'ESCALATE_TO_ON_CALL',
    }
  }
];

const initialEdges: FlowEdge[] = [
  {
    id: 'edge-1',
    source: 'start-node',
    target: 'yes-node',
    sourceHandle: 'YES',
    data: { branch: 'YES' },
    animated: false,
    style: { stroke: '#16a34a', strokeWidth: 2 }
  },
  {
    id: 'edge-2',
    source: 'start-node',
    target: 'no-node',
    sourceHandle: 'NO',
    data: { branch: 'NO' },
    animated: false,
    style: { stroke: '#dc2626', strokeWidth: 2 }
  }
];

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  executionLogs: [],
  executionStatus: null,
  activeNodeIds: [],
  executionHistory: loadExecutionHistory(),
  currentRunId: null,
  activeExecution: null,
  retryRunId: null,
  
  onNodesChange: (changes: NodeChange<FlowNode>[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle) return;
    
    // Prevent multiple edges from same source handle
    const existingEdge = get().edges.find(
      e => e.source === connection.source && e.sourceHandle === connection.sourceHandle
    );
    if (existingEdge) return;
    
    const branch = connection.sourceHandle as 'YES' | 'NO';
    const newEdge: FlowEdge = {
      id: `e-${connection.source}-${connection.target}-${branch}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      data: { branch },
      style: { 
        stroke: branch === 'YES' ? '#16a34a' : '#dc2626',
        strokeWidth: 2 
      }
    };
    set({ edges: [...get().edges, newEdge] });
  },
  
  addNode: (position) => {
    const id = uuidv4();
    const newNode: FlowNode = {
      id,
      type: 'decision',
      position,
      data: {
        id,
        label: 'New Decision',
        prompt: 'Enter question here...',
        context: ''
      }
    };
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id });
  },
  
  updateNode: (id, data) => {
    set({
      nodes: get().nodes.map(node => 
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    });
  },
  
  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter(node => node.id !== id),
      edges: get().edges.filter(edge => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
    });
  },
  
  deleteEdge: (id) => {
    set({ edges: get().edges.filter(edge => edge.id !== id) });
  },
  
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  setExecutionLogs: (logs, status) => {
    set({ executionLogs: logs, executionStatus: status });
    // Also animate the edges if they were executed
    const edges = get().edges.map(edge => {
      // Find if this edge was traversed
      const wasTraversed = logs.some(log => 
        log.nodeId === edge.source && 
        log.decision === edge.sourceHandle
      );
      return {
        ...edge,
        animated: wasTraversed
      };
    });
    set({ edges });
  },
  
  clearExecution: () => set({ 
    executionLogs: [], 
    executionStatus: null, 
    activeNodeIds: [],
    edges: get().edges.map(e => ({ ...e, animated: false }))
  }),
  
  setActiveNodeIds: (ids) => set({ activeNodeIds: ids }),

  beginExecution: (request, retryOf) => {
    const previousRun = retryOf ? get().executionHistory.find(run => run.id === retryOf) : undefined;
    const activeExecution = {
      ...request,
      id: uuidv4(),
      attempt: nextAttemptForRetry(previousRun),
      retryOf,
      startedAt: new Date().toISOString(),
    };
    set({
      executionLogs: [],
      executionStatus: null,
      activeNodeIds: [],
      activeExecution,
      currentRunId: activeExecution.id,
      retryRunId: null,
      edges: get().edges.map(edge => ({ ...edge, animated: false })),
    });
    return { id: activeExecution.id, attempt: activeExecution.attempt };
  },

  completeExecution: (result) => {
    const activeExecution = get().activeExecution;
    if (!activeExecution) return;
    const run: ExecutionRun = {
      ...activeExecution,
      ...result,
      startedAt: activeExecution.startedAt,
      finishedAt: new Date().toISOString(),
    };
    const executionHistory = appendExecutionRun(get().executionHistory, run);
    persistExecutionHistory(executionHistory);
    const edges = get().edges.map(edge => ({
      ...edge,
      animated: result.logs.some(log => log.nodeId === edge.source && log.decision === edge.sourceHandle),
    }));
    set({
      executionLogs: result.logs,
      executionStatus: result.status,
      activeNodeIds: result.visitedNodeIds,
      executionHistory,
      activeExecution: null,
      currentRunId: run.id,
      retryRunId: result.status === 'failed' ? run.id : null,
      edges,
    });
  },

  getExecutionRun: (id) => get().executionHistory.find(run => run.id === id),
  
  getDecisionGraph: () => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map(n => n.data),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        branch: e.data!.branch
      }))
    };
  },
  
  importGraph: (graph) => {
    const nodes: FlowNode[] = graph.nodes.map((n, i) => ({
      id: n.id,
      type: 'decision',
      position: { x: 300, y: i * 150 }, // simple auto-layout
      data: n as DecisionNode & Record<string, unknown>
    }));
    
    const edges: FlowEdge[] = graph.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.branch,
      data: { branch: e.branch as 'YES' | 'NO' },
      style: { 
        stroke: e.branch === 'YES' ? '#16a34a' : '#dc2626',
        strokeWidth: 2 
      }
    }));
    
    set({ nodes, edges, selectedNodeId: null, executionLogs: [], executionStatus: null });
  },
  
  resetToSample: () => set({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodeId: null,
    executionLogs: [],
    executionStatus: null,
    activeNodeIds: [],
    currentRunId: null,
    activeExecution: null,
    retryRunId: null,
  }),

  saveGraph: () => {
    const graph = get().getDecisionGraph();
    window.localStorage.setItem('flyrank-decision-graph', JSON.stringify(graph));
  },

  loadGraph: () => {
    try {
      const raw = window.localStorage.getItem('flyrank-decision-graph');
      if (!raw) return false;
      const graph = JSON.parse(raw) as DecisionGraph;
      if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return false;
      get().importGraph(graph);
      return true;
    } catch {
      return false;
    }
  }
}));
