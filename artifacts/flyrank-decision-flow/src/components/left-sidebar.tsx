import { useState, useRef } from 'react';
import { useFlowStore } from '@/store/flow-store';
import { useGetDecisionFlowCapabilities, useExecuteDecisionGraph, useValidateDecisionGraph } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NodeEditor } from './node-editor';
import { Play, CheckCircle2, Download, Upload, RotateCcw, Save, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LeftSidebar() {
  const { selectedNodeId, nodes, getDecisionGraph, setExecutionLogs, clearExecution, setActiveNodeIds, importGraph, resetToSample, saveGraph, loadGraph } = useFlowStore();
  const { data: caps } = useGetDecisionFlowCapabilities();
  const executeMutation = useExecuteDecisionGraph();
  const validateMutation = useValidateDecisionGraph();
  const { toast } = useToast();

  const [startNodeId, setStartNodeId] = useState<string>('');
  const [inputData, setInputData] = useState<string>('');
  const [mode, setMode] = useState<string>('stub');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!startNodeId && nodes.length > 0) {
    setStartNodeId(nodes[0].id);
  }

  const handleValidate = async () => {
    try {
      const graph = getDecisionGraph();
      const res = await validateMutation.mutateAsync({ data: graph });
      if (res.valid) {
        toast({
          title: "Graph is Valid",
          description: "No errors found.",
        });
      } else {
        toast({
          title: "Graph Validation Failed",
          description: res.errors.join(", "),
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Validation Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleExecute = async () => {
    if (!startNodeId) {
      toast({
        title: "No Start Node",
        description: "Please select a starting node.",
        variant: "destructive"
      });
      return;
    }
    
    clearExecution();
    
    try {
      const graph = getDecisionGraph();
      const res = await executeMutation.mutateAsync({
        data: {
          graph,
          startNodeId,
          input: inputData,
          mode: mode as 'stub' | 'ai'
        }
      });
      
      setExecutionLogs(res.logs, res.status);
      setActiveNodeIds(res.visitedNodeIds);
      
      if (res.status === 'failed') {
        toast({
          title: "Execution Failed",
          description: res.error || "Graph execution did not complete successfully.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Execution Complete",
          description: `Ended at ${res.terminalNodeId ? "node " + res.terminalNodeId : "unknown"} with outcome ${res.terminalOutcome || "none"}.`,
        });
      }
    } catch (e) {
      toast({
        title: "Execution Error",
        description: "Failed to communicate with the execution engine.",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const graph = getDecisionGraph();
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decision-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const graph = JSON.parse(event.target?.result as string);
        if (graph.nodes && graph.edges) {
          importGraph(graph);
          toast({ title: "Graph Imported" });
        } else {
          throw new Error("Invalid graph format");
        }
      } catch (err) {
        toast({
          title: "Import Failed",
          description: "The file is not a valid Decision Graph.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-80 h-full flex flex-col bg-card border-r border-border shadow-sm z-10 flex-shrink-0 overflow-hidden">
      <div className="p-4 border-b border-border bg-primary text-primary-foreground">
        <h1 className="font-bold text-lg tracking-tight">FlyRank Flow</h1>
        <p className="text-xs text-primary-foreground/80 font-medium">Decision Graph Editor</p>
      </div>
      
      {selectedNodeId ? (
        <NodeEditor />
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 space-y-6">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Execution Setup</h2>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Node</Label>
                <Select value={startNodeId} onValueChange={setStartNodeId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select starting node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.data.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Execution Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {caps?.modes.map(m => (
                      <SelectItem key={m} value={m}>{m === 'ai' ? 'AI Agent' : 'Stub (Mock)'}</SelectItem>
                    )) || (
                      <>
                        <SelectItem value="stub">Stub (Mock)</SelectItem>
                        <SelectItem value="ai">AI Agent</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Input Data (Optional)</Label>
                <Input 
                  placeholder="Initial context string..." 
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="bg-background"
                />
              </div>

              <Button 
                className="w-full font-bold shadow-md hover-elevate-2 transition-transform" 
                onClick={handleExecute}
                disabled={executeMutation.isPending}
                data-testid="button-execute"
              >
                {executeMutation.isPending ? (
                  <span className="animate-pulse">Executing...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" /> Run Flow
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                className="w-full text-muted-foreground hover:text-foreground" 
                onClick={handleValidate}
                disabled={validateMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Validate Graph
              </Button>
            </div>

            <div className="h-px bg-border w-full my-2"></div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Persistence</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3 h-3 mr-2" /> Import
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                
                <Button variant="outline" className="w-full text-xs" onClick={handleExport}>
                  <Download className="w-3 h-3 mr-2" /> Export
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full text-xs" onClick={() => { saveGraph(); toast({ title: "Saved locally", description: "Graph saved in this browser." }); }}>
                  <Save className="w-3 h-3 mr-2" /> Save local
                </Button>
                <Button variant="outline" className="w-full text-xs" onClick={() => {
                  const restored = loadGraph();
                  toast(restored ? { title: "Loaded local graph" } : { title: "No saved graph", description: "Save a graph locally before loading it.", variant: "destructive" });
                }}>
                  <FolderOpen className="w-3 h-3 mr-2" /> Load local
                </Button>
              </div>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-destructive" onClick={resetToSample}>
                <RotateCcw className="w-3 h-3 mr-2" /> Reset to Sample
              </Button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
