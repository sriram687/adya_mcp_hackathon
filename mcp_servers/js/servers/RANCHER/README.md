# Rancher MCP Server

A Model Context Protocol (MCP) server for managing Rancher Kubernetes clusters. This server provides tools to interact with Rancher's API for cluster management, workload monitoring, and resource administration.

## Features

### Cluster Management
- **list-clusters**: Get all clusters in your Rancher instance
- **get-cluster**: Get detailed information about a specific cluster
- **get-cluster-health**: Check cluster health and node status

### Project & Namespace Management
- **list-projects**: List projects within a cluster
- **list-namespaces**: List namespaces within a project

### Workload Management
- **list-workloads**: Get workloads in a namespace
- **get-workload**: Get detailed workload information

### Node Management
- **list-nodes**: Get all nodes in a cluster with their roles and status

### Resource Management
- **list-secrets**: List secrets in a namespace
- **list-configmaps**: List config maps in a namespace
- **list-services**: List services in a namespace

### Utilities
- **get-rancher-version**: Get Rancher server version and settings

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Configuration

The server requires authentication with your Rancher instance. You can use either:

1. **Token-based authentication** (recommended):
   - Generate an API token in Rancher UI (User Settings → API Keys)
   - Use the `token` parameter in tool calls

2. **Username/password authentication**:
   - Use your Rancher username and password
   - Use the `username` and `password` parameters in tool calls

### Required Parameters

For all tools, you need to provide:
- `rancherUrl`: Your Rancher server URL (e.g., `https://rancher.example.com`)
- Authentication: Either `token` OR (`username` + `password`)

### Optional Parameters

- `skipTlsVerify`: Set to `true` if using self-signed certificates (default: `false`)

## Usage Examples

### List all clusters
```json
{
  "rancherUrl": "https://rancher.example.com",
  "token": "your-api-token"
}
```

### Get cluster health
```json
{
  "rancherUrl": "https://rancher.example.com",
  "clusterId": "c-12345",
  "token": "your-api-token"
}
```

### List workloads in a namespace
```json
{
  "rancherUrl": "https://rancher.example.com",
  "namespaceId": "namespace-12345",
  "token": "your-api-token"
}
```

## Security Considerations

- Store API tokens securely and never commit them to version control
- Use token-based authentication when possible for better security
- Consider using environment variables for sensitive configuration
- Enable TLS verification unless absolutely necessary for development

## API Endpoints

This server interacts with Rancher's v3 API endpoints:
- `/v3/clusters` - Cluster management
- `/v3/projects` - Project management
- `/v3/cluster/namespaces` - Namespace management
- `/v3/project/workloads` - Workload management
- `/v3/nodes` - Node management
- `/v3/project/secrets` - Secret management
- `/v3/project/configmaps` - ConfigMap management
- `/v3/project/services` - Service management

## Error Handling

The server provides detailed error messages for common issues:
- Authentication failures
- Network connectivity problems
- Resource not found errors
- API rate limiting

## Development

To run in development mode with auto-rebuild:
```bash
npm run dev
```

To clean build artifacts:
```bash
npm run clean
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with a real Rancher instance
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
