import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { researchApi, type ResearchResult } from '@/lib/api/research';

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
};

type ChatContext = {
  lastReferencedPaperIndex?: number;
};

type QueryConversationProps = {
  result: ResearchResult;
  onGenerateSynthesis: () => void;
};

function commandHelp() {
  return [
    'You can chat naturally, or use these commands:',
    '- priorities',
    '- contradictions',
    '- gaps',
    '- citations',
    '- papers',
    '- paper <number>',
    '- summary',
    '- generate synthesis',
    '- website help',
  ].join('\n');
}

function websiteHelp() {
  return [
    'ResearchHub website guide:',
    '- Left side: all retrieved research papers for this query.',
    '- Right side: summary, gaps, contradictions, citations, and priorities.',
    '- Use "Generate Final Synthesis" or ask "generate synthesis" here.',
    '- Use "paper <number>" to drill into a specific paper quickly.',
    '- Use "export" button at the top-right of summary to download markdown.',
  ].join('\n');
}

function rankByKeywordMatch(input: string, result: ResearchResult) {
  const normalized = input.toLowerCase();
  const terms = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 2);

  if (!terms.length) return [];

  return result.papers
    .map((paper, index) => {
      const haystack = `${paper.title} ${paper.abstract} ${paper.authors} ${paper.source}`.toLowerCase();
      const score = terms.reduce((acc, term) => (haystack.includes(term) ? acc + 1 : acc), 0);
      return { paper, index, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function answerAsChat(
  userInput: string,
  result: ResearchResult,
  context: ChatContext,
  onGenerateSynthesis: () => void
): { text: string; contextUpdate?: Partial<ChatContext> } {
  const normalized = userInput.trim().toLowerCase();
  if (!normalized) {
    return { text: 'Please ask a question about this research result. Type "help" if needed.' };
  }

  if (/(help|commands)/.test(normalized)) {
    return { text: commandHelp() };
  }

  if (/(website help|how to use|how does this website work|what can i do here|navigate)/.test(normalized)) {
    return { text: websiteHelp() };
  }

  if (/(generate|create|make).*(synthesis|summary)|(synthesis|summary).*(generate|create|make)/.test(normalized)) {
    if (result.synthesis) {
      return { text: 'Synthesis is already generated. You can ask "summary" to read it or export it from the top-right button.' };
    }
    onGenerateSynthesis();
    return { text: 'Generating synthesis now. Ask "summary" in a moment to view the final narrative.' };
  }

  if (/(priorit|weight)/.test(normalized)) {
    if (!result.research_priorities?.length) {
      return { text: 'No weighted priorities are available for this query yet.' };
    }

    const lines = result.research_priorities.map(
      (item) => `${item.rank}. ${item.title} (${item.weightage}%)`
    );
    return { text: ['Here are the weighted priorities for this query:', ...lines].join('\n') };
  }

  if (/(contradiction|conflict)/.test(normalized)) {
    if (!result.contradictions?.length) return { text: 'No contradictions were detected.' };

    return {
      text: [
        `I found ${result.contradictions.length} contradictions:`,
        ...result.contradictions.map((item, index) => `${index + 1}. ${item.description}`),
      ].join('\n'),
    };
  }

  if (/(gap|missing)/.test(normalized)) {
    if (!result.research_gaps?.length) return { text: 'No research gaps are available.' };

    return {
      text: [
        `Top ${result.research_gaps.length} research gaps:`,
        ...result.research_gaps.map((item, index) => `${index + 1}. ${item.description}`),
      ].join('\n'),
    };
  }

  if (/(citation|cited|trail)/.test(normalized)) {
    if (!result.citation_trails?.length) return { text: 'No citation trail analysis is available.' };

    const lines = result.citation_trails.slice(0, 5).map((item, index) => {
      return `${index + 1}. ${item.paper_title} (cited-by est. ${item.cited_by_estimate})`;
    });
    return { text: ['Top citation branches:', ...lines].join('\n') };
  }

  if (/^paper\s+\d+$/.test(normalized)) {
    const index = Number.parseInt(normalized.replace(/[^0-9]/g, ''), 10) - 1;
    const paper = result.papers[index];
    if (!paper) {
      return { text: `Paper ${index + 1} is out of range. Try a value from 1 to ${result.papers.length}.` };
    }

    return {
      text: [
        `${index + 1}. ${paper.title}`,
        `Authors: ${paper.authors}`,
        `Source: ${paper.source} (${paper.year})`,
        `Abstract: ${paper.abstract}`,
      ].join('\n'),
      contextUpdate: { lastReferencedPaperIndex: index },
    };
  }

  if (/(that paper|this paper|same paper|more on that)/.test(normalized)) {
    const idx = context.lastReferencedPaperIndex;
    if (idx === undefined) {
      return { text: 'Please refer to a paper first, for example: "paper 1" or "tell me about paper 3".' };
    }

    const paper = result.papers[idx];
    if (!paper) return { text: 'I could not find that referenced paper. Please ask again with a paper number.' };

    return {
      text: [
        `More on paper ${idx + 1}: ${paper.title}`,
        `Key finding: ${paper.key_findings || 'No specific key finding was extracted.'}`,
        `This paper is relevant to the current query because it aligns with topic terms from "${result.query}".`,
      ].join('\n'),
    };
  }

  if (/(papers|list)/.test(normalized)) {
    const lines = result.papers.map((paper, index) => `${index + 1}. ${paper.title}`);
    return { text: [`Available papers (${result.papers.length}):`, ...lines].join('\n') };
  }

  if (/(summary|overview|synthesis)/.test(normalized)) {
    return {
      text:
        result.synthesis ||
        result.overview ||
        'No synthesis has been generated yet. Use "Generate Final Synthesis" first.',
    };
  }

  const candidatePapers = rankByKeywordMatch(userInput, result);
  if (candidatePapers.length > 0) {
    const top = candidatePapers[0];
    const lines = candidatePapers.map(
      (item) => `${item.index + 1}. ${item.paper.title} (${item.paper.source}, ${item.paper.year})`
    );

    return {
      text: [
        `Based on your question, these papers look most relevant:`,
        ...lines,
        `If you want details, ask: "paper ${top.index + 1}".`,
      ].join('\n'),
      contextUpdate: { lastReferencedPaperIndex: top.index },
    };
  }

  return {
    text: [
      `I can answer this query from the current result page, but I need a bit more direction.`,
      `Try asking things like:`,
      `- "What are the top priorities?"`,
      `- "Which papers conflict?"`,
      `- "Show citation impact"`,
      `- "paper 2"`,
    ].join('\n'),
  };
}

export function QueryConversation({ result, onGenerateSynthesis }: QueryConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const intro = useMemo(
    () =>
      `I am your ResearchHub assistant for "${result.query}". Ask any question about papers, priorities, citations, or how to use this page.`,
    [result.query]
  );

  useEffect(() => {
    setMessages([{ id: Date.now(), role: 'assistant', text: intro }]);
    setCommandInput('');
  }, [intro, result.job_id]);

  const sendCommand = async () => {
    const trimmed = commandInput.trim();
    if (!trimmed || isSending) return;

    // Trigger synthesis locally if asked
    if (/(generate|create|make).*(synthesis|summary)|(synthesis|summary).*(generate|create|make)/.test(trimmed.toLowerCase())) {
      if (!result.synthesis) {
        onGenerateSynthesis();
      }
    }

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setCommandInput('');
    setIsSending(true);

    try {
      const chatHistory = messages
        .filter(m => m.id !== messages[0].id) // omit intro
        .map(m => ({ role: m.role, text: m.text }));
      
      const response = await researchApi.sendChatMessage(result.job_id, trimmed, chatHistory);
      
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.text,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
       setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: 'Sorry, I encountered an error communicating with the agent server.' }]);
    } finally {
       setIsSending(false);
    }
  };

  return (
    <div className="glass-panel rounded-lg p-5 animate-fade-in-up animate-delay-4" style={{ opacity: 0 }}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold font-heading readability-heading">Website Chatbot</h3>
      </div>
      <p className="text-xs readability-secondary mb-3">
        Ask anything about this website page and the current research results. I can also run page actions.
      </p>

      <div className="rounded-md border border-border bg-secondary/55 p-3 space-y-2 max-h-72 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-md px-3 py-2 text-xs whitespace-pre-line ${
              message.role === 'user'
                ? 'bg-primary/20 text-foreground ml-8 border border-primary/30'
                : 'bg-muted/70 readability-body mr-8 border border-border'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={commandInput}
          onChange={(event) => setCommandInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              sendCommand();
            }
          }}
          placeholder="Ask anything... e.g. How do I use this page? | generate synthesis | top priorities"
          className="h-10 text-sm bg-secondary/70"
        />
        <Button onClick={sendCommand} className="h-10 px-4 gap-1.5" disabled={!commandInput.trim() || isSending}>
          <Send className="w-3.5 h-3.5" />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
