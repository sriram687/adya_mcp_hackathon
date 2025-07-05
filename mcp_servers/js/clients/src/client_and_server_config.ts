export const ClientsConfig:any = [
    "MCP_CLIENT_OPENAI",
    "MCP_CLIENT_AZURE_AI",
    "MCP_CLIENT_GEMINI",
    // "CLAUDE",
]

export const ServersConfig: any = [
  {
    server_name: "WORDPRESS",
    server_features_and_capability: "WORDPRESS",
    path: "build/index.js", // WordPress build
  },
  {
    server_name: "PINTEREST", // Pinterest build
    server_features_and_capability: "PINTEREST",
    path: "build/index.js", // same structure
  },
  {
    server_name: "WAYBACK",
    server_features_and_capability: "WAYBACK",
    path: "build/index.js", // Wayback Machine build
  },
  {
    server_name: "RANCHER",
    server_features_and_capability: "RANCHER",
    path: "build/index.js", // Rancher build
  }
];

