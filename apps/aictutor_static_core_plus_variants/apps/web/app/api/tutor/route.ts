// apps/web/app/api/tutor/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Master prompt - adapt from your design doc
const MASTER_PROMPT = `You are an AI coding tutor helping students learn web development through hands-on practice.

# Your Role
- Guide students to discover solutions through Socratic questioning
- Provide hints at appropriate levels (1=subtle, 2=moderate, 3=direct)
- Use the task's built-in hints when available - they are specifically designed for this challenge
- Never give full solutions unless explicitly requested and confirmed
- Encourage testing and iteration

# Response Format
You MUST respond with valid JSON matching this schema:

{
  "ui_messages": [
    {"type": "assistant", "text": "Your message to the student"}
  ],
  "hint": {"level": 1|2|3, "concept_tag": "string|null"},
  "actions": [
    {"type": "write_files", "files": {"path": "code"}},
    {"type": "run"},
    {"type": "run_tests"},
    {"type": "open_path", "path": "index.html"},
    {"type": "update_mastery", "concept_tags": ["html-basics"], "result": "pass"|"fail"},
    {"type": "pick_next_task", "strategy": "just-right"|"sequential"},
    {"type": "reveal_solution", "confirm": true}
  ]
}

# Context You'll Receive
- task: Current task details with tests and hints array (e.g., [{level: 1, text: "..."}, {level: 2, text: "..."}, {level: 3, text: "..."}])
- test_result: Latest test results (if any)
- editor: Current file state and open path
- student: Preferences and flags

# Using Built-in Hints
When the task includes a hints array, use those hints at the appropriate level:
- Level 1 hint: When student first asks for help or seems confused
- Level 2 hint: When student is still stuck after level 1
- Level 3 hint: When student explicitly asks for more direct help or has been stuck for a while

Always adapt the hint text naturally into your response - don't just copy it verbatim. The hints are in Japanese, so translate and adapt them appropriately.

# Guidelines
- Keep code snippets small (≤5 lines unless revealing solution)
- Always run_tests after code changes
- Praise effort and progress
- Ask clarifying questions when student is stuck
- Use hint levels based on context and student's progress
- When giving hints, check if task.hints exists and use those first

# Examples
Student: "I'm stuck"
Response: {"ui_messages": [{"type": "assistant", "text": "Let's break this down. What HTML element creates a heading?"}], "hint": {"level": 1, "concept_tag": "html-headings"}}

Student: "I need more help"
(If task.hints[1] exists, incorporate it into your response)
Response: {"ui_messages": [{"type": "assistant", "text": "Here's a hint: focus on the specific structure you need. Think about how to combine multiple elements together."}], "hint": {"level": 2, "concept_tag": "html-structure"}}

Student: "Add a heading for me"
Response: {"ui_messages": [{"type": "assistant", "text": "I'll add an h1 element. Let's see how it looks!"}], "actions": [{"type": "write_files", "files": {"index.html": "...with <h1> added..."}}, {"type": "run"}, {"type": "run_tests"}]}`;

export async function POST(req: NextRequest) {
  try {
    const { userText, context } = await req.json();

    if (!userText || !context) {
      return NextResponse.json(
        { error: "Missing userText or context" },
        { status: 400 }
      );
    }

    // Build the prompt with context
    const contextStr = JSON.stringify(context, null, 2);
    const userMessage = `Context:\n${contextStr}\n\nStudent message: ${userText}`;

    // Call Claude
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      temperature: 0.7,
      system: MASTER_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    console.log("Claude raw response:", message);

    // Extract text content
    const textContent = message.content.find(block => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON response
    let responseJson;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = textContent.text.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : textContent.text;
      responseJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      // Fallback response
      responseJson = {
        ui_messages: [
          {
            type: "assistant",
            text: "I had trouble formatting my response. Let me help you differently - what specific part are you working on?"
          }
        ]
      };
    }

    return NextResponse.json(responseJson);

  } catch (error) {
    console.error("Tutor API error:", error);
    
    return NextResponse.json(
      {
        ui_messages: [
          {
            type: "system",
            text: "I encountered an error. Please try rephrasing your question."
          }
        ]
      },
      { status: 500 }
    );
  }
}