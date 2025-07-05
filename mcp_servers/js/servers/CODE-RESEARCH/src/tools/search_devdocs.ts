import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";
import * as cheerio from "cheerio";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// DevDocs search result interface
interface DevDocsResult {
  title: string;
  url: string;
  type: string;
  documentation_set: string;
  excerpt: string;
  path: string;
}

// DevDocs documentation set interface
interface DevDocsSet {
  name: string;
  slug: string;
  version: string;
  mtime: number;
  db_size: number;
}

// DevDocs search tool implementation
export function createDevDocsSearchTool(server: any) {
  server.tool(
    "search_devdocs",
    "Search DevDocs for programming documentation using web scraping",
    {
      query: z.string().describe("Search query for DevDocs documentation"),
      documentation_set: z.string().optional().describe("Filter by specific documentation set (e.g., javascript, python, react)"),
      limit: z.number().min(1).max(20).optional().default(10).describe("Maximum number of results to return (1-20)"),
    },
    async ({ query, documentation_set, limit }: {
      query: string;
      documentation_set?: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = `devdocs:${query}:${documentation_set || 'all'}:${limit}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `DevDocs Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Prepare headers for web scraping
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        };

        // Build search URL
        const searchParams = new URLSearchParams({
          q: query,
          t: '0', // Search in all docs
        });

        if (documentation_set) {
          searchParams.set('t', documentation_set);
        }

        const searchUrl = `https://devdocs.io/?${searchParams.toString()}`;

        // Make the search request
        const response = await axios.get(searchUrl, {
          headers,
          timeout: 15000,
          maxRedirects: 5,
        });

        // Parse the HTML response
        const $ = cheerio.load(response.data);
        const results: DevDocsResult[] = [];

        // Try multiple selectors to find search results
        const selectors = [
          '.result',
          '.search-result',
          '[data-testid="search-result"]',
          'article',
          '.card',
          'li a[href*="/"]',
          'a[href*="/"]',
          '.entry',
          '.doc'
        ];

        for (const selector of selectors) {
          if (results.length >= limit) break;

          $(selector).each((index, element) => {
            if (results.length >= limit) return false;

            const $element = $(element);
            
            // Extract title and link
            let title = '';
            let url = '';
            
            // Try different ways to get title and URL
            if (selector.includes('a[')) {
              // Direct link element
              title = $element.text().trim();
              url = $element.attr('href') || '';
            } else {
              // Container element
              const titleElement = $element.find('h1, h2, h3, h4, .title, .result-title, a').first();
              title = titleElement.text().trim();
              url = titleElement.attr('href') || $element.find('a').first().attr('href') || '';
            }
            
            if (!title || !url || title.length < 3) return; // Skip if no meaningful title or URL

            // Check if the title contains our search query (case insensitive)
            if (!title.toLowerCase().includes(query.toLowerCase())) return;

            // Extract excerpt/description
            const excerpt = $element.find('.excerpt, .description, p, .snippet').text().trim() || 
                           $element.text().substring(0, 200).trim();

            // Extract type and documentation set
            const type = $element.find('.type, .category').text().trim() || 'Documentation';
            const docSet = $element.closest('[data-doc]').attr('data-doc') || 
                          $element.find('.doc-set').text().trim() || 
                          documentation_set || 'Unknown';

            // Build full URL if it's relative
            const fullUrl = url.startsWith('http') ? url : `https://devdocs.io${url}`;

            // Avoid duplicates
            if (results.some(r => r.url === fullUrl)) return;

            results.push({
              title,
              url: fullUrl,
              type,
              documentation_set: docSet,
              excerpt: excerpt.length > 300 ? excerpt.substring(0, 300) + '...' : excerpt,
              path: url
            });
          });
        }

        // If no results found, provide a fallback with direct DevDocs search
        if (results.length === 0) {
          // Create a fallback result that links to DevDocs search
          results.push({
            title: `Search DevDocs for "${query}"`,
            url: searchUrl,
            type: 'Search',
            documentation_set: documentation_set || 'All',
            excerpt: `No direct results found. Click to search DevDocs for "${query}". The search tool will redirect you to DevDocs where you can find relevant documentation.`,
            path: '/'
          });
        }

        // Format output text
        const resultsText = results.length > 0
          ? results.map((result, index) => 
              `${index + 1}. **${result.title}**\n` +
              `   Type: ${result.type} | Doc Set: ${result.documentation_set}\n` +
              `   URL: ${result.url}\n` +
              `   Excerpt: ${result.excerpt}\n`
            ).join('\n')
          : 'No documentation found';

        const outputText = `DevDocs Search Results for "${query}":\n\n${resultsText}\n\nNote: Results are scraped from DevDocs. For the most up-to-date information, visit the provided URLs.`;

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
        let errorMessage = 'An error occurred while searching DevDocs';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            errorMessage = 'DevDocs search page not found. The search functionality may be temporarily unavailable.';
          } else if (error.response?.status === 403) {
            errorMessage = 'Access to DevDocs search is forbidden. This may be due to rate limiting.';
          } else if (error.response?.status === 429) {
            errorMessage = 'DevDocs search rate limit exceeded. Please try again later.';
          } else if (error.response?.status) {
            errorMessage = `DevDocs search error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'DevDocs search request timed out. Please try again.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Unable to reach DevDocs. Please check your internet connection.';
          } else {
            errorMessage = `Network error: ${error.message}`;
          }
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        // Provide fallback search URL
        const fallbackUrl = `https://devdocs.io/?q=${encodeURIComponent(query)}`;
        errorMessage += `\n\nYou can try searching directly at: ${fallbackUrl}`;

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