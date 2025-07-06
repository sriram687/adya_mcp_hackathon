# Complete Tool Testing Prompts

## 🔍 OMNISEARCH SERVER TOOLS

### 1. Tavily Search (General)
```
Tell me about Tesla's latest electric vehicle models and their features.
```

### 2. Tavily Search News
```
What are the latest news updates about Tesla stock price and recent announcements?
```

### 3. Tavily Search Academic
```
Find research papers about electric vehicle battery technology and sustainability studies.
```

### 4. Brave Search
```
Search for privacy-focused information about electric vehicle charging infrastructure using Brave search.
```

### 5. Kagi Search
```
Find high-quality information about Tesla's manufacturing processes and quality control.
```

### 6. Perplexity Chat
```
Explain how Tesla's autopilot technology works and compare it to other autonomous driving systems.
```

### 7. Kagi FastGPT
```
What is Tesla's market capitalization and how does it compare to other automotive companies?
```

### 8. Jina Search
```
Search for Tesla Model 3 specifications and pricing information.
```

### 9. Jina Reader
```
Read and analyze the content from this Tesla page: https://www.tesla.com/model3
```

### 10. Jina Batch Reader
```
Compare content from these Tesla pages:
- https://www.tesla.com/model3
- https://www.tesla.com/modely
```

### 11. Jina PDF Reader
```
Analyze this Tesla sustainability report PDF: https://www.tesla.com/ns_videos/2022-tesla-sustainability-report.pdf
```

### 12. Firecrawl Scrape
```
Extract clean content from Tesla's main website: https://www.tesla.com
```

### 13. Firecrawl Crawl
```
Crawl Tesla's website to map all their product pages: https://www.tesla.com
```

### 14. Firecrawl Map
```
Map all URLs on Tesla's website to find their site structure: https://www.tesla.com
```

### 15. Firecrawl Extract
```
Extract all product names and prices from Tesla's website: https://www.tesla.com
Prompt: "Extract all vehicle model names, their starting prices, and key specifications"
```

### 16. Firecrawl Research
```
Research Tesla's competitive position by analyzing these sources:
- https://www.tesla.com
- https://www.ford.com/electric
Research Question: "How does Tesla's EV lineup compare to Ford's electric vehicle offerings?"
```

### 17. Jina Grounding
```
Verify these facts about Tesla:
- "Tesla Model 3 is the best-selling electric car globally"
- "Tesla's Gigafactory produces more batteries than any other facility"
Source: Recent Tesla financial reports and industry analysis
```

### 18. Kagi Enrichment
```
Enrich this Tesla page with additional context: https://www.tesla.com/model3
```

### 19. Cross-Platform Fact Verification
```
Verify this claim: "Tesla's Supercharger network is the largest fast-charging network in the world"
```

## 📌 PINTEREST SERVER TOOLS

### 1. Get Pinterest Auth URL
```
Generate Pinterest OAuth URL for authentication
```

### 2. Get Boards
```
Fetch all Pinterest boards for the authenticated user
Access Token: [YOUR_ACCESS_TOKEN]
```

### 3. Create Board
```
Create a new Pinterest board
Access Token: [YOUR_ACCESS_TOKEN]
Name: "Tesla Electric Vehicles"
Description: "Collection of Tesla EV models and electric car inspiration"
Privacy: "PUBLIC"
```

### 4. Delete Board
```
Delete a Pinterest board
Access Token: [YOUR_ACCESS_TOKEN]
Board ID: [BOARD_ID_TO_DELETE]
```

### 5. Create Pin (Base64)
```
Create a new Pinterest pin using base64 image
Access Token: [YOUR_ACCESS_TOKEN]
Board ID: [BOARD_ID]
Title: "Tesla Model 3 - Electric Innovation"
Description: "Sleek design meets cutting-edge technology"
Alt Text: "Red Tesla Model 3 parked in front of modern building"
Link: "https://www.tesla.com/model3"
Image Data: [BASE64_IMAGE_DATA]
```

### 6. Create Pin (URL)
```
Create a new Pinterest pin using image URL
Access Token: [YOUR_ACCESS_TOKEN]
Board ID: [BOARD_ID]
Title: "Tesla Cybertruck - Future of Trucks"
Description: "Revolutionary electric pickup truck design"
Alt Text: "Tesla Cybertruck with angular metallic design"
Link: "https://www.tesla.com/cybertruck"
Media URL: "https://example.com/cybertruck-image.jpg"
```

### 7. Delete Pin
```
Delete a Pinterest pin
Access Token: [YOUR_ACCESS_TOKEN]
Pin ID: [PIN_ID_TO_DELETE]
```

### 8. Create Sandbox Board
```
Create a new Pinterest sandbox board
Access Token: [SANDBOX_ACCESS_TOKEN]
Name: "Test Tesla Board"
Description: "Testing Pinterest API with Tesla content"
Privacy: "PUBLIC"
```

### 9. Get Sandbox Boards
```
Fetch boards from Pinterest Sandbox environment
Access Token: [SANDBOX_ACCESS_TOKEN]
```

## 🧪 ADVANCED TESTING SCENARIOS

### Multi-Tool Research Flow
```
1. First, search for Tesla's latest financial results using Tavily Search
2. Then, verify the key claims using Cross-Platform Fact Verification
3. Finally, create a Pinterest board about Tesla investments and pin relevant content
```

### Content Analysis Pipeline
```
1. Use Jina Reader to analyze Tesla's sustainability report
2. Extract key metrics using Firecrawl Extract
3. Verify claims using Jina Grounding
4. Create Pinterest board with sustainability content
```

### Comprehensive Website Analysis
```
1. Map Tesla's website structure using Firecrawl Map
2. Crawl key product pages using Firecrawl Crawl
3. Extract product data using Firecrawl Extract
4. Create Pinterest boards for each vehicle category
```

## 🎯 TESTING CHECKLIST

### For Each Tool:
- [ ] Tool executes without errors
- [ ] Parameters are correctly validated
- [ ] Response format is consistent
- [ ] Error handling works properly
- [ ] Smart defaults are applied
- [ ] Results are relevant and accurate

### Expected Success Metrics:
- [ ] **90%+ accuracy** in tool selection
- [ ] **Response time** < 30 seconds per tool
- [ ] **Error rate** < 10% for valid inputs
- [ ] **Parameter validation** catches invalid inputs
- [ ] **Smart defaults** improve user experience

### Error Testing:
- [ ] Invalid access tokens
- [ ] Malformed URLs
- [ ] Non-existent board/pin IDs
- [ ] Network timeout scenarios
- [ ] Invalid image formats
- [ ] Missing required parameters

## 🔧 SETUP REQUIREMENTS

### Environment Variables Needed:
```bash
# OMNISEARCH
TAVILY_API_KEY=your_tavily_key
JINA_API_KEY=your_jina_key
FIRECRAWL_API_KEY=your_firecrawl_key
BRAVE_API_KEY=your_brave_key
KAGI_API_KEY=your_kagi_key
PERPLEXITY_API_KEY=your_perplexity_key

# PINTEREST
PINTEREST_CLIENT_ID=your_pinterest_client_id
PINTEREST_CLIENT_SECRET=your_pinterest_client_secret
```

### OAuth Setup:
1. Get Pinterest OAuth URL using the tool
2. Complete OAuth flow to get access token
3. Use access token for all Pinterest operations

## 📊 PERFORMANCE TESTING

### Load Testing:
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  # Run tool test in background
  echo "Testing tool $i"
done
```

### Response Time Testing:
```bash
# Measure response times
time [tool_command]
```

### Memory Usage:
```bash
# Monitor memory usage during testing
top -p [server_pid]
```

This comprehensive testing suite will validate all tools across both servers and ensure they meet the 90%+ accuracy target with proper error handling and performance optimization.
