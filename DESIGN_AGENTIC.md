# Agentic Architecture for env-code-agent

## Vision

An LLM-powered system that autonomously explores APIs/CLIs, builds specifications, and generates Fleet-compliant environments through iterative refinement.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Phase 1: Exploration Agent                   │
│  - LLM decides what to test                                  │
│  - Generates intelligent queries                             │
│  - Reasons about responses                                   │
│  - Builds understanding iteratively                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Phase 2: Specification Generation               │
│  - LLM synthesizes observations into spec                    │
│  - Creates OpenAPI/structured format                         │
│  - Documents inferred behavior                               │
│  - Identifies data models and relationships                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Phase 3: Code Generation Agent                  │
│  - LLM reads specification                                   │
│  - Generates Fleet environment code                          │
│  - Creates: server + database + MCP + client                 │
│  - Ensures Fleet compliance                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                Phase 4: Validation & Refinement              │
│  - Run generated environment                                 │
│  - Test against original API                                 │
│  - LLM identifies gaps                                       │
│  - Iteratively improve                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       └──────→ [Loop back if needed]
```

## Phase 1: Exploration Agent

### Responsibilities
- **Autonomous Discovery**: LLM decides what to explore based on findings
- **Intelligent Querying**: Generate test cases that reveal behavior
- **Relationship Mapping**: Understand how endpoints relate
- **State Tracking**: Observe how actions affect system state

### Implementation

```typescript
class ExplorationAgent {
  private llm: AnthropicClient;
  private observations: Observation[];
  private explorationQueue: ExplorationTask[];

  async explore(targetUrl: string): Promise<ExplorationResult> {
    // 1. Initial discovery
    const initialEndpoints = await this.discoverBasicEndpoints();

    // 2. LLM-driven exploration loop
    while (this.shouldContinueExploring()) {
      // Ask LLM what to test next
      const nextAction = await this.llm.complete({
        prompt: this.buildExplorationPrompt(),
        tools: [
          'make_request',      // Execute HTTP request
          'analyze_response',  // Store observation
          'hypothesize'        // Form theories about behavior
        ]
      });

      // Execute LLM's decision
      await this.executeAction(nextAction);

      // Update understanding
      this.observations.push(nextAction.observation);
    }

    return {
      endpoints: this.discoveredEndpoints,
      observations: this.observations,
      relationships: this.inferredRelationships
    };
  }

  private buildExplorationPrompt(): string {
    return `
You are exploring an API to understand its structure and behavior.

## What you've discovered so far:
${this.formatObservations()}

## Your goal:
1. Understand all available endpoints
2. Infer data models and relationships
3. Identify CRUD patterns
4. Map state-changing operations
5. Understand validation rules

## What should you test next?
Decide on the next request to make and explain your reasoning.
    `;
  }
}
```

### Key LLM Prompts

**Discovery Prompt:**
```
I've found endpoint GET /api/products that returns:
{
  "products": [...],
  "total": 150,
  "page": 1
}

What should I test next to understand this API better?
Options:
1. Test pagination (GET /api/products?page=2)
2. Look for single item endpoint (GET /api/products/{id})
3. Search for related endpoints (POST /api/products)
4. Test filtering/sorting

Choose and explain your reasoning.
```

**Hypothesis Formation:**
```
Observations:
- POST /api/cart returns {"cart_id": "abc123"}
- GET /api/cart/abc123 returns cart contents
- POST /api/cart/abc123/items adds items

What can you infer about the data model and relationships?
```

## Phase 2: Specification Generation

### Responsibilities
- Synthesize observations into structured spec
- Generate OpenAPI documentation
- Document inferred business logic
- Create data model diagrams

### Implementation

```typescript
class SpecificationBuilder {
  private llm: AnthropicClient;

  async buildSpecification(exploration: ExplorationResult): Promise<APISpecification> {
    // LLM synthesizes observations
    const spec = await this.llm.complete({
      prompt: `
Based on these observations, generate a complete API specification:

${JSON.stringify(exploration.observations, null, 2)}

Generate:
1. OpenAPI spec with all endpoints
2. Database schema (tables, relationships)
3. Business logic documentation
4. Validation rules
5. Authentication requirements

Format as structured JSON.
      `
    });

    return this.parseSpecification(spec);
  }
}
```

### Output Format

```json
{
  "openapi": "3.0.0",
  "endpoints": [...],
  "database": {
    "tables": [
      {
        "name": "products",
        "fields": [...],
        "relationships": [...]
      }
    ]
  },
  "businessLogic": {
    "search": "Full-text search on title and description",
    "cart": "Session-based, expires after 24h",
    "orders": "Requires payment before creation"
  }
}
```

## Phase 3: Code Generation Agent

### Responsibilities
- Read specification
- Generate Fleet-compliant code
- Write server + database + MCP + client
- Ensure determinism and standards

### Implementation

```typescript
class CodeGeneratorAgent {
  private llm: AnthropicClient;

  async generateEnvironment(spec: APISpecification): Promise<void> {
    // LLM generates code in phases

    // 1. Database schema
    await this.llm.complete({
      prompt: `Generate SQLite schema for this data model: ${spec.database}`,
      tools: ['write_file']
    });

    // 2. Server routes
    await this.llm.complete({
      prompt: `Generate Express routes implementing: ${spec.endpoints}`,
      tools: ['write_file', 'read_file']
    });

    // 3. MCP server
    await this.llm.complete({
      prompt: `Generate MCP server wrapping these endpoints: ${spec.endpoints}`,
      tools: ['write_file']
    });

    // 4. Client UI
    await this.llm.complete({
      prompt: `Generate SvelteKit client for: ${spec.endpoints}`,
      tools: ['write_file']
    });
  }
}
```

### Key Prompts

**Database Generation:**
```
Generate a Fleet-compliant SQLite schema for this API:

Data model:
${spec.database}

Requirements:
- INTEGER AUTOINCREMENT primary keys
- No CHECK constraints
- WAL mode enabled
- Foreign key relationships
- Sample seed data

Write to: data/schema.sql
```

**Route Implementation:**
```
Implement this endpoint:

GET /api/products/search?q={query}&category={cat}

Specification:
- Full-text search on title and description
- Filter by category if provided
- Sort by relevance
- Paginate with limit=20

Generate Express route with actual SQL queries.
```

## Phase 4: Validation & Refinement

### Responsibilities
- Test generated environment
- Compare with original API
- Identify discrepancies
- Iterate to improve

### Implementation

```typescript
class ValidationAgent {
  private llm: AnthropicClient;

  async validate(originalUrl: string, cloneUrl: string): Promise<ValidationResult> {
    // Generate test cases
    const tests = await this.generateTests();

    // Run differential testing
    const results = [];
    for (const test of tests) {
      const original = await fetch(`${originalUrl}${test.path}`);
      const clone = await fetch(`${cloneUrl}${test.path}`);

      // LLM compares responses
      const comparison = await this.llm.complete({
        prompt: `
Compare these two API responses:

Original: ${original.body}
Clone: ${clone.body}

Are they semantically equivalent? Identify any gaps.
        `
      });

      results.push(comparison);
    }

    // LLM suggests improvements
    const improvements = await this.llm.complete({
      prompt: `
Based on these test results, what code changes are needed?
${results}
      `
    });

    return { results, improvements };
  }
}
```

## Tool Integration

The LLM agents need these tools:

```typescript
const tools = [
  {
    name: 'make_http_request',
    description: 'Make HTTP request to target API',
    parameters: { url, method, body, headers }
  },
  {
    name: 'write_file',
    description: 'Write code to file',
    parameters: { path, content }
  },
  {
    name: 'read_file',
    description: 'Read existing code',
    parameters: { path }
  },
  {
    name: 'run_sql_query',
    description: 'Query database',
    parameters: { query }
  },
  {
    name: 'run_command',
    description: 'Execute shell command',
    parameters: { command }
  }
];
```

## Example Flow

```
1. User: "Clone http://localhost:3000"

2. Exploration Agent (LLM):
   - "I'll start by checking /health and /api"
   - "Found /api/products, let me test it"
   - "Returns array, let me try /api/products/1"
   - "Found pagination, let me test ?page=2"
   - [Continues exploring autonomously]

3. Specification Builder (LLM):
   - "Based on observations, this is an e-commerce API"
   - "I see products, cart, orders tables"
   - "Search uses FTS, cart is session-based"
   - [Generates structured spec]

4. Code Generator (LLM):
   - "I'll create the database schema first"
   - "Now implementing the products routes"
   - "Adding MCP server wrapper"
   - "Creating SvelteKit client"

5. Validation Agent (LLM):
   - "Testing /api/products/search"
   - "Response matches! ✓"
   - "Testing cart operations"
   - "Found gap: cart persistence issue"
   - "Suggesting fix: add session middleware"

6. Refinement:
   - Apply fixes
   - Re-test
   - Iterate until >90% fidelity
```

## Implementation Plan

### Week 1: Core Infrastructure
- [ ] Set up Anthropic Claude SDK integration
- [ ] Create base Agent class
- [ ] Implement tool execution framework
- [ ] Build observation storage

### Week 2: Exploration Agent
- [ ] LLM-driven endpoint discovery
- [ ] Intelligent test case generation
- [ ] Relationship inference
- [ ] State tracking

### Week 3: Specification & Code Generation
- [ ] Specification builder with LLM
- [ ] Code generator agent
- [ ] Fleet compliance checker
- [ ] File generation system

### Week 4: Validation & Refinement
- [ ] Differential testing
- [ ] Gap analysis
- [ ] Iterative improvement loop
- [ ] Fidelity scoring

## Success Criteria

- **Autonomy**: System explores APIs without human guidance
- **Coverage**: Discovers >90% of endpoints automatically
- **Quality**: Generated code passes >80% of differential tests
- **Compliance**: Output is Fleet-compliant by default
- **Iteration**: Can refine output based on test results

## Next Steps

1. Implement base Agent framework with Claude SDK
2. Build exploration loop with LLM decision-making
3. Test on famazon API
4. Iterate and refine
