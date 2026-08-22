import { Handle, Position } from '@xyflow/react';
import type { DecisionNode } from '@workspace/api-client-react';
import { HelpCircle, TerminalSquare } from 'lucide-react';
import { useFlowStore } from '@/store/flow-store';

export function DecisionNodeComponent({ data, id, selected }: { data: DecisionNode; id: string, selected: boolean }) {
  const activeNodeIds = useFlowStore(s => s.activeNodeIds);
  const isActive = activeNodeIds.includes(id);

  return (
    <div className={`relative w-[280px] bg-card border-2 rounded-lg shadow-sm transition-all duration-200 
      ${selected ? 'border-primary ring-4 ring-primary/20' : 'border-border hover:border-primary/50'}
      ${isActive ? 'border-amber-500 bg-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''}
    `}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-4 !h-4 !bg-muted !border-2 !border-muted-foreground" 
      />
      
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
            <TerminalSquare size={16} />
          </div>
          <h3 className="font-semibold text-sm text-foreground truncate" title={data.label}>
            {data.label}
          </h3>
        </div>
        
        <div className="bg-muted/50 rounded-md p-3 border border-border/50 text-xs">
          <div className="flex gap-2 items-start text-muted-foreground mb-1">
            <HelpCircle size={14} className="shrink-0 mt-0.5" />
            <p className="font-medium text-foreground leading-snug line-clamp-3">
              {data.prompt}
            </p>
          </div>
          {data.context && (
            <p className="mt-2 text-muted-foreground text-[10px] italic line-clamp-2 border-t border-border/50 pt-2">
              Context: {data.context}
            </p>
          )}
        </div>
      </div>

      {data.terminalOutcome ? (
        <div className="border-t border-border/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-primary">
          Terminal: {data.terminalOutcome}
        </div>
      ) : (
      <div className="absolute -bottom-3 left-0 w-full flex justify-between px-8">
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-6 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
            YES
          </div>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="YES"
            className="!relative !transform-none !left-0 !top-0 !w-4 !h-4 !bg-green-500 !border-2 !border-background" 
          />
        </div>

        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-6 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
            NO
          </div>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="NO"
            className="!relative !transform-none !left-0 !top-0 !w-4 !h-4 !bg-red-500 !border-2 !border-background" 
          />
        </div>
      </div>
      )}
    </div>
  );
}
