import type { ResearchResult } from './api/research';

type CatalogPaper = ResearchResult['papers'][number] & { tags: string[] };
type PaperProvider = 'arxiv' | 'pubmed' | 'semanticScholar' | 'googleScholar';

const PROVIDER_ROTATION: PaperProvider[] = ['arxiv', 'pubmed', 'semanticScholar', 'googleScholar'];

const PROVIDER_LABELS: Record<PaperProvider, string> = {
  arxiv: 'arXiv',
  pubmed: 'PubMed',
  semanticScholar: 'Semantic Scholar',
  googleScholar: 'Google Scholar',
};

function buildProviderSearchUrl(query: string, provider: PaperProvider): string {
  const encodedQuery = encodeURIComponent(query);
  if (provider === 'arxiv') {
    return `https://arxiv.org/search/?query=${encodedQuery}&searchtype=all`;
  }
  if (provider === 'pubmed') {
    return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedQuery}`;
  }
  if (provider === 'googleScholar') {
    return `https://scholar.google.com/scholar?q=${encodedQuery}`;
  }
  return `https://www.semanticscholar.org/search?q=${encodedQuery}`;
}

function buildProviderDescriptor(provider: PaperProvider) {
  return `Academic DB: ${PROVIDER_LABELS[provider]}`;
}

function providerForIndex(index: number): PaperProvider {
  return PROVIDER_ROTATION[index % PROVIDER_ROTATION.length];
}

function providerFromUrl(url?: string): PaperProvider | null {
  if (!url) return null;
  if (url.includes('arxiv.org')) return 'arxiv';
  if (url.includes('pubmed.ncbi.nlm.nih.gov')) return 'pubmed';
  if (url.includes('semanticscholar.org')) return 'semanticScholar';
  if (url.includes('scholar.google.com')) return 'googleScholar';
  return null;
}

function ensureAllAcademicSources(papers: ResearchResult['papers']): ResearchResult['papers'] {
  const selected: ResearchResult['papers'] = [];
  const used = new Set<string>();

  PROVIDER_ROTATION.forEach((provider) => {
    const found = papers.find((paper) => providerFromUrl(paper.url) === provider);
    if (!found) return;
    const key = `${found.title}::${found.source}`;
    if (used.has(key)) return;
    selected.push(found);
    used.add(key);
  });

  papers.forEach((paper) => {
    const key = `${paper.title}::${paper.source}`;
    if (used.has(key)) return;
    selected.push(paper);
    used.add(key);
  });

  return selected;
}

const PAPER_CATALOG: CatalogPaper[] = [
  {
    title: 'Deep Learning for Medical Image Analysis: A Comprehensive Survey',
    authors: 'Li, Zhang, Chen et al.',
    year: 2024,
    source: 'Nature Medicine',
    abstract: 'A broad survey of deep learning methods for radiology, pathology, and ophthalmology diagnostics.',
    url: buildProviderSearchUrl('deep learning medical image analysis', providerForIndex(0)),
    key_findings: 'CNN-based systems reach specialist-level AUC in selected imaging tasks.',
    tags: ['healthcare', 'medical', 'imaging', 'deep learning', 'diagnosis', 'clinical'],
  },
  {
    title: 'Federated Learning for Electronic Health Records: Privacy-Preserving Approaches',
    authors: 'Rieke, Hancox, Li et al.',
    year: 2023,
    source: 'IEEE JBHI',
    abstract: 'Federated methods for multi-hospital EHR modeling without exchanging raw patient data.',
    url: buildProviderSearchUrl('federated learning health records', providerForIndex(1)),
    key_findings: 'Federated setups preserve privacy while retaining most centralized-model performance.',
    tags: ['healthcare', 'medical', 'privacy', 'federated', 'ehr', 'machine learning'],
  },
  {
    title: 'Transformer Models for Clinical NLP: From BERT to GPT in Medicine',
    authors: 'Gu, Tinn, Cheng et al.',
    year: 2024,
    source: 'ACL Anthology',
    abstract: 'Evaluation of transformer models for clinical notes, coding support, and medical entity extraction.',
    url: buildProviderSearchUrl('transformer clinical NLP', providerForIndex(2)),
    key_findings: 'Domain pretraining improves biomedical NLP tasks compared with general-purpose transformers.',
    tags: ['healthcare', 'clinical', 'nlp', 'transformer', 'llm', 'medicine'],
  },
  {
    title: 'Bias and Fairness in Machine Learning Models for Healthcare',
    authors: 'Obermeyer, Powers, Vogeli, Mullainathan',
    year: 2023,
    source: 'Science',
    abstract: 'An analysis of bias and inequity risks in healthcare risk models with mitigation recommendations.',
    url: buildProviderSearchUrl('bias fairness machine learning healthcare', providerForIndex(3)),
    key_findings: 'Unmitigated deployment can produce measurable demographic disparities.',
    tags: ['healthcare', 'fairness', 'bias', 'ethics', 'machine learning'],
  },
  {
    title: 'Large Language Models for Scientific Discovery: Opportunities and Risks',
    authors: 'Baker, Nori, McInerney et al.',
    year: 2025,
    source: 'Nature',
    abstract: 'Role of LLMs in literature mining, hypothesis generation, and automated experimentation workflows.',
    url: buildProviderSearchUrl('large language models scientific discovery', providerForIndex(4)),
    key_findings: 'LLM copilots accelerate idea generation but require strict factual grounding controls.',
    tags: ['llm', 'language model', 'scientific discovery', 'research automation', 'ai'],
  },
  {
    title: 'Retrieval-Augmented Generation for Domain-Specific Question Answering',
    authors: 'Lewis, Gao, Izacard et al.',
    year: 2024,
    source: 'Transactions of ACL',
    abstract: 'RAG architectures for improving factual reliability in expert-domain LLM systems.',
    url: buildProviderSearchUrl('retrieval augmented generation domain qa', providerForIndex(5)),
    key_findings: 'Grounded retrieval sharply reduces hallucination in specialized QA tasks.',
    tags: ['llm', 'rag', 'question answering', 'hallucination', 'retrieval', 'nlp'],
  },
  {
    title: 'Chain-of-Thought Prompting in Complex Scientific Reasoning',
    authors: 'Wei, Zhou, Arora et al.',
    year: 2023,
    source: 'NeurIPS',
    abstract: 'Evaluation of deliberate reasoning prompts for multi-step scientific and mathematical tasks.',
    url: buildProviderSearchUrl('chain of thought scientific reasoning', providerForIndex(6)),
    key_findings: 'Structured reasoning prompts improve multi-step task accuracy in controlled benchmarks.',
    tags: ['llm', 'reasoning', 'prompting', 'scientific', 'benchmark'],
  },
  {
    title: 'Climate Model Downscaling with Hybrid Physics-AI Systems',
    authors: 'Rasp, Thuerey, Weyn et al.',
    year: 2024,
    source: 'Journal of Climate Informatics',
    abstract: 'Hybrid methods combining physical simulations with deep models for regional climate forecasting.',
    url: buildProviderSearchUrl('climate downscaling hybrid ai', providerForIndex(7)),
    key_findings: 'Hybrid approaches improve regional precision and computation efficiency.',
    tags: ['climate', 'weather', 'forecasting', 'hybrid', 'physics', 'environment'],
  },
  {
    title: 'Satellite-Based Deforestation Monitoring with Computer Vision',
    authors: 'Hansen, Potapov, Tyukavina et al.',
    year: 2023,
    source: 'Remote Sensing of Environment',
    abstract: 'Computer vision models for detecting forest loss using multi-spectral satellite data streams.',
    url: buildProviderSearchUrl('satellite deforestation computer vision', providerForIndex(8)),
    key_findings: 'Automated monitoring pipelines provide faster alerts than manual review processes.',
    tags: ['climate', 'deforestation', 'satellite', 'computer vision', 'environment'],
  },
  {
    title: 'Carbon-Aware Data Center Scheduling for AI Workloads',
    authors: 'Radovanovic, Koningstein, Schneider et al.',
    year: 2024,
    source: 'ACM e-Energy',
    abstract: 'Scheduling strategies that shift AI workloads based on grid carbon intensity forecasts.',
    url: buildProviderSearchUrl('carbon aware data center scheduling ai', providerForIndex(9)),
    key_findings: 'Carbon-aware orchestration lowers emissions for training workloads without major SLA impact.',
    tags: ['climate', 'carbon', 'sustainability', 'energy', 'ai workloads'],
  },
  {
    title: 'Smart Contract Vulnerability Detection Using Graph Neural Networks',
    authors: 'Durieux, Feist, Wang et al.',
    year: 2023,
    source: 'IEEE S&P Workshops',
    abstract: 'Graph-based methods to detect reentrancy and arithmetic vulnerabilities in Solidity contracts.',
    url: buildProviderSearchUrl('smart contract vulnerability graph neural network', providerForIndex(10)),
    key_findings: 'Graph representations improve vulnerability recall over rule-based analyzers.',
    tags: ['blockchain', 'smart contract', 'security', 'ethereum', 'graph neural network'],
  },
  {
    title: 'Scalable Zero-Knowledge Proof Systems for Rollup Networks',
    authors: 'Bowe, Gabizon, Green et al.',
    year: 2025,
    source: 'IACR ePrint',
    abstract: 'Practical tradeoffs in proving systems for high-throughput blockchain rollups.',
    url: buildProviderSearchUrl('zero knowledge proof rollup scaling', providerForIndex(11)),
    key_findings: 'Hardware-aware proving pipelines significantly improve throughput and verification cost.',
    tags: ['blockchain', 'zero knowledge', 'zk', 'rollup', 'scaling', 'cryptography'],
  },
];

const FALLBACK_GAPS = [
  'Insufficient cross-dataset evaluation across domains and populations.',
  'Limited replication studies and long-horizon deployment outcomes.',
  'Need for stronger interpretability and transparent reporting standards.',
  'Lack of robust safety and governance protocols for production use.',
];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scorePaper(queryTokens: string[], paper: CatalogPaper) {
  const haystack = `${paper.title} ${paper.abstract} ${paper.source} ${paper.tags.join(' ')}`.toLowerCase();
  return queryTokens.reduce((score, token) => {
    if (paper.tags.some((tag) => tag.includes(token) || token.includes(tag))) return score + 4;
    if (haystack.includes(token)) return score + 1;
    return score;
  }, 0);
}

function getResearchGaps(queryTokens: string[]) {
  const queryText = queryTokens.join(' ');
  if (/(health|medical|clinic|ehr|biomedical)/.test(queryText)) {
    return [
      'Lack of longitudinal clinical impact studies beyond retrospective benchmarks.',
      'Insufficient integration of imaging, clinical text, and structured EHR signals in unified models.',
      'Few fairness audits across underrepresented demographic groups.',
      'Limited clinician-facing interpretability in high-risk workflows.',
    ];
  }
  if (/(climate|weather|carbon|environment|sustain)/.test(queryText)) {
    return [
      'Sparse real-world transfer evaluation across geographies and seasons.',
      'Limited uncertainty calibration for extreme-event forecasting.',
      'Missing standards for lifecycle carbon accounting in AI-assisted climate tools.',
      'Need for stronger coupling between physical priors and learned models.',
    ];
  }
  if (/(blockchain|smart contract|zk|rollup|crypto)/.test(queryText)) {
    return [
      'Tooling lacks benchmark suites for adversarial smart contract edge cases.',
      'Few studies compare proving-system tradeoffs under real network constraints.',
      'Formal verification integration remains weak in mainstream developer workflows.',
      'Limited post-deployment incident analyses for preventive model feedback loops.',
    ];
  }
  if (/(llm|language model|rag|prompt|reasoning|agent)/.test(queryText)) {
    return [
      'Insufficient evaluation of reasoning reliability outside benchmark-style datasets.',
      'Need stronger provenance tracking and citation guarantees for generated claims.',
      'Limited studies on long-context degradation and memory consistency.',
      'Lack of robust guardrails for autonomous multi-step agent workflows.',
    ];
  }

  return FALLBACK_GAPS;
}

function buildCrossPaperValidation(
  papers: ResearchResult['papers'],
  findings: ResearchResult['key_findings'],
  contradictions: ResearchResult['contradictions']
): NonNullable<ResearchResult['cross_paper_validation']> {
  const validations: NonNullable<ResearchResult['cross_paper_validation']> = [];
  const contradictionTitles = new Set(
    contradictions.flatMap((item) => item.papers.map((title) => title.trim().toLowerCase()))
  );

  const positivePapers = papers
    .filter((paper) => !contradictionTitles.has(paper.title.trim().toLowerCase()))
    .slice(0, 4)
    .map((paper) => paper.title);

  if (positivePapers.length >= 2) {
    validations.push({
      claim: 'Core performance gains are reproducible across independent studies.',
      support_level: 'strong',
      supporting_papers: positivePapers,
      conflicting_papers: [],
      confidence: 0.83,
      notes: `Validated across ${positivePapers.length} papers that report converging results on the same topic.`,
    });
  }

  if (contradictions.length > 0) {
    const contradiction = contradictions[0];
    const firstSupport = findings[0]?.paper_title;
    validations.push({
      claim: 'Real-world deployment impact remains uncertain despite benchmark improvements.',
      support_level: 'mixed',
      supporting_papers: firstSupport ? [firstSupport] : [],
      conflicting_papers: contradiction.papers,
      confidence: 0.62,
      notes: contradiction.description,
    });
  }

  if (papers.length >= 3) {
    const support = papers.slice(1, 4).map((paper) => paper.title);
    validations.push({
      claim: 'Data quality and domain shift are recurring constraints across the literature.',
      support_level: 'moderate',
      supporting_papers: support,
      conflicting_papers: [],
      confidence: 0.71,
      notes: 'Multiple papers independently mention robustness and transferability limitations.',
    });
  }

  return validations;
}

function buildCitationTrails(
  papers: ResearchResult['papers'],
  contradictions: ResearchResult['contradictions']
): NonNullable<ResearchResult['citation_trails']> {
  const trails: NonNullable<ResearchResult['citation_trails']> = [];
  const contradictionPaperSet = new Set(
    contradictions.flatMap((item) => item.papers.map((title) => title.trim().toLowerCase()))
  );

  papers.slice(0, 6).forEach((paper, index, list) => {
    const next1 = list[(index + 1) % list.length]?.title;
    const next2 = list[(index + 2) % list.length]?.title;
    const prev1 = list[(index - 1 + list.length) % list.length]?.title;

    const references = [next1, next2, prev1]
      .filter((title): title is string => Boolean(title && title !== paper.title))
      .slice(0, 3);

    const isContradictionLinked = contradictionPaperSet.has(paper.title.trim().toLowerCase());
    const citationCount = 24 + ((index + 3) * 17);
    const citedByEstimate = 40 + ((index + 1) * 23) + (isContradictionLinked ? 19 : 0);

    trails.push({
      paper_title: paper.title,
      citation_count: citationCount,
      cited_by_estimate: citedByEstimate,
      referenced_papers: references,
      influence_note: isContradictionLinked
        ? 'This paper sits on a debated citation branch and is central to conflicting claims in the topic.'
        : 'This paper appears on a well-supported citation branch and connects to multiple related studies.',
    });
  });

  return trails;
}

function clampWeight(value: number) {
  return Math.max(35, Math.min(98, Math.round(value)));
}

function buildResearchPriorities(
  query: string,
  papers: ResearchResult['papers'],
  contradictions: ResearchResult['contradictions'],
  researchGaps: ResearchResult['research_gaps'],
  crossPaperValidation: NonNullable<ResearchResult['cross_paper_validation']>,
  citationTrails: NonNullable<ResearchResult['citation_trails']>
): NonNullable<ResearchResult['research_priorities']> {
  const topCitation = citationTrails
    .slice()
    .sort((a, b) => b.cited_by_estimate - a.cited_by_estimate)
    .slice(0, 3);

  const topValidation = crossPaperValidation
    .slice()
    .sort((a, b) => b.confidence - a.confidence)[0];

  const contradictionSupport = contradictions[0];
  const leadGap = researchGaps[0]?.description || `Resolve major evidence gaps in ${query}.`;

  const candidates = [
    {
      title: 'Stabilize Evidence Across Conflicting Papers',
      weightage: clampWeight(62 + contradictions.length * 14 + (contradictionSupport ? 6 : 0)),
      rationale: contradictionSupport
        ? `Conflicting claims were detected between key papers. Prioritize replication and head-to-head comparison before downstream decisions. (${contradictionSupport.description})`
        : 'Small contradictions still exist in methods and assumptions. Consolidate findings before committing to one direction.',
      related_papers: contradictionSupport?.papers || papers.slice(0, 2).map((paper) => paper.title),
    },
    {
      title: 'Focus on High-Influence Citation Branches',
      weightage: clampWeight(54 + Math.round((topCitation.reduce((acc, item) => acc + item.cited_by_estimate, 0) / Math.max(topCitation.length, 1)) / 6)),
      rationale: topCitation.length
        ? `These papers anchor the citation network and should lead the briefing narrative before lower-impact studies are considered.`
        : 'Use citation centrality to identify seminal studies first, then expand to adjacent work.',
      related_papers: topCitation.length ? topCitation.map((item) => item.paper_title) : papers.slice(0, 3).map((paper) => paper.title),
    },
    {
      title: 'Close the Most Critical Research Gap',
      weightage: clampWeight(58 + researchGaps.length * 5),
      rationale: `The brief should prioritize unresolved gaps that block reliable adoption. Primary gap: ${leadGap}`,
      related_papers: papers.slice(0, 3).map((paper) => paper.title),
    },
    {
      title: 'Prioritize High-Confidence Cross-Paper Claims',
      weightage: clampWeight(50 + Math.round((topValidation?.confidence || 0.65) * 35)),
      rationale: topValidation
        ? `Start the brief with claims that are validated across papers and have stronger confidence to reduce decision risk. (${topValidation.claim})`
        : 'Begin with claims supported by multiple independent papers and clear reproducibility signals.',
      related_papers: topValidation?.supporting_papers?.slice(0, 3) || papers.slice(0, 3).map((paper) => paper.title),
    },
  ];

  return candidates
    .sort((a, b) => b.weightage - a.weightage)
    .slice(0, 4)
    .map((item, index) => ({
      rank: index + 1,
      title: item.title,
      weightage: item.weightage,
      rationale: item.rationale,
      related_papers: item.related_papers,
    }));
}

function buildTopicFallbackPapers(query: string): ResearchResult['papers'] {
  const normalized = query.toLowerCase();
  const templates = [
    {
      title: `${query}: A Systematic Literature Review (2020-2026)`,
      authors: 'Patel, Kim, Alvarez et al.',
      year: 2026,
      source: 'Journal of Applied AI Research',
      abstract: `A systematic review of methods, datasets, and evaluation protocols for ${query}, including trends in model design and deployment barriers.`,
      key_findings: `Recent work in ${query} shows measurable gains, but benchmark standardization is still inconsistent across studies.`,
      suffix: 'systematic+review',
    },
    {
      title: `Benchmarking Methods for ${query}: Performance, Robustness, and Cost`,
      authors: 'Singh, Romero, Wang et al.',
      year: 2025,
      source: 'IEEE Access',
      abstract: `Compares leading algorithmic families for ${query} with attention to tradeoffs across accuracy, robustness, and compute budget.`,
      key_findings: `No single method dominates ${query}; best choices depend on data quality and operational constraints.`,
      suffix: 'benchmarking+methods',
    },
    {
      title: `Data-Centric Challenges in ${query}: Quality, Shift, and Generalization`,
      authors: 'Lopez, Hassan, Gupta et al.',
      year: 2024,
      source: 'ACM Computing Surveys',
      abstract: `Analyzes dataset curation, domain shift, and labeling noise effects in ${query} pipelines across real-world deployments.`,
      key_findings: `Performance drops under distribution shift remain a key obstacle for dependable ${query} systems.`,
      suffix: 'data+quality+generalization',
    },
    {
      title: `Interpretable and Trustworthy AI for ${query}`,
      authors: 'Nakamura, Das, Reed et al.',
      year: 2025,
      source: 'Nature Machine Intelligence',
      abstract: `Examines explainability, calibration, and governance mechanisms required for trustworthy decision-making in ${query}.`,
      key_findings: `Combining uncertainty estimates with explanation tools improves stakeholder trust in ${query} workflows.`,
      suffix: 'interpretable+trustworthy+ai',
    },
    {
      title: `From Prototype to Production in ${query}: Deployment Lessons and Open Problems`,
      authors: 'Meyer, Iqbal, Chen et al.',
      year: 2026,
      source: 'Proceedings of the AAAI Industry Track',
      abstract: `A deployment-focused synthesis of monitoring, retraining, safety, and policy concerns for ${query} in operational settings.`,
      key_findings: `Operational maturity in ${query} depends on continuous monitoring, drift response, and clear accountability.`,
      suffix: 'production+deployment+lessons',
    },
    {
      title: `Survey of Datasets and Benchmarks for ${query}`,
      authors: 'Verma, Ortega, Hughes et al.',
      year: 2024,
      source: 'Data-Centric AI Letters',
      abstract: `Catalogs public datasets and benchmark protocols used in ${query}, with notes on quality and reproducibility.`,
      key_findings: `Dataset fragmentation in ${query} makes cross-paper comparison difficult without unified evaluation pipelines.`,
      suffix: 'datasets+benchmarks',
    },
    {
      title: `Efficient Model Architectures for ${query} Under Resource Constraints`,
      authors: 'Khan, Silva, Pereira et al.',
      year: 2025,
      source: 'IEEE Transactions on Emerging Topics',
      abstract: `Studies low-latency and low-memory architectures for ${query} in edge and production environments.`,
      key_findings: `Model compression and distillation can preserve much of the performance for ${query} with lower compute cost.`,
      suffix: 'efficient+architectures',
    },
    {
      title: `Safety, Risk, and Governance Frameworks in ${query}`,
      authors: 'Benson, Imai, Rahman et al.',
      year: 2026,
      source: 'AI Policy & Governance Review',
      abstract: `Reviews policy, auditing, and operational safeguards for large-scale deployment of ${query} systems.`,
      key_findings: `Governance maturity is strongly associated with fewer deployment incidents in ${query}.`,
      suffix: 'safety+risk+governance',
    },
    {
      title: `Multi-Modal and Hybrid Approaches for ${query}`,
      authors: 'Roy, Yamamoto, Flores et al.',
      year: 2025,
      source: 'NeurIPS Workshops',
      abstract: `Combines structured, unstructured, and contextual signals to improve robustness and adaptability in ${query}.`,
      key_findings: `Hybrid pipelines often outperform single-modality baselines in ${query} tasks.`,
      suffix: 'multimodal+hybrid+approaches',
    },
    {
      title: `Real-World Deployment Case Studies in ${query}`,
      authors: 'Sato, Johnson, Hale et al.',
      year: 2026,
      source: 'AAAI Industry Proceedings',
      abstract: `Summarizes operational rollouts of ${query} systems, focusing on monitoring, drift, and maintenance outcomes.`,
      key_findings: `Continuous monitoring and retraining policies are critical for stable ${query} performance in production.`,
      suffix: 'real+world+deployment+case+studies',
    },
  ];

  return templates.map((template, index) => {
    const provider = providerForIndex(index);
    return {
      title: template.title,
      authors: template.authors,
      year: template.year,
      source: `${template.source} · ${buildProviderDescriptor(provider)}`,
      abstract: template.abstract,
      url: buildProviderSearchUrl(
        `${normalized} ${template.suffix.replace(/\+/g, ' ')}`,
        provider
      ),
      key_findings: template.key_findings,
    };
  });
}

export function buildMockResearchResult(query: string): ResearchResult {
  const normalizedQuery = query.trim() || 'General AI Research';
  const queryTokens = tokenize(normalizedQuery);

  const ranked = PAPER_CATALOG
    .map((paper) => ({ paper, score: scorePaper(queryTokens, paper) }))
    .sort((a, b) => b.score - a.score);

  const hasCatalogMatch = (ranked[0]?.score || 0) > 0;

  const catalogPapers = ranked.map((item) => {
        const { tags, ...paper } = item.paper;
        return paper;
      });

  const fallbackPapers = buildTopicFallbackPapers(normalizedQuery);

  const candidatePapers = hasCatalogMatch ? catalogPapers : fallbackPapers;

  const papers = ensureAllAcademicSources(candidatePapers);

  const key_findings = papers.map((paper) => ({
    paper_title: paper.title,
    findings: paper.key_findings || 'The paper reports measurable improvements on representative benchmarks.',
  }));

  const contradictions = papers.length >= 2
    ? [
        {
          description: `${papers[0].title} highlights strong gains, while ${papers[1].title} warns that deployment constraints may reduce real-world impact.`,
          papers: [papers[0].title, papers[1].title],
        },
        {
          description: `${papers[papers.length - 2].title} emphasizes performance, whereas ${papers[papers.length - 1].title} prioritizes robustness and safety tradeoffs.`,
          papers: [papers[papers.length - 2].title, papers[papers.length - 1].title],
        },
      ]
    : [];

  const research_gaps = getResearchGaps(queryTokens).map((description) => ({ description }));
  const cross_paper_validation = buildCrossPaperValidation(papers, key_findings, contradictions);
  const citation_trails = buildCitationTrails(papers, contradictions);
  const research_priorities = buildResearchPriorities(
    normalizedQuery,
    papers,
    contradictions,
    research_gaps,
    cross_paper_validation,
    citation_trails
  );

  return {
    job_id: 'demo-001',
    status: 'completed',
    query: normalizedQuery,
    papers,
    key_findings,
    contradictions,
    research_gaps,
    cross_paper_validation,
    citation_trails,
    research_priorities,
    overview: `This analysis surfaces ${papers.length} papers related to "${normalizedQuery}", follows ${citation_trails.length} citation trails, flags ${contradictions.length} notable tensions, identifies ${research_gaps.length} priority research gaps, runs ${cross_paper_validation.length} cross-paper validation checks, and ranks ${research_priorities.length} weighted brief priorities.`,
    synthesis: undefined,
  };
}

export function buildMockSynthesis(result: ResearchResult): string {
  const leadPapers = result.papers.slice(0, 3).map((paper) => paper.title).join('; ');
  const leadGap = result.research_gaps[0]?.description;
  const contradiction = result.contradictions[0]?.description;
  const crossValidation = result.cross_paper_validation?.[0];
  const citationTrail = result.citation_trails?.[0];
  const topPriority = result.research_priorities?.[0];

  return [
    `Across the reviewed literature on ${result.query}, the evidence suggests meaningful progress with clear application potential. Core support comes from ${leadPapers}.`,
    `Priority ranking (by weightage) places "${topPriority?.title || 'evidence stabilization'}" at the top with ${topPriority?.weightage || 80}% weight, guiding what should appear first in the research brief.`,
    `Citation-trail analysis shows ${result.citation_trails?.length || 0} influential branches. ${citationTrail ? `${citationTrail.paper_title} is a central node with an estimated cited-by count of ${citationTrail.cited_by_estimate}.` : 'Key papers were prioritized by how strongly they connect to related work.'}`,
    `Cross-paper validation indicates: ${crossValidation?.claim || 'several claims are supported by multiple independent papers.'} Confidence: ${crossValidation ? Math.round(crossValidation.confidence * 100) : 70}%.`,
    `At the same time, the literature is not fully aligned. A major tension appears in the analysis: ${contradiction || 'performance advances are often ahead of real-world validation constraints.'}`,
    `A high-priority next step is to address: ${leadGap || 'the gap between benchmark gains and production reliability.'} Future studies should emphasize reproducibility, cross-domain transfer, and governance-aware deployment standards.`,
  ].join('\n\n');
}

export const MOCK_RESULT: ResearchResult = buildMockResearchResult('Machine Learning in Healthcare');
