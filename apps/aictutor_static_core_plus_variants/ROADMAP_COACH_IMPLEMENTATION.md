# Roadmap AI Coach Implementation Guide

## Overview
Add a high-level AI coach to help students navigate their learning roadmap, separate from the existing task-specific tutor.

## Architecture

### Two AI Chat Experiences

#### 1. Roadmap Coach (`/tasks` page)
- **Purpose**: Strategic learning guidance
- **Focus**: Path planning, motivation, concept overviews
- **API**: `/api/roadmap-coach`
- **Model**: Claude Sonnet (same as task tutor)

#### 2. Task Tutor (`/learn` page) - EXISTING
- **Purpose**: Tactical coding assistance
- **Focus**: Code hints, debugging, test running
- **API**: `/api/tutor` (already implemented)
- **Component**: `ChatPanel.tsx` (already working)

## Files to Create

### 1. API Route: `/api/roadmap-coach/route.ts`

```typescript
// apps/web/app/api/roadmap-coach/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const ROADMAP_COACH_PROMPT = `You are a supportive coding career mentor helping students navigate their learning roadmap.

# Your Role
- Guide students in choosing their next learning project
- Explain why certain prerequisites matter
- Provide architectural/conceptual overviews of projects
- Motivate and set realistic expectations
- Help students understand the "big picture" of web development

# Response Format
Respond conversationally in plain text. Be encouraging, concise, and actionable.

# Guidelines
- Ask about their goals and experience level
- Suggest tasks that match their current skills (not too easy, not too hard)
- Explain concepts at a high level before they dive into coding
- Connect tasks to real-world applications
- Celebrate completed milestones

# Examples
Student: "Should I learn CSS before JavaScript?"
You: "Great question! Yes, I'd recommend CSS first. Here's why: CSS teaches you visual thinking and layout principles that make you a better frontend developer. Once you can style pages, adding JavaScript interactivity becomes much more rewarding because you'll have a solid foundation to build on. Your roadmap has a CSS basics task - want to hear what it covers?"

Student: "What will I build in the API integration project?"
You: "Excellent! The API integration project teaches you how real web apps work. You'll fetch data from external services (like weather APIs or GitHub), handle loading states, and display live data. This is a crucial skill - most modern apps are just elegant interfaces for APIs. Think of it as learning the 'plumbing' that powers sites like Twitter or Spotify."

# Context You'll Receive
- Available tasks with titles, descriptions, difficulty levels, concepts
- Completed task IDs
- Current filter/focus (if any)
`;

export async function POST(req: NextRequest) {
  try {
    const { userMessage, context } = await req.json();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Missing userMessage" },
        { status: 400 }
      );
    }

    // Build context string
    const contextStr = context ? JSON.stringify(context, null, 2) : "No context provided";
    const prompt = `Context:\n${contextStr}\n\nStudent: ${userMessage}`;

    // Call Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.8, // Slightly higher for more conversational responses
      system: ROADMAP_COACH_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Extract text
    const textContent = message.content.find(block => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return NextResponse.json({
      response: textContent.text
    });

  } catch (error) {
    console.error("Roadmap coach error:", error);
    return NextResponse.json(
      { error: "Failed to get coach response" },
      { status: 500 }
    );
  }
}
```

### 2. Component: `RoadmapCoachPanel.tsx`

```typescript
// apps/web/app/components/RoadmapCoachPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface RoadmapCoachPanelProps {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: number;
    concepts: Array<{ concept: { id: string; name: string } }>;
  }>;
  completedTaskIds: string[];
  selectedTaskId?: string | null;
}

export function RoadmapCoachPanel({
  tasks,
  completedTaskIds,
  selectedTaskId
}: RoadmapCoachPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your learning coach. I can help you choose your next project, understand concepts, or explain what you'll learn in any task. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    return {
      availableTasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        concepts: t.concepts.map(tc => tc.concept.name)
      })),
      completedTaskIds,
      selectedTaskId,
      progressSummary: {
        totalTasks: tasks.length,
        completedTasks: completedTaskIds.length,
        percentComplete: Math.round((completedTaskIds.length / tasks.length) * 100)
      }
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context = buildContext();

      const res = await fetch("/api/roadmap-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, context })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      // Add assistant response
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error("Coach error:", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "system",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons
  const quickActions = [
    "What should I learn next?",
    "Explain this task to me",
    "What's my progress?",
    "Why learn this concept?"
  ];

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <h2 className="text-white font-semibold text-lg">🎓 Learning Coach</h2>
        <p className="text-blue-100 text-xs mt-1">
          Get guidance on your learning path
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : msg.role === "system"
                  ? "bg-red-100 text-red-800 text-sm"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(action => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="text-xs bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-50 text-gray-700"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your roadmap..."
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}
```

### 3. Update Tasks Page

```typescript
// apps/web/app/tasks/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { TaskCard } from '../components/TaskCard';
import { RoadmapCoachPanel } from '../components/RoadmapCoachPanel';
import { useRouter } from 'next/navigation';

// ... existing interface ...

export default function TasksPage() {
  // ... existing state ...
  const [showCoach, setShowCoach] = useState(true); // Toggle coach panel
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // ... existing functions ...

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Path</h1>
            <p className="text-gray-600 mt-1">Choose your next challenge</p>
          </div>
          <button
            onClick={() => setShowCoach(!showCoach)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCoach ? 'Hide' : 'Show'} Coach
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Existing filters and task grid */}
            {/* ... */}
          </div>
        </div>

        {/* Coach Sidebar */}
        {showCoach && (
          <div className="w-96 flex-shrink-0">
            <div className="h-full">
              <RoadmapCoachPanel
                tasks={tasks}
                completedTaskIds={completedTaskIds}
                selectedTaskId={selectedTaskId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Benefits of This Approach

### 1. **Separation of Concerns**
- **Roadmap Coach**: Strategic "what/why" questions
- **Task Tutor**: Tactical "how" questions

### 2. **Context-Appropriate Help**
- Students browsing tasks get **learning path guidance**
- Students actively coding get **implementation help**

### 3. **Better UX**
- No context-switching confusion
- Each AI has a clear, focused role
- Students know which to ask based on their current activity

### 4. **Scalability**
- Can add conversation history per task
- Can track which questions lead to task completion
- Can personalize recommendations based on chat patterns

## Quick Start

1. **Create API route**: `/api/roadmap-coach/route.ts`
2. **Create component**: `RoadmapCoachPanel.tsx`
3. **Update tasks page**: Add coach sidebar
4. **Test**: Deploy and verify both coaches work independently

## Future Enhancements

- **Persistent chat history** per user
- **Smart task recommendations** based on chat analysis
- **Progress tracking** tied to coach conversations
- **Mentor handoff**: "Let me send you to the task tutor for hands-on help"
- **Multi-turn reasoning**: Use extended thinking for complex path planning
