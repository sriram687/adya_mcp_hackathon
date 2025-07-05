#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import https from "https";

// ================ INTERFACES ================

interface RancherCluster {
  id: string;
  name: string;
  state: string;
  provider: string;
  version: string;
  description?: string;
  created: string;
  createdBy: string;
}

interface RancherProject {
  id: string;
  name: string;
  clusterId: string;
  description?: string;
  state: string;
  created: string;
}

interface RancherNamespace {
  id: string;
  name: string;
  projectId: string;
  clusterId: string;
  state: string;
  created: string;
}

interface RancherWorkload {
  id: string;
  name: string;
  type: string;
  state: string;
  namespaceId: string;
  image?: string;
  replicas?: number;
  available?: number;
  created: string;
}

interface RancherNode {
  id: string;
  name: string;
  clusterId: string;
  state: string;
  roles: string[];
  version: string;
  ipAddress: string;
  hostname: string;
  created: string;
}

interface RancherSecret {
  id: string;
  name: string;
  namespaceId: string;
  type: string;
  created: string;
}

interface RancherConfigMap {
  id: string;
  name: string;
  namespaceId: string;
  created: string;
}

interface RancherService {
  id: string;
  name: string;
  namespaceId: string;
  type: string;
  state: string;
  created: string;
}

// ================ SERVER SETUP ================

const server = new McpServer({
  name: "rancher",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// ================ HELPER FUNCTIONS ================

// Helper function for making Rancher API requests
async function makeRancherRequest<T>({
  baseUrl,
  endpoint,
  method = 'GET',
  auth,
  data = null,
  params = null,
  skipTlsVerify = false
}: {
  baseUrl: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  auth: { username: string; password: string } | { token: string };
  data?: any;
  params?: Record<string, any> | null;
  skipTlsVerify?: boolean;
}): Promise<T> {
  try {
    const url = new URL(endpoint, baseUrl);
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const config: any = {
      method,
      url: url.toString(),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Handle authentication
    if ('token' in auth) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    } else {
      config.auth = {
        username: auth.username,
        password: auth.password
      };
    }

    // Handle request body
    if (data) {
      config.data = data;
    }

    // Skip TLS verification if requested (for self-signed certificates)
    if (skipTlsVerify) {
      config.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const response = await axios(config);
    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Rancher API error: ${error.response.status} - ${error.response.statusText}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

console.log("✅ Rancher MCP Server initialized");

// ================ CLUSTER MANAGEMENT TOOLS ================

server.tool(
  "list-clusters",
  "Get a list of all Rancher clusters",
  {
    rancherUrl: z.string().url().describe("Rancher server URL (e.g., https://rancher.example.com)"),
    username: z.string().optional().describe("Rancher username (if using basic auth)"),
    password: z.string().optional().describe("Rancher password (if using basic auth)"),
    token: z.string().optional().describe("Rancher API token (alternative to username/password)"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Either provide a token or both username and password for authentication."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherCluster[] }>({
        baseUrl: rancherUrl,
        endpoint: "/v3/clusters",
        auth,
        skipTlsVerify
      });

      const clusters = response.data || [];
      
      if (clusters.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No clusters found in this Rancher instance."
          }]
        };
      }

      const clusterText = clusters.map(cluster => 
        `🏗️ **${cluster.name}** (${cluster.id})\n` +
        `   State: ${cluster.state}\n` +
        `   Provider: ${cluster.provider}\n` +
        `   Version: ${cluster.version}\n` +
        `   Created: ${new Date(cluster.created).toLocaleString()}\n` +
        `   Created By: ${cluster.createdBy}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🏗️ **Rancher Clusters (${clusters.length} total):**\n\n${clusterText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching clusters: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "get-cluster",
  "Get detailed information about a specific cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const cluster = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        auth,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `🏗️ **Cluster Details:**\n\n` +
            `**Name:** ${cluster.name}\n` +
            `**ID:** ${cluster.id}\n` +
            `**State:** ${cluster.state}\n` +
            `**Provider:** ${cluster.provider}\n` +
            `**Version:** ${cluster.version}\n` +
            `**Description:** ${cluster.description || 'No description'}\n` +
            `**Created:** ${new Date(cluster.created).toLocaleString()}\n` +
            `**Created By:** ${cluster.createdBy}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching cluster: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ PROJECT MANAGEMENT TOOLS ================

server.tool(
  "list-projects",
  "Get a list of projects in a cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherProject[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/projects`,
        auth,
        params: { clusterId },
        skipTlsVerify
      });

      const projects = response.data || [];
      
      if (projects.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No projects found in cluster ${clusterId}.`
          }]
        };
      }

      const projectText = projects.map(project => 
        `📁 **${project.name}** (${project.id})\n` +
        `   State: ${project.state}\n` +
        `   Description: ${project.description || 'No description'}\n` +
        `   Created: ${new Date(project.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `📁 **Projects in Cluster ${clusterId} (${projects.length} total):**\n\n${projectText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching projects: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ NAMESPACE MANAGEMENT TOOLS ================

server.tool(
  "list-namespaces",
  "Get a list of namespaces in a project",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    projectId: z.string().describe("Project ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, projectId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherNamespace[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/cluster/namespaces`,
        auth,
        params: { projectId },
        skipTlsVerify
      });

      const namespaces = response.data || [];
      
      if (namespaces.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No namespaces found in project ${projectId}.`
          }]
        };
      }

      const namespaceText = namespaces.map(ns => 
        `🏷️ **${ns.name}** (${ns.id})\n` +
        `   State: ${ns.state}\n` +
        `   Created: ${new Date(ns.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🏷️ **Namespaces in Project ${projectId} (${namespaces.length} total):**\n\n${namespaceText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching namespaces: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ WORKLOAD MANAGEMENT TOOLS ================

server.tool(
  "list-workloads",
  "Get a list of workloads in a namespace",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherWorkload[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/project/workloads`,
        auth,
        params: { namespaceId },
        skipTlsVerify
      });

      const workloads = response.data || [];
      
      if (workloads.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No workloads found in namespace ${namespaceId}.`
          }]
        };
      }

      const workloadText = workloads.map(workload => 
        `⚙️ **${workload.name}** (${workload.type})\n` +
        `   State: ${workload.state}\n` +
        `   Image: ${workload.image || 'N/A'}\n` +
        `   Replicas: ${workload.replicas || 0} (Available: ${workload.available || 0})\n` +
        `   Created: ${new Date(workload.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `⚙️ **Workloads in Namespace ${namespaceId} (${workloads.length} total):**\n\n${workloadText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching workloads: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "get-workload",
  "Get detailed information about a specific workload",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    workloadId: z.string().describe("Workload ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, workloadId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const workload = await makeRancherRequest<RancherWorkload>({
        baseUrl: rancherUrl,
        endpoint: `/v3/project/workloads/${workloadId}`,
        auth,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `⚙️ **Workload Details:**\n\n` +
            `**Name:** ${workload.name}\n` +
            `**ID:** ${workload.id}\n` +
            `**Type:** ${workload.type}\n` +
            `**State:** ${workload.state}\n` +
            `**Namespace:** ${workload.namespaceId}\n` +
            `**Image:** ${workload.image || 'N/A'}\n` +
            `**Replicas:** ${workload.replicas || 0}\n` +
            `**Available:** ${workload.available || 0}\n` +
            `**Created:** ${new Date(workload.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching workload: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ NODE MANAGEMENT TOOLS ================

server.tool(
  "list-nodes",
  "Get a list of nodes in a cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherNode[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/nodes`,
        auth,
        params: { clusterId },
        skipTlsVerify
      });

      const nodes = response.data || [];
      
      if (nodes.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No nodes found in cluster ${clusterId}.`
          }]
        };
      }

      const nodeText = nodes.map(node => 
        `🖥️ **${node.name}** (${node.id})\n` +
        `   State: ${node.state}\n` +
        `   Roles: ${node.roles.join(', ')}\n` +
        `   IP Address: ${node.ipAddress}\n` +
        `   Hostname: ${node.hostname}\n` +
        `   Version: ${node.version}\n` +
        `   Created: ${new Date(node.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🖥️ **Nodes in Cluster ${clusterId} (${nodes.length} total):**\n\n${nodeText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching nodes: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ RESOURCE MANAGEMENT TOOLS ================

server.tool(
  "list-secrets",
  "Get a list of secrets in a namespace",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherSecret[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/project/secrets`,
        auth,
        params: { namespaceId },
        skipTlsVerify
      });

      const secrets = response.data || [];
      
      if (secrets.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No secrets found in namespace ${namespaceId}.`
          }]
        };
      }

      const secretText = secrets.map(secret => 
        `🔐 **${secret.name}** (${secret.id})\n` +
        `   Type: ${secret.type}\n` +
        `   Created: ${new Date(secret.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🔐 **Secrets in Namespace ${namespaceId} (${secrets.length} total):**\n\n${secretText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching secrets: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "list-configmaps",
  "Get a list of config maps in a namespace",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherConfigMap[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/project/configmaps`,
        auth,
        params: { namespaceId },
        skipTlsVerify
      });

      const configMaps = response.data || [];
      
      if (configMaps.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No config maps found in namespace ${namespaceId}.`
          }]
        };
      }

      const configMapText = configMaps.map(cm => 
        `📄 **${cm.name}** (${cm.id})\n` +
        `   Created: ${new Date(cm.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `📄 **Config Maps in Namespace ${namespaceId} (${configMaps.length} total):**\n\n${configMapText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching config maps: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "list-services",
  "Get a list of services in a namespace",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: RancherService[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/project/services`,
        auth,
        params: { namespaceId },
        skipTlsVerify
      });

      const services = response.data || [];
      
      if (services.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No services found in namespace ${namespaceId}.`
          }]
        };
      }

      const serviceText = services.map(service => 
        `🌐 **${service.name}** (${service.id})\n` +
        `   Type: ${service.type}\n` +
        `   State: ${service.state}\n` +
        `   Created: ${new Date(service.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🌐 **Services in Namespace ${namespaceId} (${services.length} total):**\n\n${serviceText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching services: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ CLUSTER MANAGEMENT TOOLS (CRUD) ================

server.tool(
  "create-cluster",
  "Create a new Rancher cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    name: z.string().describe("Cluster name"),
    description: z.string().optional().describe("Cluster description"),
    kubernetesVersion: z.string().optional().describe("Kubernetes version"),
    clusterType: z.string().optional().default("imported").describe("Cluster type (imported, rke, rke2, k3s)"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, name, description, kubernetesVersion, clusterType, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const clusterData = {
        name,
        description,
        type: clusterType,
        ...(kubernetesVersion && { kubernetesVersion })
      };

      const response = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters`,
        method: 'POST',
        auth,
        data: clusterData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Cluster Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Type:** ${clusterType}\n` +
            `**State:** ${response.state}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating cluster: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "update-cluster",
  "Update an existing Rancher cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    name: z.string().optional().describe("New cluster name"),
    description: z.string().optional().describe("New cluster description"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, name, description, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get current cluster
      const currentCluster = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        auth,
        skipTlsVerify
      });

      const updateData = {
        ...currentCluster,
        ...(name && { name }),
        ...(description && { description })
      };

      const response = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        method: 'PUT',
        auth,
        data: updateData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Cluster Updated Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**State:** ${response.state}\n` +
            `**Description:** ${response.description || 'None'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error updating cluster: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "delete-cluster",
  "Delete a Rancher cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get cluster details before deletion
      const cluster = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        auth,
        skipTlsVerify
      });

      await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        method: 'DELETE',
        auth,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `🗑️ **Cluster Deletion Initiated!**\n\n` +
            `**Cluster:** ${cluster.name} (${cluster.id})\n` +
            `**Status:** Deletion in progress\n\n` +
            `⚠️ **Warning:** This action cannot be undone. All workloads and data in this cluster will be permanently deleted.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error deleting cluster: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ PROJECT MANAGEMENT TOOLS (CRUD) ================

server.tool(
  "create-project",
  "Create a new project in a cluster",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    name: z.string().describe("Project name"),
    description: z.string().optional().describe("Project description"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, name, description, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const projectData = {
        name,
        clusterId,
        description
      };

      const response = await makeRancherRequest<RancherProject>({
        baseUrl: rancherUrl,
        endpoint: `/v3/projects`,
        method: 'POST',
        auth,
        data: projectData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Project Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Cluster:** ${response.clusterId}\n` +
            `**State:** ${response.state}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating project: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "update-project",
  "Update an existing project",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    projectId: z.string().describe("Project ID"),
    name: z.string().optional().describe("New project name"),
    description: z.string().optional().describe("New project description"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, projectId, name, description, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get current project
      const currentProject = await makeRancherRequest<RancherProject>({
        baseUrl: rancherUrl,
        endpoint: `/v3/projects/${projectId}`,
        auth,
        skipTlsVerify
      });

      const updateData = {
        ...currentProject,
        ...(name && { name }),
        ...(description && { description })
      };

      const response = await makeRancherRequest<RancherProject>({
        baseUrl: rancherUrl,
        endpoint: `/v3/projects/${projectId}`,
        method: 'PUT',
        auth,
        data: updateData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Project Updated Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Cluster:** ${response.clusterId}\n` +
            `**State:** ${response.state}\n` +
            `**Description:** ${response.description || 'None'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error updating project: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "delete-project",
  "Delete a project",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    projectId: z.string().describe("Project ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, projectId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get project details before deletion
      const project = await makeRancherRequest<RancherProject>({
        baseUrl: rancherUrl,
        endpoint: `/v3/projects/${projectId}`,
        auth,
        skipTlsVerify
      });

      await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/projects/${projectId}`,
        method: 'DELETE',
        auth,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `🗑️ **Project Deletion Initiated!**\n\n` +
            `**Project:** ${project.name} (${project.id})\n` +
            `**Status:** Deletion in progress\n\n` +
            `⚠️ **Warning:** This will delete all namespaces and resources in this project.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error deleting project: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ NAMESPACE MANAGEMENT TOOLS (CRUD) ================

server.tool(
  "create-namespace",
  "Create a new namespace in a project",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    projectId: z.string().describe("Project ID"),
    name: z.string().describe("Namespace name"),
    description: z.string().optional().describe("Namespace description"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, projectId, name, description, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const namespaceData = {
        name,
        projectId,
        description
      };

      const response = await makeRancherRequest<RancherNamespace>({
        baseUrl: rancherUrl,
        endpoint: `/v3/namespaces`,
        method: 'POST',
        auth,
        data: namespaceData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Namespace Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Project:** ${response.projectId}\n` +
            `**State:** ${response.state}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating namespace: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "delete-namespace",
  "Delete a namespace",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get namespace details before deletion
      const namespace = await makeRancherRequest<RancherNamespace>({
        baseUrl: rancherUrl,
        endpoint: `/v3/namespaces/${namespaceId}`,
        auth,
        skipTlsVerify
      });

      await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/namespaces/${namespaceId}`,
        method: 'DELETE',
        auth,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `🗑️ **Namespace Deletion Initiated!**\n\n` +
            `**Namespace:** ${namespace.name} (${namespace.id})\n` +
            `**Status:** Deletion in progress\n\n` +
            `⚠️ **Warning:** This will delete all resources in this namespace.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error deleting namespace: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ CLUSTER HEALTH & MONITORING TOOLS ================

server.tool(
  "get-cluster-health",
  "Get cluster health status and metrics",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get cluster details
      const cluster = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        auth,
        skipTlsVerify
      });

      // Get nodes for health check
      const nodesResponse = await makeRancherRequest<{ data: RancherNode[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/nodes`,
        auth,
        params: { clusterId },
        skipTlsVerify
      });

      const nodes = nodesResponse.data || [];
      const healthyNodes = nodes.filter(node => node.state === 'active').length;
      const totalNodes = nodes.length;

      return {
        content: [{
          type: "text",
          text: `🏥 **Cluster Health Status:**\n\n` +
            `**Cluster:** ${cluster.name} (${cluster.id})\n` +
            `**Overall State:** ${cluster.state}\n` +
            `**Kubernetes Version:** ${cluster.version}\n` +
            `**Node Health:** ${healthyNodes}/${totalNodes} nodes active\n` +
            `**Provider:** ${cluster.provider}\n\n` +
            `**Node Details:**\n` +
            nodes.map(node => 
              `  • ${node.name}: ${node.state} (${node.roles.join(', ')})`
            ).join('\n')
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching cluster health: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "get-cluster-events",
  "Get cluster events and logs",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    limit: z.number().optional().default(50).describe("Maximum number of events to return"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, limit, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const eventsResponse = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/events`,
        auth,
        params: { clusterId, limit },
        skipTlsVerify
      });

      const events = eventsResponse.data || [];
      
      if (events.length === 0) {
        return {
          content: [{
            type: "text",
            text: `📋 **No events found for cluster ${clusterId}.**`
          }]
        };
      }

      const eventText = events.slice(0, limit).map(event => 
        `⏰ **${new Date(event.created).toLocaleString()}**\n` +
        `   Type: ${event.type || 'Unknown'}\n` +
        `   Source: ${event.source || 'Unknown'}\n` +
        `   Message: ${event.message || 'No message'}\n` +
        `   Reason: ${event.reason || 'No reason'}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `📋 **Cluster Events (${events.length} total, showing ${Math.min(limit, events.length)}):**\n\n${eventText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching cluster events: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "get-cluster-metrics",
  "Get cluster resource usage metrics",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get cluster details
      const cluster = await makeRancherRequest<RancherCluster>({
        baseUrl: rancherUrl,
        endpoint: `/v3/clusters/${clusterId}`,
        auth,
        skipTlsVerify
      });

      // Get nodes for resource calculation
      const nodesResponse = await makeRancherRequest<{ data: RancherNode[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/nodes`,
        auth,
        params: { clusterId },
        skipTlsVerify
      });

      const nodes = nodesResponse.data || [];
      
      // Get workloads for resource usage
      const workloadsResponse = await makeRancherRequest<{ data: RancherWorkload[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/workloads`,
        auth,
        params: { clusterId },
        skipTlsVerify
      });

      const workloads = workloadsResponse.data || [];
      const totalWorkloads = workloads.length;
      const runningWorkloads = workloads.filter(w => w.state === 'active').length;
      const totalReplicas = workloads.reduce((sum, w) => sum + (w.replicas || 0), 0);
      const availableReplicas = workloads.reduce((sum, w) => sum + (w.available || 0), 0);

      return {
        content: [{
          type: "text",
          text: `📊 **Cluster Resource Metrics:**\n\n` +
            `**Cluster:** ${cluster.name} (${cluster.id})\n` +
            `**Total Nodes:** ${nodes.length}\n` +
            `**Active Nodes:** ${nodes.filter(n => n.state === 'active').length}\n` +
            `**Total Workloads:** ${totalWorkloads}\n` +
            `**Running Workloads:** ${runningWorkloads}\n` +
            `**Total Replicas:** ${totalReplicas}\n` +
            `**Available Replicas:** ${availableReplicas}\n` +
            `**Replica Availability:** ${totalReplicas > 0 ? Math.round((availableReplicas / totalReplicas) * 100) : 0}%\n\n` +
            `**Node Breakdown:**\n` +
            nodes.map(node => 
              `  • ${node.name}: ${node.state} (${node.roles.join(', ')})`
            ).join('\n')
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching cluster metrics: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ UTILITY TOOLS ================

server.tool(
  "get-rancher-version",
  "Get Rancher server version and settings",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const settings = await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/settings`,
        auth,
        skipTlsVerify
      });

      // Look for version-related settings
      const versionSettings = settings.data?.filter((setting: any) => 
        setting.name?.includes('version') || setting.name?.includes('release')
      ) || [];

      let versionInfo = "**Rancher Server Information:**\n\n";
      
      if (versionSettings.length > 0) {
        versionInfo += versionSettings.map((setting: any) => 
          `**${setting.name}:** ${setting.value || 'Not set'}`
        ).join('\n');
      } else {
        versionInfo += "Version information not available through settings API.";
      }

      return {
        content: [{
          type: "text",
          text: versionInfo
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching Rancher version: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ SECURITY & RBAC TOOLS ================

server.tool(
  "list-users",
  "List all users in Rancher",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/users`,
        auth,
        skipTlsVerify
      });

      const users = response.data || [];
      
      if (users.length === 0) {
        return {
          content: [{
            type: "text",
            text: `👥 **No users found.**`
          }]
        };
      }

      const userText = users.map(user => 
        `👤 **${user.name || user.username}** (${user.id})\n` +
        `   Username: ${user.username}\n` +
        `   Principal: ${user.principalIds?.[0] || 'None'}\n` +
        `   Enabled: ${user.enabled ? 'Yes' : 'No'}\n` +
        `   Created: ${new Date(user.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `👥 **Users (${users.length} total):**\n\n${userText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching users: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "list-roles",
  "List all roles and permissions",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/roles`,
        auth,
        skipTlsVerify
      });

      const roles = response.data || [];
      
      if (roles.length === 0) {
        return {
          content: [{
            type: "text",
            text: `🔐 **No roles found.**`
          }]
        };
      }

      const roleText = roles.map(role => 
        `🔐 **${role.name}** (${role.id})\n` +
        `   Context: ${role.context || 'Global'}\n` +
        `   Built-in: ${role.builtin ? 'Yes' : 'No'}\n` +
        `   Rules: ${role.rules?.length || 0} permission rules\n` +
        `   Created: ${new Date(role.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🔐 **Roles (${roles.length} total):**\n\n${roleText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching roles: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "list-role-bindings",
  "List role bindings (user-role assignments)",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().optional().describe("Cluster ID to filter by"),
    projectId: z.string().optional().describe("Project ID to filter by"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, projectId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const params: Record<string, any> = {};
      if (clusterId) params.clusterId = clusterId;
      if (projectId) params.projectId = projectId;

      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/rolebindings`,
        auth,
        params,
        skipTlsVerify
      });

      const bindings = response.data || [];
      
      if (bindings.length === 0) {
        return {
          content: [{
            type: "text",
            text: `🔗 **No role bindings found.**`
          }]
        };
      }

      const bindingText = bindings.map(binding => 
        `🔗 **${binding.name}** (${binding.id})\n` +
        `   Role: ${binding.roleTemplateId || 'Unknown'}\n` +
        `   User: ${binding.userId || 'Unknown'}\n` +
        `   Subject: ${binding.subjectName || 'Unknown'}\n` +
        `   Created: ${new Date(binding.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🔗 **Role Bindings (${bindings.length} total):**\n\n${bindingText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching role bindings: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "create-user",
  "Create a new user in Rancher",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    username: z.string().describe("New user's username"),
    password: z.string().describe("New user's password"),
    name: z.string().describe("New user's display name"),
    email: z.string().optional().describe("New user's email"),
    adminUsername: z.string().optional().describe("Admin username"),
    adminPassword: z.string().optional().describe("Admin password"),
    token: z.string().optional().describe("Admin API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, username: newUsername, password: newPassword, name, email, adminUsername, adminPassword, token, skipTlsVerify }) => {
    try {
      if (!token && (!adminUsername || !adminPassword)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Admin authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: adminUsername!, password: adminPassword! };
      
      const userData = {
        username: newUsername,
        password: newPassword,
        name,
        email,
        enabled: true
      };

      const response = await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/users`,
        method: 'POST',
        auth,
        data: userData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **User Created Successfully!**\n\n` +
            `**Username:** ${response.username}\n` +
            `**Name:** ${response.name}\n` +
            `**Email:** ${response.email || 'Not provided'}\n` +
            `**ID:** ${response.id}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating user: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ WORKLOAD MANAGEMENT TOOLS (CRUD) ================

server.tool(
  "create-deployment",
  "Create a new deployment workload",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    name: z.string().describe("Deployment name"),
    image: z.string().describe("Container image (e.g., nginx:latest)"),
    replicas: z.number().optional().default(1).describe("Number of replicas"),
    port: z.number().optional().describe("Container port"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, name, image, replicas, port, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const deploymentData = {
        name,
        namespaceId,
        type: "deployment",
        scale: replicas,
        containers: [{
          name,
          image,
          ...(port && { 
            ports: [{ 
              containerPort: port, 
              protocol: "TCP" 
            }] 
          })
        }]
      };

      const response = await makeRancherRequest<RancherWorkload>({
        baseUrl: rancherUrl,
        endpoint: `/v3/workloads`,
        method: 'POST',
        auth,
        data: deploymentData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Deployment Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Type:** ${response.type}\n` +
            `**Image:** ${image}\n` +
            `**Replicas:** ${replicas}\n` +
            `**Namespace:** ${response.namespaceId}\n` +
            `**State:** ${response.state}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating deployment: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "scale-workload",
  "Scale a workload up or down",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    workloadId: z.string().describe("Workload ID"),
    replicas: z.number().describe("New number of replicas"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, workloadId, replicas, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get current workload
      const currentWorkload = await makeRancherRequest<RancherWorkload>({
        baseUrl: rancherUrl,
        endpoint: `/v3/workloads/${workloadId}`,
        auth,
        skipTlsVerify
      });

      const updateData = {
        ...currentWorkload,
        scale: replicas
      };

      const response = await makeRancherRequest<RancherWorkload>({
        baseUrl: rancherUrl,
        endpoint: `/v3/workloads/${workloadId}`,
        method: 'PUT',
        auth,
        data: updateData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `🔄 **Workload Scaled Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Type:** ${response.type}\n` +
            `**New Replicas:** ${replicas}\n` +
            `**Previous Replicas:** ${currentWorkload.replicas || 'Unknown'}\n` +
            `**State:** ${response.state}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error scaling workload: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "delete-workload",
  "Delete a workload",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    workloadId: z.string().describe("Workload ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, workloadId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Get workload details before deletion
      const workload = await makeRancherRequest<RancherWorkload>({
        baseUrl: rancherUrl,
        endpoint: `/v3/workloads/${workloadId}`,
        auth,
        skipTlsVerify
      });

      await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/workloads/${workloadId}`,
        method: 'DELETE',
        auth,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `🗑️ **Workload Deletion Initiated!**\n\n` +
            `**Workload:** ${workload.name} (${workload.id})\n` +
            `**Type:** ${workload.type}\n` +
            `**Status:** Deletion in progress\n\n` +
            `⚠️ **Warning:** This will terminate all pods and remove the workload permanently.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error deleting workload: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ RESOURCE MANAGEMENT TOOLS (CRUD) ================

server.tool(
  "create-secret",
  "Create a new secret",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    name: z.string().describe("Secret name"),
    type: z.string().optional().default("Opaque").describe("Secret type (Opaque, kubernetes.io/tls, etc.)"),
    data: z.record(z.string()).describe("Secret data as key-value pairs"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, name, type, data, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      // Base64 encode the data
      const encodedData: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        encodedData[key] = Buffer.from(value).toString('base64');
      }

      const secretData = {
        name,
        namespaceId,
        type,
        data: encodedData
      };

      const response = await makeRancherRequest<RancherSecret>({
        baseUrl: rancherUrl,
        endpoint: `/v3/secrets`,
        method: 'POST',
        auth,
        data: secretData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Secret Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Type:** ${response.type}\n` +
            `**Namespace:** ${response.namespaceId}\n` +
            `**Keys:** ${Object.keys(data).join(', ')}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating secret: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "create-configmap",
  "Create a new ConfigMap",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    name: z.string().describe("ConfigMap name"),
    data: z.record(z.string()).describe("ConfigMap data as key-value pairs"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, name, data, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{

            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const configMapData = {
        name,
        namespaceId,
        data
      };

      const response = await makeRancherRequest<RancherConfigMap>({
        baseUrl: rancherUrl,
        endpoint: `/v3/configmaps`,
        method: 'POST',
        auth,
        data: configMapData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **ConfigMap Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Namespace:** ${response.namespaceId}\n` +
            `**Keys:** ${Object.keys(data).join(', ')}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating ConfigMap: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "create-service",
  "Create a new Kubernetes service",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    namespaceId: z.string().describe("Namespace ID"),
    name: z.string().describe("Service name"),
    type: z.string().optional().default("ClusterIP").describe("Service type (ClusterIP, NodePort, LoadBalancer)"),
    port: z.number().describe("Service port"),
    targetPort: z.number().describe("Target port on pods"),
    selector: z.record(z.string()).describe("Pod selector labels"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, namespaceId, name, type, port, targetPort, selector, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const serviceData = {
        name,
        namespaceId,
        type,
        ports: [{
          port,
          targetPort,
          protocol: "TCP"
        }],
        selector
      };

      const response = await makeRancherRequest<RancherService>({
        baseUrl: rancherUrl,
        endpoint: `/v3/services`,
        method: 'POST',
        auth,
        data: serviceData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Service Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Type:** ${response.type}\n` +
            `**Port:** ${port} → ${targetPort}\n` +
            `**Namespace:** ${response.namespaceId}\n` +
            `**Selector:** ${Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(', ')}\n` +
            `**State:** ${response.state}\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating service: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ MONITORING & ALERT TOOLS ================

server.tool(
  "list-alerts",
  "List active alerts and notifications",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().optional().describe("Cluster ID to filter alerts"),
    state: z.string().optional().describe("Alert state (active, pending, resolved)"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, state, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const params: Record<string, any> = {};
      if (clusterId) params.clusterId = clusterId;
      if (state) params.state = state;

      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/alerts`,
        auth,
        params,
        skipTlsVerify
      });

      const alerts = response.data || [];
      
      if (alerts.length === 0) {
        return {
          content: [{
            type: "text",
            text: `🚨 **No alerts found.**`
          }]
        };
      }

      const alertText = alerts.map(alert => 
        `🚨 **${alert.name || 'Unnamed Alert'}** (${alert.id})\n` +
        `   State: ${alert.state || 'Unknown'}\n` +
        `   Severity: ${alert.severity || 'Unknown'}\n` +
        `   Message: ${alert.message || 'No message'}\n` +
        `   Cluster: ${alert.clusterId || 'Unknown'}\n` +
        `   Created: ${new Date(alert.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🚨 **Alerts (${alerts.length} total):**\n\n${alertText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching alerts: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "get-audit-logs",
  "Get audit logs for security monitoring",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().optional().describe("Cluster ID to filter logs"),
    limit: z.number().optional().default(100).describe("Maximum number of logs to return"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, limit, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const params: Record<string, any> = { limit };
      if (clusterId) params.clusterId = clusterId;

      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/auditlogs`,
        auth,
        params,
        skipTlsVerify
      });

      const logs = response.data || [];
      
      if (logs.length === 0) {
        return {
          content: [{
            type: "text",
            text: `📋 **No audit logs found.**`
          }]
        };
      }

      const logText = logs.slice(0, limit).map(log => 
        `📋 **${new Date(log.created).toLocaleString()}**\n` +
        `   User: ${log.userId || 'System'}\n` +
        `   Action: ${log.verb || 'Unknown'}\n` +
        `   Resource: ${log.objectRef?.resource || 'Unknown'}\n` +
        `   Namespace: ${log.objectRef?.namespace || 'N/A'}\n` +
        `   Response: ${log.responseStatus?.code || 'Unknown'}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `📋 **Audit Logs (${logs.length} total, showing ${Math.min(limit, logs.length)}):**\n\n${logText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching audit logs: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ BACKUP & DISASTER RECOVERY TOOLS ================

server.tool(
  "list-backups",
  "List cluster backups",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/etcdbackups`,
        auth,
        params: { clusterId },
        skipTlsVerify
      });

      const backups = response.data || [];
      
      if (backups.length === 0) {
        return {
          content: [{
            type: "text",
            text: `💾 **No backups found for cluster ${clusterId}.**`
          }]
        };
      }

      const backupText = backups.map(backup => 
        `💾 **${backup.name}** (${backup.id})\n` +
        `   State: ${backup.state || 'Unknown'}\n` +
        `   Size: ${backup.size || 'Unknown'}\n` +
        `   Created: ${new Date(backup.created).toLocaleString()}\n` +
        `   Manual: ${backup.manual ? 'Yes' : 'No'}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `💾 **Cluster Backups (${backups.length} total):**\n\n${backupText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching backups: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "create-backup",
  "Create a manual backup of cluster etcd",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    clusterId: z.string().describe("Cluster ID"),
    name: z.string().optional().describe("Backup name"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, clusterId, name, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const backupData = {
        name: name || `manual-backup-${new Date().toISOString().split('T')[0]}`,
        clusterId,
        manual: true
      };

      const response = await makeRancherRequest<any>({
        baseUrl: rancherUrl,
        endpoint: `/v3/etcdbackups`,
        method: 'POST',
        auth,
        data: backupData,
        skipTlsVerify
      });

      return {
        content: [{
          type: "text",
          text: `✅ **Backup Created Successfully!**\n\n` +
            `**Name:** ${response.name}\n` +
            `**ID:** ${response.id}\n` +
            `**Cluster:** ${response.clusterId}\n` +
            `**State:** ${response.state}\n` +
            `**Type:** Manual\n` +
            `**Created:** ${new Date(response.created).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error creating backup: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ CATALOG & APP MANAGEMENT TOOLS ================

server.tool(
  "list-catalogs",
  "List available application catalogs",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/catalogs`,
        auth,
        skipTlsVerify
      });

      const catalogs = response.data || [];
      
      if (catalogs.length === 0) {
        return {
          content: [{
            type: "text",
            text: `📚 **No catalogs found.**`
          }]
        };
      }

      const catalogText = catalogs.map(catalog => 
        `📚 **${catalog.name}** (${catalog.id})\n` +
        `   URL: ${catalog.url || 'Unknown'}\n` +
        `   Branch: ${catalog.branch || 'master'}\n` +
        `   State: ${catalog.state || 'Unknown'}\n` +
        `   Kind: ${catalog.kind || 'Unknown'}\n` +
        `   Created: ${new Date(catalog.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `📚 **Application Catalogs (${catalogs.length} total):**\n\n${catalogText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching catalogs: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

server.tool(
  "list-apps",
  "List deployed applications",
  {
    rancherUrl: z.string().url().describe("Rancher server URL"),
    projectId: z.string().optional().describe("Project ID to filter apps"),
    username: z.string().optional().describe("Rancher username"),
    password: z.string().optional().describe("Rancher password"),
    token: z.string().optional().describe("Rancher API token"),
    skipTlsVerify: z.boolean().optional().default(false).describe("Skip TLS certificate verification"),
  },
  async ({ rancherUrl, projectId, username, password, token, skipTlsVerify }) => {
    try {
      if (!token && (!username || !password)) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Authentication required."
          }]
        };
      }

      const auth = token ? { token } : { username: username!, password: password! };
      
      const params: Record<string, any> = {};
      if (projectId) params.projectId = projectId;

      const response = await makeRancherRequest<{ data: any[] }>({
        baseUrl: rancherUrl,
        endpoint: `/v3/apps`,
        auth,
        params,
        skipTlsVerify
      });

      const apps = response.data || [];
      
      if (apps.length === 0) {
        return {
          content: [{
            type: "text",
            text: `🚀 **No applications found.**`
          }]
        };
      }

      const appText = apps.map(app => 
        `🚀 **${app.name}** (${app.id})\n` +
        `   State: ${app.state || 'Unknown'}\n` +
        `   Template: ${app.externalId || 'Unknown'}\n` +
        `   Version: ${app.templateVersion || 'Unknown'}\n` +
        `   Namespace: ${app.targetNamespace || 'Unknown'}\n` +
        `   Created: ${new Date(app.created).toLocaleString()}`
      ).join('\n\n');

      return {
        content: [{
          type: "text",
          text: `🚀 **Deployed Applications (${apps.length} total):**\n\n${appText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error fetching applications: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// ================ SERVER INITIALIZATION ================

// Start the server
async function runServer() {
  console.log("✅ Rancher MCP Server initialized");
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("🔗 Rancher MCP Server connected and ready");
}

runServer().catch((error) => {
  console.error("❌ Failed to run Rancher MCP server:", error);
  process.exit(1);
});
