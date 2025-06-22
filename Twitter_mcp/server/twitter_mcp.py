
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
    
    async def _get_user_tweets(self, username: str, max_results: int = 10, exclude: List[str] = None) -> Dict:
        """Get tweets from a specific user"""
        try:
            # First get user by username
            user = self.twitter_client.get_user(username=username)
            if not user.data:
                return {"error": f"User {username} not found"}
            
            # Get user's tweets
            tweets = self.twitter_client.get_users_tweets(
                id=user.data.id,
                max_results=min(max_results, 100),
                exclude=exclude,
                tweet_fields=["created_at", "public_metrics"]
            )
            
            if not tweets.data:
                return {"message": f"No tweets found for @{username}"}
            
            result = {
                "username": username,
                "user_id": user.data.id,
                "count": len(tweets.data),
                "tweets": []
            }
            
            for tweet in tweets.data:
                tweet_data = {
                    "id": tweet.id,
                    "text": tweet.text,
                    "created_at": str(tweet.created_at) if tweet.created_at else None,
                    "public_metrics": tweet.public_metrics
                }
                result["tweets"].append(tweet_data)
            
            return result
            
        except Exception as e:
            return {"error": f"Failed to get user tweets: {str(e)}"}
    
    async def _get_user_info(self, username: str, user_fields: List[str] = None) -> Dict:
        """Get information about a Twitter user"""
        if user_fields is None:
            user_fields = ["created_at", "description", "public_metrics", "verified"]
        
        try:
            user = self.twitter_client.get_user(
                username=username,
                user_fields=user_fields
            )
            
            if not user.data:
                return {"error": f"User {username} not found"}
            
            result = {
                "id": user.data.id,
                "username": user.data.username,
                "name": user.data.name,
                "created_at": str(user.data.created_at) if user.data.created_at else None,
                "description": user.data.description,
                "verified": getattr(user.data, 'verified', False),
                "public_metrics": user.data.public_metrics
            }
            
            return result
            
        except Exception as e:
            return {"error": f"Failed to get user info: {str(e)}"}
    
    async def _post_tweet(self, text: str, in_reply_to_tweet_id: str = None) -> Dict:
        """Post a new tweet"""
        try:
            if len(text) > 280:
                return {"error": "Tweet text exceeds 280 characters"}
            
            tweet = self.twitter_client.create_tweet(
                text=text,
                in_reply_to_tweet_id=in_reply_to_tweet_id
            )
            
            return {
                "success": True,
                "tweet_id": tweet.data['id'],
                "text": text,
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": f"Failed to post tweet: {str(e)}"}
    
    async def _get_tweet_by_id(self, tweet_id: str, tweet_fields: List[str] = None, expansions: List[str] = None) -> Dict:
        """Get a specific tweet by ID"""
        if tweet_fields is None:
            tweet_fields = ["created_at", "author_id", "public_metrics", "context_annotations"]
        if expansions is None:
            expansions = ["author_id"]
        
        try:
            tweet = self.twitter_client.get_tweet(
                id=tweet_id,
                tweet_fields=tweet_fields,
                expansions=expansions
            )
            
            if not tweet.data:
                return {"error": f"Tweet {tweet_id} not found"}
            
            result = {
                "id": tweet.data.id,
                "text": tweet.data.text,
                "created_at": str(tweet.data.created_at) if tweet.data.created_at else None,
                "author_id": tweet.data.author_id,
                "public_metrics": tweet.data.public_metrics
            }
            
            # Add author info if available
            if tweet.includes and 'users' in tweet.includes:
                for user in tweet.includes['users']:
                    if user.id == tweet.data.author_id:
                        result["author"] = {
                            "username": user.username,
                            "name": user.name
                        }
                        break
            
            return result
            
        except Exception as e:
            return {"error": f"Failed to get tweet: {str(e)}"}
    
    async def _get_trending_topics(self, woeid: int = 1) -> Dict:
        """Get trending topics for a location"""
        try:
            if not self.twitter_api:
                return {"error": "Twitter API v1.1 not available for trending topics"}
            
            trends = self.twitter_api.get_place_trends(id=woeid)
            
            if not trends:
                return {"error": "No trending topics found"}
            
            result = {
                "woeid": woeid,
                "location": trends[0]['locations'][0]['name'],
                "trends": []
            }
            
            for trend in trends[0]['trends'][:10]:  # Top 10 trends
                result["trends"].append({
                    "name": trend['name'],
                    "url": trend['url'],
                    "tweet_volume": trend.get('tweet_volume')
                })
            
            return result
            
        except Exception as e:
            return {"error": f"Failed to get trending topics: {str(e)}"}
    
    def _initialize_twitter_client(self):
        """Initialize Twitter API client"""
        try:
            # Load configuration from environment variables
            self.config = TwitterConfig(
                bearer_token=os.getenv('TWITTER_BEARER_TOKEN'),
                consumer_key=os.getenv('TWITTER_CONSUMER_KEY'),
                consumer_secret=os.getenv('TWITTER_CONSUMER_SECRET'),
                access_token=os.getenv('TWITTER_ACCESS_TOKEN'),
                access_token_secret=os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
            )
            
            # Initialize Twitter API v2 client
            self.twitter_client = tweepy.Client(
                bearer_token=self.config.bearer_token,
                consumer_key=self.config.consumer_key,
                consumer_secret=self.config.consumer_secret,
                access_token=self.config.access_token,
                access_token_secret=self.config.access_token_secret,
                wait_on_rate_limit=True
            )
            
            # Initialize Twitter API v1.1 for features not available in v2
            auth = tweepy.OAuth1UserHandler(
                self.config.consumer_key,
                self.config.consumer_secret,
                self.config.access_token,
                self.config.access_token_secret
            )
            self.twitter_api = tweepy.API(auth, wait_on_rate_limit=True)
            
            logger.info("Twitter API client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Twitter API client: {str(e)}")
            raise
    
    async def run(self):
        """Run the MCP server"""
        try:
            # Initialize Twitter client
            self._initialize_twitter_client()
            
            # Test API connection
            try:
                me = self.twitter_client.get_me()
                logger.info(f"Connected as: @{me.data.username}")
            except Exception as e:
                logger.warning(f"API connection test failed: {str(e)}")
            
            # Run the server
            async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
                await self.server.run(
                    read_stream,
                    write_stream,
                    InitializationOptions(
                        server_name="twitter-api",
                        server_version="1.0.0",
                        capabilities=self.server.get_capabilities(
                            notification_options=NotificationOptions(),
                            experimental_capabilities={}
                        )
                    )
                )
        except Exception as e:
            logger.error(f"Server error: {str(e)}")
            raise

async def main():
    """Main entry point"""
    server = TwitterMCPServer()
    await server.run()

if __name__ == "__main__":
    import argparse
    import sys
    
    # Check for required environment variables
    required_vars = [
        'TWITTER_BEARER_TOKEN',
        'TWITTER_CONSUMER_KEY', 
        'TWITTER_CONSUMER_SECRET',
        'TWITTER_ACCESS_TOKEN',
        'TWITTER_ACCESS_TOKEN_SECRET'
    ]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("\nPlease set the following environment variables:")
        for var in required_vars:
            print(f"export {var}=your_value_here")
        exit(1)

    parser = argparse.ArgumentParser(description="Twitter MCP Tools CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # search_tweets
    parser_search = subparsers.add_parser("search_tweets", help="Search for tweets")
    parser_search.add_argument("--query", required=True, help="Search query")
    parser_search.add_argument("--max_results", type=int, default=10, help="Max results (10-100)")
    parser_search.add_argument("--tweet_fields", nargs="*", default=["created_at", "author_id", "public_metrics"], help="Tweet fields to include")

    # get_user_tweets
    parser_user_tweets = subparsers.add_parser("get_user_tweets", help="Get tweets from a user")
    parser_user_tweets.add_argument("--username", required=True, help="Twitter username (without @)")
    parser_user_tweets.add_argument("--max_results", type=int, default=10, help="Max results (5-100)")
    parser_user_tweets.add_argument("--exclude", nargs="*", default=None, help="Types of tweets to exclude (retweets, replies)")

    # get_user_info
    parser_user_info = subparsers.add_parser("get_user_info", help="Get user info")
    parser_user_info.add_argument("--username", required=True, help="Twitter username (without @)")
    parser_user_info.add_argument("--user_fields", nargs="*", default=["created_at", "description", "public_metrics", "verified"], help="User fields to include")

    # post_tweet
    parser_post = subparsers.add_parser("post_tweet", help="Post a new tweet")
    parser_post.add_argument("--text", required=True, help="Tweet text content (max 280 chars)")
    parser_post.add_argument("--in_reply_to_tweet_id", default=None, help="ID of tweet to reply to (optional)")

    # get_tweet_by_id
    parser_get_tweet = subparsers.add_parser("get_tweet_by_id", help="Get tweet by ID")
    parser_get_tweet.add_argument("--tweet_id", required=True, help="Tweet ID")
    parser_get_tweet.add_argument("--tweet_fields", nargs="*", default=["created_at", "author_id", "public_metrics", "context_annotations"], help="Tweet fields to include")
    parser_get_tweet.add_argument("--expansions", nargs="*", default=["author_id"], help="Expansions to include")

    # get_trending_topics
    parser_trends = subparsers.add_parser("get_trending_topics", help="Get trending topics")
    parser_trends.add_argument("--woeid", type=int, default=1, help="Where On Earth ID (1=worldwide)")

    args = parser.parse_args()

    async def cli_main():
        server = TwitterMCPServer()
        server._initialize_twitter_client()
        if args.command == "search_tweets":
            result = await server._search_tweets(
                query=args.query,
                max_results=args.max_results,
                tweet_fields=args.tweet_fields
            )
        elif args.command == "get_user_tweets":
            result = await server._get_user_tweets(
                username=args.username,
                max_results=args.max_results,
                exclude=args.exclude
            )
        elif args.command == "get_user_info":
            result = await server._get_user_info(
                username=args.username,
                user_fields=args.user_fields
            )
        elif args.command == "post_tweet":
            result = await server._post_tweet(
                text=args.text,
                in_reply_to_tweet_id=args.in_reply_to_tweet_id
            )
        elif args.command == "get_tweet_by_id":
            result = await server._get_tweet_by_id(
                tweet_id=args.tweet_id,
                tweet_fields=args.tweet_fields,
                expansions=args.expansions
            )
        elif args.command == "get_trending_topics":
            result = await server._get_trending_topics(
                woeid=args.woeid
            )
        else:
            print(f"Unknown command: {args.command}")
            sys.exit(1)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    asyncio.run(cli_main())