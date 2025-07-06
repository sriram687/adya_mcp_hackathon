// TODO: Implement PyPI search tool
// Will follow the same pattern as search_github.ts
// Uses PyPI JSON API with proper error handling and caching

import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// PyPI API response interfaces
interface PyPIPackage {
  info: {
    name: string;
    version: string;
    summary: string;
    description: string;
    author: string;
    author_email: string;
    maintainer: string;
    maintainer_email: string;
    home_page: string;
    download_url: string;
    platform: string[];
    requires_python: string;
    license: string;
    keywords: string[];
    classifiers: string[];
    project_urls: Record<string, string>;
    requires_dist: string[];
    provides_dist: string[];
    obsoletes_dist: string[];
  };
  releases: {
    [version: string]: Array<{
      filename: string;
      size: number;
      upload_time: string;
      url: string;
      python_version: string;
      md5_digest: string;
      sha256_digest: string;
      packagetype: string;
    }>;
  };
  urls: Array<{
    filename: string;
    size: number;
    upload_time: string;
    url: string;
    python_version: string;
    md5_digest: string;
    sha256_digest: string;
    packagetype: string;
  }>;
  last_serial: number;
}

interface PyPISearchResponse {
  info: {
    name: string;
    version: string;
    summary: string;
    description: string;
    author: string;
    author_email: string;
    maintainer: string;
    maintainer_email: string;
    home_page: string;
    download_url: string;
    platform: string[];
    requires_python: string;
    license: string;
    keywords: string[];
    classifiers: string[];
    project_urls: Record<string, string>;
    requires_dist: string[];
    provides_dist: string[];
    obsoletes_dist: string[];
  };
  releases: {
    [version: string]: Array<{
      filename: string;
      size: number;
      upload_time: string;
      url: string;
      python_version: string;
      md5_digest: string;
      sha256_digest: string;
      packagetype: string;
    }>;
  };
  urls: Array<{
    filename: string;
    size: number;
    upload_time: string;
    url: string;
    python_version: string;
    md5_digest: string;
    sha256_digest: string;
    packagetype: string;
  }>;
  last_serial: number;
}

// PyPI search tool implementation
export function createPyPISearchTool(server: any) {
  server.tool(
    "search_pypi",
    "Search PyPI packages using the PyPI JSON API",
    {
      query: z.string().describe("Search query for PyPI packages"),
      limit: z.number().min(1).max(100).optional().default(10).describe("Maximum number of results to return"),
      sort: z.enum(["name", "version", "created", "updated"]).optional().default("name").describe("Sort order for results"),
    },
    async ({ query, limit, sort }: {
      query: string;
      limit: number;
      sort: string;
    }) => {
      try {
        // Create cache key
        const cacheKey = `pypi:${query}:${limit}:${sort}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `PyPI Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Prepare headers
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': 'CODE-RESEARCH-MCP-Server'
        };

        // PyPI doesn't require authentication for search, but we'll make the request
        const response = await axios.get<PyPISearchResponse>(
          `https://pypi.org/pypi/${encodeURIComponent(query)}/json`,
          {
            headers,
            timeout: 10000
          }
        );

        // Format the single package result
        const pkg = response.data;
        const latestVersion = pkg.info.version;
        const latestRelease = pkg.releases[latestVersion];
        
        // Get download stats for the latest version
        const downloadCount = latestRelease ? latestRelease.length : 0;
        const totalSize = latestRelease ? latestRelease.reduce((sum, file) => sum + file.size, 0) : 0;
        
        // Get project URLs
        const projectUrls = pkg.info.project_urls || {};
        const repository = projectUrls.Repository || projectUrls['Source Code'] || projectUrls['Bug Tracker'] || '';
        const homepage = pkg.info.home_page || projectUrls.Homepage || '';
        
        // Get dependencies
        const dependencies = pkg.info.requires_dist || [];
        const pythonRequirement = pkg.info.requires_python || 'Any';
        
        // Get classifiers for more metadata
        const classifiers = pkg.info.classifiers || [];
        const license = pkg.info.license || 'Unknown';
        const keywords = pkg.info.keywords || [];

        const result = {
          title: pkg.info.name,
          description: pkg.info.summary || 'No description available',
          url: `https://pypi.org/project/${pkg.info.name}/`,
          metadata: {
            version: latestVersion,
            author: pkg.info.author || 'Unknown',
            maintainer: pkg.info.maintainer || pkg.info.author || 'Unknown',
            license: license,
            pythonRequirement: pythonRequirement,
            downloadCount: downloadCount,
            totalSize: totalSize,
            lastUpdated: latestRelease ? latestRelease[0]?.upload_time : 'Unknown',
            dependencies: dependencies.slice(0, 5), // Show first 5 dependencies
            keywords: keywords.slice(0, 5), // Show first 5 keywords
            homepage: homepage,
            repository: repository,
            classifiers: classifiers.slice(0, 3) // Show first 3 classifiers
          }
        };

        // Format output text
        const resultsText = 
          `1. **${result.title}** (v${result.metadata.version})\n` +
          `   Description: ${result.description}\n` +
          `   URL: ${result.url}\n` +
          `   Author: ${result.metadata.author} | Maintainer: ${result.metadata.maintainer}\n` +
          `   License: ${result.metadata.license} | Python: ${result.metadata.pythonRequirement}\n` +
          `   Downloads: ${result.metadata.downloadCount} files | Size: ${(result.metadata.totalSize / 1024 / 1024).toFixed(2)} MB\n` +
          `   Updated: ${result.metadata.lastUpdated ? new Date(result.metadata.lastUpdated).toLocaleDateString() : 'Unknown'}\n` +
          `   Keywords: ${result.metadata.keywords.join(', ')}\n` +
          `   Dependencies: ${result.metadata.dependencies.join(', ')}${result.metadata.dependencies.length > 5 ? '...' : ''}\n` +
          `   Homepage: ${result.metadata.homepage || 'N/A'}\n` +
          `   Repository: ${result.metadata.repository || 'N/A'}`;

        const outputText = `PyPI Search Results for "${query}":\n\n${resultsText}\n\nNote: PyPI search returns detailed information for exact package matches.`;

        // Cache the result
        cache.set(cacheKey, outputText);

        return {
          content: [
            {
              type: "text",
              text: outputText,
            },
          ],
        };
      } catch (error) {
        let errorMessage = 'An error occurred while searching PyPI';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            errorMessage = `Package "${query}" not found on PyPI. Please check the package name and try again.`;
          } else if (error.response?.status === 429) {
            errorMessage = 'PyPI API rate limit exceeded. Please try again later.';
          } else if (error.response?.status) {
            errorMessage = `PyPI API error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'PyPI API request timed out. Please try again.';
          } else {
            errorMessage = `Network error: ${error.message}`;
          }
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
        };
      }
    }
  );
} 