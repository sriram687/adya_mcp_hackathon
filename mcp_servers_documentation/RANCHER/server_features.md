# Rancher MCP Server Features

## Overview
The Rancher MCP Server provides comprehensive management capabilities for Rancher Kubernetes platform through the Model Context Protocol. It enables users to monitor, manage, and interact with Rancher clusters, projects, namespaces, workloads, and resources.

## Core Features

### 🏗️ Cluster Management
- **List Clusters**: View all clusters with their state, provider, and version information
- **Get Cluster Details**: Retrieve comprehensive information about a specific cluster
- **Cluster Health Monitoring**: Check cluster health status and node availability

### 📁 Project & Namespace Management
- **List Projects**: View all projects within a cluster
- **List Namespaces**: View all namespaces within a project
- **Hierarchical Navigation**: Navigate through cluster → project → namespace hierarchy

### ⚙️ Workload Management
- **List Workloads**: View all workloads (deployments, daemonsets, etc.) in a namespace
- **Get Workload Details**: Retrieve detailed information about specific workloads
- **Replica Monitoring**: Check replica counts and availability status

### 🖥️ Node Management
- **List Nodes**: View all nodes in a cluster
- **Node Health**: Monitor node states and roles (master, worker, etcd)
- **Node Information**: Access IP addresses, hostnames, and Kubernetes versions

### 🔐 Resource Management
- **Secrets Management**: List and monitor secrets in namespaces
- **ConfigMaps**: View configuration maps and their metadata
- **Services**: Monitor Kubernetes services and their types

### 🏥 Monitoring & Health Checks
- **Cluster Health Status**: Real-time cluster health monitoring
- **Node Status Tracking**: Monitor active vs total node counts
- **Resource State Monitoring**: Track states of various Kubernetes resources

### 🔧 Administrative Tools
- **Version Information**: Get Rancher server version and settings
- **Authentication Support**: Token-based and username/password authentication
- **TLS Configuration**: Support for self-signed certificates

## Authentication Methods

### Token-Based Authentication (Recommended)
```json
{
  "rancherUrl": "https://rancher.example.com",
  "token": "your-api-token"
}
```

### Username/Password Authentication
```json
{
  "rancherUrl": "https://rancher.example.com",
  "username": "your-username",
  "password": "your-password"
}
```

## Security Features

- **Secure Token Management**: Support for Rancher API tokens
- **TLS Certificate Handling**: Options for self-signed certificates
- **Error Sanitization**: Secure error handling without credential exposure
- **Authentication Validation**: Proper auth requirement enforcement

## API Coverage

### Rancher v3 API Endpoints
- `/v3/clusters` - Cluster management and monitoring
- `/v3/projects` - Project administration
- `/v3/cluster/namespaces` - Namespace management
- `/v3/project/workloads` - Workload operations
- `/v3/nodes` - Node monitoring and management
- `/v3/project/secrets` - Secret management
- `/v3/project/configmaps` - ConfigMap operations
- `/v3/project/services` - Service management
- `/v3/settings` - Server configuration and version info

## Tool Categories

### Infrastructure Management
1. **list-clusters** - Comprehensive cluster listing
2. **get-cluster** - Detailed cluster information
3. **list-nodes** - Node inventory and status
4. **get-cluster-health** - Health monitoring

### Application Management
1. **list-projects** - Project organization
2. **list-namespaces** - Namespace organization
3. **list-workloads** - Application deployment monitoring
4. **get-workload** - Detailed workload analysis

### Resource Operations
1. **list-secrets** - Secret inventory
2. **list-configmaps** - Configuration management
3. **list-services** - Service discovery

### System Information
1. **get-rancher-version** - System information and version details

## Use Cases

### DevOps Teams
- Monitor cluster health across multiple environments
- Track workload deployments and scaling
- Manage secrets and configurations
- Troubleshoot node and service issues

### Platform Engineers
- Audit cluster resources and configurations
- Monitor resource utilization and states
- Manage multi-tenant project structures
- Maintain cluster inventory

### Site Reliability Engineers
- Health monitoring and alerting
- Capacity planning with node information
- Service discovery and networking oversight
- Incident response and troubleshooting

### Development Teams
- View application deployments and status
- Access logs and configuration information
- Monitor service health and availability
- Debug networking and connectivity issues

## Output Formats

All tools provide structured, human-readable output with:
- **Rich Formatting**: Uses emojis and markdown for clarity
- **Hierarchical Information**: Organized by logical groupings
- **Timestamps**: Human-readable date/time information
- **Status Indicators**: Clear state and health indicators
- **Detailed Metadata**: Comprehensive resource information

## Error Handling

- **Authentication Errors**: Clear guidance on credential issues
- **Network Connectivity**: Detailed error messages for connection problems
- **Resource Not Found**: Specific feedback for missing resources
- **Permission Issues**: Clear indication of access restrictions
- **API Rate Limits**: Handling of Rancher API limitations

## Best Practices

1. **Use API Tokens**: Prefer token authentication over username/password
2. **Monitor Cluster Health**: Regular health checks for proactive management
3. **Resource Organization**: Use project/namespace hierarchy effectively
4. **Security**: Store credentials securely and use TLS verification
5. **Error Handling**: Monitor tool outputs for errors and warnings
