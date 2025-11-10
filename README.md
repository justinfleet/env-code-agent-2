# env-code-agent

🤖 **Autonomous API cloning system** that uses LLM-powered agents to explore APIs and generate Fleet-compliant environments.

## Overview

env-code-agent is an **agentic coding system** that:

1. 🔍 **Autonomously explores** target APIs using Claude as the decision-maker
2. 📋 **Generates specifications** by synthesizing exploration findings
3. ⚡ **Writes production code** that implements the API as a Fleet environment
4. ✅ **Fleet-compliant** output (seed.db, deterministic, backend-driven)

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Exploration Agent (LLM-driven)          │
│  "I'll test /api/products... Found pagination"  │
│  "Now checking /api/products/1... Got it!"      │
└─────────────────┬───────────────────────────────┘
                  │ Observations & findings
                  ↓
┌─────────────────────────────────────────────────┐
│      Specification Builder (LLM synthesis)      │
│  Generates: OpenAPI spec + DB schema + logic    │
└─────────────────┬───────────────────────────────┘
                  │ Structured specification
                  ↓
┌─────────────────────────────────────────────────┐
│      Code Generator Agent (LLM coding)          │
│  Writes: Express server + SQLite + routes       │
└─────────────────┬───────────────────────────────┘
                  │ Generated environment
                  ↓
                Fleet-compliant environment ready! ✅
```

## Quick Start

### Prerequisites

- Node.js 20+
- Anthropic API key ([get one here](https://console.anthropic.com/))
- Target API running locally or remotely

### Installation

```bash
# Clone the repo
git clone https://github.com/justinfleet/env-code-agent.git
cd env-code-agent

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Usage

```bash
# Clone a local API
pnpm clone http://localhost:3000

# Clone with custom output
OUTPUT_DIR=./my-clone pnpm clone http://localhost:3000
```

### Run the Generated Environment

```bash
cd output/cloned-env
pnpm install
pnpm dev
```

## How It Works

### Phase 1: Autonomous Exploration

The **Exploration Agent** uses Claude to intelligently explore the API:

```
Agent: "I'll start by checking /health and /api"
Agent: "Found /api/products returning an array"
Agent: "Let me test /api/products/1 for single item"
Agent: "Testing pagination with ?page=2"
Agent: "Looking for related endpoints like /api/categories"
```

The LLM **decides what to test next** based on what it discovers.

### Phase 2: Specification Generation

The **Specification Agent** synthesizes findings into structured format:

```json
{
  "endpoints": [
    {
      "path": "/api/products/search",
      "method": "GET",
      "logic": "Full-text search with pagination"
    }
  ],
  "database": {
    "tables": [
      {
        "name": "products",
        "fields": [...]
      }
    ]
  }
}
```

### Phase 3: Code Generation

The **Code Generator Agent** writes production-ready code:

- ✅ Express + TypeScript server
- ✅ SQLite database with seed data
- ✅ Actual SQL queries (not mocks!)
- ✅ Fleet-compliant structure
- ✅ Proper error handling

## Example: Cloning Famazon

```bash
# Assuming famazon is running on :3000
pnpm clone http://localhost:3000

# Output:
🔍 PHASE 1: AUTONOMOUS API EXPLORATION
💭 Agent: I'll start by checking common patterns...
🔧 Tool: make_http_request { path: "/health" }
💭 Agent: Found API at /api, exploring endpoints...
✅ Exploration complete!

📋 PHASE 2: SPECIFICATION GENERATION
🏗️ Building API specification...
✅ Specification generated: 15 endpoints, 8 tables

⚡ PHASE 3: FLEET ENVIRONMENT GENERATION
🔧 Tool: write_file { path: "data/schema.sql" }
🔧 Tool: write_file { path: "src/index.ts" }
✅ Code generation complete!

🎉 CLONING COMPLETE!
```

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_key_here

# Optional
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # Model to use
OUTPUT_DIR=./output/cloned-env             # Output directory
MAX_ITERATIONS=50                          # Max agent iterations
```

### Supported Models

- `claude-sonnet-4-20250514` (default, recommended)
- `claude-3-5-sonnet-20241022`
- `claude-opus-4-20250514` (slower but more thorough)

## Fleet Compliance

Generated environments follow all Fleet standards:

- ✅ `seed.db` ready for immediate use
- ✅ `schema.sql` without CHECK constraints
- ✅ INTEGER AUTOINCREMENT primary keys
- ✅ WAL mode + foreign keys enabled
- ✅ DATABASE_PATH environment variable support
- ✅ Backend-driven (no localStorage dependencies)
- ✅ Deterministic behavior support

## Project Structure

```
env-code-agent/
├── src/
│   ├── core/
│   │   ├── llm-client.ts        # Anthropic API wrapper
│   │   ├── base-agent.ts        # Agentic loop framework
│   │   └── orchestrator.ts      # Main coordinator
│   ├── agents/
│   │   ├── exploration-agent.ts      # LLM-driven API explorer
│   │   ├── specification-agent.ts    # Spec generator
│   │   └── code-generator-agent.ts   # Code writer
│   ├── tools/
│   │   ├── tool-definitions.ts  # Tool schemas
│   │   └── tool-executor.ts     # Tool implementation
│   └── cli.ts                   # CLI entry point
├── output/                      # Generated environments
└── DESIGN_AGENTIC.md           # Architecture docs
```

## Development

```bash
# Run in development mode
pnpm dev clone http://localhost:3000

# Build for production
pnpm build

# Run built version
pnpm start clone http://localhost:3000
```

## Roadmap

- [x] Agentic exploration with LLM decision-making
- [x] Specification generation from observations
- [x] Code generation with Fleet compliance
- [ ] Validation agent with differential testing
- [ ] Iterative refinement loop
- [ ] MCP server generation
- [ ] SvelteKit client generation
- [ ] Support for authenticated APIs
- [ ] CLI tool cloning (non-HTTP)

## Contributing

This is an internal Fleet tool. For questions or contributions, contact the Fleet team.

## License

MIT

## Credits

Built by the Fleet team for automated environment generation.
