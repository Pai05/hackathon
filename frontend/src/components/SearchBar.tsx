import { Search, Sparkles, Loader2, Compass } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { researchApi } from '@/lib/api/research';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length <= 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const data = await researchApi.getSuggestions(query.trim());
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsSuggesting(false);
      }
    }, 600);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-panel neon-border rounded-2xl p-6 md:p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary font-heading">AI-Powered Research Agent</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-foreground mb-3 tracking-tight">
          ResearchHub
        </h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          Enter a research topic and our agent will autonomously crawl academic databases, extract findings, detect contradictions, and synthesize insights.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1" ref={suggestionsRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="e.g. Large Language Models in Scientific Discovery"
            className="pl-11 h-12 text-sm bg-secondary/70 border-border shadow-card focus-visible:shadow-elevated transition-shadow"
            disabled={isLoading}
            autoComplete="off"
          />
          {isSuggesting && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}

          {showSuggestions && suggestions.length > 0 && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-elevated overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 bg-secondary/30 border-b border-border text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI Suggested Topics
              </div>
              <ul className="max-h-64 overflow-y-auto p-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-secondary/60 rounded-lg flex items-start gap-2.5 transition-colors group"
                    >
                      <Compass className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{suggestion}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="h-12 px-6 gradient-primary text-primary-foreground font-heading font-semibold hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Researching...
            </span>
          ) : 'Start Research'}
        </Button>
      </form>
      </div>
    </div>
  );
}
