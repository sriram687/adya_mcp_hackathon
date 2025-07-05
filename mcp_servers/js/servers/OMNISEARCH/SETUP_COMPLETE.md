# MCP Omnisearch Server - Setup and Installation Guide

## 🎉 MCP Omnisearch Server Created Successfully!

A comprehensive Model Context Protocol (MCP) server that provides unified access to multiple search providers and AI tools has been successfully created at:

```
/Users/sreejesh/Documents/Projects/adya_mcp_hackathon/mcp_servers/js/servers/OMNISEARCH/
```

## 📁 Project Structure

```
OMNISEARCH/
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript output
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md            # Comprehensive documentation
├── LICENSE              # MIT license
├── .env.example         # Environment variable template
└── test_omnisearch.js   # Test suite for all tools
```

## 🔧 Available Tools

The server provides **13 powerful tools** across **6 different providers**:

### 🔍 Search Tools (3 tools)
- `tavily_search` - Factual search with citations and AI answers
- `brave_search` - Privacy-focused search with operators
- `kagi_search` - High-quality, ad-free search results

### 🤖 AI Response Tools (2 tools)
- `perplexity_chat` - Advanced AI with real-time web search
- `kagi_fastgpt` - Quick AI answers with citations (900ms)

### 📄 Content Processing Tools (6 tools)
- `jina_reader` - Clean content extraction with image captioning
- `kagi_summarizer` - Summarize pages, videos, podcasts
- `tavily_extract` - Batch content extraction from URLs
- `firecrawl_scrape` - LLM-ready data extraction
- `firecrawl_crawl` - Deep website crawling
- `firecrawl_map` - Website structure mapping

### 🔄 Enhancement Tools (2 tools)
- `firecrawl_extract` - AI-powered structured data extraction
- `jina_grounding` - Real-time fact verification
- `kagi_enrichment` - Specialized content enrichment

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /Users/sreejesh/Documents/Projects/adya_mcp_hackathon/mcp_servers/js/servers/OMNISEARCH
npm install
```

### 2. Configure API Keys
```bash
cp .env.example .env
# Edit .env file with your API keys
```

### 3. Build and Start
```bash
npm run build
npm start
```

### 4. Test Your Setup
```bash
npm test
```

## 🔑 API Key Configuration

The server supports **flexible API key configuration** - you only need the keys for providers you want to use:

```bash
# Minimum setup (just one provider)
TAVILY_API_KEY=your_tavily_key

# Recommended setup (search + AI)
TAVILY_API_KEY=your_tavily_key
PERPLEXITY_API_KEY=your_perplexity_key

# Full setup (all providers)
TAVILY_API_KEY=your_tavily_key
BRAVE_API_KEY=your_brave_key
KAGI_API_KEY=your_kagi_key
PERPLEXITY_API_KEY=your_perplexity_key
JINA_API_KEY=your_jina_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

## 📚 Documentation Created

Comprehensive documentation has been created in:
```
/Users/sreejesh/Documents/Projects/adya_mcp_hackathon/mcp_servers_documentation/OMNISEARCH/
```

### Documentation Files:
- **credentials.md** - Complete API key setup guide with provider details
- **server_features.md** - Detailed feature comparison and usage examples
- **demo_videos.md** - Demo scripts and video production guidance

## 🎯 Key Features

### ✅ Flexible Provider Support
- Works with any combination of API keys
- Automatically detects available providers
- Graceful fallback when providers are unavailable

### ✅ Comprehensive Search Capabilities
- Multiple search engines with different strengths
- Advanced search operators support
- Domain filtering and result customization

### ✅ AI-Powered Analysis
- Real-time web search integration
- Citation tracking and verification
- Multiple AI models available

### ✅ Advanced Content Processing
- Clean text extraction from any URL
- Bulk content processing capabilities
- Structured data extraction with AI

### ✅ Enterprise-Ready Features
- Error handling and rate limiting
- Configurable timeouts and parameters
- Comprehensive logging and monitoring

## 🧪 Testing

The server includes a comprehensive test suite (`test_omnisearch.js`) that:
- Tests all available tools
- Handles missing API keys gracefully
- Provides detailed success/failure reporting
- Includes performance metrics

Run tests with:
```bash
npm test
```

## 🔄 Integration Examples

### Basic Search Comparison
```javascript
// Compare results across providers
const queries = [
  { tool: "tavily_search", query: "AI developments 2024" },
  { tool: "brave_search", query: "AI developments 2024" },
  { tool: "kagi_search", query: "AI developments 2024" }
];
```

### Research Pipeline
```javascript
// Complete research workflow
1. Search with multiple providers
2. Extract content from top URLs
3. Process and clean content
4. Generate AI summaries
5. Verify facts and claims
```

### Content Intelligence
```javascript
// Website analysis workflow
1. Map website structure
2. Scrape key pages
3. Extract structured data
4. Generate competitive intelligence
```

## 📈 Performance Characteristics

- **Tavily**: Fast search with AI answers (~1-2s)
- **Brave**: Fast privacy-focused search (~0.5-1s)
- **Kagi**: High-quality results (~1-2s)
- **Perplexity**: AI responses (~3-5s)
- **Kagi FastGPT**: Ultra-fast AI (~0.9s)
- **Jina AI**: Content processing (~2-4s)
- **Firecrawl**: Variable based on content size

## 🚦 Next Steps

1. **Configure API Keys**: Start with free tiers from 1-2 providers
2. **Run Tests**: Verify everything works with `npm test`
3. **Try Examples**: Use the demo scripts from documentation
4. **Integrate**: Connect with your MCP client of choice
5. **Scale**: Add more providers as needed

## 🌟 Advanced Usage

### Search Operators
```
# Brave and Kagi support advanced operators
site:docs.python.org "async def"
filetype:pdf "machine learning"
intitle:"tutorial" -site:youtube.com
before:2024 "climate change"
```

### Batch Processing
```javascript
// Process multiple URLs at once
tavily_extract({
  urls: ["url1", "url2", "url3"],
  extraction_depth: "advanced"
})
```

### AI-Powered Research
```javascript
// Get comprehensive analysis
perplexity_chat({
  query: "Compare renewable energy solutions",
  return_citations: true,
  return_related_questions: true
})
```

## 🛟 Support and Troubleshooting

### Common Issues:
1. **"API key not configured"** - Check your .env file
2. **"429 Too Many Requests"** - You've hit rate limits
3. **"Network timeout"** - Increase timeout parameters

### Getting Help:
1. Check the comprehensive documentation
2. Review error logs for specific issues
3. Test individual providers with their official APIs
4. Monitor usage on provider dashboards

## 🎊 Congratulations!

You now have a powerful, unified search and AI server that combines the best capabilities from multiple providers into a single, easy-to-use interface. The server is production-ready and can handle everything from simple searches to complex research workflows.

**Happy searching! 🔍✨**
