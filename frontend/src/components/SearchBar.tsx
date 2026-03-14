import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
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
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Large Language Models in Scientific Discovery"
            className="pl-11 h-12 text-sm bg-secondary/70 border-border shadow-card focus-visible:shadow-elevated transition-shadow"
            disabled={isLoading}
          />
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
