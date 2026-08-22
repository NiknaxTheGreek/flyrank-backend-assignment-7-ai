import { useEffect, useRef } from 'react';
import { useFlowStore } from '@/store/flow-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NodeEditor() {
  const { selectedNodeId, nodes, updateNode, deleteNode } = useFlowStore();
  
  const node = nodes.find(n => n.id === selectedNodeId);
  
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Network className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">No Node Selected</p>
          <p className="text-sm">Select a node on the canvas to edit its properties.</p>
        </div>
      </div>
    );
  }

  const { data } = node;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <h2 className="font-semibold text-foreground">Edit Node</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => deleteNode(node.id)}
          data-testid="button-delete-node"
          title="Delete Node"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="node-label" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Label
          </Label>
          <Input 
            id="node-label" 
            value={data.label} 
            onChange={(e) => updateNode(node.id, { label: e.target.value })}
            placeholder="e.g., Check Authorization"
            data-testid="input-node-label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-terminal" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Terminal Outcome (optional)
          </Label>
          <Input
            id="node-terminal"
            value={data.terminalOutcome || ''}
            onChange={(e) => updateNode(node.id, { terminalOutcome: e.target.value || undefined })}
            placeholder="e.g., ESCALATE_TO_REVIEW"
          />
          <p className="text-[11px] text-muted-foreground">
            A terminal node ends the graph with this visible outcome.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-prompt" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Binary Prompt
          </Label>
          <Textarea 
            id="node-prompt" 
            value={data.prompt} 
            onChange={(e) => updateNode(node.id, { prompt: e.target.value })}
            placeholder="A clear yes/no question for the AI or user..."
            className="min-h-[100px] resize-y"
            data-testid="textarea-node-prompt"
          />
          <p className="text-[11px] text-muted-foreground">
            This prompt will determine whether the flow continues along the YES or NO branch.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-context" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Context (Optional)
          </Label>
          <Textarea 
            id="node-context" 
            value={data.context || ''} 
            onChange={(e) => updateNode(node.id, { context: e.target.value })}
            placeholder="Additional information for evaluation..."
            className="min-h-[100px] resize-y"
            data-testid="textarea-node-context"
          />
        </div>
        
        <div className="pt-4 border-t border-border">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            System ID
          </Label>
          <code className="text-[11px] bg-muted px-2 py-1 rounded text-muted-foreground break-all">
            {node.id}
          </code>
        </div>
      </div>
    </div>
  );
}
