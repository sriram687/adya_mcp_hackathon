#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

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

interface ProviderCredentials {
  tavily?: string;
  brave?: string;
  kagi?: string;
  perplexity?: string;
  jina?: string;
  firecrawl?: string;
}

interface ProviderConfig {
  tavily: boolean;
  brave: boolean;
  kagi: boolean;
  perplexity: boolean;
  jina: boolean;
  firecrawl: boolean;
}

// Helper function to check if credentials are available
function getProviderConfig(credentials: ProviderCredentials = {}): ProviderConfig {
  return {
    tavily: !!credentials.tavily,
    brave: !!credentials.brave,
    kagi: !!credentials.kagi,
    perplexity: !!credentials.perplexity,
    jina: !!credentials.jina,
    firecrawl: !!credentials.firecrawl,
  };
}

// Helper function to extract credentials from tool arguments
function extractCredentials(args: any): ProviderCredentials {
  return {
    tavily: args.tavily_api_key,
    brave: args.brave_api_key,
    kagi: args.kagi_api_key,
    perplexity: args.perplexity_api_key,
    jina: args.jina_api_key,
    firecrawl: args.firecrawl_api_key,
  };
}

// ================ SERVER INIT ================
const server = new McpServer({
  name: "OMNISEARCH",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Define all tool schemas - these will be used for dynamic tool registration
const toolDefinitions = {
  // Tavily tools
  tavily_search: {
    provider: 'tavily',
    name: "tavily_search",
    description: "GENERAL WEB SEARCH: Use for broad information gathering, company overviews, general facts, and when user asks about 'any topic' or 'general information'. Best for: company profiles, product info, general knowledge queries, definitions, explanations. NOT for news, academic papers, or PDFs.",
    inputSchema: {
      type: "object",
      properties: {
        tavily_api_key: { type: "string", description: "Tavily API key" },
        query: { type: "string", description: "The search query - be specific and descriptive" },
        include_domains: { type: "array", items: { type: "string" }, description: "Specific websites to search (e.g., ['tesla.com', 'wikipedia.org'])" },
        exclude_domains: { type: "array", items: { type: "string" }, description: "Websites to exclude from search" },
        search_depth: { type: "string", enum: ["basic", "advanced"], description: "Use 'advanced' for complex topics, 'basic' for simple queries" },
        include_answer: { type: "boolean", description: "Set true for AI summary of results (recommended)" },
        include_images: { type: "boolean", description: "Set true only if user specifically asks for images" },
        include_raw_content: { type: "boolean", description: "Set true for detailed content extraction" },
        max_results: { type: "number", minimum: 1, maximum: 20, description: "Number of results (5-10 recommended)" }
      },
      required: ["tavily_api_key", "query"],
      additionalProperties: false
    }
  },
  tavily_search_news: {
    provider: 'tavily',
    name: "tavily_search_news",
    description: "NEWS SEARCH: Specifically for current events, breaking news, recent developments, and time-sensitive information. Use when user asks about 'latest news', 'recent updates', or current events about any topic.",
    inputSchema: {
      type: "object",
      properties: {
        tavily_api_key: { type: "string", description: "Tavily API key" },
        query: { type: "string", description: "The news search query - be specific about what news you want" },
        include_domains: { type: "array", items: { type: "string" }, description: "Specific news sites to search (e.g., ['bbc.com', 'cnn.com'])" },
        exclude_domains: { type: "array", items: { type: "string" }, description: "News sites to exclude from search" },
        search_depth: { type: "string", enum: ["basic", "advanced"], description: "Use 'advanced' for complex topics, 'basic' for simple queries" },
        include_answer: { type: "boolean", description: "Set true for AI summary of results (recommended)" },
        include_images: { type: "boolean", description: "Set true only if user specifically asks for images" },
        include_raw_content: { type: "boolean", description: "Set true for detailed content extraction" },
        max_results: { type: "number", minimum: 1, maximum: 20, description: "Number of results (5-10 recommended)" },
        days: { type: "number", minimum: 1, maximum: 365, description: "Number of days back to search (default: 3)" }
      },
      required: ["tavily_api_key", "query"],
      additionalProperties: false
    }
  },
  tavily_search_academic: {
    provider: 'tavily',
    name: "tavily_search_academic",
    description: "ACADEMIC RESEARCH: For scholarly articles, research papers, academic content, and in-depth analysis. Use when user needs academic sources, research findings, or scholarly information.",
    inputSchema: {
      type: "object",
      properties: {
        tavily_api_key: { type: "string", description: "Tavily API key" },
        query: { type: "string", description: "The academic search query - be specific and use academic terms" },
        include_domains: { type: "array", items: { type: "string" }, description: "Specific academic sites to search (e.g., ['scholar.google.com', 'arxiv.org'])" },
        exclude_domains: { type: "array", items: { type: "string" }, description: "Sites to exclude from search" },
        search_depth: { type: "string", enum: ["basic", "advanced"], description: "Use 'advanced' for complex topics, 'basic' for simple queries" },
        include_answer: { type: "boolean", description: "Set true for AI summary of results (recommended)" },
        include_images: { type: "boolean", description: "Set true only if user specifically asks for images" },
        include_raw_content: { type: "boolean", description: "Set true for detailed content extraction" },
        max_results: { type: "number", minimum: 1, maximum: 20, description: "Number of results (5-10 recommended)" }
      },
      required: ["tavily_api_key", "query"],
      additionalProperties: false
    }
  },
  
  // Brave tools
  brave_search: {
    provider: 'brave',
    name: "brave_search",
    description: "BRAVE WEB SEARCH: Privacy-focused search engine. Use as alternative to Tavily for general web search when user prefers privacy-focused results or when Tavily is unavailable.",
    inputSchema: {
      type: "object",
      properties: {
        brave_api_key: { type: "string", description: "Brave Search API key" },
        query: { type: "string", description: "The search query" },
        country: { type: "string", description: "Country code for localized results (e.g., 'US', 'UK')" },
        search_lang: { type: "string", description: "Language code for results (e.g., 'en', 'es')" },
        ui_lang: { type: "string", description: "UI language code (e.g., 'en-US')" },
        count: { type: "number", minimum: 1, maximum: 20, description: "Number of results (default: 10)" },
        offset: { type: "number", description: "Offset for pagination (default: 0)" },
        safesearch: { type: "string", enum: ["off", "moderate", "strict"], description: "Safe search level (default: 'moderate')" },
        freshness: { type: "string", enum: ["pd", "pw", "pm", "py"], description: "pd=past day, pw=past week, pm=past month, py=past year" },
        text_decorations: { type: "boolean", description: "Include text decorations in results" },
        spellcheck: { type: "boolean", description: "Enable spell checking" },
        result_filter: { type: "string", enum: ["discussions", "faq", "infobox", "news", "query", "summarizer", "videos", "web"], description: "Filter results by type" }
      },
      required: ["brave_api_key", "query"],
      additionalProperties: false
    }
  },
  
  // Kagi tools
  kagi_search: {
    provider: 'kagi',
    name: "kagi_search",
    description: "KAGI WEB SEARCH: Premium search engine with high-quality results. Use when you need very high-quality, ad-free search results or when other search engines don't provide satisfactory results.",
    inputSchema: {
      type: "object",
      properties: {
        kagi_api_key: { type: "string", description: "Kagi API key" },
        query: { type: "string", description: "The search query" },
        limit: { type: "number", minimum: 1, maximum: 100, description: "Number of results (default: 10)" }
      },
      required: ["kagi_api_key", "query"],
      additionalProperties: false
    }
  },
  kagi_fastgpt: {
    provider: 'kagi',
    name: "kagi_fastgpt",
    description: "KAGI AI ASSISTANT: Get AI-powered answers with web search integration. Use when you need AI-generated answers based on current web information, explanations, or summaries.",
    inputSchema: {
      type: "object",
      properties: {
        kagi_api_key: { type: "string", description: "Kagi API key" },
        query: { type: "string", description: "The question or query for AI assistant" },
        web_search: { type: "boolean", description: "Enable web search for more current information (default: true)" },
        cache: { type: "boolean", description: "Enable caching for faster responses (default: true)" }
      },
      required: ["kagi_api_key", "query"],
      additionalProperties: false
    }
  },
  kagi_enrichment: {
    provider: 'kagi',
    name: "kagi_enrichment",
    description: "KAGI WEB ENRICHMENT: Get comprehensive information about a website including key details, topics, and summary. Use when you need detailed analysis of a specific website or domain.",
    inputSchema: {
      type: "object",
      properties: {
        kagi_api_key: { type: "string", description: "Kagi API key" },
        url: { type: "string", description: "The URL to analyze and get enriched information about" },
        target_language: { type: "string", description: "Target language for the summary (e.g., 'EN', 'ES')" }
      },
      required: ["kagi_api_key", "url"],
      additionalProperties: false
    }
  },
  
  // Perplexity tools
  perplexity_chat: {
    provider: 'perplexity',
    name: "perplexity_chat",
    description: "PERPLEXITY AI CHAT: Get AI-powered conversational answers with real-time web search. Use when you need AI analysis, explanations, or conversational responses about current topics.",
    inputSchema: {
      type: "object",
      properties: {
        perplexity_api_key: { type: "string", description: "Perplexity API key" },
        query: { type: "string", description: "The question or prompt for Perplexity AI" },
        model: { type: "string", enum: ["llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-online", "llama-3.1-sonar-huge-128k-online"], description: "Model to use (default: llama-3.1-sonar-small-128k-online)" },
        temperature: { type: "number", minimum: 0, maximum: 2, description: "Response creativity (0-2, default: 0.2)" },
        max_tokens: { type: "number", minimum: 1, maximum: 4096, description: "Maximum response length (default: 1024)" },
        top_p: { type: "number", minimum: 0, maximum: 1, description: "Nucleus sampling parameter (default: 0.9)" },
        search_domain_filter: { type: "array", items: { type: "string" }, description: "Filter search to specific domains" },
        return_images: { type: "boolean", description: "Include images in response (default: false)" },
        return_related_questions: { type: "boolean", description: "Include related questions (default: false)" },
        search_recency_filter: { type: "string", enum: ["month", "week", "day", "hour"], description: "Filter search by recency" },
        top_k: { type: "number", minimum: 0, maximum: 2048, description: "Top-k sampling parameter (default: 0)" },
        stream: { type: "boolean", description: "Enable streaming response (default: false)" },
        presence_penalty: { type: "number", minimum: -2, maximum: 2, description: "Presence penalty (default: 0)" },
        frequency_penalty: { type: "number", minimum: -2, maximum: 2, description: "Frequency penalty (default: 1)" }
      },
      required: ["perplexity_api_key", "query"],
      additionalProperties: false
    }
  },
  
  // Jina tools
  jina_search: {
    provider: 'jina',
    name: "jina_search",
    description: "JINA WEB SEARCH: Search the web and get clean, structured results. Use when you need clean, well-formatted search results or when other search engines are unavailable.",
    inputSchema: {
      type: "object",
      properties: {
        jina_api_key: { type: "string", description: "Jina API key" },
        query: { type: "string", description: "The search query" },
        count: { type: "number", minimum: 1, maximum: 100, description: "Number of results (default: 10)" }
      },
      required: ["jina_api_key", "query"],
      additionalProperties: false
    }
  },
  jina_reader: {
    provider: 'jina',
    name: "jina_reader",
    description: "JINA WEB READER: Extract clean, readable content from any webpage. Use when you need to read and analyze content from a specific URL or article.",
    inputSchema: {
      type: "object",
      properties: {
        jina_api_key: { type: "string", description: "Jina API key" },
        url: { type: "string", description: "The URL to read and extract content from" },
        summary: { type: "boolean", description: "Generate a summary of the content (default: false)" },
        links: { type: "boolean", description: "Include links in the output (default: false)" },
        images: { type: "boolean", description: "Include images in the output (default: false)" }
      },
      required: ["jina_api_key", "url"],
      additionalProperties: false
    }
  },
  jina_batch_reader: {
    provider: 'jina',
    name: "jina_batch_reader",
    description: "JINA BATCH READER: Extract content from multiple URLs in a single request. Use when you need to process multiple webpages or articles at once.",
    inputSchema: {
      type: "object",
      properties: {
        jina_api_key: { type: "string", description: "Jina API key" },
        urls: { type: "array", items: { type: "string" }, description: "Array of URLs to read (max 10)" },
        summary: { type: "boolean", description: "Generate summaries for each URL (default: false)" },
        links: { type: "boolean", description: "Include links in the output (default: false)" },
        images: { type: "boolean", description: "Include images in the output (default: false)" }
      },
      required: ["jina_api_key", "urls"],
      additionalProperties: false
    }
  },
  jina_grounding: {
    provider: 'jina',
    name: "jina_grounding",
    description: "JINA GROUNDING: Fact-check and verify information by grounding it with web sources. Use when you need to verify claims, check facts, or find supporting evidence.",
    inputSchema: {
      type: "object",
      properties: {
        jina_api_key: { type: "string", description: "Jina API key" },
        statement: { type: "string", description: "The statement or claim to fact-check and ground" },
        sources: { type: "array", items: { type: "string" }, description: "Optional: specific sources to check against" }
      },
      required: ["jina_api_key", "statement"],
      additionalProperties: false
    }
  },
  jina_pdf_reader: {
    provider: 'jina',
    name: "jina_pdf_reader",
    description: "JINA PDF READER: Extract and read content from PDF documents. Use when you need to process PDF files and extract their text content.",
    inputSchema: {
      type: "object",
      properties: {
        jina_api_key: { type: "string", description: "Jina API key" },
        url: { type: "string", description: "The URL of the PDF document to read" },
        pages: { type: "array", items: { type: "number" }, description: "Specific pages to extract (optional)" }
      },
      required: ["jina_api_key", "url"],
      additionalProperties: false
    }
  },
  
  // Firecrawl tools
  firecrawl_scrape: {
    provider: 'firecrawl',
    name: "firecrawl_scrape",
    description: "FIRECRAWL WEB SCRAPER: Extract clean, structured data from any webpage. Use when you need to scrape specific content, data, or information from a webpage.",
    inputSchema: {
      type: "object",
      properties: {
        firecrawl_api_key: { type: "string", description: "Firecrawl API key" },
        url: { type: "string", description: "The URL to scrape" },
        includeTags: { type: "array", items: { type: "string" }, description: "HTML tags to include in extraction" },
        excludeTags: { type: "array", items: { type: "string" }, description: "HTML tags to exclude from extraction" },
        onlyMainContent: { type: "boolean", description: "Extract only main content (default: true)" },
        waitFor: { type: "number", description: "Wait time in milliseconds before scraping" },
        screenshot: { type: "boolean", description: "Take a screenshot of the page (default: false)" }
      },
      required: ["firecrawl_api_key", "url"],
      additionalProperties: false
    }
  },
  firecrawl_crawl: {
    provider: 'firecrawl',
    name: "firecrawl_crawl",
    description: "FIRECRAWL WEBSITE CRAWLER: Crawl and extract data from multiple pages of a website. Use when you need to extract data from an entire website or multiple related pages.",
    inputSchema: {
      type: "object",
      properties: {
        firecrawl_api_key: { type: "string", description: "Firecrawl API key" },
        url: { type: "string", description: "The base URL to start crawling from" },
        maxDepth: { type: "number", minimum: 1, maximum: 10, description: "Maximum crawl depth (default: 2)" },
        limit: { type: "number", minimum: 1, maximum: 1000, description: "Maximum pages to crawl (default: 100)" },
        includePaths: { type: "array", items: { type: "string" }, description: "URL patterns to include in crawl" },
        excludePaths: { type: "array", items: { type: "string" }, description: "URL patterns to exclude from crawl" },
        onlyMainContent: { type: "boolean", description: "Extract only main content (default: true)" },
        allowBackwardCrawling: { type: "boolean", description: "Allow crawling to parent directories (default: false)" },
        allowExternalContentLinks: { type: "boolean", description: "Allow crawling external links (default: false)" }
      },
      required: ["firecrawl_api_key", "url"],
      additionalProperties: false
    }
  },
  firecrawl_map: {
    provider: 'firecrawl',
    name: "firecrawl_map",
    description: "FIRECRAWL WEBSITE MAPPER: Map and discover all pages and links on a website. Use when you need to understand the structure of a website or find all available pages.",
    inputSchema: {
      type: "object",
      properties: {
        firecrawl_api_key: { type: "string", description: "Firecrawl API key" },
        url: { type: "string", description: "The base URL to map" },
        search: { type: "string", description: "Search query to filter mapped pages" },
        ignoreSitemap: { type: "boolean", description: "Ignore sitemap.xml (default: false)" },
        includeSubdomains: { type: "boolean", description: "Include subdomains in mapping (default: false)" },
        limit: { type: "number", minimum: 1, maximum: 5000, description: "Maximum pages to map (default: 5000)" }
      },
      required: ["firecrawl_api_key", "url"],
      additionalProperties: false
    }
  },
  firecrawl_extract: {
    provider: 'firecrawl',
    name: "firecrawl_extract",
    description: "FIRECRAWL STRUCTURED EXTRACTOR: Extract structured data from webpages using custom schemas. Use when you need to extract specific data fields or structured information from webpages.",
    inputSchema: {
      type: "object",
      properties: {
        firecrawl_api_key: { type: "string", description: "Firecrawl API key" },
        url: { type: "string", description: "The URL to extract data from" },
        schema: { type: "object", description: "JSON schema defining the data structure to extract" },
        prompt: { type: "string", description: "Natural language prompt describing what to extract" },
        allowExternalContentLinks: { type: "boolean", description: "Allow extraction from external links (default: false)" }
      },
      required: ["firecrawl_api_key", "url"],
      additionalProperties: false
    }
  },
  firecrawl_research: {
    provider: 'firecrawl',
    name: "firecrawl_research",
    description: "FIRECRAWL RESEARCH AGENT: AI-powered research across multiple web sources. Use when you need comprehensive research on a topic using multiple web sources.",
    inputSchema: {
      type: "object",
      properties: {
        firecrawl_api_key: { type: "string", description: "Firecrawl API key" },
        query: { type: "string", description: "The research query or topic" },
        sources: { type: "array", items: { type: "string" }, description: "Optional: specific sources to research" },
        maxSources: { type: "number", minimum: 1, maximum: 100, description: "Maximum sources to research (default: 10)" },
        language: { type: "string", description: "Language for research results (default: 'en')" }
      },
      required: ["firecrawl_api_key", "query"],
      additionalProperties: false
    }
  },
  
  // Cross-verification tool
  cross_verify_facts: {
    provider: 'multiple',
    name: "cross_verify_facts",
    description: "CROSS-VERIFICATION: Verify facts across multiple search engines and sources. Use when you need to fact-check information or get verification from multiple reliable sources.",
    inputSchema: {
      type: "object",
      properties: {
        fact_or_claim: { type: "string", description: "The fact or claim to verify" },
        tavily_api_key: { type: "string", description: "Tavily API key (optional)" },
        brave_api_key: { type: "string", description: "Brave API key (optional)" },
        kagi_api_key: { type: "string", description: "Kagi API key (optional)" },
        perplexity_api_key: { type: "string", description: "Perplexity API key (optional)" },
        jina_api_key: { type: "string", description: "Jina API key (optional)" },
        firecrawl_api_key: { type: "string", description: "Firecrawl API key (optional)" },
        max_sources: { type: "number", minimum: 2, maximum: 10, description: "Maximum sources to verify against (default: 3)" },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1, description: "Minimum confidence threshold for verification (default: 0.7)" }
      },
      required: ["fact_or_claim"],
      additionalProperties: false
    }
  }
};

// ================ HELPER FUNCTIONS ================

// Function to get available tools based on credentials
function getAvailableTools(credentials: ProviderCredentials): Array<{name: string, description: string, provider: string}> {
  const providerConfig = getProviderConfig(credentials);
  
  return Object.entries(toolDefinitions).filter(([toolName, toolDef]) => {
    if (toolDef.provider === 'multiple') {
      // For cross-verification tool, check if at least one provider is available
      return Object.values(providerConfig).some(available => available);
    }
    return providerConfig[toolDef.provider as keyof ProviderConfig];
  }).map(([toolName, toolDef]) => ({
    name: toolDef.name,
    description: toolDef.description,
    provider: toolDef.provider
  }));
}

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
async function tavilySearch(query: string, credentials: ProviderCredentials, options: {
  include_domains?: string[];
  exclude_domains?: string[];
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  include_images?: boolean;
  include_raw_content?: boolean;
  max_results?: number;
}): Promise<TavilySearchResult> {
  if (!credentials.tavily) {
    throw new Error("Tavily API key not provided");
  }

  const requestData = {
    query,
    api_key: credentials.tavily,
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
async function braveSearch(query: string, credentials: ProviderCredentials, options: {
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
  if (!credentials.brave) {
    throw new Error("Brave API key not provided");
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
      'X-Subscription-Token': credentials.brave!,
    },
  });
}

// Kagi Search
async function kagiSearch(query: string, credentials: ProviderCredentials, options: {
  limit?: number;
}): Promise<KagiSearchResult> {
  if (!credentials.kagi) {
    throw new Error("Kagi API key not provided");
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(options.limit || 10),
  });

  return await makeApiRequest<KagiSearchResult>({
    url: `https://kagi.com/api/v0/search?${params}`,
    headers: {
      'Authorization': `Bot ${credentials.kagi}`,
    },
  });
}

// ================ AI RESPONSE PROVIDERS ================

// Perplexity AI
async function perplexityChat(query: string, credentials: ProviderCredentials, options: {
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
  if (!credentials.perplexity) {
    throw new Error("Perplexity API key not provided");
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
      'Authorization': `Bearer ${credentials.perplexity}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Kagi FastGPT
async function kagiFastGPT(query: string, credentials: ProviderCredentials, options: {
  web_search?: boolean;
  cache?: boolean;
}): Promise<any> {
  if (!credentials.kagi) {
    throw new Error("Kagi API key not provided");
  }

  const params = new URLSearchParams({
    query,
    web_search: String(options.web_search ?? true),
    cache: String(options.cache ?? true),
  });

  return await makeApiRequest({
    url: `https://kagi.com/api/v0/fastgpt?${params}`,
    headers: {
      'Authorization': `Bot ${credentials.kagi}`,
    },
  });
}

// ================ CONTENT PROCESSING ================

// Jina AI Search
async function jinaSearch(query: string, credentials: ProviderCredentials, options: {
  count?: number;
}): Promise<any> {
  if (!credentials.jina) {
    throw new Error("Jina API key not provided");
  }

  const requestData = {
    q: query,
    count: options.count || 10,
  };

  return await makeApiRequest({
    url: 'https://s.jina.ai/',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.jina}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Jina AI Reader
async function jinaReader(url: string, credentials: ProviderCredentials, options: {
  gather_all_links?: boolean;
  gather_all_images?: boolean;
  with_generated_alt?: boolean;
  proxy_server?: string;
  no_cache?: boolean;
  with_iframe?: boolean;
  with_shadow_dom?: boolean;
  with_generated_summary?: boolean;
}): Promise<JinaReaderResponse> {
  if (!credentials.jina) {
    throw new Error("Jina API key not provided");
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
      'Authorization': `Bearer ${credentials.jina}`,
      'Accept': 'application/json',
    },
  });
}

// Kagi Universal Summarizer
async function kagiSummarizer(url: string, credentials: ProviderCredentials, options: {
  engine?: 'cecil' | 'agnes' | 'daphne' | 'muriel';
  summary_type?: 'summary' | 'takeaways';
  target_language?: string;
  cache?: boolean;
}): Promise<any> {
  if (!credentials.kagi) {
    throw new Error("Kagi API key not provided");
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
      'Authorization': `Bot ${credentials.kagi}`,
    },
  });
}

// Tavily Extract
async function tavilyExtract(urls: string[], credentials: ProviderCredentials, options: {
  extraction_depth?: 'basic' | 'advanced';
}): Promise<any> {
  if (!credentials.tavily) {
    throw new Error("Tavily API key not provided");
  }

  const requestData = {
    urls,
    api_key: credentials.tavily,
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
async function firecrawlScrape(url: string, credentials: ProviderCredentials, options: {
  formats?: string[];
  headers?: Record<string, string>;
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  timeout?: number;
  waitFor?: number;
  mobile?: boolean;
}): Promise<FirecrawlScrapeResponse> {
  if (!credentials.firecrawl) {
    throw new Error("Firecrawl API key not provided");
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
      'Authorization': `Bearer ${credentials.firecrawl}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Crawl
async function firecrawlCrawl(url: string, credentials: ProviderCredentials, options: {
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
  if (!credentials.firecrawl) {
    throw new Error("Firecrawl API key not provided");
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
      'Authorization': `Bearer ${credentials.firecrawl}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Map
async function firecrawlMap(url: string, credentials: ProviderCredentials, options: {
  search?: string;
  ignoreSitemap?: boolean;
  includeSubdomains?: boolean;
  limit?: number;
}): Promise<any> {
  if (!credentials.firecrawl) {
    throw new Error("Firecrawl API key not provided");
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
      'Authorization': `Bearer ${credentials.firecrawl}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Firecrawl Extract
async function firecrawlExtract(url: string, credentials: ProviderCredentials, options: {
  prompt: string;
  schema?: any;
  systemPrompt?: string;
  timeout?: number;
  waitFor?: number;
  mobile?: boolean;
}): Promise<any> {
  if (!credentials.firecrawl) {
    throw new Error("Firecrawl API key not provided");
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
      'Authorization': `Bearer ${credentials.firecrawl}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// ================ ENHANCEMENT TOOLS ================

// Jina AI Grounding
async function jinaGrounding(source: string, statements: string[], credentials: ProviderCredentials): Promise<any> {
  if (!credentials.jina) {
    throw new Error("Jina API key not provided");
  }

  const requestData = {
    source,
    statements,
  };

  return await makeApiRequest({
    url: 'https://api.jina.ai/v1/grounding',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.jina}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });
}

// Kagi Enrichment
async function kagiEnrichment(url: string, credentials: ProviderCredentials, options: {
  engine?: 'teclis' | 'tinygem';
}): Promise<any> {
  if (!credentials.kagi) {
    throw new Error("Kagi API key not provided");
  }

  const params = new URLSearchParams({
    url,
    engine: options.engine || 'teclis',
  });

  return await makeApiRequest({
    url: `https://kagi.com/api/v0/enrich/web?${params}`,
    headers: {
      'Authorization': `Bot ${credentials.kagi}`,
    },
  });
}

// ================ TOOL DEFINITIONS ================

// Special tool to check available tools based on credentials
server.tool(
  "check_available_tools",
  "CHECK AVAILABLE TOOLS: Use this tool to see which search and analysis tools are available based on the API keys you provide. This helps you understand what tools you can use with your current credentials.",
  {
    tavily_api_key: z.string().optional().describe("Tavily API key (optional)"),
    brave_api_key: z.string().optional().describe("Brave Search API key (optional)"),
    kagi_api_key: z.string().optional().describe("Kagi API key (optional)"),
    perplexity_api_key: z.string().optional().describe("Perplexity API key (optional)"),
    jina_api_key: z.string().optional().describe("Jina API key (optional)"),
    firecrawl_api_key: z.string().optional().describe("Firecrawl API key (optional)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const providerConfig = getProviderConfig(credentials);
      const availableTools = getAvailableTools(credentials);
      
      const providerSummary = Object.entries(providerConfig)
        .map(([provider, available]) => `${provider}: ${available ? '✅ Available' : '❌ Not Available (API key missing)'}`)
        .join('\n');
      
      const toolsByProvider = availableTools.reduce((acc, tool) => {
        if (!acc[tool.provider]) {
          acc[tool.provider] = [];
        }
        acc[tool.provider].push(tool);
        return acc;
      }, {} as Record<string, typeof availableTools>);
      
      let toolsList = '';
      Object.entries(toolsByProvider).forEach(([provider, tools]) => {
        toolsList += `\n${provider.toUpperCase()} TOOLS:\n`;
        tools.forEach(tool => {
          toolsList += `  • ${tool.name}: ${tool.description}\n`;
        });
      });
      
      return {
        content: [
          {
            type: "text",
            text: `OMNISEARCH TOOL AVAILABILITY CHECK

PROVIDER STATUS:
${providerSummary}

AVAILABLE TOOLS (${availableTools.length} total):${toolsList}

USAGE NOTES:
• Each tool requires its corresponding API key to function
• The cross_verify_facts tool works with any available providers
• Provide API keys in individual tool calls to use specific tools
• Tools are only available when you provide valid API keys

NEXT STEPS:
1. Add API keys for providers you want to use
2. Call specific tools with your API keys included
3. Use check_available_tools anytime to verify your available tools`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error checking available tools: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tavily Search Tool
server.tool(
  "tavily_search",
  "GENERAL WEB SEARCH: Use for broad information gathering, company overviews, general facts, and when user asks about 'any topic' or 'general information'. Best for: company profiles, product info, general knowledge queries, definitions, explanations. NOT for news, academic papers, or PDFs.",
  {
    tavily_api_key: z.string().describe("Tavily API key"),
    query: z.string().describe("The search query - be specific and descriptive"),
    include_domains: z.array(z.string()).optional().describe("Specific websites to search (e.g., ['tesla.com', 'wikipedia.org'])"),
    exclude_domains: z.array(z.string()).optional().describe("Websites to exclude from search"),
    search_depth: z.enum(['basic', 'advanced']).optional().describe("Use 'advanced' for complex topics, 'basic' for simple queries"),
    include_answer: z.boolean().optional().describe("Set true for AI summary of results (recommended)"),
    include_images: z.boolean().optional().describe("Set true only if user specifically asks for images"),
    include_raw_content: z.boolean().optional().describe("Set true for detailed content extraction"),
    max_results: z.number().min(1).max(20).optional().describe("Number of results (5-10 recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, include_domains, exclude_domains, search_depth, include_answer, include_images, include_raw_content, max_results } = args;
      
      // Smart defaults based on query analysis
      const queryLower = query.toLowerCase();
      const isComplex = queryLower.includes('how') || queryLower.includes('why') || queryLower.includes('explain') || query.length > 50;
      const needsAnswer = queryLower.includes('tell') || queryLower.includes('about') || queryLower.includes('what is');
      
      const result = await tavilySearch(query, credentials, {
        include_domains,
        exclude_domains,
        search_depth: search_depth || (isComplex ? 'advanced' : 'basic'),
        include_answer: include_answer ?? (needsAnswer ? true : true), // Default to true for better UX
        include_images: include_images ?? false,
        include_raw_content: include_raw_content ?? isComplex,
        max_results: max_results || (isComplex ? 8 : 5),
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

// Tavily News Search Tool
server.tool(
  "tavily_search_news",
  "LATEST NEWS & CURRENT EVENTS: Use when user asks for 'latest', 'recent', 'news', 'current', 'breaking', or time-sensitive information. Automatically searches major news sources (CNN, BBC, Reuters, etc.). Use for: stock updates, company announcements, recent developments, breaking news.",
  {
    tavily_api_key: z.string().describe("Tavily API key"),
    query: z.string().describe("News search query - include key terms like company/topic name"),
    include_domains: z.array(z.string()).optional().describe("Specific news sources (leave empty for auto news sources)"),
    exclude_domains: z.array(z.string()).optional().describe("News sources to exclude"),
    search_depth: z.enum(['basic', 'advanced']).optional().describe("Use 'advanced' for complex news topics"),
    include_answer: z.boolean().optional().describe("Set true for news summary (recommended)"),
    include_images: z.boolean().optional().describe("Set true for news images"),
    include_raw_content: z.boolean().optional().describe("Set true for full article content"),
    max_results: z.number().min(1).max(15).optional().describe("Number of news articles (8-12 recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, include_domains, exclude_domains, search_depth, include_answer, include_images, include_raw_content, max_results } = args;
      
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
      
      const result = await tavilySearch(newsQuery, credentials, {
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

// Brave Search Tool
server.tool(
  "brave_search",
  "PRIVACY-FOCUSED SEARCH WITH TECHNICAL CONTENT: Use when user specifically asks for privacy-focused search or technical/programming content. Supports advanced search operators. Better for technical documentation and programming resources than general queries.",
  {
    brave_api_key: z.string().describe("Brave API key"),
    query: z.string().describe("Search query with optional operators (site:, filetype:, intitle:, inurl:, before:, after:, \"exact phrase\")"),
    country: z.string().length(2).optional().describe("Two-letter country code (US, UK, DE, etc.)"),
    search_lang: z.string().length(2).optional().describe("Search language code (en, es, fr, etc.)"),
    ui_lang: z.string().length(2).optional().describe("Interface language code"),
    count: z.number().min(1).max(20).optional().describe("Number of results (10 recommended)"),
    offset: z.number().min(0).optional().describe("Results offset for pagination"),
    safesearch: z.enum(['off', 'moderate', 'strict']).optional().describe("Safe search level"),
    freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional().describe("Time filter: past day/week/month/year"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, country, search_lang, ui_lang, count, offset, safesearch, freshness } = args;
      
      const result = await braveSearch(query, credentials, {
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

// Kagi Search Tool
server.tool(
  "kagi_search",
  "PREMIUM QUALITY SEARCH: Use when user needs high-quality, ad-free search results with minimal SEO spam. Better than Google for clean, relevant results. Perfect for: research, professional queries, avoiding low-quality content. Supports search operators.",
  {
    kagi_api_key: z.string().describe("Kagi API key"),
    query: z.string().min(2).describe("Search query (supports operators: site:, -site:, filetype:, intitle:, inurl:, before:, after:, \"exact phrase\")"),
    limit: z.number().min(1).max(50).optional().describe("Number of results to return (10 recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, limit } = args;
      
      // Smart query analysis for better results
      const isResearchQuery = /research|study|academic|scientific|paper|journal|analysis/.test(query.toLowerCase());
      const isCodeQuery = /code|programming|javascript|python|typescript|github|stackoverflow/.test(query.toLowerCase());
      const isNewsQuery = /news|latest|current|recent|today|breaking/.test(query.toLowerCase());
      
      // Optimize query based on intent
      let optimizedQuery = query;
      if (isResearchQuery) {
        optimizedQuery = `${query} site:arxiv.org OR site:scholar.google.com OR site:researchgate.net`;
      } else if (isCodeQuery) {
        optimizedQuery = `${query} site:github.com OR site:stackoverflow.com OR site:developer.mozilla.org`;
      } else if (isNewsQuery) {
        optimizedQuery = `${query} site:reuters.com OR site:bbc.com OR site:ap.org`;
      }
      
      const result = await kagiSearch(optimizedQuery, credentials, { limit: limit || 10 });

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

// Perplexity Chat Tool
server.tool(
  "perplexity_chat",
  "AI-POWERED SEARCH WITH REASONING: Use when user asks complex questions requiring AI analysis, reasoning, or synthesis. Combines real-time search with GPT-4 and Claude 3. Perfect for: analytical questions, complex research, explanations, 'why' and 'how' questions.",
  {
    perplexity_api_key: z.string().describe("Perplexity API key"),
    query: z.string().min(5).describe("Complex question or query requiring AI analysis and reasoning"),
    model: z.string().optional().describe("AI model (default: llama-3.1-sonar-small-128k-online for speed)"),
    max_tokens: z.number().min(100).max(4000).optional().describe("Response length limit (1000 recommended)"),
    temperature: z.number().min(0).max(2).optional().describe("Response creativity (0.2 for factual, 0.7 for creative)"),
    return_citations: z.boolean().optional().describe("Include source citations (recommended: true)"),
    search_domain_filter: z.array(z.string().url()).optional().describe("Limit search to specific domains"),
    return_images: z.boolean().optional().describe("Include relevant images in response"),
    return_related_questions: z.boolean().optional().describe("Suggest follow-up questions"),
    search_recency_filter: z.enum(['month', 'week', 'day', 'hour']).optional().describe("Time filter for recent information"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, model, max_tokens, temperature, return_citations, search_domain_filter, return_images, return_related_questions, search_recency_filter } = args;
      
      const result = await perplexityChat(query, credentials, {
        model: model || 'llama-3.1-sonar-small-128k-online',
        max_tokens: max_tokens || 1000,
        temperature: temperature ?? 0.2,
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

// Kagi FastGPT Tool
server.tool(
  "kagi_fastgpt",
  "INSTANT AI ANSWERS: Use when user needs quick, direct answers to specific questions (900ms response time). Better than search when user asks direct questions like 'what is', 'how to', 'when did', 'who is'. Includes web search and citations.",
  {
    kagi_api_key: z.string().describe("Kagi API key"),
    query: z.string().min(3).describe("Direct question or query requiring a specific answer"),
    web_search: z.boolean().optional().describe("Include web search for current information (recommended: true)"),
    cache: z.boolean().optional().describe("Use cache for faster responses (recommended: true)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, web_search, cache } = args;
      
      // Analyze query to determine if web search is needed
      const needsCurrentInfo = /latest|recent|current|today|news|price|stock|weather|now/.test(query.toLowerCase());
      const isFactualQuery = /what is|who is|when did|where is|how many|definition/.test(query.toLowerCase());
      
      const result = await kagiFastGPT(query, credentials, {
        web_search: web_search ?? (needsCurrentInfo || isFactualQuery),
        cache: cache ?? !needsCurrentInfo, // Don't cache if user needs current info
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

// Jina AI Search Tool
server.tool(
  "jina_search",
  "FAST WEB SEARCH WITH CLEAN RESULTS: Alternative to Tavily when you need fast, clean search results without AI summary. Use when you prefer raw search results over processed answers. Good for quick lookups and simple queries.",
  {
    jina_api_key: z.string().describe("Jina API key"),
    query: z.string().min(3).describe("Clear, specific search query"),
    count: z.number().min(1).max(20).optional().describe("Number of results to return (10 recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, count } = args;
      
      const result = await jinaSearch(query, credentials, { count: count || 10 });

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

// Jina AI Reader Tool
server.tool(
  "jina_reader",
  "SINGLE WEBPAGE CONTENT EXTRACTION: Use when user provides a specific URL or asks to 'read', 'analyze', 'extract content from' a webpage. Perfect for: reading website content, extracting text from specific pages, analyzing single web pages. NOT for multiple URLs or PDFs.",
  {
    jina_api_key: z.string().describe("Jina API key"),
    url: z.string().url().describe("The exact URL to read and extract content from"),
    gather_all_links: z.boolean().optional().describe("Set true if user wants to see all links on the page"),
    gather_all_images: z.boolean().optional().describe("Set true if user wants image information"),
    with_generated_alt: z.boolean().optional().describe("Set true for AI-generated image descriptions"),
    proxy_server: z.string().optional().describe("Proxy server if needed for access"),
    no_cache: z.boolean().optional().describe("Set true to force fresh content"),
    with_iframe: z.boolean().optional().describe("Set true to include embedded content"),
    with_shadow_dom: z.boolean().optional().describe("Set true for complex web apps"),
    with_generated_summary: z.boolean().optional().describe("Set true for AI summary of the page content (recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { url, gather_all_links, gather_all_images, with_generated_alt, proxy_server, no_cache, with_iframe, with_shadow_dom, with_generated_summary } = args;
      
      const result = await jinaReader(url, credentials, {
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

// Jina AI Batch Reader Tool
server.tool(
  "jina_batch_reader",
  "MULTIPLE WEBPAGE COMPARISON: Use when user wants to compare, analyze, or read content from MULTIPLE websites simultaneously. Perfect for: comparing company websites, analyzing multiple sources, reading several pages at once. Requires 2+ URLs.",
  {
    jina_api_key: z.string().describe("Jina API key"),
    urls: z.array(z.string().url()).min(2).max(10).describe("List of 2-10 URLs to read and compare"),
    with_generated_summary: z.boolean().optional().describe("Set true for AI summary of each page (recommended)"),
    gather_all_links: z.boolean().optional().describe("Set true to extract links from all pages"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { urls, with_generated_summary, gather_all_links } = args;
      
      const results = await Promise.all(
        urls.map(async (url, index) => {
          try {
            const result = await jinaReader(url, credentials, {
              with_generated_summary: with_generated_summary ?? true,
              gather_all_links: gather_all_links ?? false,
            });
            return { url, index: index + 1, result, error: null };
          } catch (error) {
            return { url, index: index + 1, result: null, error: error instanceof Error ? error.message : String(error) };
          }
        })
      );

      return {
        content: [
          {
            type: "text",
            text: `Jina AI Batch Reader Results:

${results.map(({ url, index, result, error }) => {
  if (error) {
    return `${index}. ${url} - ERROR: ${error}`;
  }
  if (!result) {
    return `${index}. ${url} - ERROR: No result`;
  }
  return `${index}. ${result.data.title}
   URL: ${result.data.url}
   Description: ${result.data.description}
   Tokens: ${result.data.usage.tokens}
   Content Preview: ${result.data.content.substring(0, 200)}...
   `;
}).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error with Jina AI batch reading: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Firecrawl Scrape Tool
server.tool(
  "firecrawl_scrape",
  "CLEAN WEBPAGE EXTRACTION: Use when you need clean, formatted content from a single webpage for LLM processing. Better than jina_reader for structured content extraction. Perfect for: getting clean markdown from websites, extracting main content only.",
  {
    firecrawl_api_key: z.string().describe("Firecrawl API key"),
    url: z.string().url().describe("URL to scrape and clean"),
    formats: z.array(z.enum(['markdown', 'html', 'rawHtml'])).optional().describe("Output formats - markdown recommended"),
    headers: z.record(z.string()).optional().describe("Custom headers if needed for access"),
    include_tags: z.array(z.string()).optional().describe("Specific HTML tags to include"),
    exclude_tags: z.array(z.string()).optional().describe("HTML tags to exclude (e.g., ['script', 'style'])"),
    only_main_content: z.boolean().optional().describe("Set true to extract only main content (recommended)"),
    timeout: z.number().min(5000).max(60000).optional().describe("Request timeout in milliseconds"),
    wait_for: z.number().min(0).max(10000).optional().describe("Wait time before extraction"),
    mobile: z.boolean().optional().describe("Set true to use mobile user agent"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { url, formats, headers, include_tags, exclude_tags, only_main_content, timeout, wait_for, mobile } = args;
      
      const result = await firecrawlScrape(url, credentials, {
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

// Firecrawl Crawl Tool
server.tool(
  "firecrawl_crawl",
  "COMPREHENSIVE WEBSITE CRAWLING: Use when user wants to explore or analyze ALL pages of a website, get site structure, or perform comprehensive site analysis. NOT for single pages. Perfect for: site mapping, competitive analysis, content auditing.",
  {
    firecrawl_api_key: z.string().describe("Firecrawl API key"),
    url: z.string().url().describe("Base URL of website to crawl comprehensively"),
    exclude_paths: z.array(z.string()).optional().describe("URL paths to exclude (e.g., ['/admin', '/private'])"),
    include_paths: z.array(z.string()).optional().describe("Only crawl these paths (e.g., ['/blog', '/products'])"),
    max_depth: z.number().min(1).max(5).optional().describe("Maximum crawl depth (2 recommended, 3 for deep analysis)"),
    limit: z.number().min(10).max(500).optional().describe("Maximum pages to crawl (100 recommended)"),
    allow_backward_links: z.boolean().optional().describe("Allow crawling backward navigation"),
    allow_external_links: z.boolean().optional().describe("Allow crawling external domains"),
    ignore_sitemap: z.boolean().optional().describe("Ignore sitemap.xml (use if sitemap is incomplete)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { url, exclude_paths, include_paths, max_depth, limit, allow_backward_links, allow_external_links, ignore_sitemap } = args;
      
      // Smart defaults based on URL analysis
      const domain = new URL(url).hostname;
      const isLargeEcommerce = /amazon|ebay|shopify|woocommerce/.test(domain);
      const isBlog = /blog|wordpress|medium|substack/.test(domain);
      const isDocumentation = /docs|documentation|wiki|help/.test(domain);
      
      // Adjust crawl settings based on site type
      let smartDepth = max_depth;
      let smartLimit = limit;
      
      if (isLargeEcommerce) {
        smartDepth = Math.min(smartDepth || 2, 2); // Limit depth for large e-commerce
        smartLimit = Math.min(smartLimit || 100, 50); // Limit pages for large sites
      } else if (isBlog) {
        smartDepth = smartDepth || 3; // Deeper for blogs
        smartLimit = smartLimit || 200; // More pages for blogs
      } else if (isDocumentation) {
        smartDepth = smartDepth || 4; // Deeper for documentation
        smartLimit = smartLimit || 500; // More pages for docs
      }
      
      const result = await firecrawlCrawl(url, credentials, {
        excludePaths: exclude_paths || (isLargeEcommerce ? ['/search', '/cart', '/checkout'] : undefined),
        includePaths: include_paths,
        maxDepth: smartDepth || 2,
        limit: smartLimit || 100,
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

// Firecrawl Map Tool
server.tool(
  "firecrawl_map",
  "FAST WEBSITE URL DISCOVERY: Use when user wants to quickly find all URLs on a website, get site structure overview, or find specific pages. Faster than crawling. Perfect for: URL discovery, site exploration, finding specific content types.",
  {
    firecrawl_api_key: z.string().describe("Firecrawl API key"),
    url: z.string().url().describe("Website URL to map and discover all accessible URLs"),
    search: z.string().optional().describe("Search term to filter URLs (e.g., 'blog', 'product', 'contact')"),
    ignore_sitemap: z.boolean().optional().describe("Ignore sitemap.xml (use if sitemap incomplete)"),
    include_subdomains: z.boolean().optional().describe("Include subdomains in mapping"),
    limit: z.number().min(100).max(10000).optional().describe("Max URLs to discover (5000 recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { url, search, ignore_sitemap, include_subdomains, limit } = args;
      
      const result = await firecrawlMap(url, credentials, {
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

// Firecrawl Extract Tool
server.tool(
  "firecrawl_extract",
  "AI-POWERED DATA EXTRACTION: Use when user needs specific information extracted from a webpage using natural language instructions. Perfect for: extracting structured data, finding specific details, parsing complex content with AI guidance.",
  {
    firecrawl_api_key: z.string().describe("Firecrawl API key"),
    url: z.string().url().describe("URL to extract specific data from"),
    prompt: z.string().min(10).describe("Natural language instruction for what to extract (e.g., 'extract all product prices and names')"),
    schema: z.any().optional().describe("JSON schema for structured output format"),
    system_prompt: z.string().optional().describe("System instructions for AI extraction behavior"),
    timeout: z.number().min(5000).max(60000).optional().describe("Request timeout (30000ms recommended)"),
    wait_for: z.number().min(0).max(10000).optional().describe("Wait time before extraction (for dynamic content)"),
    mobile: z.boolean().optional().describe("Use mobile user agent for mobile-optimized sites"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { url, prompt, schema, system_prompt, timeout, wait_for, mobile } = args;
      
      // Analyze prompt to optimize extraction
      const isStructuredData = /extract|table|list|price|contact|email|phone|address/.test(prompt.toLowerCase());
      const isContentExtraction = /content|text|article|blog|description/.test(prompt.toLowerCase());
      const needsWait = /dynamic|javascript|react|vue|angular/.test(prompt.toLowerCase());
      
      // Smart system prompt based on extraction type
      let smartSystemPrompt = system_prompt;
      if (!smartSystemPrompt) {
        if (isStructuredData) {
          smartSystemPrompt = "You are a data extraction expert. Extract the requested information in a structured format. Be precise and comprehensive.";
        } else if (isContentExtraction) {
          smartSystemPrompt = "You are a content extraction expert. Extract the main content while preserving important context and structure.";
        }
      }
      
      const result = await firecrawlExtract(url, credentials, {
        prompt,
        schema,
        systemPrompt: smartSystemPrompt,
        timeout: timeout || 30000,
        waitFor: wait_for || (needsWait ? 2000 : 0),
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

// Jina AI Grounding Tool
server.tool(
  "jina_grounding",
  "FACT VERIFICATION & GROUNDING: Use when user needs to verify facts, check claims against sources, or validate information accuracy. Perfect for: fact-checking, verifying claims, comparing statements against evidence, research validation.",
  {
    jina_api_key: z.string().describe("Jina API key"),
    source: z.string().min(50).describe("Source text or content to verify statements against (comprehensive source material)"),
    statements: z.array(z.string().min(10)).min(1).max(10).describe("List of specific statements, facts, or claims to verify (be precise and complete)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { source, statements } = args;
      
      const result = await jinaGrounding(source, statements, credentials);

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

// Kagi Enrichment Tool
server.tool(
  "kagi_enrichment",
  "SPECIALIZED CONTENT ENHANCEMENT: Use when user needs supplementary information about a specific URL, or wants enhanced context from specialized indexes. Perfect for: getting additional context, enriching existing content, finding related information.",
  {
    kagi_api_key: z.string().describe("Kagi API key"),
    url: z.string().url().describe("URL to enrich with additional context and information"),
    engine: z.enum(['teclis', 'tinygem']).optional().describe("Enrichment engine: 'teclis' for general enhancement, 'tinygem' for specialized content"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { url, engine } = args;
      
      const result = await kagiEnrichment(url, credentials, { engine: engine || 'teclis' });

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

// ================ ADDITIONAL TOOLS FOR WORKING PROVIDERS ================

// Tavily Academic Search Tool
server.tool(
  "tavily_search_academic",
  "ACADEMIC & RESEARCH CONTENT: Use when user asks for 'research', 'papers', 'studies', 'scientific', 'academic', or scholarly information. Searches academic databases (arxiv, pubmed, ieee, nature, etc.). Use for: research papers, scientific studies, technical documentation, academic sources.",
  {
    tavily_api_key: z.string().describe("Tavily API key"),
    query: z.string().describe("Academic search query - include technical terms and research keywords"),
    include_domains: z.array(z.string()).optional().describe("Academic sources to prioritize (e.g., ['arxiv.org', 'pubmed.ncbi.nlm.nih.gov'])"),
    exclude_domains: z.array(z.string()).optional().describe("Non-academic sources to exclude"),
    search_depth: z.enum(['basic', 'advanced']).optional().describe("Use 'advanced' for comprehensive research (recommended)"),
    max_results: z.number().min(1).max(10).optional().describe("Number of papers/studies to find (5-8 recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { query, include_domains, exclude_domains, search_depth, max_results } = args;
      
      const academicQuery = `${query} research paper academic study`;
      const academicDomains = include_domains || [
        'arxiv.org',
        'scholar.google.com',
        'pubmed.ncbi.nlm.nih.gov',
        'ieee.org',
        'acm.org',
        'springer.com',
        'sciencedirect.com',
        'nature.com',
        'science.org',
        'plos.org',
        'jstor.org',
        'researchgate.net'
      ];
      
      const result = await tavilySearch(academicQuery, credentials, {
        include_domains: academicDomains,
        exclude_domains,
        search_depth: search_depth || 'advanced',
        include_answer: true,
        include_raw_content: true,
        max_results: max_results || 10,
      });

      return {
        content: [
          {
            type: "text",
            text: `Tavily Academic Search Results for "${query}":

${result.answer ? `Research Summary: ${result.answer}\n\n` : ''}Academic Sources:
${(result.results || []).map((r, i) => `${i + 1}. ${r.title}
   URL: ${r.url}
   Score: ${r.score}
   Published: ${r.published_date || 'N/A'}
   Abstract/Content: ${r.content ? r.content.substring(0, 300) + '...' : 'No content available'}
`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing Tavily academic search: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Jina AI PDF Reader Tool
server.tool(
  "jina_pdf_reader",
  "PDF DOCUMENT ANALYSIS: Use ONLY when user provides a PDF URL or asks to read/analyze a PDF document. Perfect for: research papers, reports, documentation in PDF format. URL must end with .pdf or be a known PDF link.",
  {
    jina_api_key: z.string().describe("Jina API key"),
    pdf_url: z.string().url().describe("Direct URL to PDF file (must be accessible PDF link)"),
    with_generated_summary: z.boolean().optional().describe("Set true for AI summary of PDF content (recommended)"),
    gather_all_images: z.boolean().optional().describe("Set true to extract images from PDF"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { pdf_url, with_generated_summary, gather_all_images } = args;
      
      const result = await jinaReader(pdf_url, credentials, {
        with_generated_summary: with_generated_summary ?? true,
        gather_all_images: gather_all_images ?? false,
        with_generated_alt: true,
      });

      return {
        content: [
          {
            type: "text",
            text: `Jina AI PDF Reader Results:

Title: ${result.data.title}
URL: ${result.data.url}
Description: ${result.data.description}
Tokens Used: ${result.data.usage.tokens}

PDF Content:
${result.data.content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading PDF with Jina AI: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Firecrawl Research Tool
server.tool(
  "firecrawl_research",
  "COMPREHENSIVE RESEARCH PROJECT: Use when user asks for detailed research, investigation, or analysis across multiple sources with a specific research question. Perfect for: market research, competitive analysis, comprehensive studies. Requires specific research question and multiple relevant URLs.",
  {
    firecrawl_api_key: z.string().describe("Firecrawl API key"),
    research_urls: z.array(z.string().url()).min(2).max(8).describe("List of 2-8 relevant URLs to research (must be related to research question)"),
    research_question: z.string().min(10).describe("Specific, detailed research question or topic to investigate"),
    extract_schema: z.any().optional().describe("JSON schema for structured data extraction from each source"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { research_urls, research_question, extract_schema } = args;
      
      const results = await Promise.all(
        research_urls.map(async (url, index) => {
          try {
            // First scrape the content
            const scrapeResult = await firecrawlScrape(url, credentials, {
              formats: ['markdown'],
              onlyMainContent: true,
            });
            
            // Then extract specific information
            const extractResult = await firecrawlExtract(url, credentials, {
              prompt: `Research question: ${research_question}. Please extract relevant information that answers this question.`,
              schema: extract_schema,
            });
            
            return { url, index: index + 1, scrape: scrapeResult, extract: extractResult, error: null };
          } catch (error) {
            return { url, index: index + 1, scrape: null, extract: null, error: error instanceof Error ? error.message : String(error) };
          }
        })
      );

      return {
        content: [
          {
            type: "text",
            text: `Firecrawl Research Results:

Research Question: ${research_question}

${results.map(({ url, index, scrape, extract, error }) => {
  if (error) {
    return `${index}. ${url} - ERROR: ${error}`;
  }
  return `${index}. ${scrape?.data?.metadata?.title || url}
   URL: ${url}
   Content Preview: ${scrape?.data?.markdown?.substring(0, 200) || 'No content'}...
   
   Research Findings:
   ${JSON.stringify(extract, null, 2)}
   `;
}).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error with Firecrawl research: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Cross-Provider Fact Verification Tool
server.tool(
  "cross_verify_facts",
  "FACT CHECKING & VERIFICATION: Use when user asks to 'verify', 'fact-check', 'confirm', or 'validate' a specific claim or statement. Combines multiple search sources with AI fact grounding. Perfect for: checking claims, verifying statistics, confirming facts.",
  {
    tavily_api_key: z.string().describe("Tavily API key"),
    jina_api_key: z.string().describe("Jina API key"),
    claim: z.string().min(10).describe("The specific claim, statement, or fact to verify (be precise and complete)"),
    sources_to_check: z.array(z.string().url()).optional().describe("Specific authoritative sources to check against"),
    search_depth: z.enum(['basic', 'advanced']).optional().describe("Use 'advanced' for complex fact-checking (recommended)"),
  },
  async (args) => {
    try {
      const credentials = extractCredentials(args);
      const { claim, sources_to_check, search_depth } = args;
      
      // First, search for information about the claim
      const searchResult = await tavilySearch(`verify fact: ${claim}`, credentials, {
        search_depth: search_depth || 'advanced',
        include_answer: true,
        include_raw_content: true,
        max_results: 5,
      });

      // Then use Jina AI to ground the claim against the search results
      const sourceContent = (searchResult.results || [])
        .map(r => `${r.title}: ${r.content}`)
        .join('\n\n');

      const groundingResult = await jinaGrounding(sourceContent, [claim], credentials);

      return {
        content: [
          {
            type: "text",
            text: `Cross-Platform Fact Verification Results:

CLAIM: ${claim}

=== SEARCH RESULTS (Tavily) ===
${searchResult.answer ? `Summary: ${searchResult.answer}\n\n` : ''}Sources Found:
${(searchResult.results || []).map((r, i) => `${i + 1}. ${r.title}
   URL: ${r.url}
   Content: ${r.content ? r.content.substring(0, 200) + '...' : 'No content'}
`).join('\n')}

=== FACT GROUNDING (Jina AI) ===
${JSON.stringify(groundingResult, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error with cross-platform fact verification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ================ START SERVER ================

async function main() {
  console.log("MCP Omnisearch Server starting...");
  console.log("🔥 DYNAMIC CREDENTIAL MODE: Tools are now available based on API keys provided in each request!");
  console.log("📋 Use 'check_available_tools' to see which tools are available with your API keys");
  console.log("🔑 Each tool requires its corresponding API key to function");
  console.log("🔍 Available providers: Tavily, Brave, Kagi, Perplexity, Jina, Firecrawl");
  console.log("⚡ Tools are only active when you provide valid API keys in requests");

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("✅ MCP Omnisearch Server started successfully!");
  console.log("🚀 Server is ready to accept requests with dynamic API key support!");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
