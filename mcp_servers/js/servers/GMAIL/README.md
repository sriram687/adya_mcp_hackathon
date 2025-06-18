# Gmail MCP Server

A Model Context Protocol (MCP) server for Gmail operations, allowing AI assistants to interact with Gmail through a standardized interface.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Google OAuth2 credentials:
   - Go to the Google Cloud Console
   - Create a new project or select an existing one
   - Enable the Gmail API
   - Create OAuth2 credentials
   - Download the credentials and save them as `credentials.json` in the project root

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

## Available Operations

The server supports the following operations:

- `read`: Read emails
- `send`: Send emails
- `search`: Search through emails

## Environment Variables

- `PORT`: The port number to run the server on (default: 3000)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google credentials file

## Development

For development with hot-reloading:
```bash
npm run dev
``` 