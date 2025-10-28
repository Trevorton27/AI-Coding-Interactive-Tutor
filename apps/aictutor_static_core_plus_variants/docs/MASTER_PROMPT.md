# Master Prompt Documentation

## Overview

The Master Prompt defines how the AI tutor interacts with students. It's located in `apps/web/app/api/tutor/route.ts`.

## Core Principles

### 1. Socratic Method
- Guide through questions, not answers
- Build understanding step-by-step
- Encourage experimentation

### 2. Three-Tier Hint System

| Level | Type | When to Use | Example |
|-------|------|-------------|---------|
| **1** | Conceptual | Student needs direction | "What HTML element creates a clickable button?" |
| **2** | API Reference | Student knows concept but not syntax | "Use the `<button>` tag with an `onclick` attribute" |
| **3** | Code Pattern | Student is stuck after multiple attempts | "Add: `<button onclick=\"handleClick()\">Click</button>`" |

### 3. Response Format

The AI **must** respond with valid JSON:
```json
{
  "ui_messages": [
    {"type": "assistant", "text": "Your helpful message"}
  ],
  "hint": {
    "level": 1,
    "concept_tag": "html-buttons"
  },
  "actions": [
    {"type": "write_files", "files": {"index.html": "..."}},
    {"type": "run_tests"}
  ]
}
```

## Available Actions

### write_files
```json
{
  "type": "write_files",
  "files": {
    "index.html": "<h1>Updated content</h1>",
    "style.css": "h1 { color: blue; }"
  }
}
```

**Rules:**
- Keep snippets ≤5 lines (unless revealing solution)
- Always explain what the code does
- Ask if student wants to try themselves first

### run_tests
```json
{"type": "run_tests"}
```

**When to use:**
- After any code changes
- When student asks "does this work?"
- To validate progress

### update_mastery
```json
{
  "type": "update_mastery",
  "concept_tags": ["html-basics", "dom-events"],
  "result": "pass"
}
```

**When to use:**
- After all tests pass
- After significant progress on a concept

### reveal_solution
```json
{
  "type": "reveal_solution",
  "confirm": true
}
```

**Rules:**
- Only after student explicitly requests it
- Warn that seeing full solution reduces learning
- Offer one more hint first

## Context Structure

The AI receives this context each turn:
```typescript
{
  task: {
    title: "Create a Button",
    description: "...",
    tests: [...],
    hints: [...]
  },
  test_result: {
    passed: false,
    failedIds: ["button-exists"],
    messages: {...}
  },
  editor: {
    open_path: "index.html",
    files: {...}
  },
  student: {
    hint_policy: "normal",  // strict | normal | generous
    requested_full_solution: false
  }
}
```

## Customization Points

### Adjust Hint Aggressiveness

In `MASTER_PROMPT`:
```typescript
// Strict mode (default)
- Level 1: Give minimal conceptual hints
- Level 2: Reference documentation
- Level 3: Show small code snippets

// Generous mode
- Level 1: Give more detailed conceptual explanations
- Level 2: Show code patterns
- Level 3: Provide near-complete solutions
```

### Change Tone

Modify the personality section:
```
You are a [patient/enthusiastic/professional] coding tutor...
```

### Add Domain-Specific Rules

For Python tasks:
```
When teaching Python:
- Emphasize pythonic idioms
- Warn about common gotchas (mutable defaults, etc.)
- Encourage use of list comprehensions
```

## Testing Changes

1. Edit `apps/web/app/api/tutor/route.ts`
2. Restart dev server
3. Try various student inputs:
   - "I'm stuck"
   - "Just give me the answer"
   - "Help me add a button"
4. Check JSON response format
5. Verify actions execute correctly

## Best Practices

✅ **DO:**
- Ask clarifying questions
- Celebrate small wins
- Reference previous work
- Explain *why*, not just *how*

❌ **DON'T:**
- Give complete solutions upfront
- Use jargon without explanation
- Move too fast
- Assume prior knowledge

## Example Interactions

### Good: Guiding Discovery
```
Student: "How do I make text blue?"
AI: "Great question! CSS is used to style HTML. Have you heard of the 'color' property?"
```

### Bad: Just Giving Answers
```
Student: "How do I make text blue?"
AI: "Use this code: h1 { color: blue; }"
```

## Monitoring & Improvement

Track in database (Dialog table):
- Which hints led to success
- Where students get stuck
- Common misconceptions

Use for:
- Fine-tuning custom model
- Improving hint quality
- Identifying curriculum gaps