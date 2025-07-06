// TODO: Implement MDN search tool
// Will follow the same pattern as search_github.ts
// Uses MDN search (mocked or scraped) with proper error handling and caching

import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";
import * as cheerio from "cheerio";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// MDN search result interface
interface MDNSearchResult {
  title: string;
  description: string;
  url: string;
  metadata: {
    category: string;
    lastModified?: string;
    contributors?: string[];
    tags?: string[];
    locale: string;
    searchScore?: number;
  };
}

// MDN search tool implementation
export function createMDNSearchTool(server: any) {
  server.tool(
    "search_mdn",
    "Search MDN Web Docs for web development documentation using web scraping",
    {
      query: z.string().describe("Search query for MDN documentation"),
      limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of results to return"),
      locale: z.string().optional().default("en-US").describe("MDN locale (e.g., en-US, fr, es)"),
      category: z.string().optional().describe("Filter by category (e.g., JavaScript, CSS, HTML)"),
    },
    async ({ query, limit, locale, category }: {
      query: string;
      limit: number;
      locale: string;
      category?: string;
    }) => {
      try {
        // Create cache key
        const cacheKey = `mdn:${query}:${limit}:${locale}:${category || 'all'}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `MDN Search Results (cached):\n\n${cachedResult}`,
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
          locale: locale,
        });

        if (category) {
          searchParams.append('topic', category);
        }

        const searchUrl = `https://developer.mozilla.org/${locale}/search?${searchParams.toString()}`;

        // Make the search request
        const response = await axios.get(searchUrl, {
          headers,
          timeout: 15000,
          maxRedirects: 5,
        });

        // Parse the HTML response
        const $ = cheerio.load(response.data);
        const results: MDNSearchResult[] = [];

        // Try multiple selectors to find search results
        const selectors = [
          '.result-item',
          '.search-result',
          '[data-testid="search-result"]',
          'article',
          '.card',
          '.result',
          'li a[href*="/docs/"]',
          'a[href*="/docs/"]',
          'a[href*="/Web/"]',
          'a[href*="/Learn/"]'
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

            // Extract description
            const description = $element.find('.result-description, .description, p, .snippet').text().trim() || 
                               $element.text().substring(0, 200).trim();

            // Extract metadata
            const category = $element.find('.category, .topic, .breadcrumb').text().trim() || 
                            $element.closest('[data-category]').attr('data-category') || 'Web Development';
            
            const lastModified = $element.find('.last-modified, .date, time').text().trim();
            const contributors = $element.find('.contributors, .authors').text().trim().split(',').map(s => s.trim());
            const tags = $element.find('.tags, .keywords').text().trim().split(',').map(s => s.trim());

            // Build full URL if it's relative
            const fullUrl = url.startsWith('http') ? url : `https://developer.mozilla.org${url}`;

            // Avoid duplicates
            if (results.some(r => r.url === fullUrl)) return;

            results.push({
              title,
              description: description.length > 300 ? description.substring(0, 300) + '...' : description,
              url: fullUrl,
              metadata: {
                category,
                lastModified: lastModified || undefined,
                contributors: contributors.length > 0 ? contributors : undefined,
                tags: tags.length > 0 ? tags : undefined,
                locale,
                searchScore: Math.max(0, 100 - (results.length * 10)) // Simple scoring based on position
              }
            });
          });
        }

        // If no results found, provide a fallback with direct MDN search
        if (results.length === 0) {
          // Create a fallback result that links to MDN search
          results.push({
            title: `Search MDN for "${query}"`,
            description: `No direct results found. Click to search MDN Web Docs for "${query}". The search tool will redirect you to MDN's search page where you can find relevant documentation.`,
            url: searchUrl,
            metadata: {
              category: 'Search',
              locale,
              searchScore: 0
            }
          });
        }

        // Format output text
        const resultsText = results.length > 0
          ? results.map((result, index) => 
              `${index + 1}. **${result.title}**\n` +
              `   Description: ${result.description}\n` +
              `   URL: ${result.url}\n` +
              `   Category: ${result.metadata.category} | Locale: ${result.metadata.locale}\n` +
              `${result.metadata.lastModified ? `   Last Modified: ${result.metadata.lastModified}\n` : ''}` +
              `${result.metadata.contributors ? `   Contributors: ${result.metadata.contributors.join(', ')}\n` : ''}` +
              `${result.metadata.tags ? `   Tags: ${result.metadata.tags.join(', ')}\n` : ''}` +
              `   Score: ${result.metadata.searchScore}%\n`
            ).join('\n')
          : 'No documentation found';

        const outputText = `MDN Search Results for "${query}":\n\n${resultsText}\n\nNote: Results are scraped from MDN Web Docs. For the most up-to-date information, visit the provided URLs.`;

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
        let errorMessage = 'An error occurred while searching MDN';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            errorMessage = 'MDN search page not found. The search functionality may be temporarily unavailable.';
          } else if (error.response?.status === 403) {
            errorMessage = 'Access to MDN search is forbidden. This may be due to rate limiting.';
          } else if (error.response?.status === 429) {
            errorMessage = 'MDN search rate limit exceeded. Please try again later.';
          } else if (error.response?.status) {
            errorMessage = `MDN search error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'MDN search request timed out. Please try again.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Unable to reach MDN Web Docs. Please check your internet connection.';
          } else {
            errorMessage = `Network error: ${error.message}`;
          }
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        // Provide fallback search URL
        const fallbackUrl = `https://developer.mozilla.org/${locale || 'en-US'}/search?q=${encodeURIComponent(query)}`;
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