# Wayback Machine MCP Server - Credentials

## Overview
The Wayback Machine MCP Server uses the public Internet Archive Wayback Machine API, which **does not require authentication or API keys** for basic operations.

## No Credentials Required ✅

### Public API Access
- All Wayback Machine tools work with public API endpoints
- No registration, API keys, or authentication tokens needed
- Immediate functionality without setup

### Available Without Authentication:
- **get-wayback-snapshots**: Retrieve archived snapshots
- **search-wayback-history**: Search archive history
- **save-page-now**: Request page archiving (with rate limits)
- **get-wayback-stats**: Get archive statistics
- **compare-wayback-versions**: Compare different archived versions

## Rate Limiting
While no credentials are required, the Internet Archive implements rate limiting:
- Reasonable usage is generally allowed
- Heavy usage may be temporarily throttled
- The server includes automatic retry logic with exponential backoff

## Optional Enhanced Access
For high-volume usage, you may consider:
- Contacting the Internet Archive directly for higher rate limits
- Using your own instance of the Wayback Machine software
- Implementing additional caching mechanisms

## Getting Started
1. The Wayback server is ready to use immediately
2. No configuration files or environment variables needed
3. Start making requests to any of the available tools

## Example Usage
Since no credentials are required, you can immediately use tools like:

```json
{
  "tool": "get-wayback-snapshots",
  "arguments": {
    "url": "https://example.com"
  }
}
```

## Best Practices
- Use reasonable request intervals to respect rate limits
- Cache results when possible to reduce API calls
- Monitor for rate limit responses and implement appropriate backoff strategies
