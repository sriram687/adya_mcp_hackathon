# BigGo MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to BigGo's product search and price comparison APIs. This server enables AI assistants to search for products, track price history, and compare specifications across different regions.

## Features

- **Product Search**: Search for products across multiple regions with detailed information
- **Price History**: Track price changes over time with graph URLs and raw data
- **Specification Search**: Query product specifications using Elasticsearch indexes
- **Multi-region Support**: Support for different regions (US, TW, IN, etc.)
- **Caching**: Built-in caching with 1-hour TTL for improved performance
- **Error Handling**: Comprehensive error handling for network and API issues

## Installation

1. Clone the repository and navigate to the BigGo MCP Server directory:
```bash
cd adya_mcp_hackathon/mcp_servers/js/servers/BIGGO
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Edit `.env` file with your BigGo API credentials:
```env
BIGGO_MCP_SERVER_CLIENT_ID=your_client_id
BIGGO_MCP_SERVER_CLIENT_SECRET=your_client_secret
BIGGO_MCP_SERVER_REGION=US
BIGGO_MCP_SERVER_SERVER_TYPE=stdio
BIGGO_MCP_SERVER_SSE_PORT=9876
```

## Getting BigGo Credentials

1. Visit [BigGo Developer Portal](https://developer.biggo.com)
2. Create a new application
3. Get your Client ID and Client Secret
4. Add the credentials to your `.env` file

## Usage

### Build and Run

```bash
# Build the project
npm run build

# Start the server
npm start

# Development mode with watch
npm run dev
```

### MCP Client Configuration

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "biggo": {
      "command": "node",
      "args": ["path/to/biggo-mcp-server/build/index.js"],
      "env": {
        "BIGGO_MCP_SERVER_CLIENT_ID": "your_client_id",
        "BIGGO_MCP_SERVER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

#### VSCode

Add to your VSCode settings:

```json
{
  "mcp.servers": {
    "biggo": {
      "command": "node",
      "args": ["path/to/biggo-mcp-server/build/index.js"]
    }
  }
}
```

## Available Tools

### 1. product_search
Search for products using BigGo's API.

**Parameters:**
- `query` (string): Search query for products
- `region` (string, optional): Region for search (e.g., US, TW, IN)
- `limit` (number, optional): Maximum number of results (default: 10, max: 50)

**Example:**
```
"Show me the price of Dyson V11 in India"
```

### 2. price_history_graph
Return BigGo chart URL or raw data for price history.

**Parameters:**
- `productId` (string): Product ID for price history
- `region` (string, optional): Region for price history
- `format` (string, optional): Return format - 'url' or 'data' (default: 'url')

### 3. price_history_with_history_id
Use BigGo internal history_id to get price history.

**Parameters:**
- `historyId` (string): BigGo internal history ID

### 4. price_history_with_url
Extract product history from URL.

**Parameters:**
- `url` (string): Product URL to extract price history from

### 5. spec_indexes
List all available Elasticsearch indexes.

**Parameters:** None

### 6. spec_mapping
Return index mappings with field types.

**Parameters:**
- `indexName` (string): Name of the Elasticsearch index

### 7. spec_search
Query ES with structured specs.

**Parameters:**
- `indexName` (string): Name of the Elasticsearch index to search
- `query` (string): Structured query string (e.g., 'ram: 16GB, water_resistance: high')
- `limit` (number, optional): Maximum number of results (default: 10, max: 100)

**Example:**
```
"Find waterproof smartwatches with AMOLED screen"
```

### 8. get_current_region
Returns region currently active from .env.

**Parameters:** None

## Example Usage Prompts

### Product Search
- "Show me the price of Dyson V11 in India"
- "Find iPhone 15 Pro Max prices in Taiwan"
- "Search for Samsung Galaxy S24 Ultra in US"

### Price History
- "Get price history for product ID 12345"
- "Show me the price chart for this product URL: https://example.com/product"
- "Get price history data for history ID abc123"

### Specification Search
- "Find waterproof smartwatches with AMOLED screen"
- "Search for laptops with 16GB RAM and SSD storage"
- "Find smartphones with 5G support and 128GB storage"

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BIGGO_MCP_SERVER_CLIENT_ID` | Yes | - | BigGo API Client ID |
| `BIGGO_MCP_SERVER_CLIENT_SECRET` | Yes | - | BigGo API Client Secret |
| `BIGGO_MCP_SERVER_REGION` | No | TW | Default region for searches |
| `BIGGO_MCP_SERVER_SERVER_TYPE` | No | stdio | Server type (stdio/sse) |
| `BIGGO_MCP_SERVER_SSE_PORT` | No | 9876 | SSE server port |

## Architecture

The BigGo MCP Server follows a modular architecture:

```
src/
├── index.ts                    # Main server entry point
├── tools/                      # Individual tool implementations
│   ├── product_search.ts
│   ├── price_history_graph.ts
│   ├── price_history_with_history_id.ts
│   ├── price_history_with_url.ts
│   ├── spec_indexes.ts
│   ├── spec_mapping.ts
│   ├── spec_search.ts
│   └── get_current_region.ts
└── utils/                      # Utility modules
    ├── biggo_client.ts         # BigGo API client
    └── cache.ts               # Caching utilities
```

## Error Handling

The server includes comprehensive error handling for:
- Network timeouts
- API rate limiting
- Authentication failures
- Invalid parameters
- Missing environment variables

## Caching

All API responses are cached for 1 hour to improve performance and reduce API calls. Cache keys are generated based on tool parameters and function names.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the BigGo API documentation
2. Verify your credentials are correct
3. Check the server logs for detailed error messages
4. Open an issue in the repository 