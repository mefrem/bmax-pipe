# BMAX

**Gauntlet AI App Factory**

Claude + BMAD orchestration in two clicks.

Production: [bmax-pipe.vercel.app](https://bmax-pipe.vercel.app)

## Overview

**bmax** is an orchestration layer that sits on top of two powerful systems:

1. **[BMAD](https://github.com/bmadcode/BMAD-METHOD)** - AI-driven Agile Development
2. **Claude Code** (on web) - Anthropic's AI coding assistant

## What BMAX Does

_BMAD_ is a powerful framework for AI software development, instantiating Agile best practices for project management (and context efficiency), not to mention high standards for quality assurance, testing, etc. However, it still imposes strong human-in-the-loop checks, confirmations, and elicitations. _BMAX_ is an orchestration layer on top 1) BMAD, 2) Claude Code on the Web, and 3) your initial project documentation (brief, etc.)

BMAX consists primarily of 1) transposing BMAD agents into a format Claude can recognize to invoke as subagents, and 2) prompts that orchestrate the BMAD process through to full implementation.

### 1. Agent Transposition

Transposes BMAD specialist agents (@pm, @architect, @frontend-spec, etc.) into your project's `.claude/` directory, making them available for the main Claude thread to invoke as needed during development.

### 2. Orchestration Prompts

Provides battle-tested orchestration prompts that encode evolving insights and best practices for automating BMAD-based implementation. These prompts guide Claude Code through the entire development process.

#### Two Prompts

**YOLO Mode** (`orch-full.md`)

- Start with just a brief or idea
- Have Claude Code develop the entire project from scratch
- Ideal for demonstrating projects, prototyping, and greenfield projects

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

## Deployment

[![Vercel Deploy Button](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fmefrem%2Fbmax-pipe)
