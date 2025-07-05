import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Tech blog article interface
interface TechBlogArticle {
  title: string;
  author: string;
  platform: string;
  published_at: string;
  reading_time: string;
  url: string;
  tags: string[];
  excerpt: string;
  published_date: string;
}

// Dev.to API response interfaces
interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  reading_time_minutes: number;
  tag_list: string[];
  user: {
    name: string;
    username: string;
  };
  published_timestamp: string;
}

// Medium RSS response interface (simplified)
interface MediumRSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  category: string[];
}

// Hashnode GraphQL response interfaces
interface HashnodePost {
  title: string;
  brief: string;
  slug: string;
  dateAdded: string;
  totalReactions: number;
  author: {
    username: string;
    name: string;
  };
  tags: Array<{
    name: string;
  }>;
}

interface HashnodeResponse {
  data: {
    searchPosts: {
      posts: HashnodePost[];
    };
  };
}

// Tech Blogs search tool implementation
export function createTechBlogsSearchTool(server: any) {
  server.tool(
    "search_tech_blogs",
    "Search multiple tech blog platforms (Dev.to, Medium, Hashnode) for programming articles",
    {
      query: z.string().describe("Search query for tech blog articles"),
      platform: z.enum(["devto", "medium", "hashnode", "all"]).optional().default("all").describe("Platform to search (devto, medium, hashnode, all)"),
      limit: z.number().min(1).max(10).optional().default(5).describe("Maximum number of results to return (1-10)"),
    },
    async ({ query, platform, limit }: {
      query: string;
      platform: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = `tech_blogs:${platform}:${query}:${limit}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `Tech Blogs Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        const allResults: TechBlogArticle[] = [];

        // Search Dev.to if platform is 'all' or 'devto'
        if (platform === 'all' || platform === 'devto') {
          try {
            const devtoResults = await searchDevTo(query, Math.ceil(limit / 3));
            allResults.push(...devtoResults);
          } catch (error) {
            console.error('Dev.to search failed:', error);
          }
        }

        // Search Medium if platform is 'all' or 'medium'
        if (platform === 'all' || platform === 'medium') {
          try {
            const mediumResults = await searchMedium(query, Math.ceil(limit / 3));
            allResults.push(...mediumResults);
          } catch (error) {
            console.error('Medium search failed:', error);
          }
        }

        // Search Hashnode if platform is 'all' or 'hashnode'
        if (platform === 'all' || platform === 'hashnode') {
          try {
            const hashnodeResults = await searchHashnode(query, Math.ceil(limit / 3));
            allResults.push(...hashnodeResults);
          } catch (error) {
            console.error('Hashnode search failed:', error);
          }
        }

        // Sort by published date (newest first) and limit results
        const sortedResults = allResults
          .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
          .slice(0, limit);

        // Format output text
        const resultsText = sortedResults.length > 0
          ? sortedResults.map((result, index) => 
              `${index + 1}. **${result.title}**\n` +
              `   Platform: ${result.platform} | Author: ${result.author}\n` +
              `   Reading Time: ${result.reading_time} | Published: ${result.published_date}\n` +
              `   URL: ${result.url}\n` +
              `${result.tags.length > 0 ? `   Tags: ${result.tags.join(', ')}\n` : ''}` +
              `   Excerpt: ${result.excerpt}\n`
            ).join('\n')
          : 'No articles found';

        const outputText = `Tech Blogs Search Results for "${query}":\n\n${resultsText}\n\nPlatforms searched: ${platform === 'all' ? 'Dev.to, Medium, Hashnode' : platform}`;

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
        let errorMessage = 'An error occurred while searching tech blogs';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            errorMessage = 'Tech blogs API rate limit exceeded. Please try again later.';
          } else if (error.response?.status === 403) {
            errorMessage = 'Access to tech blogs API is forbidden. This may be due to rate limiting.';
          } else if (error.response?.status) {
            errorMessage = `Tech blogs API error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Tech blogs API request timed out. Please try again.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Unable to reach tech blogs APIs. Please check your internet connection.';
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

// Helper function to search Dev.to
async function searchDevTo(query: string, limit: number): Promise<TechBlogArticle[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'CODE-RESEARCH-MCP-Server'
  };

  const response = await axios.get<DevToArticle[]>(
    'https://dev.to/api/articles',
    {
      headers,
      params: {
        tag: query,
        per_page: limit,
        page: 1
      },
      timeout: 10000
    }
  );

  return response.data.map(article => ({
    title: article.title,
    author: article.user.name,
    platform: 'Dev.to',
    published_at: article.published_at,
    reading_time: `${article.reading_time_minutes} min read`,
    url: article.url,
    tags: article.tag_list,
    excerpt: article.description,
    published_date: new Date(article.published_at).toLocaleDateString()
  }));
}

// Helper function to search Medium (using RSS)
async function searchMedium(query: string, limit: number): Promise<TechBlogArticle[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/rss+xml, application/xml, text/xml',
    'User-Agent': 'CODE-RESEARCH-MCP-Server'
  };

  // Medium doesn't have a direct search API, so we'll use their programming tag RSS
  const response = await axios.get(
    'https://medium.com/feed/tag/programming',
    {
      headers,
      timeout: 10000
    }
  );

  // Parse RSS XML (simplified parsing)
  const articles: TechBlogArticle[] = [];
  const rssText = response.data;
  
  // Simple regex-based parsing for RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let count = 0;

  while ((match = itemRegex.exec(rssText)) && count < limit) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const descriptionMatch = itemContent.match(/<description>(.*?)<\/description>/);
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const authorMatch = itemContent.match(/<dc:creator>(.*?)<\/dc:creator>/);
    
    if (titleMatch && linkMatch) {
      const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      // Check if title contains the query
      if (title.toLowerCase().includes(query.toLowerCase())) {
        articles.push({
          title,
          author: authorMatch ? authorMatch[1] : 'Unknown',
          platform: 'Medium',
          published_at: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
          reading_time: '5 min read', // Medium doesn't provide this in RSS
          url: linkMatch[1],
          tags: ['programming'],
          excerpt: descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) : '',
          published_date: pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString() : new Date().toLocaleDateString()
        });
        count++;
      }
    }
  }

  return articles;
}

// Helper function to search Hashnode
async function searchHashnode(query: string, limit: number): Promise<TechBlogArticle[]> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'CODE-RESEARCH-MCP-Server'
  };

  const graphqlQuery = `
    query SearchPosts($query: String!, $limit: Int!) {
      searchPosts(query: $query, limit: $limit) {
        posts {
          title
          brief
          slug
          dateAdded
          totalReactions
          author {
            username
            name
          }
          tags {
            name
          }
        }
      }
    }
  `;

  const response = await axios.post<HashnodeResponse>(
    'https://api.hashnode.com/',
    {
      query: graphqlQuery,
      variables: {
        query,
        limit
      }
    },
    {
      headers,
      timeout: 10000
    }
  );

  return response.data.data.searchPosts.posts.map(post => ({
    title: post.title,
    author: post.author.name,
    platform: 'Hashnode',
    published_at: post.dateAdded,
    reading_time: '5 min read', // Hashnode doesn't provide this in the API
    url: `https://hashnode.com/${post.slug}`,
    tags: post.tags.map(tag => tag.name),
    excerpt: post.brief,
    published_date: new Date(post.dateAdded).toLocaleDateString()
  }));
} 