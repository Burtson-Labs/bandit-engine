# Custom MCP Tools Examples

## Adding Custom Tools to Bandit

Bandit now supports creating custom MCP (Model Context Protocol) tools that allow the AI to interact with external APIs and services. Here are some examples of powerful tools you can create:

### 1. GitHub Repository Information Tool

**Purpose:** Get real-time information about GitHub repositories

**Configuration:**
- **Name:** GitHub Repository Info
- **Description:** Get information about GitHub repositories, commits, and issues
- **Endpoint:** `/api/github/repo`
- **Method:** GET
- **Parameters:**
```json
{
  "type": "object",
  "properties": {
    "owner": {
      "type": "string",
      "description": "GitHub repository owner"
    },
    "repo": {
      "type": "string", 
      "description": "GitHub repository name"
    }
  },
  "required": ["owner", "repo"]
}
```

**Usage Example:**
> "What's the latest information about the microsoft/typescript repository?"

The AI will automatically use this tool to fetch current repository data including stars, forks, latest commits, and issues.

### 2. Weather Information Tool

**Purpose:** Get current weather and forecasts for any location

**Configuration:**
- **Name:** Weather API
- **Description:** Get current weather information for any location
- **Endpoint:** `/api/weather`
- **Method:** GET
- **Parameters:**
```json
{
  "type": "object",
  "properties": {
    "location": {
      "type": "string",
      "description": "City name or coordinates"
    },
    "units": {
      "type": "string",
      "description": "Temperature units (metric, imperial)",
      "enum": ["metric", "imperial"]
    }
  },
  "required": ["location"]
}
```

**Usage Example:**
> "What's the weather like in San Francisco today?"

### 3. Database Query Tool

**Purpose:** Execute SQL queries on configured databases

**Configuration:**
- **Name:** Database Query
- **Description:** Execute SQL queries on configured databases
- **Endpoint:** `/api/database/query`
- **Method:** POST
- **Parameters:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "SQL query to execute"
    },
    "database": {
      "type": "string",
      "description": "Database connection name"
    }
  },
  "required": ["query"]
}
```

**Usage Example:**
> "Show me the top 10 customers by revenue from our sales database"

### 4. CRM Integration Tool

**Purpose:** Access customer data from Salesforce or similar CRM systems

**Configuration:**
- **Name:** CRM Integration
- **Description:** Access customer data from Salesforce or similar CRM systems
- **Endpoint:** `/api/crm/contact`
- **Method:** GET
- **Parameters:**
```json
{
  "type": "object",
  "properties": {
    "contactId": {
      "type": "string",
      "description": "Contact ID to retrieve"
    },
    "email": {
      "type": "string",
      "description": "Contact email to search for"
    }
  },
  "required": []
}
```

**Usage Example:**
> "Get me the contact information for john.doe@example.com"

### 5. System Status Tool

**Purpose:** Monitor server health and system metrics

**Configuration:**
- **Name:** System Status
- **Description:** Check system health, server status, and performance metrics
- **Endpoint:** `/api/system/status`
- **Method:** GET
- **Parameters:**
```json
{
  "type": "object",
  "properties": {
    "component": {
      "type": "string",
      "description": "Specific component to check (optional)",
      "enum": ["database", "cache", "api", "storage"]
    }
  },
  "required": []
}
```

**Usage Example:**
> "How is our system performing right now? Any issues I should know about?"

## How to Create Custom Tools

1. **Open Management Panel:** Navigate to Settings → MCP Tools
2. **Click "Add Custom Tool":** This opens the tool creation modal
3. **Choose a Template:** Select from GitHub, Weather, Database, CRM, or start from scratch
4. **Configure the Tool:**
   - Enter a descriptive name
   - Write a clear description of what the tool does
   - Set the API endpoint path
   - Choose the HTTP method (GET, POST, PUT, DELETE)
   - Define the parameters schema in JSON format
5. **Test the Tool:** Use the "Test Tool" button to verify it works
6. **Enable and Use:** Toggle the tool on and start chatting!

## Tool Features

### Built-in vs Custom Tools
- **Built-in Tools:** Come pre-configured (like the health check tool) with a blue "Built-in" badge
- **Custom Tools:** Created by you with a purple "Custom" badge
- **Edit/Delete:** Custom tools can be edited or deleted, built-in tools cannot

### Smart Parameter Handling
The AI automatically understands how to use your tools based on:
- The tool description
- Parameter schemas
- Usage context in conversations

### Error Handling
Tools gracefully handle errors and provide helpful feedback:
- Network connection issues
- API authentication problems
- Invalid parameters
- Service unavailability

### Real-time Execution
When the AI uses a tool, you'll see:
1. **"🔍 Running diagnostics..."** (for diagnostic tools)
2. **"🔄 Executing tool_name..."** (for other tools)
3. Rich, formatted results with analysis

## Advanced Use Cases

### Multi-step Workflows
The AI can chain multiple tools together:
> "Check our system status, then if there are any database issues, run a query to show recent error logs"

### Contextual Tool Selection
The AI chooses the right tool based on context:
> "What's the weather like where our main office is located?" 
(AI uses location from company data + weather tool)

### Data Correlation
Tools can work together to provide insights:
> "How does our website traffic correlate with recent GitHub commits?"
(AI uses GitHub tool + analytics tool + correlation analysis)

## Security & Best Practices

1. **Endpoint Security:** Ensure your API endpoints are properly secured
2. **Authentication:** Tools inherit authentication from the gateway service
3. **Rate Limiting:** Implement appropriate rate limits on your APIs
4. **Data Validation:** Always validate parameters before processing
5. **Error Handling:** Provide meaningful error messages
6. **Documentation:** Write clear descriptions for the AI to understand

## Future Enhancements

- Visual tool builder with drag-and-drop interface
- Tool marketplace for sharing configurations
- Advanced authentication options (OAuth, API keys)
- Tool performance analytics
- Webhook support for real-time updates
- Tool composition and workflows

---

*Bandit's MCP tool system makes it incredibly easy to extend the AI's capabilities with any API or service. The combination of smart AI understanding and real-time execution creates a powerful platform for building AI-powered applications that can interact with your entire technology stack.*
