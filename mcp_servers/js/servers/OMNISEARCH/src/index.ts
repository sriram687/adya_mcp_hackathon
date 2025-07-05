#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ================ INTERFACES ================

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  published_date?: string;
  score?: number;
}

interface TavilySearchResult {
  query: string;
  follow_up_questions: string[];
  answer: string;
  images: string[];
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date: string;
  }>;
}

interface BraveSearchResult {
  query: {
    original: string;
    show_strict_warning: boolean;
    is_navigational: boolean;
    is_geolocated: boolean;
    local_decision: string;
    local_locations_idx: number;
    is_trending: boolean;
    is_news_breaking: boolean;
    spellcheck_off: boolean;
    country: string;
    bad_results: boolean;
    should_fallback: boolean;
    postal_code: string;
    city: string;
    header_country: string;
    more_results_available: boolean;
    custom_location_label: string;
    reddit_cluster: string;
  };
  mixed: {
    type: string;
    main: Array<{
      type: string;
      index: number;
      all: boolean;
    }>;
    top: Array<{
      type: string;
      index: number;
      all: boolean;
    }>;
    side: Array<{
      type: string;
      index: number;
      all: boolean;
    }>;
  };
  type: string;
  web: {
    type: string;
    results: Array<{
      type: string;
      index: number;
      url: string;
      title: string;
      description: string;
      date: string;
      extra_snippets: string[];
    }>;
    family_friendly: boolean;
  };
}

interface KagiSearchResult {
  meta: {
    id: string;
    node: string;
    ms: number;
  };
  data: Array<{
    t: number; // Type: 0 = Search Result, 1 = Related Searches
    url?: string;
    title?: string;
    snippet?: string;
    published?: string;
    thumbnail?: {
      url: string;
      height?: number;
      width?: number;
    };
    list?: string[]; // For related searches (t=1)
  }>;
}

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
}

interface JinaReaderResponse {
  code: number;
  status: number;
  data: {
    title: string;
    description: string;
    url: string;
    content: string;
    usage: {
      tokens: number;
    };
  };
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data: {
    markdown: string;
    html: string;
    rawHtml: string;
    metadata: {
      title: string;
      description: string;
      language: string;
      keywords: string;
      robots: string;
      ogTitle: string;
      ogDescription: string;
      ogUrl: string;
      ogImage: string;
      ogAudio: string;
      ogDeterminer: string;
      ogLocale: string;
      ogLocaleAlternate: string[];
      ogSiteName: string;
      ogVideo: string;
      dctermsCreated: string;
      dctermsType: string;
      dctermsFormat: string;
      dctermsIdentifier: string;
      dctermsPublisher: string;
      dctermsTitle: string;
      dctermsDescription: string;
      modifiedTime: string;
      publishedTime: string;
      articleTag: string;
      articleSection: string;
      sourceURL: string;
      statusCode: number;
      error: string;
    };
  };
}

// ================ CONFIGURATION ================

interface ProviderConfig {
  tavily: boolean;
  brave: boolean;
  kagi: boolean;
  perplexity: boolean;
  jina: boolean;
  firecrawl: boolean;
}

// Check available API keys and configure providers
const providerConfig: ProviderConfig = {
  tavily: !!process.env.TAVILY_API_KEY,
  brave: !!process.env.BRAVE_API_KEY,
  kagi: !!process.env.KAGI_API_KEY,
  perplexity: !!process.env.PERPLEXITY_API_KEY,
  jina: !!process.env.JINA_API_KEY,
  firecrawl: !!process.env.FIRECRAWL_API_KEY,
};

// Log available providers
console.log("Available providers:", Object.entries(providerConfig)
  .filter(([, available]) => available)
  .map(([provider]) => provider)
  .join(", ") || "None");

// ================ SERVER INIT ================
const server = new McpServer({
  name: "OMNISEARCH",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// ================ HELPER FUNCTIONS ================

async function makeApiRequest<T>({
  url,
  method = 'GET',
  headers = {},
  data,
  timeout = 30000
}: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
}): Promise<T> {
  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout,
    });
    
    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      const responseData = error.response.data;
      
      // Handle specific API error messages
      if (responseData && typeof responseData === 'object' && responseData.error) {
        if (Array.isArray(responseData.error) && responseData.error.length > 0) {
          const errorMsg = responseData.error[0].msg || responseData.error[0].message || 'Unknown error';
          throw new Error(`API error (${status}): ${errorMsg}`);
        } else if (typeof responseData.error === 'string') {
          throw new Error(`API error (${status}): ${responseData.error}`);
        } else if (responseData.error.message) {
          throw new Error(`API error (${status}): ${responseData.error.message}`);
        }
      }
      
      // Handle common status codes
      if (status === 401) {
        throw new Error(`API error (${status}): Invalid or expired API key`);
      } else if (status === 403) {
        throw new Error(`API error (${status}): Access forbidden - check API key permissions`);
      } else if (status === 429) {
        throw new Error(`API error (${status}): Rate limit exceeded - please wait and try again`);
      } else if (status === 500) {
        throw new Error(`API error (${status}): Internal server error - please try again later`);
      }
      
      throw new Error(`API error: ${status} - ${statusText}`);
    }
    throw error;
  }
}

// ================ SEARCH PROVIDERS ================

// Tavily Search
async function tavilySearch(query: string, options: {
  include_domains?: string[];
  exclude_domains?: string[];
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_images?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
}): Promise<TavilySearchResult> {
  if (!providerConfig.tavily) {
    throw new Error("Tavily API key not configured");
  }

  const requestData = {
    query,
    api_key: process.env.TAVILY_API_KEY,
    search_depth: options.search_depth || 'basic',
    include_answer: options.include_answer ?? true,
    include_images: options.include_images ?? false,
    include_raw_content: options.include_raw_content ?? false,
    max_results: options.max_results || 10,
    ...(options.include_domains && { include_domains: options.include_domains }),
    ...(options.exclude_domains && { exclude_domains: options.exclude_domains }),
  };

  return await makeApiRequest<TavilySearchResult>({
    url: 'https://api.tavily.com/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Brave Search
async function braveSearch(query: string, options: {
  country?: string;
  search_lang?: string;
  ui_lang?: string;
  count?: number;
  offset?: number;
  safesearch?: 'off' | 'moderate' | 'strict';
  freshness?: 'pd' | 'pw' | 'pm' | 'py';
  text_decorations?: boolean;
  spellcheck?: boolean;
}): Promise<BraveSearchResult> {
  if (!providerConfig.brave) {
    throw new Error("Brave API key not configured");
  }

  const params = new URLSearchParams({
    q: query,
    country: options.country || 'US',
    search_lang: options.search_lang || 'en',
    ui_lang: options.ui_lang || 'en',
    count: String(options.count || 10),
    offset: String(options.offset || 0),
    safesearch: options.safesearch || 'moderate',
    text_decorations: String(options.text_decorations ?? true),
    spellcheck: String(options.spellcheck ?? true),
    ...(options.freshness && { freshness: options.freshness }),
  });

  return await makeApiRequest<BraveSearchResult>({
    url: `https://api.search.brave.com/res/v1/web/search?${params}`,
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': process.env.BRAVE_API_KEY!,
    },
  });
}

// Kagi Search
async function kagiSearch(query: string, options: {
  limit?: number;
}): Promise<KagiSearchResult> {
  if (!providerConfig.kagi) {
    throw new Error("Kagi API key not configured");
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(options.limit || 10),
  });

  return await makeApiRequest<KagiSearchResult>({
    url: `https://kagi.com/api/v0/search?${params}`,
    headers: {
      'Authorization': `Bot ${process.env.KAGI_API_KEY}`,
    },
  });
}

// ================ AI RESPONSE PROVIDERS ================

// Perplexity AI
async function perplexityChat(query: string, options: {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  return_citations?: boolean;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}): Promise<PerplexityResponse> {
  if (!providerConfig.perplexity) {
    throw new Error("Perplexity API key not configured");
  }

  const requestData = {
    model: options.model || 'llama-3.1-sonar-small-128k-online',
    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
    max_tokens: options.max_tokens,
    temperature: options.temperature ?? 0.2,
    top_p: options.top_p ?? 0.9,
    return_citations: options.return_citations ?? true,
    search_domain_filter: options.search_domain_filter,
    return_images: options.return_images ?? false,
    return_related_questions: options.return_related_questions ?? false,
    search_recency_filter: options.search_recency_filter,
    top_k: options.top_k ?? 0,
    stream: options.stream ?? false,
    presence_penalty: options.presence_penalty ?? 0,
    frequency_penalty: options.frequency_penalty ?? 1,
  };

  return await makeApiRequest<PerplexityResponse>({
    url: 'https://api.perplexity.ai/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Kagi FastGPT
async function kagiFastGPT(query: string, options: {
  web_search?: boolean;
  cache?: boolean;
}): Promise<any> {
  if (!providerConfig.kagi) {
    throw new Error("Kagi API key not configured");
  }

  const params = new URLSearchParams({
    query,
    web_search: String(options.web_search ?? true),
    cache: String(options.cache ?? true),
  });

  return await makeApiRequest({
    url: `https://kagi.com/api/v0/fastgpt?${params}`,
    headers: {
      'Authorization': `Bot ${process.env.KAGI_API_KEY}`,
    },
  });
}

// ================ CONTENT PROCESSING ================

// Jina AI Search
async function jinaSearch(query: string, options: {
  count?: number;
}): Promise<any> {
  if (!providerConfig.jina) {
    throw new Error("Jina API key not configured");
  }

  const requestData = {
    q: query,
    count: options.count || 10,
  };

  return await makeApiRequest({
    url: 'https://s.jina.ai/',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Jina AI Reader
async function jinaReader(url: string, options: {
  gather_all_links?: boolean;
  gather_all_images?: boolean;
  with_generated_alt?: boolean;
  proxy_server?: string;
  no_cache?: boolean;
  with_iframe?: boolean;
  with_shadow_dom?: boolean;
  with_generated_summary?: boolean;
}): Promise<JinaReaderResponse> {
  if (!providerConfig.jina) {
    throw new Error("Jina API key not configured");
  }

  const params = new URLSearchParams({
    url,
    'gather-all-links': String(options.gather_all_links ?? false),
    'gather-all-images': String(options.gather_all_images ?? false),
    'with-generated-alt': String(options.with_generated_alt ?? false),
    'no-cache': String(options.no_cache ?? false),
    'with-iframe': String(options.with_iframe ?? false),
    'with-shadow-dom': String(options.with_shadow_dom ?? false),
    'with-generated-summary': String(options.with_generated_summary ?? false),
    ...(options.proxy_server && { 'proxy-server': options.proxy_server }),
  });

  return await makeApiRequest<JinaReaderResponse>({
    url: `https://r.jina.ai/${url}?${params}`,
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Accept': 'application/json',
    },
  });
}

// Kagi Universal Summarizer
async function kagiSummarizer(url: string, options: {
  engine?: 'cecil' | 'agnes' | 'daphne' | 'muriel';
  summary_type?: 'summary' | 'takeaways';
  target_language?: string;
  cache?: boolean;
}): Promise<any> {
  if (!providerConfig.kagi) {
    throw new Error("Kagi API key not configured");
  }

  const params = new URLSearchParams({
    url,
    engine: options.engine || 'cecil',
    summary_type: options.summary_type || 'summary',
    target_language: options.target_language || 'EN',
    cache: String(options.cache ?? true),
  });

  return await makeApiRequest({
    url: `https://kagi.com/api/v0/summarize?${params}`,
    headers: {
      'Authorization': `Bot ${process.env.KAGI_API_KEY}`,
    },
  });
}

// Tavily Extract
async function tavilyExtract(urls: string[], options: {
  extraction_depth?: 'basic' | 'advanced';
}): Promise<any> {
  if (!providerConfig.tavily) {
    throw new Error("Tavily API key not configured");
  }

  const requestData = {
    urls,
    api_key: process.env.TAVILY_API_KEY,
    extraction_depth: options.extraction_depth || 'basic',
  };

  return await makeApiRequest({
    url: 'https://api.tavily.com/extract',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Scrape
async function firecrawlScrape(url: string, options: {
  formats?: string[];
  headers?: Record<string, string>;
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  timeout?: number;
  waitFor?: number;
  mobile?: boolean;
}): Promise<FirecrawlScrapeResponse> {
  if (!providerConfig.firecrawl) {
    throw new Error("Firecrawl API key not configured");
  }

  const requestData = {
    url,
    formats: options.formats || ['markdown', 'html'],
    headers: options.headers,
    includeTags: options.includeTags,
    excludeTags: options.excludeTags,
    onlyMainContent: options.onlyMainContent ?? true,
    timeout: options.timeout || 30000,
    waitFor: options.waitFor || 0,
    mobile: options.mobile ?? false,
  };

  return await makeApiRequest<FirecrawlScrapeResponse>({
    url: 'https://api.firecrawl.dev/v1/scrape',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Crawl
async function firecrawlCrawl(url: string, options: {
  excludePaths?: string[];
  includePaths?: string[];
  maxDepth?: number;
  limit?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  ignoreSitemap?: boolean;
  formats?: string[];
  headers?: Record<string, string>;
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  timeout?: number;
  waitFor?: number;
  mobile?: boolean;
}): Promise<any> {
  if (!providerConfig.firecrawl) {
    throw new Error("Firecrawl API key not configured");
  }

  const requestData = {
    url,
    excludePaths: options.excludePaths,
    includePaths: options.includePaths,
    maxDepth: options.maxDepth || 2,
    limit: options.limit || 100,
    allowBackwardLinks: options.allowBackwardLinks ?? false,
    allowExternalLinks: options.allowExternalLinks ?? false,
    ignoreSitemap: options.ignoreSitemap ?? false,
    scrapeOptions: {
      formats: options.formats || ['markdown'],
      headers: options.headers,
      includeTags: options.includeTags,
      excludeTags: options.excludeTags,
      onlyMainContent: options.onlyMainContent ?? true,
      timeout: options.timeout || 30000,
      waitFor: options.waitFor || 0,
      mobile: options.mobile ?? false,
    },
  };

  return await makeApiRequest({
    url: 'https://api.firecrawl.dev/v1/crawl',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Map
async function firecrawlMap(url: string, options: {
  search?: string;
  ignoreSitemap?: boolean;
  includeSubdomains?: boolean;
  limit?: number;
}): Promise<any> {
  if (!providerConfig.firecrawl) {
    throw new Error("Firecrawl API key not configured");
  }

  const requestData = {
    url,
    search: options.search,
    ignoreSitemap: options.ignoreSitemap ?? false,
    includeSubdomains: options.includeSubdomains ?? false,
    limit: options.limit || 5000,
  };

  return await makeApiRequest({
    url: 'https://api.firecrawl.dev/v1/map',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Extract
async function firecrawlExtract(url: string, options: {
  prompt: string;
  schema?: any;
  systemPrompt?: string;
  timeout?: number;
  waitFor?: number;
  mobile?: boolean;
}): Promise<any> {
  if (!providerConfig.firecrawl) {
    throw new Error("Firecrawl API key not configured");
  }

  const requestData = {
    url,
    formats: ['extract'],
    extract: {
      prompt: options.prompt,
      schema: options.schema,
      systemPrompt: options.systemPrompt,
    },
    timeout: options.timeout || 30000,
    waitFor: options.waitFor || 0,
    mobile: options.mobile ?? false,
  };

  return await makeApiRequest({
    url: 'https://api.firecrawl.dev/v1/scrape',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// ================ ENHANCEMENT TOOLS ================

// Jina AI Grounding
async function jinaGrounding(source: string, statements: string[]): Promise<any> {
  if (!providerConfig.jina) {
    throw new Error("Jina API key not configured");
  }

  const requestData = {
    source,
    statements,
  };

  return await makeApiRequest({
    url: 'https://api.jina.ai/v1/grounding',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Kagi Enrichment
async function kagiEnrichment(url: string, options: {
  engine?: 'teclis' | 'tinygem';
}): Promise<any> {
  if (!providerConfig.kagi) {
    throw new Error("Kagi API key not configured");
  }

  const params = new URLSearchParams({
    url,
    engine: options.engine || 'teclis',
  });

  return await makeApiRequest({
    url: `https://kagi.com/api/v0/enrich/web?${params}`,
    headers: {
      'Authorization': `Bot ${process.env.KAGI_API_KEY}`,
    },
  });
}

// ================ TOOL DEFINITIONS ================

// Tavily Search Tool
if (providerConfig.tavily) {
  server.tool(
    "tavily_search",
    "Search using Tavily - optimized for factual information with strong citation support. Supports domain filtering through API parameters.",
    {
      query: z.string().describe("The search query"),
      include_domains: z.array(z.string()).optional().describe("List of domains to include in search"),
      exclude_domains: z.array(z.string()).optional().describe("List of domains to exclude from search"),
      search_depth: z.enum(['basic', 'advanced']).optional().describe("Search depth - basic or advanced"),
      include_answer: z.boolean().optional().describe("Include AI-generated answer"),
      include_images: z.boolean().optional().describe("Include images in results"),
      include_raw_content: z.boolean().optional().describe("Include raw content from sources"),
      max_results: z.number().optional().describe("Maximum number of results to return"),
    },
    async ({ query, include_domains, exclude_domains, search_depth, include_answer, include_images, include_raw_content, max_results }) => {
      try {
        const result = await tavilySearch(query, {
          include_domains,
          exclude_domains,
          search_depth: search_depth || 'basic',
          include_answer: include_answer ?? true,
          include_images: include_images ?? false,
          include_raw_content: include_raw_content ?? false,
          max_results: max_results || 10,
        });

        return {
          content: [
            {
              type: "text",
              text: `Tavily Search Results for "${query}":

${result.answer ? `Answer: ${result.answer}\n\n` : ''}Results:
${(result.results || []).map((r, i) => `${i + 1}. ${r.title}
   URL: ${r.url}
   Score: ${r.score}
   Published: ${r.published_date || 'N/A'}
   Content: ${r.content ? r.content.substring(0, 200) + '...' : 'No content available'}
`).join('\n')}

${(result.follow_up_questions || []).length > 0 ? `Follow-up Questions:
${result.follow_up_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

${(result.images || []).length > 0 ? `Images:
${result.images.map((img, i) => `${i + 1}. ${img}`).join('\n')}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing Tavily search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Tavily News Search Tool
if (providerConfig.tavily) {
  server.tool(
    "tavily_search_news",
    "Search for news using Tavily - optimized for current news and real-time information with strong citation support.",
    {
      query: z.string().describe("The news search query"),
      include_domains: z.array(z.string()).optional().describe("List of domains to include in search"),
      exclude_domains: z.array(z.string()).optional().describe("List of domains to exclude from search"),
      search_depth: z.enum(['basic', 'advanced']).optional().describe("Search depth - basic or advanced"),
      include_answer: z.boolean().optional().describe("Include AI-generated answer"),
      include_images: z.boolean().optional().describe("Include images in results"),
      include_raw_content: z.boolean().optional().describe("Include raw content from sources"),
      max_results: z.number().optional().describe("Maximum number of results to return"),
    },
    async ({ query, include_domains, exclude_domains, search_depth, include_answer, include_images, include_raw_content, max_results }) => {
      try {
        // For news search, we can use the same tavilySearch function with specific domains for news
        const newsQuery = `${query} news`;
        const newsDomains = include_domains || [
          'cnn.com',
          'bbc.com',
          'reuters.com',
          'apnews.com',
          'bloomberg.com',
          'wsj.com',
          'nytimes.com',
          'washingtonpost.com',
          'theguardian.com',
          'npr.org'
        ];
        
        const result = await tavilySearch(newsQuery, {
          include_domains: newsDomains,
          exclude_domains,
          search_depth: search_depth || 'basic',
          include_answer: include_answer ?? true,
          include_images: include_images ?? false,
          include_raw_content: include_raw_content ?? false,
          max_results: max_results || 10,
        });

        return {
          content: [
            {
              type: "text",
              text: `Tavily News Search Results for "${query}":

${result.answer ? `News Summary: ${result.answer}\n\n` : ''}Recent News:
${(result.results || []).map((r, i) => `${i + 1}. ${r.title}
   URL: ${r.url}
   Score: ${r.score}
   Published: ${r.published_date || 'N/A'}
   Content: ${r.content ? r.content.substring(0, 200) + '...' : 'No content available'}
`).join('\n')}

${(result.follow_up_questions || []).length > 0 ? `Related Questions:
${result.follow_up_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing Tavily news search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Brave Search Tool
if (providerConfig.brave) {
  server.tool(
    "brave_search",
    "Search using Brave - privacy-focused search with good technical content coverage. Supports native search operators (site:, -site:, filetype:, intitle:, inurl:, before:, after:, exact phrases).",
    {
      query: z.string().describe("The search query (supports operators like site:, -site:, filetype:, intitle:, inurl:, before:, after:, \"exact phrase\")"),
      country: z.string().optional().describe("Country code for localized results"),
      search_lang: z.string().optional().describe("Language for search"),
      ui_lang: z.string().optional().describe("UI language"),
      count: z.number().optional().describe("Number of results to return"),
      offset: z.number().optional().describe("Offset for pagination"),
      safesearch: z.enum(['off', 'moderate', 'strict']).optional().describe("Safe search level"),
      freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional().describe("Freshness filter (past day, week, month, year)"),
    },
    async ({ query, country, search_lang, ui_lang, count, offset, safesearch, freshness }) => {
      try {
        const result = await braveSearch(query, {
          country: country || 'US',
          search_lang: search_lang || 'en',
          ui_lang: ui_lang || 'en',
          count: count || 10,
          offset: offset || 0,
          safesearch: safesearch || 'moderate',
          freshness,
        });

        return {
          content: [
            {
              type: "text",
              text: `Brave Search Results for "${query}":

${result.web.results.map((r, i) => `${i + 1}. ${r.title}
   URL: ${r.url}
   Date: ${r.date}
   Description: ${r.description}
   ${r.extra_snippets.length > 0 ? `Extra Snippets: ${r.extra_snippets.join(', ')}` : ''}
`).join('\n')}

Query Details:
- Is Navigational: ${result.query.is_navigational}
- Is Trending: ${result.query.is_trending}
- Country: ${result.query.country}
- More Results Available: ${result.query.more_results_available}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing Brave search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Kagi Search Tool
if (providerConfig.kagi) {
  server.tool(
    "kagi_search",
    "Search using Kagi - high-quality search results with minimal advertising influence. Supports search operators in query string (site:, -site:, filetype:, intitle:, inurl:, before:, after:, exact phrases).",
    {
      query: z.string().describe("The search query (supports operators like site:, -site:, filetype:, intitle:, inurl:, before:, after:, \"exact phrase\")"),
      limit: z.number().optional().describe("Maximum number of results"),
    },
    async ({ query, limit }) => {
      try {
        const result = await kagiSearch(query, { limit: limit || 10 });

        return {
          content: [
            {
              type: "text",
              text: `Kagi Search Results for "${query}":

${result.data.filter(r => r.t === 0).map((r, i) => `${i + 1}. ${r.title || 'No title'}
   URL: ${r.url || 'No URL'}
   Published: ${r.published || 'N/A'}
   Snippet: ${r.snippet || 'No snippet'}
   ${r.thumbnail ? `Thumbnail: ${r.thumbnail.url}` : ''}
`).join('\n')}

${result.data.filter(r => r.t === 1).map(r => r.list ? `Related Searches:
${r.list.map((search, i) => `${i + 1}. ${search}`).join('\n')}` : '').join('\n')}

Query Meta:
- ID: ${result.meta.id}
- Node: ${result.meta.node}
- Processing Time: ${result.meta.ms}ms`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing Kagi search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Perplexity Chat Tool
if (providerConfig.perplexity) {
  server.tool(
    "perplexity_chat",
    "Get advanced AI responses combining real-time web search with GPT-4 Omni and Claude 3 from Perplexity.",
    {
      query: z.string().describe("The question or query"),
      model: z.string().optional().describe("Model to use (default: llama-3.1-sonar-small-128k-online)"),
      max_tokens: z.number().optional().describe("Maximum tokens in response"),
      temperature: z.number().optional().describe("Temperature for response generation"),
      top_p: z.number().optional().describe("Top-p for response generation"),
      return_citations: z.boolean().optional().describe("Include citations in response"),
      search_domain_filter: z.array(z.string()).optional().describe("Filter search to specific domains"),
      return_images: z.boolean().optional().describe("Include images in response"),
      return_related_questions: z.boolean().optional().describe("Include related questions"),
      search_recency_filter: z.enum(['month', 'week', 'day', 'hour']).optional().describe("Filter by recency"),
    },
    async ({ query, model, max_tokens, temperature, top_p, return_citations, search_domain_filter, return_images, return_related_questions, search_recency_filter }) => {
      try {
        const result = await perplexityChat(query, {
          model: model || 'llama-3.1-sonar-small-128k-online',
          max_tokens,
          temperature: temperature ?? 0.2,
          top_p: top_p ?? 0.9,
          return_citations: return_citations ?? true,
          search_domain_filter,
          return_images: return_images ?? false,
          return_related_questions: return_related_questions ?? false,
          search_recency_filter,
        });

        return {
          content: [
            {
              type: "text",
              text: `Perplexity AI Response:

${result.choices[0].message.content}

Model: ${result.model}
Usage: ${result.usage.total_tokens} tokens (${result.usage.prompt_tokens} prompt, ${result.usage.completion_tokens} completion)`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting Perplexity response: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Kagi FastGPT Tool
if (providerConfig.kagi) {
  server.tool(
    "kagi_fastgpt",
    "Get quick AI-generated answers with citations from Kagi FastGPT (900ms typical response time).",
    {
      query: z.string().describe("The question or query"),
      web_search: z.boolean().optional().describe("Include web search in response"),
      cache: z.boolean().optional().describe("Use cache for faster responses"),
    },
    async ({ query, web_search, cache }) => {
      try {
        const result = await kagiFastGPT(query, {
          web_search: web_search ?? true,
          cache: cache ?? true,
        });

        return {
          content: [
            {
              type: "text",
              text: `Kagi FastGPT Response:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting Kagi FastGPT response: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Jina AI Search Tool
if (providerConfig.jina) {
  server.tool(
    "jina_search",
    "Search the web using Jina AI Search - fast and accurate web search with clean results.",
    {
      query: z.string().describe("The search query"),
      count: z.number().optional().describe("Number of results to return (default: 10)"),
    },
    async ({ query, count }) => {
      try {
        const result = await jinaSearch(query, { count: count || 10 });

        return {
          content: [
            {
              type: "text",
              text: `Jina AI Search Results for "${query}":

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error performing Jina AI search: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Jina AI Reader Tool
if (providerConfig.jina) {
  server.tool(
    "jina_reader",
    "Extract clean content from web pages using Jina AI Reader with image captioning and PDF support.",
    {
      url: z.string().describe("URL to read"),
      gather_all_links: z.boolean().optional().describe("Gather all links from the page"),
      gather_all_images: z.boolean().optional().describe("Gather all images from the page"),
      with_generated_alt: z.boolean().optional().describe("Generate alt text for images"),
      proxy_server: z.string().optional().describe("Proxy server to use"),
      no_cache: z.boolean().optional().describe("Disable caching"),
      with_iframe: z.boolean().optional().describe("Include iframe content"),
      with_shadow_dom: z.boolean().optional().describe("Include shadow DOM content"),
      with_generated_summary: z.boolean().optional().describe("Generate summary of content"),
    },
    async ({ url, gather_all_links, gather_all_images, with_generated_alt, proxy_server, no_cache, with_iframe, with_shadow_dom, with_generated_summary }) => {
      try {
        const result = await jinaReader(url, {
          gather_all_links: gather_all_links ?? false,
          gather_all_images: gather_all_images ?? false,
          with_generated_alt: with_generated_alt ?? false,
          proxy_server,
          no_cache: no_cache ?? false,
          with_iframe: with_iframe ?? false,
          with_shadow_dom: with_shadow_dom ?? false,
          with_generated_summary: with_generated_summary ?? false,
        });

        return {
          content: [
            {
              type: "text",
              text: `Jina AI Reader Results:

Title: ${result.data.title}
URL: ${result.data.url}
Description: ${result.data.description}
Tokens Used: ${result.data.usage.tokens}

Content:
${result.data.content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading with Jina AI: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Kagi Summarizer Tool
if (providerConfig.kagi) {
  server.tool(
    "kagi_summarizer",
    "Summarize content from pages, videos, and podcasts using Kagi Universal Summarizer.",
    {
      url: z.string().describe("URL to summarize"),
      engine: z.enum(['cecil', 'agnes', 'daphne', 'muriel']).optional().describe("Summarization engine"),
      summary_type: z.enum(['summary', 'takeaways']).optional().describe("Type of summary"),
      target_language: z.string().optional().describe("Target language for summary"),
      cache: z.boolean().optional().describe("Use cache for faster responses"),
    },
    async ({ url, engine, summary_type, target_language, cache }) => {
      try {
        const result = await kagiSummarizer(url, {
          engine: engine || 'cecil',
          summary_type: summary_type || 'summary',
          target_language: target_language || 'EN',
          cache: cache ?? true,
        });

        return {
          content: [
            {
              type: "text",
              text: `Kagi Universal Summarizer Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error summarizing with Kagi: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Tavily Extract Tool
if (providerConfig.tavily) {
  server.tool(
    "tavily_extract",
    "Extract raw content from single or multiple web pages using Tavily. Supports configurable extraction depth.",
    {
      urls: z.array(z.string()).describe("List of URLs to extract content from"),
      extraction_depth: z.enum(['basic', 'advanced']).optional().describe("Extraction depth - basic or advanced"),
    },
    async ({ urls, extraction_depth }) => {
      try {
        const result = await tavilyExtract(urls, { extraction_depth: extraction_depth || 'basic' });

        return {
          content: [
            {
              type: "text",
              text: `Tavily Extract Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error extracting with Tavily: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Firecrawl Scrape Tool
if (providerConfig.firecrawl) {
  server.tool(
    "firecrawl_scrape",
    "Extract clean, LLM-ready data from single URLs using Firecrawl with enhanced formatting options.",
    {
      url: z.string().describe("URL to scrape"),
      formats: z.array(z.string()).optional().describe("Output formats (markdown, html, rawHtml)"),
      headers: z.record(z.string()).optional().describe("Custom headers for the request"),
      include_tags: z.array(z.string()).optional().describe("HTML tags to include"),
      exclude_tags: z.array(z.string()).optional().describe("HTML tags to exclude"),
      only_main_content: z.boolean().optional().describe("Extract only main content"),
      timeout: z.number().optional().describe("Request timeout in milliseconds"),
      wait_for: z.number().optional().describe("Wait time before extraction"),
      mobile: z.boolean().optional().describe("Use mobile user agent"),
    },
    async ({ url, formats, headers, include_tags, exclude_tags, only_main_content, timeout, wait_for, mobile }) => {
      try {
        const result = await firecrawlScrape(url, {
          formats: formats || ['markdown', 'html'],
          headers,
          includeTags: include_tags,
          excludeTags: exclude_tags,
          onlyMainContent: only_main_content ?? true,
          timeout: timeout || 30000,
          waitFor: wait_for || 0,
          mobile: mobile ?? false,
        });

        return {
          content: [
            {
              type: "text",
              text: `Firecrawl Scrape Results:

Title: ${result.data.metadata.title}
Description: ${result.data.metadata.description}
URL: ${result.data.metadata.sourceURL}
Status Code: ${result.data.metadata.statusCode}

${result.data.markdown ? `Markdown Content:
${result.data.markdown.substring(0, 2000)}${result.data.markdown.length > 2000 ? '...' : ''}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error scraping with Firecrawl: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Firecrawl Crawl Tool
if (providerConfig.firecrawl) {
  server.tool(
    "firecrawl_crawl",
    "Deep crawl all accessible subpages on a website using Firecrawl with configurable depth limits.",
    {
      url: z.string().describe("URL to crawl"),
      exclude_paths: z.array(z.string()).optional().describe("Paths to exclude from crawling"),
      include_paths: z.array(z.string()).optional().describe("Paths to include in crawling"),
      max_depth: z.number().optional().describe("Maximum crawl depth"),
      limit: z.number().optional().describe("Maximum number of pages to crawl"),
      allow_backward_links: z.boolean().optional().describe("Allow backward links"),
      allow_external_links: z.boolean().optional().describe("Allow external links"),
      ignore_sitemap: z.boolean().optional().describe("Ignore sitemap"),
    },
    async ({ url, exclude_paths, include_paths, max_depth, limit, allow_backward_links, allow_external_links, ignore_sitemap }) => {
      try {
        const result = await firecrawlCrawl(url, {
          excludePaths: exclude_paths,
          includePaths: include_paths,
          maxDepth: max_depth || 2,
          limit: limit || 100,
          allowBackwardLinks: allow_backward_links ?? false,
          allowExternalLinks: allow_external_links ?? false,
          ignoreSitemap: ignore_sitemap ?? false,
        });

        return {
          content: [
            {
              type: "text",
              text: `Firecrawl Crawl Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error crawling with Firecrawl: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Firecrawl Map Tool
if (providerConfig.firecrawl) {
  server.tool(
    "firecrawl_map",
    "Fast URL collection from websites using Firecrawl for comprehensive site mapping.",
    {
      url: z.string().describe("URL to map"),
      search: z.string().optional().describe("Search term to filter URLs"),
      ignore_sitemap: z.boolean().optional().describe("Ignore sitemap"),
      include_subdomains: z.boolean().optional().describe("Include subdomains"),
      limit: z.number().optional().describe("Maximum number of URLs to return"),
    },
    async ({ url, search, ignore_sitemap, include_subdomains, limit }) => {
      try {
        const result = await firecrawlMap(url, {
          search,
          ignoreSitemap: ignore_sitemap ?? false,
          includeSubdomains: include_subdomains ?? false,
          limit: limit || 5000,
        });

        return {
          content: [
            {
              type: "text",
              text: `Firecrawl Map Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error mapping with Firecrawl: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Firecrawl Extract Tool
if (providerConfig.firecrawl) {
  server.tool(
    "firecrawl_extract",
    "Extract structured data with AI using natural language prompts via Firecrawl.",
    {
      url: z.string().describe("URL to extract data from"),
      prompt: z.string().describe("Natural language prompt for extraction"),
      schema: z.any().optional().describe("JSON schema for structured output"),
      system_prompt: z.string().optional().describe("System prompt for AI"),
      timeout: z.number().optional().describe("Request timeout in milliseconds"),
      wait_for: z.number().optional().describe("Wait time before extraction"),
      mobile: z.boolean().optional().describe("Use mobile user agent"),
    },
    async ({ url, prompt, schema, system_prompt, timeout, wait_for, mobile }) => {
      try {
        const result = await firecrawlExtract(url, {
          prompt,
          schema,
          systemPrompt: system_prompt,
          timeout: timeout || 30000,
          waitFor: wait_for || 0,
          mobile: mobile ?? false,
        });

        return {
          content: [
            {
              type: "text",
              text: `Firecrawl Extract Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error extracting with Firecrawl: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Jina AI Grounding Tool
if (providerConfig.jina) {
  server.tool(
    "jina_grounding",
    "Verify facts against web knowledge using Jina AI Grounding for real-time fact verification.",
    {
      source: z.string().describe("Source text to verify against"),
      statements: z.array(z.string()).describe("Statements to verify"),
    },
    async ({ source, statements }) => {
      try {
        const result = await jinaGrounding(source, statements);

        return {
          content: [
            {
              type: "text",
              text: `Jina AI Grounding Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error grounding with Jina AI: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// Kagi Enrichment Tool
if (providerConfig.kagi) {
  server.tool(
    "kagi_enrichment",
    "Get supplementary content from Kagi's specialized indexes (Teclis, TinyGem).",
    {
      url: z.string().describe("URL to enrich"),
      engine: z.enum(['teclis', 'tinygem']).optional().describe("Enrichment engine"),
    },
    async ({ url, engine }) => {
      try {
        const result = await kagiEnrichment(url, { engine: engine || 'teclis' });

        return {
          content: [
            {
              type: "text",
              text: `Kagi Enrichment Results:

${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error enriching with Kagi: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// ================ START SERVER ================

async function main() {
  console.log("MCP Omnisearch Server starting...");
  console.log("Available providers:", Object.entries(providerConfig)
    .filter(([, available]) => available)
    .map(([provider]) => provider)
    .join(", ") || "None");

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("MCP Omnisearch Server started successfully!");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
