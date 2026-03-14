import { useEffect, useMemo, useState } from 'react';
import { FileDown, Sparkles, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchResult } from '@/lib/api/research';
import { QueryConversation } from '@/components/QueryConversation';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';

interface SynthesisPanelProps {
  result: ResearchResult;
  onGenerateSynthesis: () => void;
  onStartNewResearch?: (newQuery: string) => void;
}

type FlowStepId =
  | 'priority-order'
  | 'structured-literature'
  | 'overview'
  | 'key-findings'
  | 'contradictions'
  | 'research-gaps'
  | 'cross-paper-validation'
  | 'citation-trail-analysis'
  | 'weighted-priority';

function exportToMarkdown(result: ResearchResult) {
  let md = `# AI Research Summary\n\n`;
  md += `**Query:** ${result.query}\n\n`;
  md += `---\n\n## Structured Literature Summary\n\n`;
  result.papers.forEach((paper, i) => {
    md += `${i + 1}. **${paper.title}**\n`;
    md += `   - Authors: ${paper.authors}\n`;
    md += `   - Source: ${paper.source} (${paper.year})\n`;
    md += `   - Focus: ${paper.abstract}\n`;
    if (paper.key_findings) {
      md += `   - Reported result: ${paper.key_findings}\n`;
    }
    md += '\n';
  });

  md += `## Overview\n\nAnalysis of ${result.papers.length} papers on "${result.query}". `;
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

  if (result.cross_paper_validation?.length) {
    md += `## Cross-Paper Validation\n\n`;
    result.cross_paper_validation.forEach((v, i) => {
      md += `${i + 1}. **${v.claim}**\n`;
      md += `   - Support level: ${v.support_level}\n`;
      md += `   - Confidence: ${Math.round(v.confidence * 100)}%\n`;
      if (v.supporting_papers.length) {
        md += `   - Supporting papers: ${v.supporting_papers.join('; ')}\n`;
      }
      if (v.conflicting_papers.length) {
        md += `   - Conflicting papers: ${v.conflicting_papers.join('; ')}\n`;
      }
      md += `   - Notes: ${v.notes}\n\n`;
    });
  }

  if (result.citation_trails?.length) {
    md += `## Citation Trail Analysis\n\n`;
    result.citation_trails.forEach((trail, i) => {
      md += `${i + 1}. **${trail.paper_title}**\n`;
      md += `   - Local references followed: ${trail.citation_count}\n`;
      md += `   - Cited-by estimate: ${trail.cited_by_estimate}\n`;
      if (trail.referenced_papers.length) {
        md += `   - Connected papers: ${trail.referenced_papers.join('; ')}\n`;
      }
      md += `   - Influence note: ${trail.influence_note}\n\n`;
    });
  }

  if (result.research_priorities?.length) {
    md += `## Weighted Research Brief Priorities\n\n`;
    result.research_priorities.forEach((priority) => {
      md += `${priority.rank}. **${priority.title}**\n`;
      md += `   - Weightage: ${priority.weightage}%\n`;
      md += `   - Why this is prioritized: ${priority.rationale}\n`;
      if (priority.related_papers.length) {
        md += `   - Related papers: ${priority.related_papers.join('; ')}\n`;
      }
      md += '\n';
    });
  }

  if (result.synthesis) {
    md += `## Final Research Synthesis\n\n${result.synthesis}\n`;
    md += '\n## Topic Knowledge Graph\n\n';
    md += 'Knowledge graph is available in the app UI and summarizes links among topic, papers, findings, and research gaps.\n';
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-synthesis-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SynthesisPanel({ result, onGenerateSynthesis, onStartNewResearch }: SynthesisPanelProps) {
  const flowSteps = useMemo(
    () => [
      {
        id: 'priority-order' as const,
        title: 'Priority Order',
        subtitle: 'By Weightage',
        available: (result.research_priorities?.length || 0) > 0,
      },
      {
        id: 'structured-literature' as const,
        title: 'Structured Literature Summary',
        subtitle: 'Paper-wise breakdown',
        available: (result.papers?.length || 0) > 0,
      },
      {
        id: 'overview' as const,
        title: 'Overview',
        subtitle: 'Topic-level context',
        available: true,
      },
      {
        id: 'key-findings' as const,
        title: 'Key Findings',
        subtitle: 'High-signal insights',
        available: (result.key_findings?.length || 0) > 0,
      },
      {
        id: 'contradictions' as const,
        title: 'Contradictions',
        subtitle: 'Conflicting evidence',
        available: (result.contradictions?.length || 0) > 0,
      },
      {
        id: 'research-gaps' as const,
        title: 'Research Gaps',
        subtitle: 'Unsolved opportunities',
        available: (result.research_gaps?.length || 0) > 0,
      },
      {
        id: 'cross-paper-validation' as const,
        title: 'Cross-Paper Validation',
        subtitle: 'Claim consistency check',
        available: (result.cross_paper_validation?.length || 0) > 0,
      },
      {
        id: 'citation-trail-analysis' as const,
        title: 'Citation Trail Analysis',
        subtitle: 'Influence pathways',
        available: (result.citation_trails?.length || 0) > 0,
      },
      {
        id: 'weighted-priority' as const,
        title: 'Weighted Re-Priority',
        subtitle: 'Final ranked action plan',
        available: (result.research_priorities?.length || 0) > 0,
      },
    ],
    [result],
  );

  const [selectedStep, setSelectedStep] = useState<FlowStepId>('overview');

  useEffect(() => {
    const firstAvailable = flowSteps.find((step) => step.available);
    if (firstAvailable) {
      setSelectedStep(firstAvailable.id);
    }
  }, [flowSteps]);

  const handleStepClick = (stepId: FlowStepId) => {
    setSelectedStep(stepId);
  };

  const selectedStepData = flowSteps.find((step) => step.id === selectedStep);

  const focusedContent = useMemo(() => {
    if (!selectedStepData?.available) {
      return {
        summary: 'This section has no data for the current query.',
        points: [] as string[],
      };
    }

    switch (selectedStep) {
      case 'priority-order':
      case 'weighted-priority': {
        const priorities = result.research_priorities || [];
        const top = priorities[0];
        return {
          summary: top
            ? `Top priority: ${top.title} (${top.weightage}%). ${top.rationale}`
            : 'Priority weighting is unavailable for this run.',
          points: priorities.slice(0, 6).map(
            (priority) =>
              `${priority.rank}. ${priority.title} — ${priority.weightage}% weightage${
                priority.related_papers.length ? ` | Related: ${priority.related_papers.slice(0, 2).join('; ')}` : ''
              }`,
          ),
        };
      }
      case 'structured-literature': {
        const papers = result.papers || [];
        const firstPaper = papers[0];
        return {
          summary: firstPaper
            ? `Leading paper: ${firstPaper.title}. ${firstPaper.abstract}`
            : 'No paper details available.',
          points: papers.slice(0, 5).map(
            (paper) =>
              `${paper.title} (${paper.source}, ${paper.year})${
                paper.key_findings ? ` | Result: ${paper.key_findings}` : ''
              }`,
          ),
        };
      }
      case 'overview': {
        return {
          summary:
            result.overview ||
            `Analysis of ${result.papers.length} papers on "${result.query}" with ${result.contradictions?.length || 0} contradictions and ${result.research_gaps?.length || 0} research gaps.`,
          points: [
            `Papers analyzed: ${result.papers.length}`,
            `Key findings extracted: ${result.key_findings?.length || 0}`,
            `Contradictions detected: ${result.contradictions?.length || 0}`,
            `Research gaps identified: ${result.research_gaps?.length || 0}`,
            `Cross-paper validations: ${result.cross_paper_validation?.length || 0}`,
            `Citation trails followed: ${result.citation_trails?.length || 0}`,
          ],
        };
      }
      case 'key-findings': {
        const findings = result.key_findings || [];
        const firstFinding = findings[0];
        return {
          summary: firstFinding
            ? `${firstFinding.paper_title}: ${firstFinding.findings}`
            : 'No key findings available.',
          points: findings
            .slice(0, 6)
            .map((finding) => `${finding.paper_title} — ${finding.findings}`),
        };
      }
      case 'contradictions': {
        const contradictions = result.contradictions || [];
        const first = contradictions[0];
        return {
          summary: first ? first.description : 'No contradictions identified.',
          points: contradictions.slice(0, 6).map((entry) => entry.description),
        };
      }
      case 'research-gaps': {
        const gaps = result.research_gaps || [];
        const first = gaps[0];
        return {
          summary: first ? first.description : 'No research gaps identified.',
          points: gaps.slice(0, 6).map((entry) => entry.description),
        };
      }
      case 'cross-paper-validation': {
        const validations = result.cross_paper_validation || [];
        const first = validations[0];
        return {
          summary: first
            ? `${first.claim} (support: ${first.support_level}, confidence: ${Math.round(first.confidence * 100)}%).`
            : 'No cross-paper validation data available.',
          points: validations.slice(0, 6).map(
            (entry) =>
              `${entry.claim} | ${entry.support_level} support | ${Math.round(entry.confidence * 100)}% confidence | +${entry.supporting_papers.length} support / -${entry.conflicting_papers.length} conflict`,
          ),
        };
      }
      case 'citation-trail-analysis': {
        const trails = result.citation_trails || [];
        const first = trails[0];
        return {
          summary: first
            ? `${first.paper_title}: ${first.influence_note}`
            : 'No citation trail information available.',
          points: trails.slice(0, 6).map(
            (trail) =>
              `${trail.paper_title} | refs: ${trail.citation_count} | cited-by: ${trail.cited_by_estimate}${
                trail.referenced_papers.length ? ` | connected: ${trail.referenced_papers.slice(0, 2).join('; ')}` : ''
              }`,
          ),
        };
      }
      default:
        return { summary: '', points: [] as string[] };
    }
  }, [result, selectedStep, selectedStepData?.available]);

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card/60 backdrop-blur-xl border-b border-border p-5 flex items-center justify-between">
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
        <p className="text-sm readability-secondary">
          Synthesized from <span className="font-semibold text-foreground">{result.papers.length} real papers</span>
        </p>

        <div className="glass-panel rounded-lg p-5 animate-fade-in-up" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold font-heading readability-heading">Interactive Research Flowchart</h3>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="flex flex-col items-center">
                {flowSteps.map((step, idx) => {
                  const isActive = selectedStep === step.id;
                  return (
                    <div key={step.id} className="w-full flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => handleStepClick(step.id)}
                        disabled={!step.available}
                        className={`w-full rounded-md border px-3 py-2 text-left transition-all duration-200 ${
                          isActive
                            ? 'border-primary/60 bg-primary/15 shadow-card'
                            : 'border-border bg-background/65 hover:border-primary/40 hover:bg-background'
                        } ${!step.available ? 'opacity-45 cursor-not-allowed' : ''}`}
                      >
                        <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'readability-body'}`}>{step.title}</p>
                        <p className="text-[11px] readability-secondary">{step.subtitle}</p>
                      </button>
                      {idx < flowSteps.length - 1 && <span className="text-xs text-primary/70 py-1">↓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-primary/80 font-semibold">Selected Step</p>
              <h4 className="text-lg font-bold font-heading text-foreground mt-1">
                {selectedStepData?.title || 'Overview'}
              </h4>
              <p className="text-sm readability-secondary mt-1">{selectedStepData?.subtitle || ''}</p>
              <p className="text-sm readability-body leading-relaxed mt-3">{focusedContent.summary}</p>

              {focusedContent.points.length > 0 && (
                <div className="mt-3 rounded-md border border-border bg-background/60 p-3 max-h-64 overflow-y-auto">
                  <p className="text-xs uppercase tracking-wide text-primary/70 font-semibold mb-2">Detailed Evidence</p>
                  <div className="space-y-2">
                    {focusedContent.points.map((point, index) => (
                      <div key={`${selectedStep}-point-${index}`} className="text-xs readability-body leading-relaxed">
                        <span className="text-primary mr-1">{index + 1}.</span>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs readability-secondary mt-3">
                Click any flowchart step to update this panel.
              </p>
            </div>
          </div>
        </div>

        {!result.synthesis ? (
          <button
            onClick={onGenerateSynthesis}
            className="w-full py-3 rounded-lg gradient-hero text-primary-foreground font-heading font-bold text-sm flex items-center justify-center gap-2 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            Generate Final Synthesis
          </button>
        ) : (
          <>
            <div className="rounded-lg border border-primary/20 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-primary/80 font-semibold">Final Synthesis</p>
              <p className="text-sm readability-body mt-2 leading-relaxed whitespace-pre-line">{result.synthesis}</p>
            </div>

            <div className="glass-panel rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold font-heading readability-heading">Topic Knowledge Graph</h3>
              </div>
              <p className="text-xs readability-secondary mb-3">
                Visual map of how papers, findings, gaps, and contradictions interconnect around your query. Click on nodes to research them further.
              </p>
              <KnowledgeGraph result={result} onStartNewResearch={onStartNewResearch} />
            </div>
          </>
        )}

        <QueryConversation result={result} onGenerateSynthesis={onGenerateSynthesis} />
      </div>
    </div>
  );
}
