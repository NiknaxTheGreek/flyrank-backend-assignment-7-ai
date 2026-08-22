import { useFlowStore } from '@/store/flow-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertCircle, CheckCircle2, Clock, ChevronRight, Ban } from 'lucide-react';
import type { ExecutionLogEntryStatus } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';

export function ExecutionPanel() {
  const { executionLogs, executionStatus } = useFlowStore();

  if (executionLogs.length === 0 && !executionStatus) {
    return (
      <div className="w-80 h-full flex flex-col bg-card border-l border-border shadow-sm z-10 flex-shrink-0">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-foreground">Execution History</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Activity className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">No Active Run</p>
            <p className="text-sm">Configure and start an execution to see live trace logs here.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: ExecutionLogEntryStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'routed': return <ChevronRight className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-80 h-full flex flex-col bg-card border-l border-border shadow-sm z-10 flex-shrink-0">
      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-foreground">Execution Trace</h2>
        {executionStatus && (
          <Badge variant={executionStatus === 'completed' ? 'default' : 'destructive'} className="uppercase text-[10px]">
            {executionStatus}
          </Badge>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {executionLogs.map((log, i) => (
            <div key={`${log.nodeId}-${i}`} className="relative pl-6 pb-4 last:pb-0">
              {/* Timeline line */}
              {i < executionLogs.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
              )}
              
              {/* Status dot */}
              <div className="absolute left-0 top-1 bg-card rounded-full p-0.5">
                {getStatusIcon(log.status)}
              </div>
              
              <div className="bg-muted/30 border border-border/50 rounded-md p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-xs text-foreground truncate max-w-[160px]" title={log.label}>
                    {log.label}
                  </span>
                  {log.latencyMs && (
                    <span className="text-[10px] text-muted-foreground font-mono bg-background px-1.5 rounded">
                      {log.latencyMs}ms
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed break-words">
                  {log.message}
                </p>
                
                {log.decision && (
                  <div className="pt-2 mt-2 border-t border-border/50 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Decision:</span>
                    <Badge variant="outline" className={`h-5 px-1.5 text-[10px] font-bold ${
                      log.decision === 'YES' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {log.decision}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {executionStatus === 'failed' && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md text-sm border border-destructive/20 mt-4">
              <Ban className="w-4 h-4 shrink-0" />
              <span className="font-medium">Execution Halted due to error.</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
