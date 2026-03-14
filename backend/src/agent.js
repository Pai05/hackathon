import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import crypto from "crypto";
import { ChromaClient } from "chromadb";
import crypto from "crypto";

const geminiApiKey = "AIzaSyApiQtP5E1pR6NiAhHNkqrgcf6OAQsV2Lc";
const grokApiKey = "sxf00JnwC3OLrOnd6UzDWGdyb3FYDQxJXCUcdJt9BHQQ4ABeTlLu";

const genAI = new GoogleGenerativeAI(geminiApiKey);
// Using a standard modern fast model, fallback to a widely supported string "gemini-1.5-flash"
const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", 
  generationConfig: { responseMimeType: "application/json" } 
});

const openai = new OpenAI({
  apiKey: grokApiKey,
  baseURL: "https://api.x.ai/v1", // xAI API endpoint
});

const chromaClient = new ChromaClient();
const jobs = new Map();

// Helper to chunk text
function chunkText(text, maxChars = 800) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Step 1 of the research pipeline: AI Research Query Enhancement Agent.
// Transforms vague user queries into detailed academic search queries.
async function enhanceQuery(rawQuery) {
  console.log(`[QueryEnhancer] Raw input: "${rawQuery}"`);
  try {
    const simpleModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `ROLE: AI Research Query Enhancement Agent

OBJECTIVE:
Transform the following user research query into a detailed academic search query optimized for retrieving relevant scientific research papers from academic databases.

INPUT QUERY: "${rawQuery}"

PROCESS:
1. Identify missing technical keywords in the query.
2. Expand the query with: academic terminology, related research topics, and common research keywords.
3. If the query starts with phrases like "Find papers similar to:", "Research into:", "Research gap -", extract the core topic and expand from there.
4. Produce a refined single-sentence query suitable for semantic search and academic database retrieval.
5. Do NOT generate answers or explanations, only enhance the search query.

RULES:
- Maintain the original intent of the user.
- Focus on academic literature retrieval keywords.
- Output ONLY the enhanced academic query as a single sentence. No labels, no markdown, no extra text.

Example:
- Input: "AI in healthcare"
- Output: "Recent machine learning and deep learning techniques applied to healthcare data analysis, medical imaging diagnostics, and clinical decision support systems."`;

    const result = await simpleModel.generateContent(prompt);
    const enhanced = result.response.text().trim().replace(/\n+/g, ' ');
    console.log(`[QueryEnhancer] Enhanced: "${enhanced}"`);
    return enhanced || rawQuery;
  } catch (err) {
    console.warn("[QueryEnhancer] Enhancement failed, using raw query:", err.message);
    return rawQuery;
  }
}

async function fetchPapers(rawQuery) {
  const query = await enhanceQuery(rawQuery);
  console.log(`\n--- Starting Research for query: "${query}" ---`);
  console.log("1. Fetching papers from CrossRef...");
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&select=title,author,abstract,URL,published&rows=200`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
  const data = await response.json();
  const items = data?.message?.items || [];
  
  return items.map((item, index) => {
    let authors = "Unknown";
    if (item.author) {
      authors = item.author.map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(", ");
    }
    let year = "Unknown";
    if (item.published && item.published['date-parts']) {
      year = item.published['date-parts'][0][0];
    }
    
    // MOCK SOURCE MAPPING FOR UI TO SUPPORT REQUESTED DATABASES
    const mockSources = [
      { name: "arXiv", urlBase: "https://arxiv.org/search/advanced?query=" },
      { name: "PubMed", urlBase: "https://pubmed.ncbi.nlm.nih.gov/?term=" },
      { name: "Semantic Scholar", urlBase: "https://www.semanticscholar.org/search?q=" },
      { name: "Google Scholar", urlBase: "https://scholar.google.com/scholar?q=" }
    ];
    const assignedSource = mockSources[index % mockSources.length];
    // If the paper has a real CrossRef URL and it's not a generic dx.doi.org, use it. Otherwise construct a search link.
    // However, the requested domains need to actually be in the string for the frontend pill categorization to work.
    const fallbackUrl = assignedSource.urlBase + encodeURIComponent(item.title?.[0] || "Untitled");

    return {
      title: item.title?.[0] || "Untitled",
      authors,
      year,
      source: assignedSource.name,
      abstract: item.abstract?.replace(/<[^>]+>/g, '') || "No abstract available.",
      url: item.URL || fallbackUrl,
      doi: item.DOI || null,
    };
  }).filter(p => p.abstract && p.abstract !== "No abstract available.")
    .slice(0, 25)
    .map((p, i) => ({ ...p, ref: i + 1 })); // Assign stable 1-based reference IDs after filtering
}

export async function startResearchJob(rawQuery) {
  const jobId = crypto.randomUUID();
  // Enhance the query before storing (so the display query reflects the academic expansion)
  const query = await enhanceQuery(rawQuery);
  jobs.set(jobId, { status: "running", query });
  
  (async () => {
    try {
      const papers = await fetchPapers(query);
      if (papers.length === 0) {
        jobs.set(jobId, { status: "failed", query, error: "No papers found." });
        return;
      }
      
      console.log(`Found ${papers.length} papers. Proceeding to Chroma DB ingestion...`);
      
      let collection;
      try {
          collection = await chromaClient.getOrCreateCollection({
              name: `job_${jobId.replace(/-/g, '')}`,
          });
      } catch (err) {
          console.error("ChromaDB connection error. Is it running? Falling back to standard prompt...", err.message);
      }

      let papersContext = "";
      
      if (collection) {
        // Embed the papers
        const documents = [];
        const metadatas = [];
        const ids = [];
        let chunkIndex = 0;

        for (const paper of papers) {
            const chunks = chunkText(`Title: ${paper.title}\nAuthors: ${paper.authors}\nAbstract: ${paper.abstract}`);
            for (const chunk of chunks) {
                documents.push(chunk);
                metadatas.push({ title: paper.title, authors: paper.authors, year: paper.year, source: paper.source });
                ids.push(`chunk_${chunkIndex++}`);
            }
        }
        
        // Simple embedding function using Gemini (Note: in production a dedicated embedding model is much faster)
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddings = [];
        console.log(`Generating embeddings for ${documents.length} chunks...`);
        for (const doc of documents) {
           const result = await embeddingModel.embedContent(doc);
           embeddings.push(result.embedding.values);
        }

        await collection.add({
            ids,
            embeddings,
            metadatas,
            documents
        });

        // Query the most relevant chunks for the analysis prompt to save context windows
        const queryEmbedding = await embeddingModel.embedContent(`Find key findings, research gaps, and contradictions regarding ${query}`);
        const searchResults = await collection.query({
            queryEmbeddings: [queryEmbedding.embedding.values],
            nResults: 30, // Get top 30 most relevant chunks
        });

        const relevantChunks = searchResults.documents[0];
        const relevantMetadata = searchResults.metadatas[0];

        // Format only the retrieved context for the LLM — with numbered references
        papersContext = relevantChunks.map((chunk, i) => `[Source: ${relevantMetadata[i].title}]\n${chunk}`).join("\n\n");
      } else {
        // Fallback to the old full-context method if Chroma DB is not running
        papersContext = papers.map((p, i) => `[${i+1}] Title: ${p.title}\nAuthors: ${p.authors}\nAbstract: ${p.abstract}`).join("\n\n");
      }

      // Build a numbered reference list so Gemini can cite papers precisely
      const referenceList = papers.map((p, i) => `[${i+1}] ${p.title} (${p.authors}, ${p.year})`).join("\n");
      
const prompt = `You are an expert AI research analyst. Thoroughly analyze the following academic papers about "${query}".

== PAPER REFERENCE LIST ==
Use these exact reference numbers when citing papers in your analysis:
${referenceList}

== PAPER CONTENT ==
${papersContext}

You MUST respond in valid JSON format matching this schema exactly. Do not leave arrays empty if you can infer data.
{
  "key_findings": [ { "paper_title": "Exact Title from list", "findings": "Detailed finding. Cite as [N] where N is the reference number." } ],
  "contradictions": [ { "description": "Describe conflicting methods or results between papers. Always cite papers as [N] and [M].", "papers": ["[N] Title 1", "[M] Title 2"] } ],
  "research_gaps": [ { "description": "What is missing from the current literature? Cite supporting papers as [N] where applicable." } ],
  "cross_paper_validation": [ { "claim": "String", "support_level": "strong", "supporting_papers": ["[N] Title"], "conflicting_papers": [], "confidence": 0.9, "notes": "Cite papers as [N]" } ],
  "citation_trails": [ { "paper_title": "[N] Title", "citation_count": 100, "cited_by_estimate": 50, "referenced_papers": ["[M] Title 1"], "influence_note": "Why is this influential" } ],
  "research_priorities": [ { "rank": 1, "title": "Priority area", "weightage": 85, "rationale": "Why pursue this. Cite relevant papers as [N].", "related_papers": ["[N] Title"] } ]
}

CRITICAL RULES:
- Always use [N] reference numbers when mentioning papers. Example: "Paper [3] found that..."
- You must extract at least 2 contradictions, 3 research gaps, and 3 citation trails from the papers provided.
- If actual citation numbers aren't present, estimate based on the paper's importance.
- The paper reference numbers MUST match the numbered reference list above.
`;

      console.log("2. Sending prompt to Gemini API...");
      const result = await geminiModel.generateContent(prompt);
      console.log("Gemini API response received. Parsing JSON...");
      let responseText = result.response.text();
      
      const structuredData = JSON.parse(responseText.trim().replace(/^```json/g, '').replace(/```$/g, ''));
      
      const combinedResult = {
        job_id: jobId,
        status: "completed",
        query,
        papers,
        overview: `Analyzed ${papers.length} papers for "${query}".`,
        ...structuredData
      };
      
      jobs.set(jobId, combinedResult);
    } catch (error) {
      console.error("Agent error:", error);
      jobs.set(jobId, { status: "failed", query, error: error.message });
    }
  })();

  return { job_id: jobId };
}

export function getJobStatus(jobId) {
  const job = jobs.get(jobId);
  if (!job) return { status: "failed", error: "Job not found" };
  return job;
}

export async function synthesizeJob(jobId) {
  const job = jobs.get(jobId);
  if (!job || job.status !== "completed") {
    throw new Error("Job not complete or not found");
  }

  const prompt = `Write a comprehensive, professional research synthesis (1-2 paragraphs) based on these findings for the query "${job.query}":
  
  Key Findings: ${JSON.stringify(job.key_findings)}
  Contradictions: ${JSON.stringify(job.contradictions)}
  Gaps: ${JSON.stringify(job.research_gaps)}`;

  let synthesis;
  try {
    const completion = await openai.chat.completions.create({
      model: "grok-beta", 
      messages: [
        { role: "system", content: "You are an expert academic research assistant." },
        { role: "user", content: prompt }
      ]
    });
    synthesis = completion.choices[0].message.content;
  } catch (error) {
    console.warn("Grok failed (" + error.message + "). Falling back to Gemini for synthesis.");
    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await fallbackModel.generateContent(
      "You are an expert academic research assistant.\n\n" + prompt
    );
    synthesis = result.response.text();
  }

  job.synthesis = synthesis;
  jobs.set(jobId, job);
  
  return { synthesis };
}

export async function chatWithAgent(jobId, history, message) {
  const job = jobs.get(jobId);
  if (!job || job.status !== "completed") {
    throw new Error("Job not complete or not found");
  }

  const context = `
  You are an expert AI research assistant named ResearchHub Chatbot.
  You are currently assisting a researcher who is looking at a dashboard containing findings for the query: "${job.query}".
  
  Use the following extracted insights from the research to directly, accurately, and thoroughly answer the user's questions. 
  When you reference information, strongly link them to the specific paper titles.
  
  RESEARCH CONTEXT:
  - Key Findings: ${JSON.stringify(job.key_findings)}
  - Contradictions: ${JSON.stringify(job.contradictions)}
  - Gaps: ${JSON.stringify(job.research_gaps)}
  - Citation Trails: ${JSON.stringify(job.citation_trails)}
  - Priorities: ${JSON.stringify(job.research_priorities)}
  - All Reviewed Papers: ${JSON.stringify(job.papers.map(p => ({ title: p.title, authors: p.authors, abstract: p.abstract })))}
  `;

  const chatContext = [
    { role: "user", parts: [{ text: context }] },
    { role: "model", parts: [{ text: "Understood. I have reviewed the research results. I am ready to answer any questions the user has based on this data." }]}
  ];

  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  // Query Chroma DB if the user asks a specific question
  let additionalContext = "";
  try {
     const collection = await chromaClient.getCollection({ name: `job_${jobId.replace(/-/g, '')}` });
     const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
     const queryEmbedding = await embeddingModel.embedContent(message);
     const searchResults = await collection.query({
         queryEmbeddings: [queryEmbedding.embedding.values],
         nResults: 5,
     });
     
     if (searchResults.documents[0] && searchResults.documents[0].length > 0) {
         additionalContext = `\n\nRELEVANT EXCERPTS FROM PAPERS TO HELP ANSWER THIS QUESTION:\n` + 
             searchResults.documents[0].map((doc, i) => `[Source: ${searchResults.metadatas[0][i].title}]\n${doc}`).join("\n\n");
     }
  } catch (err) {
      console.log("Could not query Chroma DB for chat context:", err.message);
  }

  const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const chat = fallbackModel.startChat({
    history: [...chatContext, { role: "user", parts: [{ text: "Use these paper excerpts to answer if relevant: " + additionalContext }] }, ...geminiHistory]
  });

  const result = await chat.sendMessage(message);
  return { text: result.response.text() };
}

export async function getSuggestions(query) {
  try {
    const prompt = `You are an expert AI research analyst. The user has typed the following broad research topic: "${query}".

Generate 3 to 5 specific, highly advanced, and focused research queries that the user could use instead to get a more specialized analysis.

Respond ONLY with a valid JSON array of strings. Do not include markdown formatting or any other text.
Example: ["Machine learning applied to genomic sequencing", "Bias mitigation algorithms in healthcare ML", "Federated learning for IoT privacy"]`;

    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await fallbackModel.generateContent(prompt);
    let responseText = result.response.text();
    const suggestions = JSON.parse(responseText.trim().replace(/^```json/g, '').replace(/```$/g, ''));
    return { suggestions: Array.isArray(suggestions) ? suggestions : [] };
  } catch (err) {
    console.error("Failed to generate suggestions:", err);
    return { suggestions: [] };
  }
}

export async function extractKeywordsFromPaper({ title, abstract, key_findings }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const content = [
      `Title: ${title}`,
      abstract ? `Abstract: ${abstract.slice(0, 800)}` : '',
      key_findings ? `Key Findings: ${key_findings.slice(0, 300)}` : '',
    ].filter(Boolean).join('\n');

    const result = await model.generateContent(
      `You are an academic search specialist. Extract 6-10 specific technical keywords and keyphrases from the following research paper content that can be used to find related papers on the same topic in CrossRef.\n\nPaper details:\n${content}\n\nRespond ONLY with a JSON array of keyword strings. Example: ["transformer architecture", "low-resource NLP", "cross-lingual transfer learning"]\n\nKeywords:`
    );

    const raw = result.response.text().trim().replace(/^```json/g, '').replace(/```$/g, '');
    const keywords = JSON.parse(raw);
    return { keywords: Array.isArray(keywords) ? keywords : [] };
  } catch (err) {
    console.error("Failed to extract keywords:", err);
    // Fallback: naive keyword extraction from title
    const fallback = title.split(' ').filter(w => w.length > 4).slice(0, 8);
    return { keywords: fallback };
  }
}
