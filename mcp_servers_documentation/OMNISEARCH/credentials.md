# MCP Omnisearch Server - API Key Setup Guide

## Overview
The MCP Omnisearch Server integrates with multiple search providers and AI services. You can use any combination of these services - the server will automatically enable only the providers for which you have valid API keys.

## Available Providers

### 🔍 Search Providers

#### 1. Tavily Search
- **Purpose**: Optimized for factual information with strong citation support
- **Features**: Domain filtering, AI-generated answers, image results
- **API Key**: Get from [Tavily](https://tavily.com/)
- **Environment Variable**: `TAVILY_API_KEY`

#### 2. Brave Search
- **Purpose**: Privacy-focused search with good technical content coverage
- **Features**: Native search operators (site:, filetype:, intitle:, etc.)
- **API Key**: Get from [Brave Search API](https://brave.com/search/api/)
- **Environment Variable**: `BRAVE_API_KEY`

#### 3. Kagi Search
- **Purpose**: High-quality search results with minimal advertising influence
- **Features**: Complete search operators support, authoritative sources
- **API Key**: Get from [Kagi](https://kagi.com/settings?p=api)
- **Environment Variable**: `KAGI_API_KEY`
- **⚠️ Important**: Requires billing setup at [Kagi Billing](https://kagi.com/settings/billing_api)

### 🤖 AI Response Providers

#### 4. Perplexity AI
- **Purpose**: Advanced AI responses with real-time web search
- **Features**: GPT-4 Omni and Claude 3 models, citations, related questions
- **API Key**: Get from [Perplexity](https://docs.perplexity.ai/docs/getting-started)
- **Environment Variable**: `PERPLEXITY_API_KEY`

#### 5. Kagi FastGPT
- **Purpose**: Quick AI-generated answers with citations (900ms response time)
- **Features**: Web search integration, fast responses
- **API Key**: Same as Kagi Search (uses `KAGI_API_KEY`)
- **Environment Variable**: `KAGI_API_KEY`
- **⚠️ Important**: Requires billing setup at [Kagi Billing](https://kagi.com/settings/billing_api)

### 📄 Content Processing

#### 6. Jina AI
- **Purpose**: Clean content extraction and fact verification
- **Features**: Image captioning, PDF support, real-time fact checking
- **API Key**: Get from [Jina AI](https://jina.ai/)
- **Environment Variable**: `JINA_API_KEY`

#### 7. Firecrawl
- **Purpose**: Advanced web scraping and crawling
- **Features**: LLM-ready data extraction, deep crawling, structured data extraction
- **API Key**: Get from [Firecrawl](https://firecrawl.dev/)
- **Environment Variable**: `FIRECRAWL_API_KEY`

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Add Your API Keys
Edit the `.env` file and add your API keys:

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

### 3. Start with Minimal Setup
You can start with just one or two providers:

**Option A: Basic Search Setup**
```bash
TAVILY_API_KEY=your_tavily_key
```

**Option B: AI + Search Setup**
```bash
TAVILY_API_KEY=your_tavily_key
PERPLEXITY_API_KEY=your_perplexity_key
```

**Option C: Full Content Processing Setup**
```bash
TAVILY_API_KEY=your_tavily_key
JINA_API_KEY=your_jina_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

## API Key Acquisition Details

### Tavily Search
1. Visit [Tavily](https://tavily.com/)
2. Sign up for an account
3. Navigate to API settings
4. Generate your API key
5. **Free tier**: 1,000 requests/month

### Brave Search
1. Visit [Brave Search API](https://brave.com/search/api/)
2. Sign up for an account
3. Subscribe to a plan
4. Get your API key from dashboard
5. **Free tier**: 2,000 requests/month

### Kagi Search & FastGPT
1. Visit [Kagi](https://kagi.com/)
2. Create an account
3. Go to Settings > API
4. Generate your API key
5. **Pricing**: $0.005 per search

### Perplexity AI
1. Visit [Perplexity API](https://docs.perplexity.ai/docs/getting-started)
2. Sign up for an account
3. Navigate to API settings
4. Generate your API key
5. **Free tier**: Limited requests, then pay-per-use

### Jina AI
1. Visit [Jina AI](https://jina.ai/)
2. Sign up for an account
3. Go to API section
4. Generate your API key
5. **Free tier**: 1,000 requests/month

### Firecrawl
1. Visit [Firecrawl](https://firecrawl.dev/)
2. Sign up for an account
3. Go to API settings
4. Generate your API key
5. **Free tier**: 500 requests/month

## Testing Your Setup

After adding your API keys, start the server:

```bash
npm run build
npm start
```

The server will log which providers are available based on your API keys:

```
Available providers: tavily, perplexity, jina
```

## Cost Optimization Tips

1. **Start Small**: Begin with 1-2 providers and add more as needed
2. **Free Tiers**: Many providers offer free tiers perfect for testing
3. **Use Caching**: Enable caching options where available (Kagi, etc.)
4. **Monitor Usage**: Keep track of your API usage to avoid unexpected costs
5. **Provider Selection**: Choose providers based on your specific use case:
   - **Factual Research**: Tavily
   - **Technical Content**: Brave
   - **High Quality**: Kagi
   - **AI Responses**: Perplexity
   - **Content Processing**: Jina + Firecrawl

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Ensure the API key is set in your `.env` file
   - Check for typos in the environment variable name
   - Restart the server after adding new keys

2. **"API error: 401 - Unauthorized"**
   - Verify your API key is valid
   - Check if your API key has expired
   - Ensure you have sufficient credits/quota

3. **"API error: 429 - Too Many Requests"**
   - You've hit the rate limit
   - Wait before making more requests
   - Consider upgrading to a higher tier

### Getting Help

If you encounter issues:
1. Check the server logs for specific error messages
2. Verify your API keys are valid by testing them directly
3. Consult the provider's documentation
4. Check your account usage/quota on each provider's dashboard
