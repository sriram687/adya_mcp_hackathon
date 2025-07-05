# Rancher MCP Server Credentials Setup

## Overview
The Rancher MCP Server supports two authentication methods to connect to your Rancher instance. Choose the method that best fits your security requirements and infrastructure setup.

## Authentication Methods

### Method 1: API Token Authentication (Recommended)

API tokens provide better security and are the recommended authentication method for production environments.

#### Creating an API Token

1. **Login to Rancher UI**
   - Access your Rancher dashboard at `https://your-rancher-domain.com`
   - Login with your administrator or user credentials

2. **Navigate to API Keys**
   - Click on your profile icon in the top-right corner
   - Select "API & Keys" from the dropdown menu

3. **Create a New Token**
   - Click "Add Key" button
   - Provide a description (e.g., "MCP Server Token")
   - Set expiration date (optional but recommended)
   - Select appropriate scope:
     - **No Scope**: Full access (use with caution)
     - **Specific Cluster**: Limit access to specific clusters
     - **Specific Project**: Limit access to specific projects

4. **Save the Token**
   - Copy the generated token immediately
   - Store it securely (you won't be able to see it again)
   - The token format looks like: `token-12345:abcdef1234567890abcdef1234567890`

#### Using API Token in MCP Calls

```json
{
  "rancherUrl": "https://rancher.example.com",
  "token": "token-12345:abcdef1234567890abcdef1234567890"
}
```

### Method 2: Username/Password Authentication

Use this method for development or when API tokens are not available.

#### Requirements
- Valid Rancher username
- Corresponding password
- Appropriate permissions for the operations you want to perform

#### Using Username/Password in MCP Calls

```json
{
  "rancherUrl": "https://rancher.example.com",
  "username": "your-username",
  "password": "your-password"
}
```

## Permission Requirements

### Minimum Required Permissions

For the MCP server to function properly, the authenticated user/token needs these permissions:

#### Cluster Level
- **View Clusters**: Read access to cluster information
- **View Nodes**: Read access to node information and status

#### Project Level
- **View Projects**: Read access to project information
- **View Namespaces**: Read access to namespace information

#### Namespace Level
- **View Workloads**: Read access to deployments, pods, services
- **View Config**: Read access to configmaps and secrets
- **View Services**: Read access to service information

### Recommended Permission Levels

#### For Monitoring/Read-Only Use
- **Cluster Member**: Provides read access to cluster resources
- **Project Member**: Provides read access to project resources

#### For Management Operations
- **Cluster Owner**: Full access to cluster and all projects within
- **Project Owner**: Full access to specific projects and their resources

## Security Best Practices

### API Token Security
1. **Use Scoped Tokens**: Limit token scope to specific clusters/projects when possible
2. **Set Expiration Dates**: Regularly rotate tokens by setting expiration dates
3. **Store Securely**: Never commit tokens to version control
4. **Environment Variables**: Use environment variables for token storage
5. **Monitor Usage**: Regularly audit token usage in Rancher logs

### Network Security
1. **Use HTTPS**: Always use HTTPS for Rancher connections
2. **TLS Verification**: Enable TLS verification unless using self-signed certificates
3. **Network Isolation**: Restrict network access to Rancher API endpoints
4. **Firewall Rules**: Configure appropriate firewall rules for API access

### Access Control
1. **Principle of Least Privilege**: Grant minimum required permissions
2. **Regular Audits**: Periodically review user permissions and token usage
3. **Role-Based Access**: Use Rancher's RBAC features effectively
4. **Session Management**: Monitor and manage active sessions

## Environment Configuration

### Using Environment Variables

Create a `.env` file (never commit to version control):

```bash
# Rancher Configuration
RANCHER_URL=https://rancher.example.com
RANCHER_TOKEN=token-12345:abcdef1234567890abcdef1234567890

# Alternative: Username/Password
# RANCHER_USERNAME=your-username
# RANCHER_PASSWORD=your-password

# TLS Configuration
RANCHER_SKIP_TLS_VERIFY=false
```

### Docker Environment

When running in Docker:

```bash
docker run -e RANCHER_URL=https://rancher.example.com \
           -e RANCHER_TOKEN=your-token \
           rancher-mcp-server
```

## Self-Signed Certificates

If your Rancher instance uses self-signed certificates:

### Option 1: Skip TLS Verification (Development Only)
```json
{
  "rancherUrl": "https://rancher.example.com",
  "token": "your-token",
  "skipTlsVerify": true
}
```

### Option 2: Add Certificate to Trust Store (Recommended)
1. Obtain the certificate from your Rancher instance
2. Add it to your system's trust store
3. Use normal TLS verification

## Troubleshooting Authentication

### Common Issues

#### 1. "Unauthorized" Error (401)
- **Cause**: Invalid credentials or expired token
- **Solution**: Verify token/credentials and check expiration

#### 2. "Forbidden" Error (403)
- **Cause**: Insufficient permissions
- **Solution**: Check user/token permissions in Rancher

#### 3. "Connection Refused" or Network Errors
- **Cause**: Network connectivity or firewall issues
- **Solution**: Verify Rancher URL and network connectivity

#### 4. TLS/SSL Certificate Errors
- **Cause**: Self-signed certificates or certificate issues
- **Solution**: Use `skipTlsVerify: true` or add certificate to trust store

### Testing Connectivity

Test your credentials with a simple curl command:

```bash
# With Token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://rancher.example.com/v3/clusters

# With Username/Password
curl -u "username:password" \
     https://rancher.example.com/v3/clusters
```

### Debug Mode

Enable debug mode to see detailed HTTP requests:

```bash
export DEBUG=1
npm start
```

## Multiple Rancher Instances

If you manage multiple Rancher instances:

1. **Separate Tokens**: Create different tokens for each instance
2. **Clear Naming**: Use descriptive names in token descriptions
3. **Environment Segregation**: Use different environment configurations
4. **Tool Calls**: Specify the correct `rancherUrl` for each call

## Token Rotation

Implement a token rotation strategy:

1. **Set Expiration**: Always set expiration dates on tokens
2. **Advance Creation**: Create new tokens before old ones expire
3. **Gradual Migration**: Update services gradually with new tokens
4. **Monitoring**: Monitor for authentication failures during rotation
5. **Cleanup**: Remove old tokens after successful rotation
