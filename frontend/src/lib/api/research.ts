// API client for the Research Literature Agent backend
// Configure BASE_URL to point to your FastAPI backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ResearchPaper {
  title: string;
  authors: string;
  year: string | number;
  source: string;
  abstract: string;
  url?: string;
  doi?: string;
  ref?: number;
  key_findings?: string;
}

export interface Contradiction {
  description: string;
  papers: string[];
}

export interface ResearchGap {
  description: string;
}

export interface CrossPaperValidation {
  claim: string;
  support_level: 'strong' | 'moderate' | 'mixed';
  supporting_papers: string[];
  conflicting_papers: string[];
  confidence: number;
  notes: string;
}

export interface CitationTrail {
  paper_title: string;
  citation_count: number;
  cited_by_estimate: number;
  referenced_papers: string[];
  influence_note: string;
}

export interface ResearchPriority {
  rank: number;
  title: string;
  weightage: number;
  rationale: string;
  related_papers: string[];
}

export interface ResearchResult {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  query: string;
  papers: ResearchPaper[];
  key_findings: { paper_title: string; findings: string }[];
  contradictions: Contradiction[];
  research_gaps: ResearchGap[];
  cross_paper_validation?: CrossPaperValidation[];
  citation_trails?: CitationTrail[];
  research_priorities?: ResearchPriority[];
  synthesis?: string;
  overview?: string;
}

export const researchApi = {
  async startResearch(query: string): Promise<{ job_id: string }> {
    const res = await fetch(`${BASE_URL}/api/research/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Failed to start research');
    return res.json();
  },

  async getStatus(jobId: string): Promise<ResearchResult> {
    const res = await fetch(`${BASE_URL}/api/research/status/${jobId}`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },

  async generateSynthesis(jobId: string): Promise<{ synthesis: string }> {
    const res = await fetch(`${BASE_URL}/api/research/synthesize/${jobId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate synthesis');
    return res.json();
  },

  async sendChatMessage(jobId: string, message: string, history: Array<{ role: 'user' | 'assistant', text: string }>): Promise<{ text: string }> {
    const res = await fetch(`${BASE_URL}/api/research/chat/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Failed to send chat message');
    return res.json();
  },

  async getSuggestions(query: string): Promise<{ suggestions: string[] }> {
    const res = await fetch(`${BASE_URL}/api/research/suggestions?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to get suggestions');
    return res.json();
  },

  async extractKeywords(paper: { title: string; abstract?: string; key_findings?: string }): Promise<{ keywords: string[] }> {
    const res = await fetch(`${BASE_URL}/api/research/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paper),
    });
    if (!res.ok) throw new Error('Failed to extract keywords');
    return res.json();
  },
};

