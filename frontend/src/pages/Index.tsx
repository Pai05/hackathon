import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { PapersPanel } from '@/components/PapersPanel';
import { SynthesisPanel } from '@/components/SynthesisPanel';
import { PipelineStatus } from '@/components/PipelineStatus';
import { useResearch } from '@/hooks/use-research';
import { useAuth } from '@/lib/auth-context';
import { BarChart2, Clock3, FileText, LogOut, Moon, PlusSquare, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CosmicBackdrop } from '@/components/CosmicBackdrop';

const Index = () => {
  const {
    query,
    result,
    isLoading,
    error,
    history,
    startResearch,
    generateSynthesis,
    beginNewSearch,
    openHistoryItem,
  } = useResearch();
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<'dashboard' | 'new' | 'history' | 'compare'>('dashboard');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !isDark);
  }, [isDark]);

  const hasResults = result?.status === 'completed' && result.papers?.length > 0;
  const recentInsights = history.slice(0, 3);

  const handleStartNew = () => {
    beginNewSearch();
    setViewMode('new');
  };

  const handleViewHistory = () => {
    beginNewSearch();
    setViewMode('history');
  };

  const openSavedAnalysis = (itemId: string) => {
    openHistoryItem(itemId);
  };

  return (
    <div className="min-h-screen app-shell relative overflow-hidden">
      <CosmicBackdrop />
      {/* Top nav bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/60 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold font-heading text-foreground tracking-wide">ResearchHub</span>
          <Button variant="ghost" size="sm" onClick={() => setViewMode('dashboard')} className="text-xs text-muted-foreground hover:text-foreground">
            Home
          </Button>
          <Button variant="ghost" size="sm" onClick={handleStartNew} className="text-xs text-muted-foreground hover:text-foreground">
            New Search
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{user?.name || user?.email}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Dashboard state */}
      {!hasResults && !isLoading && viewMode === 'dashboard' && (
        <div className="min-h-screen px-6 pt-24 pb-12 flex flex-col items-center">
          <div className="w-full max-w-5xl relative mb-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block">
              <img src="/magnifier-3d.svg" alt="3D magnifying lens" className="w-52 h-52 animate-float-slow drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block">
              <img src="/microscope-3d.svg" alt="3D microscope" className="w-56 h-56 animate-float-reverse drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-foreground mb-3 tracking-tight text-center">
            Welcome back, {user?.name || 'Researcher'}
          </h1>
          <p className="text-muted-foreground text-base text-center mb-10 max-w-2xl">
            Unlock research intelligence with a cinematic workspace built for deep paper exploration and winning presentations.
          </p>

          {/* Quick stats bar */}
          {history.length > 0 && (
            <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-8">
              <div className="glass-panel rounded-xl p-4 flex flex-col items-center">
                <BarChart2 className="w-6 h-6 text-primary mb-1" />
                <span className="text-2xl font-bold text-foreground">{history.length}</span>
                <span className="text-xs text-muted-foreground">Searches Done</span>
              </div>
              <div className="glass-panel rounded-xl p-4 flex flex-col items-center">
                <FileText className="w-6 h-6 text-accent mb-1" />
                <span className="text-2xl font-bold text-foreground">{history.reduce((sum, h) => sum + (h.result.papers?.length || 0), 0)}</span>
                <span className="text-xs text-muted-foreground">Papers Analyzed</span>
              </div>
              <div className="glass-panel rounded-xl p-4 flex flex-col items-center">
                <Clock3 className="w-6 h-6 text-violet-400 mb-1" />
                <span className="text-2xl font-bold text-foreground">{history.reduce((sum, h) => sum + (h.result.research_gaps?.length || 0), 0)}</span>
                <span className="text-xs text-muted-foreground">Gaps Found</span>
              </div>
            </div>
          )}

          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="glass-panel neon-border rounded-2xl p-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                <PlusSquare className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-foreground text-center">Create New Search</h2>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Launch a new paper search workflow and run full analysis with contradictions, gaps, and citations.
              </p>
              <Button onClick={handleStartNew} className="w-full mt-6 gradient-primary text-primary-foreground font-semibold">
                Get Started
              </Button>
            </div>

            <div className="glass-panel neon-border rounded-2xl p-6">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-5 mx-auto">
                <Clock3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold font-heading text-foreground text-center">View Previous Research</h2>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Open your recently viewed paper analyses and continue from where you left off.
              </p>
              <Button onClick={handleViewHistory} variant="outline" className="w-full mt-6 font-semibold">
                Browse Results
              </Button>
            </div>
          </div>

          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold font-heading text-foreground">Recent Insights</h3>
              <Button variant="link" className="text-primary px-0" onClick={handleViewHistory}>
                View all reports
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentInsights.length > 0 ? recentInsights.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openSavedAnalysis(item.id)}
                  className="text-left glass-panel rounded-xl p-4 hover:shadow-elevated transition-all"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    {new Date(item.viewedAt).toLocaleDateString()}
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{item.query}</p>
                </button>
              )) : (
                <div className="md:col-span-3 bg-card border border-dashed border-border rounded-xl p-6 text-sm text-muted-foreground text-center">
                  No recent insights yet. Start a new search to build your history.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New search state */}
      {!hasResults && !isLoading && viewMode === 'new' && (
        <div className="flex items-center justify-center min-h-screen px-6 pt-14">
          <SearchBar onSearch={startResearch} isLoading={isLoading} />
        </div>
      )}

      {/* Previous research state */}
      {!hasResults && !isLoading && viewMode === 'history' && (
        <div className="min-h-screen px-6 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold font-heading text-foreground">Previous Research</h2>
              {history.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => { setCompareIds([]); setViewMode('compare'); }}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Compare Two
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">Open any recently viewed paper analysis.</p>

            <div className="space-y-3">
              {history.length > 0 ? history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openSavedAnalysis(item.id)}
                  className="w-full text-left glass-panel rounded-xl p-4 hover:shadow-elevated transition-all"
                >
                  <p className="text-sm font-semibold text-foreground">{item.query}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Viewed: {new Date(item.viewedAt).toLocaleString()} · Papers: {item.result.papers.length}
                  </p>
                </button>
              )) : (
                <div className="bg-card border border-dashed border-border rounded-xl p-6 text-sm text-muted-foreground text-center">
                  No previous analysis found. Run a new search first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare mode */}
      {!hasResults && !isLoading && viewMode === 'compare' && (
        <div className="min-h-screen px-6 pt-24 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold font-heading text-foreground">Compare Research</h2>
                <p className="text-sm text-muted-foreground mt-1">Select two searches to compare side-by-side.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleViewHistory} className="text-xs">← Back</Button>
            </div>

            {/* Picker */}
            {compareIds.length < 2 && (
              <div className="space-y-2 mb-6">
                <p className="text-xs text-primary font-semibold">Select {compareIds.length === 0 ? 'first' : 'second'} search ({compareIds.length}/2 selected)</p>
                {history.map((item) => (
                  <button
                    key={item.id}
                    disabled={compareIds.includes(item.id)}
                    onClick={() => setCompareIds((prev) => [...prev, item.id])}
                    className={`w-full text-left glass-panel rounded-xl p-4 transition-all ${
                      compareIds.includes(item.id)
                        ? 'border-primary/60 opacity-50 cursor-not-allowed'
                        : 'hover:shadow-elevated hover:border-primary/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{item.query}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.viewedAt).toLocaleString()} · {item.result.papers.length} papers</p>
                  </button>
                ))}
              </div>
            )}

            {/* Side-by-side comparison */}
            {compareIds.length === 2 && (() => {
              const [a, b] = compareIds.map((id) => history.find((h) => h.id === id)!);
              const rows: Array<{ label: string; aVal: string | number; bVal: string | number }> = [
                { label: 'Query', aVal: a.query, bVal: b.query },
                { label: 'Papers', aVal: a.result.papers.length, bVal: b.result.papers.length },
                { label: 'Key Findings', aVal: a.result.key_findings?.length || 0, bVal: b.result.key_findings?.length || 0 },
                { label: 'Contradictions', aVal: a.result.contradictions?.length || 0, bVal: b.result.contradictions?.length || 0 },
                { label: 'Research Gaps', aVal: a.result.research_gaps?.length || 0, bVal: b.result.research_gaps?.length || 0 },
                { label: 'Citation Trails', aVal: a.result.citation_trails?.length || 0, bVal: b.result.citation_trails?.length || 0 },
                { label: 'Top Priority', aVal: a.result.research_priorities?.[0]?.title || '—', bVal: b.result.research_priorities?.[0]?.title || '—' },
              ];
              return (
                <div>
                  <div className="grid grid-cols-[1fr_1fr] gap-4 mb-3">
                    <div className="glass-panel rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Search A</p>
                      <p className="text-sm font-bold text-foreground line-clamp-1">{a.query}</p>
                    </div>
                    <div className="glass-panel rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Search B</p>
                      <p className="text-sm font-bold text-foreground line-clamp-1">{b.query}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {rows.map((row, i) => (
                      <div key={i} className={`grid grid-cols-[160px_1fr_1fr] text-sm ${
                        i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'
                      }`}>
                        <div className="px-4 py-3 font-semibold text-xs text-muted-foreground border-r border-border flex items-center">{row.label}</div>
                        <div className="px-4 py-3 text-foreground border-r border-border">{row.aVal}</div>
                        <div className="px-4 py-3 text-foreground">{row.bVal}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={() => setCompareIds([])}
                  >
                    Reset Selection
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-14">
          <SearchBar onSearch={startResearch} isLoading={isLoading} />
          <PipelineStatus status={result?.status || 'running'} />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-14">
          <SearchBar onSearch={startResearch} isLoading={false} />
          <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive max-w-md text-center">
            {error}. Please check your backend is running and try again.
          </div>
        </div>
      )}

      {/* Results: split layout */}
      {hasResults && (
        <div className="flex h-screen pt-14">
          <div className="w-[30%] border-r border-border bg-card/70 backdrop-blur-xl overflow-hidden flex flex-col">
            <PapersPanel papers={result.papers} query={query} />
          </div>
          <div className="w-[70%] bg-background/40 overflow-hidden flex flex-col">
            <SynthesisPanel result={result} onGenerateSynthesis={generateSynthesis} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
