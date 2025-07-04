# Wayback Machine MCP Server Features

## Overview
The Wayback Machine MCP Server provides comprehensive tools for interacting with the Internet Archive's Wayback Machine API. This server enables AI assistants to search, retrieve, save, and analyze web archive snapshots.

## Available Tools

### 1. get-wayback-snapshots
**Purpose**: Retrieve the closest snapshot of a URL from the Wayback Machine.

**Parameters**:
- `url` (string, required): The URL to find snapshots for
- `timestamp` (string, optional): Target timestamp in YYYYMMDDHHMMSS format
- `status_code` (string, optional): HTTP status code filter (default: "200")

**Use Cases**:
- Find the closest archived version of a webpage
- Retrieve historical content for research
- Access deleted or changed web content

**Example**:
```json
{
  "url": "https://example.com",
  "timestamp": "20240101000000",
  "status_code": "200"
}
```

### 2. search-wayback-history
**Purpose**: Search the complete archive history for a URL.

**Parameters**:
- `url` (string, required): The URL to search history for
- `limit` (number, optional): Maximum number of results (default: 10, max: 100)
- `collapse` (string, optional): Collapse results by timespan (urlkey, timestamp, original, mimetype, statuscode, digest, length)

**Use Cases**:
- View all available snapshots of a website
- Track changes over time
- Research web evolution and history

**Example**:
```json
{
  "url": "https://example.com",
  "limit": 50,
  "collapse": "timestamp"
}
```

### 3. save-page-now
**Purpose**: Request the Internet Archive to save a page to the Wayback Machine.

**Parameters**:
- `url` (string, required): The URL to archive
- `capture_all` (boolean, optional): Whether to capture embedded resources (default: false)
- `skip_first_archive` (boolean, optional): Skip if already archived today (default: false)

**Use Cases**:
- Archive important content before it disappears
- Create preservation snapshots
- Ensure historical record of web content

**Example**:
```json
{
  "url": "https://example.com/important-article",
  "capture_all": true,
  "skip_first_archive": false
}
```

### 4. get-wayback-stats
**Purpose**: Get statistics about a URL's presence in the archive.

**Parameters**:
- `url` (string, required): The URL to get statistics for

**Use Cases**:
- Understand archive coverage of a website
- Research web preservation statistics
- Analyze archival patterns

**Example**:
```json
{
  "url": "https://example.com"
}
```

### 5. compare-wayback-versions
**Purpose**: Compare two archived versions of a URL.

**Parameters**:
- `url` (string, required): The URL to compare
- `timestamp1` (string, required): First timestamp in YYYYMMDDHHMMSS format
- `timestamp2` (string, required): Second timestamp in YYYYMMDDHHMMSS format

**Use Cases**:
- Track changes between different time periods
- Analyze content evolution
- Research web development patterns
- Compare before/after states

**Example**:
```json
{
  "url": "https://example.com",
  "timestamp1": "20200101000000",
  "timestamp2": "20240101000000"
}
```

## Error Handling

The server includes comprehensive error handling for:
- Invalid URLs
- Network connectivity issues
- API rate limiting
- Invalid timestamp formats
- Non-existent snapshots
- Server timeouts

## Response Formats

All tools return structured JSON responses with:
- Success/error status
- Relevant data (snapshots, statistics, etc.)
- Error messages when applicable
- Metadata about the operation

## Rate Limiting

The server respects Internet Archive API rate limits and includes automatic retry logic with exponential backoff for resilient operation.

## Public API

The Wayback Machine API is public and does not require authentication, making this server immediately usable without credential setup.
