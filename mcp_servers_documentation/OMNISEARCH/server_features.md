# MCP Omnisearch Server - Features and Capabilities

## 🔍 Search Tools

### Tavily Search
**Purpose**: Optimized for factual information with strong citation support

**Features**:
- Domain filtering through API parameters (include_domains/exclude_domains)
- AI-generated answers with citations
- Image search results
- Configurable search depth (basic/advanced)
- Raw content extraction from sources

**Best For**: Research, fact-checking, getting comprehensive answers with citations

**Example Use Cases**:
- Academic research with domain filtering
- News verification with citation tracking
- Multi-source fact compilation

### Brave Search
**Purpose**: Privacy-focused search with excellent technical content coverage

**Features**:
- Native search operators support:
  - `site:domain.com` - Search specific domain
  - `-site:domain.com` - Exclude specific domain
  - `filetype:pdf` - Search for specific file types
  - `intitle:"exact phrase"` - Search in page titles
  - `inurl:keyword` - Search in URLs
  - `before:2024` / `after:2023` - Date filtering
  - `"exact phrase"` - Exact phrase matching
- Freshness filters (past day, week, month, year)
- Country-specific results
- Safe search options
- Extra snippets for context

**Best For**: Technical searches, programming queries, privacy-conscious users

**Example Use Cases**:
- Finding specific documentation: `site:docs.python.org "async def"`
- Technical tutorials: `filetype:pdf "machine learning tutorial"`
- Recent news: `"AI breakthrough" after:2024`

### Kagi Search
**Purpose**: High-quality search results with minimal advertising influence

**Features**:
- Complete search operators support (same as Brave)
- Authoritative source prioritization
- Minimal advertising influence
- High-quality ranking algorithms
- Fast response times
- Detailed metadata (rank, processing time)

**Best For**: High-quality research, professional use, ad-free searching

**Example Use Cases**:
- Academic research with quality prioritization
- Professional information gathering
- Clean, focused search results

## 🤖 AI Response Tools

### Perplexity AI
**Purpose**: Advanced AI responses combining real-time web search with powerful language models

**Features**:
- Multiple models available (GPT-4 Omni, Claude 3, Llama)
- Real-time web search integration
- Citation tracking
- Related question suggestions
- Image results
- Domain filtering for searches
- Recency filtering (hour, day, week, month)
- Customizable response parameters

**Best For**: Complex queries requiring AI reasoning, research summaries, Q&A

**Example Use Cases**:
- "Explain quantum computing with recent developments"
- "Compare different machine learning frameworks with citations"
- "What are the latest trends in renewable energy?"

### Kagi FastGPT
**Purpose**: Quick AI-generated answers with citations (900ms typical response time)

**Features**:
- Ultra-fast response times
- Web search integration
- Citation support
- Caching for repeated queries
- Concise, focused answers

**Best For**: Quick answers, rapid information retrieval, time-sensitive queries

**Example Use Cases**:
- Quick fact checking
- Rapid research assistance
- Fast answers to straightforward questions

## 📄 Content Processing Tools

### Jina AI Reader
**Purpose**: Clean content extraction with advanced processing capabilities

**Features**:
- Clean text extraction from web pages
- Image captioning and alt text generation
- PDF content extraction
- Link and image gathering
- Iframe and Shadow DOM content inclusion
- Proxy server support
- Content summarization
- Token usage tracking

**Best For**: Content analysis, research preparation, accessibility improvements

**Example Use Cases**:
- Converting web articles to clean text
- Extracting content from PDFs
- Generating image descriptions for accessibility

### Kagi Universal Summarizer
**Purpose**: Content summarization for various media types

**Features**:
- Multiple summarization engines (Cecil, Agnes, Daphne, Muriel)
- Summary types: general summary or key takeaways
- Support for pages, videos, and podcasts
- Multi-language output
- Fast processing with caching

**Best For**: Content digestion, research preparation, information synthesis

**Example Use Cases**:
- Summarizing long articles
- Getting key points from videos
- Condensing research materials

### Tavily Extract
**Purpose**: Raw content extraction from single or multiple web pages

**Features**:
- Batch URL processing
- Configurable extraction depth (basic/advanced)
- Combined content output
- Individual URL content separation
- Metadata including word count and extraction statistics

**Best For**: Bulk content extraction, research compilation, data gathering

**Example Use Cases**:
- Extracting content from multiple related articles
- Gathering information from competitor websites
- Bulk research content preparation

### Firecrawl Suite
**Purpose**: Advanced web scraping and crawling with AI-enhanced capabilities

#### Firecrawl Scrape
- Clean, LLM-ready data extraction
- Multiple output formats (Markdown, HTML, raw HTML)
- Custom headers and filtering
- Main content extraction
- Mobile user agent support
- Configurable timeouts

#### Firecrawl Crawl
- Deep crawling of entire websites
- Configurable depth limits
- Path inclusion/exclusion
- Sitemap integration
- Backward and external link handling
- Bulk processing capabilities

#### Firecrawl Map
- Fast URL collection from websites
- Comprehensive site mapping
- Subdomain inclusion
- Search filtering
- Large-scale URL discovery (up to 5000 URLs)

#### Firecrawl Extract
- AI-powered structured data extraction
- Natural language prompts
- Custom JSON schemas
- System prompt customization
- Interactive elements support

**Best For**: Large-scale web scraping, competitive analysis, site auditing

**Example Use Cases**:
- Crawling competitor websites
- Extracting structured data from e-commerce sites
- Site mapping and architecture analysis

## 🔄 Enhancement Tools

### Jina AI Grounding
**Purpose**: Real-time fact verification against web knowledge

**Features**:
- Statement verification against source content
- Fact-checking automation
- Web knowledge integration
- Batch statement processing

**Best For**: Fact-checking, content verification, research validation

**Example Use Cases**:
- Verifying claims in articles
- Fact-checking research findings
- Validating information accuracy

### Kagi Enrichment
**Purpose**: Supplementary content from specialized indexes

**Features**:
- Access to Teclis and TinyGem indexes
- Specialized content enrichment
- Additional context and information
- Enhanced search results

**Best For**: Research enhancement, finding additional context, specialized information

**Example Use Cases**:
- Finding related academic papers
- Discovering additional context for topics
- Enriching research with specialized sources

## 🎯 Search Operators Guide

### Universal Operators (Brave & Kagi)
```
site:example.com          # Search within specific domain
-site:example.com         # Exclude specific domain
filetype:pdf              # Search for specific file types
intitle:"machine learning" # Search in page titles
inurl:tutorial            # Search in URLs
before:2024               # Content before specific date
after:2023                # Content after specific date
"exact phrase"            # Exact phrase matching
```

### Tavily Domain Filtering
```json
{
  "query": "artificial intelligence",
  "include_domains": ["arxiv.org", "nature.com"],
  "exclude_domains": ["wikipedia.org"]
}
```

### Advanced Search Examples
```
# Technical documentation
site:docs.python.org "async def" filetype:html

# Recent research papers
"machine learning" site:arxiv.org after:2024

# Excluding forums from results
"python tutorial" -site:stackoverflow.com -site:reddit.com

# Finding specific file types
"data science" filetype:pdf OR filetype:ppt
```

## 🏆 Provider Comparison

| Feature | Tavily | Brave | Kagi | Perplexity | Jina | Firecrawl |
|---------|--------|-------|------|------------|------|-----------|
| **Search Quality** | High | Good | Excellent | AI-Enhanced | N/A | N/A |
| **Speed** | Fast | Fast | Fast | Medium | Fast | Medium |
| **Citations** | Yes | Basic | Yes | Yes | N/A | N/A |
| **AI Integration** | Yes | No | Limited | Yes | Yes | Yes |
| **Operators** | Limited | Full | Full | Limited | N/A | N/A |
| **Content Extraction** | Basic | No | No | No | Advanced | Advanced |
| **Bulk Processing** | Limited | No | No | No | Limited | Yes |
| **Free Tier** | Yes | Yes | No | Limited | Yes | Yes |

## 🔧 Configuration Tips

### Performance Optimization
- Use caching where available (Kagi, Tavily)
- Adjust timeout settings based on your needs
- Use appropriate search depth for your use case
- Batch requests when possible

### Cost Management
- Start with free tiers
- Monitor API usage regularly
- Use domain filtering to reduce irrelevant results
- Cache frequently accessed content

### Quality Optimization
- Use appropriate search operators
- Combine multiple providers for comprehensive results
- Leverage AI providers for complex queries
- Use content processing tools for clean extraction
