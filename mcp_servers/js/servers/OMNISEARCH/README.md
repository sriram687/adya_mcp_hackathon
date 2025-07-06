# MCP Omnisearch Server

A Model Context Protocol (MCP) server that provides unified access to multiple search providers and AI tools. This server combines the capabilities of Tavily, Perplexity, Kagi, Jina AI, Brave, and Firecrawl to offer comprehensive search, AI responses, content processing, and enhancement features through a single interface.

## Features

### 🔍 Search Tools
- **Tavily Search**: Optimized for factual information with strong citation support. Supports domain filtering through API parameters (include_domains/exclude_domains).
- **Brave Search**: Privacy-focused search with good technical content coverage. Features native support for search operators (site:, -site:, filetype:, intitle:, inurl:, before:, after:, and exact phrases).
- **Kagi Search**: High-quality search results with minimal advertising influence, focused on authoritative sources. Supports search operators in query string (site:, -site:, filetype:, intitle:, inurl:, before:, after:, and exact phrases).

### 🎯 Search Operators
MCP Omnisearch provides powerful search capabilities through operators and parameters:

**Common Search Features**
- Domain filtering: Available across all providers
  - Tavily: Through API parameters (include_domains/exclude_domains)
  - Brave & Kagi: Through site: and -site: operators
- File type filtering: Available in Brave and Kagi (filetype:)
- Title and URL filtering: Available in Brave and Kagi (intitle:, inurl:)
- Date filtering: Available in Brave and Kagi (before:, after:)
- Exact phrase matching: Available in Brave and Kagi ("phrase")

### 🤖 AI Response Tools
- **Perplexity AI**: Advanced response generation combining real-time web search with GPT-4 Omni and Claude 3
- **Kagi FastGPT**: Quick AI-generated answers with citations (900ms typical response time)

### 📄 Content Processing Tools
- **Jina AI Reader**: Clean content extraction with image captioning and PDF support
- **Kagi Universal Summarizer**: Content summarization for pages, videos, and podcasts
- **Tavily Extract**: Extract raw content from single or multiple web pages with configurable extraction depth ('basic' or 'advanced'). Returns both combined content and individual URL content, with metadata including word count and extraction statistics
- **Firecrawl Scrape**: Extract clean, LLM-ready data from single URLs with enhanced formatting options
- **Firecrawl Crawl**: Deep crawling of all accessible subpages on a website with configurable depth limits
- **Firecrawl Map**: Fast URL collection from websites for comprehensive site mapping
- **Firecrawl Extract**: Structured data extraction with AI using natural language prompts
- **Firecrawl Actions**: Support for page interactions (clicking, scrolling, etc.) before extraction for dynamic content

### 🔄 Enhancement Tools
- **Kagi Enrichment API**: Supplementary content from specialized indexes (Teclis, TinyGem)
- **Jina AI Grounding**: Real-time fact verification against web knowledge

## Flexible API Key Requirements

MCP Omnisearch is designed to work with the API keys you have available. You don't need to have keys for all providers - the server will automatically detect which API keys are available and only enable those providers.

For example:
- If you only have a Tavily and Perplexity API key, only those providers will be available
- If you don't have a Kagi API key, Kagi-based services won't be available, but all other providers will work normally
- The server will log which providers are available based on the API keys you've configured

This flexibility makes it easy to get started with just one or two providers and add more as needed.

## Environment Variables

Create a `.env` file in the server directory with your API keys:

```bash
# Search Providers
TAVILY_API_KEY=your_tavily_key
BRAVE_API_KEY=your_brave_key
KAGI_API_KEY=your_kagi_key

# AI Response Providers
PERPLEXITY_API_KEY=your_perplexity_key

# Content Processing
JINA_API_KEY=your_jina_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Usage

The server provides multiple tools for different search and AI capabilities. Each tool is automatically available based on the API keys you have configured.

### Available Tools
- `tavily_search` - Search using Tavily
- `brave_search` - Search using Brave
- `kagi_search` - Search using Kagi
- `perplexity_chat` - AI responses from Perplexity
- `kagi_fastgpt` - Quick AI answers from Kagi
- `jina_reader` - Content extraction with Jina AI
- `kagi_summarizer` - Content summarization
- `tavily_extract` - Content extraction from URLs
- `firecrawl_scrape` - Single URL scraping
- `firecrawl_crawl` - Website crawling
- `firecrawl_map` - Website mapping
- `firecrawl_extract` - Structured data extraction
- `jina_grounding` - Fact verification
- `kagi_enrichment` - Content enrichment

## License

MIT
