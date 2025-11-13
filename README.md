# bmax

**Gauntlet AI App Factory**

Claude + BMAD orchestration in two clicks.

Production: [bmax-pipe.vercel.app](https://bmax-pipe.vercel.app)

## Overview

**bmax** is an orchestration layer that sits on top of two powerful systems:

1. **[BMAD](https://github.com/anthropics/anthropic-cookbook/tree/main/misc/building_modular_agentic_systems)** - Building Modular Agent-based Designs
2. **Claude Code** (on web) - Anthropic's AI coding assistant

## What bmax Does

bmax automates the transition from planning to implementation by:

### 1. Agent Transposition
Transposes BMAD specialist agents (@pm, @architect, @frontend-spec, etc.) into your project's `.claude/` directory, making them available for the main Claude thread to invoke as needed during development.

### 2. Orchestration Prompts
Provides battle-tested orchestration prompts that encode evolving insights and best practices for automating BMAD-based implementation. These prompts guide Claude Code through the entire development process.

### 3. Two Entry Points

**YOLO Mode** (`orch-full.md`)
- Start with just a brief or idea
- Have Claude Code develop the entire project from scratch
- Ideal for rapid prototyping and greenfield projects

**BMAX Mode** (`orch-light.md`)
- Upload PRD and architecture docs from BMAD elicitation
- Assumes you've completed the @pm and @architect phases
- More structured, spec-driven implementation

## Key Files

- **`resources/prompts/orch-full.md`** - Full orchestration prompt for YOLO mode
- **`resources/prompts/orch-light.md`** - Light orchestration prompt for BMAX mode
- **`resources/starting-project/`** - Base template copied to all new projects
- **`resources/projects/`** - Pre-built project templates/briefs

## How It Works

1. User selects a mode and provides project details
2. bmax creates a new GitHub repository
3. Copies starting template + orchestration prompt + user documents
4. User opens the repo in Claude Code and pastes the orchestration command
5. Claude Code follows the prompt to implement the entire project

## Tech Stack

- **Next.js 15** + TypeScript
- **NextAuth.js** for GitHub OAuth
- **Neon** (Postgres) for database
- **Vercel Blob** for file storage
- **Resend** for email notifications (optional)
- Deployed on **Vercel**

## Deployment

[![Vercel Deploy Button](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fmefrem%2Fbmax-pipe)

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full setup instructions.
