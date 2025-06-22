
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import tweepy
import os
from dotenv import load_dotenv 
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TwitterConfig:
    """Twitter API configuration"""
    bearer_token: str
    consumer_key: str
    consumer_secret: str
    access_token: str
    access_token_secret: str

class TwitterMCPServer:
    """Twitter API MCP Server implementation"""
    
    def __init__(self):
        self.server = Server("twitter-api")
        self.twitter_client: Optional[tweepy.Client] = None
        self.twitter_api: Optional[tweepy.API] = None
        self.config: Optional[TwitterConfig] = None
        

        self._register_handlers()
    
    def _register_handlers(self):
        """Register all MCP protocol handlers"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[types.Tool]:
            """Return available Twitter API tools"""
            return [
                types.Tool(
                    name="search_tweets",
                    description="Search for tweets using Twitter API v2",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Search query (Twitter search syntax)"
                            },
                            "max_results": {
                                "type": "integer",
                                "description": "Maximum number of results (10-100)",
                                "default": 5
                            },
                            "tweet_fields": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Tweet fields to include",
                                "default": ["created_at", "author_id", "public_metrics"]
                            }
                        },
                        "required": ["query"]
                    }
                ),
                types.Tool(
                    name="get_user_tweets",
                    description="Get tweets from a specific user",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "username": {
                                "type": "string",
                                "description": "Twitter username (without @)"
                            },
                            "max_results": {
                                "type": "integer",
                                "description": "Maximum number of results (5-100)",
                                "default": 5
                            },
                            "exclude": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Types of tweets to exclude (retweets, replies)"
                            }
                        },
                        "required": ["username"]
                    }
                ),
                types.Tool(
                    name="get_user_info",
                    description="Get information about a Twitter user",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "username": {
                                "type": "string",
                                "description": "Twitter username (without @)"
                            },
                            "user_fields": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "User fields to include",
                                "default": ["created_at", "description", "public_metrics", "verified"]
                            }
                        },
                        "required": ["username"]
                    }
                ),
                types.Tool(
                    name="post_tweet",
                    description="Post a new tweet",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "text": {
                                "type": "string",
                                "description": "Tweet text content (max 280 characters)"
                            },
                            "in_reply_to_tweet_id": {
                                "type": "string",
                                "description": "ID of tweet to reply to (optional)"
                            }
                        },
                        "required": ["text"]
                    }
                ),
                types.Tool(
                    name="get_tweet_by_id",
                    description="Get a specific tweet by its ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "tweet_id": {
                                "type": "string",
                                "description": "Tweet ID"
                            },
                            "tweet_fields": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Tweet fields to include",
                                "default": ["created_at", "author_id", "public_metrics", "context_annotations"]
                            },
                            "expansions": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Expansions to include",
                                "default": ["author_id"]
                            }
                        },
                        "required": ["tweet_id"]
                    }
                ),
                types.Tool(
                    name="get_trending_topics",
                    description="Get trending topics for a location",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "woeid": {
                                "type": "integer",
                                "description": "Where On Earth ID (1 for worldwide, 23424977 for US)",
                                "default": 1
                            }
                        }
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
            """Handle tool execution requests"""
            
            if not self.twitter_client:
                return [types.TextContent(
                    type="text",
                    text="Error: Twitter API not initialized. Please check your credentials."
                )]
            
            try:
                if name == "search_tweets":
                    result = await self._search_tweets(**arguments)
                elif name == "get_user_tweets":
                    result = await self._get_user_tweets(**arguments)
                elif name == "get_user_info":
                    result = await self._get_user_info(**arguments)
                elif name == "post_tweet":
                    result = await self._post_tweet(**arguments)
                elif name == "get_tweet_by_id":
                    result = await self._get_tweet_by_id(**arguments)
                elif name == "get_trending_topics":
                    result = await self._get_trending_topics(**arguments)
                else:
                    result = f"Unknown tool: {name}"
                
                return [types.TextContent(type="text", text=str(result))]
                
            except Exception as e:
                logger.error(f"Error executing tool {name}: {str(e)}")
                return [types.TextContent(
                    type="text",
                    text=f"Error executing {name}: {str(e)}"
                )]
    
    async def _search_tweets(self, query: str, max_results: int = 10, tweet_fields: List[str] = None) -> Dict:
        """Search for tweets"""
        if tweet_fields is None:
            tweet_fields = ["created_at", "author_id", "public_metrics"]
        
        try:
            tweets = self.twitter_client.search_recent_tweets(
                query=query,
                max_results=min(max_results, 100),
                tweet_fields=tweet_fields
            )
            
            if not tweets.data:
                return {"message": "No tweets found", "query": query}
            
            result = {
                "query": query,
                "count": len(tweets.data),
                "tweets": []
            }
            
            for tweet in tweets.data:
                tweet_data = {
                    "id": tweet.id,
                    "text": tweet.text,
                    "created_at": str(tweet.created_at) if tweet.created_at else None,
                    "author_id": tweet.author_id,
                    "public_metrics": tweet.public_metrics
                }
                result["tweets"].append(tweet_data)
            
            return result
            
        except Exception as e:
            return {"error": f"Search failed: {str(e)}"}