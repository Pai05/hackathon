import { Loader2 } from 'lucide-react';

interface PipelineStatusProps {
  status: string;
}

const stages = [
  { key: 'planning', label: 'Query Planning', icon: '🧠' },
  { key: 'searching', label: 'Paper Search', icon: '🔍' },
  { key: 'reading', label: 'Reading Papers', icon: '📖' },
  { key: 'citation', label: 'Tracing Citation Trails', icon: '🧬' },
  { key: 'detecting', label: 'Detecting Contradictions', icon: '⚡' },
  { key: 'gaps', label: 'Finding Research Gaps', icon: '🎯' },
  { key: 'complete', label: 'Complete', icon: '✅' },
];

export function PipelineStatus({ status }: PipelineStatusProps) {
  return (
    <div className="w-full max-w-md mx-auto mt-12">
      <div className="glass-panel neon-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <h3 className="text-base font-bold font-heading text-foreground">Research Pipeline</h3>
        </div>
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const isActive = status === stage.key || (status === 'running' && i === 0);
            const isPast = i < stages.findIndex(s => s.key === status);
            return (
              <div
                key={stage.key}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/15 border border-primary/30 shadow-card'
                    : isPast
                    ? 'opacity-75'
                    : 'opacity-30'
                }`}
              >
                <span className="text-base">{stage.icon}</span>
                <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stage.label}
                </span>
                {isActive && (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-auto" />
                )}
                {isPast && (
                  <span className="ml-auto text-xs text-accent font-medium">Done</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
