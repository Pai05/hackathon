import { useId, useMemo } from 'react';
import type { ResearchResult } from '@/lib/api/research';

type NodeKind = 'topic' | 'paper' | 'finding' | 'gap' | 'contradiction';
type EdgeKind = 'topic-paper' | 'paper-finding' | 'topic-gap' | 'paper-contradiction' | 'contradiction-topic';

type GraphNode = {
  id: string;
  x: number;
  y: number;
  kind: NodeKind;
  label: string;
  subLabel?: string;
  fullLabel: string;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function shortLabel(text: string, max = 38) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}...`;
}

function wrapLabel(text: string, maxCharsPerLine: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (!lines.length) return [shortLabel(text, maxCharsPerLine)];

  if (words.join(' ').length > lines.join(' ').length) {
    lines[lines.length - 1] = shortLabel(lines[lines.length - 1], Math.max(6, maxCharsPerLine - 1));
  }

  return lines.slice(0, maxLines);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function distributeAngles(count: number, start: number, end: number) {
  if (count <= 1) return [(start + end) / 2];
  return Array.from({ length: count }, (_, i) => start + ((end - start) * i) / (count - 1));
}

function matchPaperIndex(query: string, paperTitles: string[]) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return -1;

  let best = { idx: -1, score: 0 };
  paperTitles.forEach((title, idx) => {
    const normalizedTitle = normalizeText(title);
    if (!normalizedTitle) return;

    const score = normalizedQuery.includes(normalizedTitle) || normalizedTitle.includes(normalizedQuery)
      ? normalizedQuery.length
      : normalizedQuery.split(' ').reduce((acc, token) => {
          if (token.length < 3) return acc;
          return normalizedTitle.includes(token) ? acc + token.length : acc;
        }, 0);

    if (score > best.score) best = { idx, score };
  });

  return best.score > 0 ? best.idx : -1;
}

function buildGraph(result: ResearchResult) {
  const cx = 500;
  const cy = 360;

  const papers = result.papers.slice(0, 8);
  const findings = result.key_findings.slice(0, 6);
  const gaps = result.research_gaps.slice(0, 6);
  const contradictions = result.contradictions.slice(0, 2);

  const nodes: GraphNode[] = [
    {
      id: 'topic',
      x: cx,
      y: cy,
      kind: 'topic',
      label: shortLabel(result.query, 44),
      subLabel: 'TOPIC CORE',
      fullLabel: result.query,
    },
  ];

  distributeAngles(papers.length, -140, 220).forEach((angle, idx) => {
    const p = polar(cx, cy, 220, angle);
    const paper = papers[idx];
    if (!paper) return;
    nodes.push({
      id: `paper-${idx}`,
      x: p.x,
      y: p.y,
      kind: 'paper',
      label: shortLabel(paper.title, 30),
      subLabel: String(paper.year),
      fullLabel: paper.title,
    });
  });

  distributeAngles(findings.length, -165, -15).forEach((angle, idx) => {
    const p = polar(cx, cy, 330, angle);
    const finding = findings[idx];
    if (!finding) return;
    nodes.push({
      id: `finding-${idx}`,
      x: p.x,
      y: p.y,
      kind: 'finding',
      label: shortLabel(finding.findings, 44),
      subLabel: 'FINDING',
      fullLabel: finding.findings,
    });
  });

  distributeAngles(gaps.length, 20, 160).forEach((angle, idx) => {
    const p = polar(cx, cy, 330, angle);
    const gap = gaps[idx];
    if (!gap) return;
    nodes.push({
      id: `gap-${idx}`,
      x: p.x,
      y: p.y,
      kind: 'gap',
      label: shortLabel(gap.description, 44),
      subLabel: 'GAP',
      fullLabel: gap.description,
    });
  });

  contradictions.forEach((contradiction, idx) => {
    const x = idx === 0 ? 120 : 880;
    const y = idx === 0 ? 280 : 430;
    nodes.push({
      id: `contradiction-${idx}`,
      x,
      y,
      kind: 'contradiction',
      label: shortLabel(contradiction.description, 42),
      subLabel: 'TENSION',
      fullLabel: contradiction.description,
    });
  });

  const edges: GraphEdge[] = [];
  papers.forEach((_, idx) => {
    edges.push({ id: `tp-${idx}`, from: 'topic', to: `paper-${idx}`, kind: 'topic-paper' });
  });

  const paperTitles = papers.map((paper) => paper.title);

  findings.forEach((finding, idx) => {
    const linkedPaperIdx = matchPaperIndex(finding.paper_title, paperTitles);
    edges.push({
      id: `pf-${idx}`,
      from: linkedPaperIdx >= 0 ? `paper-${linkedPaperIdx}` : 'topic',
      to: `finding-${idx}`,
      kind: 'paper-finding',
    });
  });

  gaps.forEach((_, idx) => {
    edges.push({ id: `tg-${idx}`, from: 'topic', to: `gap-${idx}`, kind: 'topic-gap' });
  });

  contradictions.forEach((contradiction, idx) => {
    edges.push({ id: `ct-core-${idx}`, from: `contradiction-${idx}`, to: 'topic', kind: 'contradiction-topic' });

    contradiction.papers.slice(0, 2).forEach((title, pIdx) => {
      const linkedPaperIdx = matchPaperIndex(title, paperTitles);
      if (linkedPaperIdx < 0) return;
      edges.push({
        id: `ct-paper-${idx}-${pIdx}`,
        from: `paper-${linkedPaperIdx}`,
        to: `contradiction-${idx}`,
        kind: 'paper-contradiction',
      });
    });
  });

  return { nodes, edges, papers, findings, gaps };
}

function edgeStyle(kind: EdgeKind) {
  if (kind === 'paper-finding') return { color: '#22d3ee', width: 2.3, dash: undefined };
  if (kind === 'topic-gap') return { color: '#fb923c', width: 2.4, dash: undefined };
  if (kind === 'paper-contradiction') return { color: '#f472b6', width: 2.5, dash: '8 6' };
  if (kind === 'contradiction-topic') return { color: '#ef4444', width: 2.8, dash: '6 5' };
  return { color: '#60a5fa', width: 1.8, dash: undefined };
}

function nodeVisual(kind: NodeKind) {
  if (kind === 'topic') {
    return {
      radius: 76,
      fill: '#5b65f3',
      stroke: '#a5b4fc',
      glow: '#5b65f3',
      text: '#ffffff',
      sub: '#e2e8f0',
      lineChars: 16,
      lines: 2,
    };
  }
  if (kind === 'paper') {
    return {
      radius: 48,
      fill: '#0f1f45',
      stroke: '#60a5fa',
      glow: '#3b82f6',
      text: '#e2e8f0',
      sub: '#93c5fd',
      lineChars: 15,
      lines: 2,
    };
  }
  if (kind === 'finding') {
    return {
      radius: 44,
      fill: '#052f2c',
      stroke: '#2dd4bf',
      glow: '#14b8a6',
      text: '#d1fae5',
      sub: '#5eead4',
      lineChars: 18,
      lines: 2,
    };
  }
  if (kind === 'gap') {
    return {
      radius: 44,
      fill: '#371907',
      stroke: '#fb923c',
      glow: '#f97316',
      text: '#ffedd5',
      sub: '#fdba74',
      lineChars: 18,
      lines: 2,
    };
  }

  return {
    radius: 42,
    fill: '#3a0f33',
    stroke: '#f472b6',
    glow: '#ec4899',
    text: '#fce7f3',
    sub: '#f9a8d4',
    lineChars: 17,
    lines: 2,
  };
}

function curvedPath(from: GraphNode, to: GraphNode, curvature = 0.18) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const nx = -dy / distance;
  const ny = dx / distance;
  const curve = distance * curvature;
  const cx = mx + nx * curve;
  const cy = my + ny * curve;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function KnowledgeGraph({ result }: { result: ResearchResult }) {
  const graph = useMemo(() => buildGraph(result), [result]);
  const nodesById = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graph.nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [graph.nodes]);

  const idScope = useId().replace(/:/g, '');
  const bgGradientId = `kg-bg-${idScope}`;
  const glowFilterId = `kg-glow-${idScope}`;
  const softGlowFilterId = `kg-soft-${idScope}`;

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const x = 20 + ((i * 137) % 960);
        const y = 20 + ((i * 83) % 680);
        const opacity = 0.15 + (i % 4) * 0.1;
        const r = i % 5 === 0 ? 1.6 : 1.0;
        return { x, y, opacity, r };
      }),
    []
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#040816] p-5 shadow-elevated animate-fade-in-up" style={{ opacity: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold font-heading text-slate-100">Topic Knowledge Graph</h3>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 font-medium">{graph.papers.length} papers</span>
          <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-200 font-medium">{graph.findings.length} findings</span>
          <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-200 font-medium">{graph.gaps.length} gaps</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/90 bg-[#030712] p-2 overflow-x-auto">
        <svg viewBox="0 0 1000 720" className="w-full min-w-[780px] h-[520px]">
          <defs>
            <radialGradient id={bgGradientId} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#0f172a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </radialGradient>
            <filter id={glowFilterId}>
              <feGaussianBlur stdDeviation="2.4" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={softGlowFilterId}>
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="1000" height="720" fill={`url(#${bgGradientId})`} rx="16" />
          {stars.map((star, idx) => (
            <circle key={`star-${idx}`} cx={star.x} cy={star.y} r={star.r} fill="#93c5fd" opacity={star.opacity} />
          ))}

          {graph.edges.map((edge) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to) return null;

            const style = edgeStyle(edge.kind);
            const path = curvedPath(from, to, edge.kind === 'topic-paper' ? 0.06 : 0.17);

            return (
              <g key={edge.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={style.color}
                  strokeWidth={style.width + 1.8}
                  opacity={0.16}
                  filter={`url(#${glowFilterId})`}
                  strokeDasharray={style.dash}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={style.color}
                  strokeWidth={style.width}
                  opacity={0.94}
                  strokeLinecap="round"
                  strokeDasharray={style.dash}
                  filter={`url(#${softGlowFilterId})`}
                />
              </g>
            );
          })}

          {graph.nodes.map((node) => {
            const visual = nodeVisual(node.kind);
            const lines = wrapLabel(node.label, visual.lineChars, visual.lines);
            const lineHeight = 12;
            const firstLineY = node.y - (lines.length - 1) * (lineHeight / 2) - 4;
            const subY = node.y + visual.radius - 12;

            return (
              <g key={node.id}>
                <title>{node.fullLabel}</title>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={visual.radius + 6}
                  fill={visual.glow}
                  opacity={0.16}
                  filter={`url(#${glowFilterId})`}
                />
                <circle cx={node.x} cy={node.y} r={visual.radius} fill={visual.fill} stroke={visual.stroke} strokeWidth={2.1} />

                <text x={node.x} y={firstLineY} textAnchor="middle" fill={visual.text} fontSize="11" fontWeight={650}>
                  {lines.map((line, idx) => (
                    <tspan key={`${node.id}-line-${idx}`} x={node.x} dy={idx === 0 ? 0 : lineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>

                {node.subLabel && (
                  <text x={node.x} y={subY} textAnchor="middle" fill={visual.sub} fontSize="9" fontWeight={700} letterSpacing="0.8">
                    {node.subLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded-md border border-slate-800 bg-[#081020] px-2 py-1.5 text-slate-300">
          <span className="font-semibold text-blue-300">Blue:</span> topic to papers
        </div>
        <div className="rounded-md border border-slate-800 bg-[#081020] px-2 py-1.5 text-slate-300">
          <span className="font-semibold text-teal-300">Teal:</span> evidence paths
        </div>
        <div className="rounded-md border border-slate-800 bg-[#081020] px-2 py-1.5 text-slate-300">
          <span className="font-semibold text-orange-300">Orange:</span> topic gaps
        </div>
        <div className="rounded-md border border-slate-800 bg-[#081020] px-2 py-1.5 text-slate-300">
          <span className="font-semibold text-pink-300">Pink/Red dashed:</span> contradictions
        </div>
      </div>
    </div>
  );
}
