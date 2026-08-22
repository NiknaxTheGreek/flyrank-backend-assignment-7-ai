import { type ComponentType, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
  type NodeMouseHandler,
  type ReactFlowProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DecisionNodeComponent } from './decision-node';
import { useFlowStore } from '@/store/flow-store';
import type { FlowEdge, FlowNode } from '@/store/flow-store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const nodeTypes = {
  decision: DecisionNodeComponent,
};

const TypedReactFlow = ReactFlow as unknown as ComponentType<
  ReactFlowProps<FlowNode, FlowEdge>
>;

function FlowCanvas() {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    addNode,
    setSelectedNodeId,
    deleteNode,
    deleteEdge
  } = useFlowStore();
  
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);
  
  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onAddNode = useCallback(() => {
    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      });
      addNode(position);
    }
  }, [addNode, screenToFlowPosition]);

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <TypedReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        minZoom={0.2}
        maxZoom={1.5}
        deleteKeyCode={['Backspace', 'Delete']}
        onNodesDelete={(deletedNodes) => {
          deletedNodes.forEach(n => deleteNode(n.id));
        }}
        onEdgesDelete={(deletedEdges) => {
          deletedEdges.forEach(e => deleteEdge(e.id));
        }}
      >
        <Background gap={24} size={2} color="hsl(var(--muted-foreground))" className="opacity-20" />
        <Controls className="bg-card border border-border rounded-md shadow-sm" showInteractive={false} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'decision') return 'hsl(var(--primary))';
            return 'hsl(var(--muted))';
          }}
          maskColor="hsl(var(--background) / 0.7)"
          className="border border-border rounded-md shadow-sm" 
        />
        <Panel position="top-left" className="m-4">
          <Button 
            onClick={onAddNode} 
            className="shadow-sm" 
            size="sm"
            data-testid="button-add-node"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </Panel>
      </TypedReactFlow>
    </div>
  );
}

export function GraphEditor() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
