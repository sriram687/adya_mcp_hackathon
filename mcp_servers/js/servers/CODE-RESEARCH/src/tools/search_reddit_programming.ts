import { z } from "zod";
import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Reddit API response interfaces
interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    score: number;
    num_comments: number;
    created_utc: number;
    subreddit: string;
    author: string;
    permalink: string;
    is_self: boolean;
    domain: string;
    over_18: boolean;
    spoiler: boolean;
    locked: boolean;
    stickied: boolean;
    subreddit_subscribers: number;
    num_crossposts: number;
    upvote_ratio: number;
    total_awards_received: number;
    all_awardings: any[];
    media: any;
    is_video: boolean;
    thumbnail: string;
    preview?: {
      images: Array<{
        source: {
          url: string;
          width: number;
          height: number;
        };
        resolutions: Array<{
          url: string;
          width: number;
          height: number;
        }>;
      }>;
    };
  };
  kind: string;
}

interface RedditSearchResponse {
  data: {
    children: RedditPost[];
    after: string | null;
    before: string | null;
    dist: number;
    geo_filter: string;
    modhash: string;
  };
  kind: string;
}

// Reddit Programming search tool implementation
export function createRedditProgrammingSearchTool(server: any) {
  server.tool(
    "search_reddit_programming",
    "Search Reddit programming subreddits using Reddit JSON API",
    {
      query: z.string().describe("Search query for Reddit posts"),
      subreddit: z.string().optional().default("programming").describe("Subreddit to search (e.g., programming, learnprogramming, webdev)"),
      sort_by: z.enum(["relevance", "new", "hot", "top"]).optional().default("relevance").describe("Sort order for results"),
      limit: z.number().min(1).max(10).optional().default(5).describe("Maximum number of results to return (1-10)"),
    },
    async ({ query, subreddit, sort_by, limit }: {
      query: string;
      subreddit: string;
      sort_by: string;
      limit: number;
    }) => {
      try {
        // Create cache key
        const cacheKey = `reddit:${subreddit}:${query}:${sort_by}:${limit}`;
        
        // Check cache first
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return {
            content: [
              {
                type: "text",
                text: `Reddit Programming Search Results (cached):\n\n${cachedResult}`,
              },
            ],
          };
        }

        // Prepare headers
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': 'CODE-RESEARCH-MCP-Server/1.0 (by /u/code_research_bot)'
        };

        // Build search URL for Reddit JSON API
        const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json`;

        // Make API request to Reddit
        const response = await axios.get<RedditSearchResponse>(
          searchUrl,
          {
            headers,
            params: {
              q: query,
              sort: sort_by,
              limit: limit,
              t: 'all', // Time filter: all time
              restrict_sr: 'on', // Restrict to subreddit
              include_over_18: 'off' // Exclude NSFW content
            },
            timeout: 15000
          }
        );

        // Format results
        const results = response.data.data.children.map(post => {
          // Extract preview text from selftext
          const selftextPreview = post.data.selftext 
            ? post.data.selftext.substring(0, 200).replace(/\n/g, ' ').trim() + (post.data.selftext.length > 200 ? '...' : '')
            : '';

          return {
            title: post.data.title,
            url: post.data.url,
            score: post.data.score,
            num_comments: post.data.num_comments,
            subreddit: post.data.subreddit,
            author: post.data.author,
            created_utc: post.data.created_utc,
            selftext_preview: selftextPreview,
            permalink: `https://www.reddit.com${post.data.permalink}`,
            is_self: post.data.is_self,
            upvote_ratio: post.data.upvote_ratio,
            thumbnail: post.data.thumbnail
          };
        });

        // Format output text
        const resultsText = results.length > 0
          ? results.map((result, index) => 
              `${index + 1}. **${result.title}**\n` +
              `   Score: ${result.score} | Comments: ${result.num_comments} | Upvote Ratio: ${(result.upvote_ratio * 100).toFixed(1)}%\n` +
              `   Subreddit: r/${result.subreddit} | Author: u/${result.author}\n` +
              `   URL: ${result.url}\n` +
              `   Reddit: ${result.permalink}\n` +
              `${result.selftext_preview ? `   Preview: ${result.selftext_preview}\n` : ''}` +
              `   Created: ${new Date(result.created_utc * 1000).toLocaleDateString()}\n`
            ).join('\n')
          : 'No posts found';

        const outputText = `Reddit Programming Search Results for "${query}" in r/${subreddit}:\n\n${resultsText}\n\nSort: ${sort_by} | Total results: ${response.data.data.dist}`;

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
        let errorMessage = 'An error occurred while searching Reddit';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            errorMessage = 'Reddit API rate limit exceeded. Please try again later.';
          } else if (error.response?.status === 403) {
            errorMessage = 'Access to Reddit API is forbidden. This may be due to rate limiting or subreddit restrictions.';
          } else if (error.response?.status === 404) {
            errorMessage = `Subreddit r/${subreddit} not found or is private.`;
          } else if (error.response?.status) {
            errorMessage = `Reddit API error: ${error.response.status} - ${error.response.statusText}`;
          } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Reddit API request timed out. Please try again.';
          } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Unable to reach Reddit. Please check your internet connection.';
          } else {
            errorMessage = `Network error: ${error.message}`;
          }
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        // Provide fallback search URL
        const fallbackUrl = `https://www.reddit.com/r/${subreddit}/search/?q=${encodeURIComponent(query)}&restrict_sr=1&sort=${sort_by}`;
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