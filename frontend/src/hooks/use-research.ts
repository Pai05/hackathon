import { useState, useEffect, useCallback, useRef } from 'react';
import { researchApi, type ResearchResult } from '@/lib/api/research';
import { buildMockResearchResult, buildMockSynthesis } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';

const USE_DEMO = !import.meta.env.VITE_API_URL && true;
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ResearchHistoryItem {
  id: string;
  query: string;
  viewedAt: string;
  result: ResearchResult;
}

export function useResearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const lastSavedSignature = useRef<string | null>(null);

  // Fetch history on mount / user change
  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      return;
    }
    
    fetch(`${BASE_URL}/api/history?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.history) {
          setHistory(data.history);
        }
      })
      .catch(err => console.error("Failed to fetch history:", err));
  }, [user]);

  const persistHistory = useCallback((items: ResearchHistoryItem[]) => {
    setHistory(items);
    // Let backend handle persistence, we just update local state instantly
  }, []);

  const startResearch = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setQuery(q);

    // Try real backend first
    try {
      const { job_id } = await researchApi.startResearch(q);
      setJobId(job_id);
      setIsPolling(true);
      setDemoMode(false);
      return;
    } catch {
      // Backend unreachable — fall back to demo mode
      console.log("Falling back to demo mode...");
    }

    // Demo mode
    setDemoMode(true);
    const demoResult = buildMockResearchResult(q);
    const stages: ResearchResult['status'][] = ['pending', 'running'];
    for (const status of stages) {
      setResult({ ...demoResult, status, papers: [], key_findings: [], contradictions: [], research_gaps: [] });
      await new Promise(r => setTimeout(r, 1200));
    }
    setResult(demoResult);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isPolling || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const data = await researchApi.getStatus(jobId);
        setResult(data);
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          setIsLoading(false);
          if (data.status === 'failed') {
            setError('Research pipeline failed');
          }
        }
      } catch {
        // Keep polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, jobId]);

  const generateSynthesis = useCallback(async () => {
    if (demoMode) {
      setResult(prev => {
        if (!prev) return prev;
        return { ...prev, synthesis: buildMockSynthesis(prev) };
      });
      return;
    }
    if (!jobId) return;
    try {
      const { synthesis } = await researchApi.generateSynthesis(jobId);
      setResult(prev => prev ? { ...prev, synthesis } : prev);
    } catch {
      setError('Failed to generate synthesis');
    }
  }, [jobId, demoMode]);

  const beginNewSearch = useCallback(() => {
    setResult(null);
    setQuery('');
    setError(null);
    setIsLoading(false);
    setIsPolling(false);
    setJobId(null);
  }, []);

  const openHistoryItem = useCallback((itemId: string) => {
    const item = history.find((entry) => entry.id === itemId);
    if (!item) return;
    setResult(item.result);
    setQuery(item.query);
    setError(null);
    setIsLoading(false);
    setIsPolling(false);
  }, [history]);

  useEffect(() => {
    if (!result || result.status !== 'completed' || !result.papers?.length || !user?.id) return;

    const signature = `${result.job_id}|${result.query}|${result.papers.length}`;
    if (signature === lastSavedSignature.current) return;
    lastSavedSignature.current = signature;

    const entry: ResearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      query: result.query,
      viewedAt: new Date().toISOString(),
      result,
    };

    const updated = [entry, ...history]
      .filter((item, index, arr) => arr.findIndex((x) => x.query === item.query) === index)
      .slice(0, 12);

    persistHistory(updated);

    // Save to backend
    fetch(`${BASE_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, query: result.query, result: result })
    }).catch(err => console.error("Failed to save history to backend:", err));

  }, [result, history, persistHistory, user?.id]);

  return {
    query,
    result,
    isLoading,
    error,
    history,
    startResearch,
    generateSynthesis,
    beginNewSearch,
    openHistoryItem,
  };
}
