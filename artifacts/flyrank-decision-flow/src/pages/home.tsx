import { LeftSidebar } from '@/components/left-sidebar';
import { ExecutionPanel } from '@/components/execution-panel';
import { GraphEditor } from '@/components/graph-editor';

export default function HomePage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      <LeftSidebar />
      <main className="flex-1 relative h-full">
        <GraphEditor />
      </main>
      <ExecutionPanel />
    </div>
  );
}
