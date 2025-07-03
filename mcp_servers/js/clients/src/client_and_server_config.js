"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServersConfig = exports.ClientsConfig = void 0;
exports.ClientsConfig = [
    "MCP_CLIENT_OPENAI",
    "MCP_CLIENT_AZURE_AI",
    "MCP_CLIENT_GEMINI",
    // "CLAUDE",
];
exports.ServersConfig = [
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
    }
];
