# OMNISEARCH Postman Environment Variables

This document provides a comprehensive reference for all environment variables available in the OMNISEARCH Postman collection.

## 🔧 Configuration Variables

### Host Configuration
- **`dev-js-host`**: `http://localhost:5000` - JavaScript MCP server host
- **`dev-python-host`**: `http://localhost:5001` - Python MCP server host
- **`omnisearch-server`**: `OMNISEARCH` - Server identifier

## 🔑 API Keys (Secret Variables)

### Search & AI Service Keys
- **`gemini-api-key`**: Google Gemini API key for LLM client
- **`tavily-api-key`**: Tavily search API key
- **`jina-api-key`**: Jina AI API key for web scraping
- **`firecrawl-api-key`**: Firecrawl API key for web scraping
- **`brave-api-key`**: Brave Search API key
- **`kagi-api-key`**: Kagi Search API key
- **`perplexity-api-key`**: Perplexity AI API key

## 🌐 Test URLs

### Basic Test URLs
- **`test-url-reliable`**: `https://example.com` - Most reliable test URL
- **`test-url-wikipedia`**: `https://en.wikipedia.org/wiki/Artificial_intelligence` - Wikipedia article
- **`test-url-github`**: `https://github.com/microsoft/vscode` - GitHub repository
- **`test-url-hackernews`**: `https://news.ycombinator.com/item?id=38504909` - Hacker News article

### Legacy Test URLs (May Have Access Issues)
- **`test-url-tesla`**: `https://www.tesla.com/model3` - Tesla website (may be blocked)
- **`test-url-ford`**: `https://www.ford.com/electric` - Ford website (may be blocked)

### Social Media URLs
- **`test-url-medium`**: `https://medium.com/@example/sample-article-123` - Medium article
- **`test-url-reddit`**: `https://www.reddit.com/r/MachineLearning/` - Reddit community
- **`test-youtube-url`**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` - YouTube video
- **`test-linkedin-url`**: `https://www.linkedin.com/company/microsoft/` - LinkedIn company page
- **`test-pinterest-url`**: `https://www.pinterest.com/pin/1234567890/` - Pinterest pin
- **`test-twitter-url`**: `https://twitter.com/elonmusk/status/1234567890` - Twitter/X post
- **`test-instagram-url`**: `https://www.instagram.com/p/ABC123/` - Instagram post

## 📄 Document URLs

### PDF Test URLs
- **`test-pdf-url`**: `https://www.tesla.com/ns_videos/2022-tesla-sustainability-report.pdf` - Tesla sustainability report (may be blocked)
- **`test-pdf-url-arxiv`**: `https://arxiv.org/pdf/1706.03762.pdf` - ArXiv research paper
- **`test-pdf-url-simple`**: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf` - Simple test PDF

### Image URLs
- **`test-image-url`**: `https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Test+Image` - Test placeholder image

## 🔍 Search Query Variables

### General Search Queries
- **`test-query-tesla`**: `Tesla electric vehicle technology developments 2024 2025`
- **`test-query-ai`**: `artificial intelligence machine learning latest news`
- **`test-query-programming`**: `Python machine learning tutorial`
- **`test-query-news`**: `technology news today latest developments`
- **`test-query-github`**: `site:github.com Python machine learning tutorial`

## 📊 Test Data Variables

### Geographic Data
- **`test-coordinates`**: `37.7749,-122.4194` - San Francisco coordinates
- **`test-location`**: `San Francisco, CA` - Test location
- **`test-country`**: `US` - Country code

### Business Data
- **`test-company-name`**: `Tesla Inc` - Company name
- **`test-stock-symbol`**: `TSLA` - Stock ticker symbol
- **`test-domain`**: `example.com` - Test domain

### Content Data
- **`test-text-content`**: `This is a sample text content for testing text analysis and processing tools.`
- **`test-keyword`**: `artificial intelligence` - Test keyword
- **`test-language`**: `en` - Language code

### Contact Data
- **`test-email`**: `test@example.com` - Test email address
- **`test-phone`**: `+1-555-123-4567` - Test phone number

### Date/Time Data
- **`test-date-range`**: `2024-01-01 to 2024-12-31` - Test date range

## 🚀 Usage Examples

### Using Variables in Requests
```json
{
  "url": "{{test-url-reliable}}",
  "query": "{{test-query-ai}}",
  "api_key": "{{gemini-api-key}}"
}
```

### Switching Between Test URLs
For web scraping tools, you can easily switch between different test URLs:
- Use `{{test-url-reliable}}` for guaranteed access
- Use `{{test-url-wikipedia}}` for content-rich pages
- Use `{{test-url-github}}` for technical content

### Dynamic Query Testing
Use the query variables to test different search scenarios:
- `{{test-query-tesla}}` for specific company research
- `{{test-query-ai}}` for technology topics
- `{{test-query-programming}}` for technical tutorials

## 🔧 Configuration Tips

1. **API Keys**: Set all API keys as secret variables in your Postman environment
2. **Test URLs**: Use reliable URLs like `example.com` and Wikipedia for consistent testing
3. **Search Queries**: Customize query variables based on your testing needs
4. **Environment Switching**: Create separate environments for different testing scenarios

## 🚨 Important Notes

- **Access Issues**: Some websites (like Tesla.com) may block scraping attempts
- **Rate Limits**: Be mindful of API rate limits when testing
- **Secret Variables**: Never share environments with API keys publicly
- **URL Reliability**: Always test with `{{test-url-reliable}}` first before using specific domain URLs

## 📋 Quick Reference

Most commonly used variables for testing:
- `{{test-url-reliable}}` - Safe test URL
- `{{test-query-ai}}` - General AI/tech query
- `{{gemini-api-key}}` - Primary LLM API key
- `{{tavily-api-key}}` - Primary search API key
- `{{test-pdf-url-simple}}` - Reliable PDF for testing
