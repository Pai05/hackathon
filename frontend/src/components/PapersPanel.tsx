import { useState, useMemo } from 'react';
import { Download, ExternalLink, Search, X, BookOpen, Calendar, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ResearchPaper } from '@/lib/api/research';

interface PapersPanelProps {
  papers: ResearchPaper[];
  query: string;
}

function databaseFromUrl(url?: string) {
  if (!url) return 'Academic Source';
  if (url.includes('arxiv.org')) return 'arXiv';
  if (url.includes('pubmed.ncbi.nlm.nih.gov')) return 'PubMed';
  if (url.includes('semanticscholar.org')) return 'Semantic Scholar';
  if (url.includes('scholar.google.com')) return 'Google Scholar';
  return 'Academic Source';
}

const DB_COLORS: Record<string, string> = {
  arXiv: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  PubMed: 'text-green-400 border-green-400/30 bg-green-400/10',
  'Semantic Scholar': 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  'Google Scholar': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  'Academic Source': 'text-primary border-primary/30 bg-primary/10',
};

function PaperModal({ paper, onClose }: { paper: ResearchPaper; onClose: () => void }) {
  const db = databaseFromUrl(paper.url);
  const colorClass = DB_COLORS[db] || DB_COLORS['Academic Source'];
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl glass-panel rounded-2xl border border-border shadow-elevated p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close paper details"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-semibold mb-4 ${colorClass}`}>
          {db}
        </div>

        <h2 className="text-lg font-bold font-heading text-foreground leading-snug mb-4 pr-6">
          {paper.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3">
            <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Authors</p>
              <p className="text-xs text-foreground mt-0.5">{paper.authors}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3">
            <Calendar className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Published</p>
              <p className="text-xs text-foreground mt-0.5">{paper.year}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3">
            <BookOpen className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Journal / Source</p>
              <p className="text-xs text-foreground mt-0.5">{paper.source}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3">
            <Tag className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Database</p>
              <p className="text-xs text-foreground mt-0.5">{db}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/50 p-4 mb-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Abstract</p>
          <p className="text-sm text-foreground leading-relaxed">{paper.abstract}</p>
        </div>

        {paper.key_findings && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
            <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-2">Key Findings</p>
            <p className="text-sm text-foreground leading-relaxed">{paper.key_findings}</p>
          </div>
        )}

        {paper.url && (
          <a href={paper.url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 gradient-primary text-primary-foreground font-semibold">
              <Download className="w-4 h-4" />
              Open / Download Paper
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

export function PapersPanel({ papers, query }: PapersPanelProps) {
  const [search, setSearch] = useState('');
  const [activeDb, setActiveDb] = useState<string>('All');
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

  const databases = useMemo(() => {
    const dbs = new Set(papers.map((p) => databaseFromUrl(p.url)));
    return ['All', ...Array.from(dbs)];
  }, [papers]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      const matchDb = activeDb === 'All' || databaseFromUrl(p.url) === activeDb;
      const matchSearch =
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.authors.toLowerCase().includes(search.toLowerCase());
      return matchDb && matchSearch;
    });
  }, [papers, activeDb, search]);

  return (
    <>
      {selectedPaper && (
        <PaperModal paper={selectedPaper} onClose={() => setSelectedPaper(null)} />
      )}

      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border bg-card/70 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-foreground">Research Papers</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/25">
              {query}
            </span>
          </div>

          {/* Search within papers */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search papers by title or author…"
              className="pl-9 h-9 text-xs bg-secondary/60 border-border"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear paper search"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Database source filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {databases.map((db) => (
              <button
                key={db}
                type="button"
                onClick={() => setActiveDb(db)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold transition-all ${
                  activeDb === db
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground border-border bg-secondary/40 hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {db}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filtered.length}</span> of {papers.length} papers · click any card for full details
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              No papers match the current filter.
            </div>
          )}
          {filtered.map((paper, idx) => {
            const db = databaseFromUrl(paper.url);
            const colorClass = DB_COLORS[db] || DB_COLORS['Academic Source'];
            return (
              <div
                key={idx}
                onClick={() => setSelectedPaper(paper)}
                className="glass-panel rounded-lg p-4 hover:shadow-elevated transition-all duration-200 cursor-pointer group animate-fade-in-up"
              >
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border mb-2 font-semibold ${colorClass}`}>
                  {db}
                </div>
                <h3 className="text-sm font-semibold font-heading text-foreground group-hover:text-primary transition-colors leading-snug mb-1.5">
                  {paper.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {paper.authors} · {paper.year} · <span className="text-accent font-medium">{paper.source}</span>
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {paper.abstract}
                </p>
                <p className="text-[11px] text-primary mt-2 font-medium">Click to view full details →</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
