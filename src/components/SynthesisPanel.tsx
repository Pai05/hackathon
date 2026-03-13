import { FileDown, FileText, Sparkles, AlertTriangle, Lightbulb, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchResult } from '@/lib/api/research';

interface SynthesisPanelProps {
  result: ResearchResult;
  onGenerateSynthesis: () => void;
}

function exportToMarkdown(result: ResearchResult) {
  let md = `# AI Research Summary\n\n`;
  md += `**Query:** ${result.query}\n\n`;
  md += `---\n\n## Overview\n\nAnalysis of ${result.papers.length} papers on "${result.query}". `;
  md += `The AI identified ${result.contradictions?.length || 0} contradictions and ${result.research_gaps?.length || 0} research gaps.\n\n`;

  if (result.key_findings?.length) {
    md += `## Key Findings\n\n`;
    result.key_findings.forEach((f, i) => {
      md += `${i + 1}. **${f.paper_title}** — ${f.findings}\n\n`;
    });
  }

  if (result.contradictions?.length) {
    md += `## Contradictions\n\n`;
    result.contradictions.forEach((c, i) => {
      md += `${i + 1}. ${c.description}\n`;
    });
    md += '\n';
  }

  if (result.research_gaps?.length) {
    md += `## Research Gaps\n\n`;
    result.research_gaps.forEach((g, i) => {
      md += `${i + 1}. ${g.description}\n`;
    });
    md += '\n';
  }

  if (result.synthesis) {
    md += `## Final Research Synthesis\n\n${result.synthesis}\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-synthesis-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SynthesisPanel({ result, onGenerateSynthesis }: SynthesisPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold font-heading text-foreground">AI Research Summary</h2>
        </div>
        <Button
          onClick={() => exportToMarkdown(result)}
          className="gradient-primary text-primary-foreground font-heading text-sm font-semibold gap-2 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
        >
          <FileDown className="w-4 h-4" />
          Export Synthesis
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <p className="text-sm text-muted-foreground">
          Synthesized from <span className="font-semibold text-foreground">{result.papers.length} real papers</span>
        </p>

        {/* Overview Card */}
        <div className="bg-card rounded-lg border border-border p-5 shadow-card animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold font-heading text-foreground">Overview</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.overview || `Analysis of ${result.papers.length} papers on "${result.query}". The AI identified ${result.contradictions?.length || 0} contradictions and ${result.research_gaps?.length || 0} research gaps.`}
          </p>
        </div>

        {/* Key Findings */}
        {result.key_findings?.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-5 shadow-card animate-fade-in-up animate-delay-1" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold font-heading text-foreground">Key Findings</h3>
            </div>
            <div className="space-y-3">
              {result.key_findings.map((f, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{f.paper_title}</span>
                    <span className="text-sm text-muted-foreground"> — {f.findings}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contradictions */}
        {result.contradictions?.length > 0 && (
          <div className="bg-card rounded-lg border border-destructive/20 p-5 shadow-card animate-fade-in-up animate-delay-2" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-bold font-heading text-foreground">
                Contradictions <span className="text-xs font-normal text-destructive ml-1">({result.contradictions.length} found)</span>
              </h3>
            </div>
            <div className="space-y-2">
              {result.contradictions.map((c, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-destructive/30">
                  {c.description}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Research Gaps */}
        {result.research_gaps?.length > 0 && (
          <div className="bg-card rounded-lg border border-accent/20 p-5 shadow-card animate-fade-in-up animate-delay-3" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold font-heading text-foreground">Research Gaps</h3>
            </div>
            <p className="text-xs text-accent font-medium mb-2">
              Based on the existing research papers, here are {result.research_gaps.length} specific gaps:
            </p>
            <div className="space-y-2">
              {result.research_gaps.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-accent">{i + 1}.</span>
                  <p className="text-sm text-muted-foreground">{g.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate / Show Synthesis */}
        {!result.synthesis ? (
          <button
            onClick={onGenerateSynthesis}
            className="w-full py-4 rounded-lg gradient-hero text-primary-foreground font-heading font-bold text-base flex items-center justify-center gap-2 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animate-delay-4"
            style={{ opacity: 0 }}
          >
            <Sparkles className="w-5 h-5" />
            Generate Final Synthesis
          </button>
        ) : (
          <div className="bg-card rounded-lg border-2 border-primary/20 p-5 shadow-elevated animate-fade-in-up animate-delay-4" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold font-heading text-foreground">Final Research Synthesis</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {result.synthesis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
