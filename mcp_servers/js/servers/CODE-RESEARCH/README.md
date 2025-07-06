# CODE-RESEARCH MCP Server

A Model Context Protocol (MCP) server for searching developer resources: GitHub, Stack Overflow, npm, PyPI, and MDN. Exposes tools for AI assistants and developer workflows.

## Features
- Search GitHub repositories
- Search Stack Overflow questions and answers
- Search npm packages
- Search PyPI packages
- Search MDN documentation (mocked or scraped)
- Unified search across all resources

## Prerequisites
- Node.js v18 or higher
- (Optional) API tokens for GitHub and npm
- (Optional) OAuth credentials for Stack Overflow

## Installation
```bash
npm install
```

## Build
```bash
npm run build
```

## Start
```bash
npm start
```

## Development
```bash
npm run dev
```

## Environment Setup
Create a `.env` file in the root directory:

```
# GitHub API Token (optional - for higher rate limits)
GITHUB_TOKEN=your_github_token_here

# npm Registry Token (optional - for authenticated requests)
NPM_TOKEN=your_npm_token_here

# Stack Overflow OAuth Credentials (optional - for authenticated API access)
STACK_CLIENT_ID=your_stack_overflow_client_id_here
STACK_CLIENT_SECRET=your_stack_overflow_client_secret_here
STACK_REDIRECT_URI=http://localhost:3000/oauth/callback
```

### Stack Overflow OAuth Setup
1. Go to https://stackapps.com/apps/oauth/register
2. Create a new OAuth application
3. Set the redirect URI to `http://localhost:3000/oauth/callback`
4. Copy the Client ID and Client Secret to your `.env` file
5. The server will handle OAuth token management automatically

## MCP Configuration Example
Add to your MCP settings (e.g., for Claude/VSCode):
```json
{
  "mcpServers": {
    "code-research": {
      "command": "node",
      "args": ["path/to/code-research-mcp-server/build/index.js"]
    }
  }
}
```

## Tools

### GitHub Search (`search_github`)
Search GitHub repositories with filtering by language, stars, forks, etc.
- **Parameters**: `query`, `limit`, `sort`, `order`, `language`
- **Authentication**: Optional GITHUB_TOKEN for higher rate limits

### Stack Overflow Search (`search_stackoverflow`)
Search Stack Overflow questions with advanced filtering options.
- **Parameters**: `query`, `limit`, `sort`, `order`, `tagged`, `nottagged`, `min`, `max`, `accepted`, `answers`, `views`, etc.
- **Authentication**: OAuth-based (handled server-side)
- **Features**: HTML cleanup, quota management, comprehensive metadata

### npm Search (`search_npm`)
Search npm packages with quality, popularity, and maintenance filtering.
- **Parameters**: `query`, `limit`, `quality`, `popularity`, `maintenance`
- **Authentication**: Optional NPM_TOKEN for authenticated requests

### PyPI Search (`search_pypi`)
Search PyPI packages with detailed package information.
- **Parameters**: `query`, `limit`, `sort`
- **Authentication**: None required (public API)
- **Features**: Exact package matching with comprehensive metadata

### MDN Search (`search_mdn`)
Search MDN documentation (placeholder - to be implemented).
- **Parameters**: `query`, `limit`
- **Authentication**: None required

### Search All (`search_all`)
Search all resources in parallel (placeholder - to be implemented).
- **Parameters**: `query`, `limit`
- **Features**: Aggregates results from all search tools

Each tool accepts:
- `query` (required): Search string
- `limit` (optional): Max results

Each result includes: `title`, `description`, `url`, `metadata` (e.g., stars, downloads, scores, etc.)

## License
MIT 