/**
 * Enhances tasks with:
 * 1. Detailed, conversational descriptions
 * 2. Alternative solutions (2-3 per task)
 * 3. Real-world context and explanations
 *
 * Uses Claude AI to generate high-quality content
 */
import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  scaffold: Record<string, string>;
  tests: Array<{ id: string; code: string; label: string }>;
  solution?: Record<string, string>;
}

interface EnhancedTask extends Task {
  detailedDescription: string;
  realWorldContext: string;
  alternativeSolutions: Array<{
    label: string;
    files: Record<string, string>;
    explanation: string;
  }>;
}

const ENHANCEMENT_PROMPT = `You are a technical writing expert creating educational content for a coding tutorial platform.

Your task is to enhance a coding challenge with rich, engaging content that helps students learn effectively.

Given a challenge, provide:

1. **Detailed Description** (2-3 paragraphs, conversational tone):
   - Explain what the student needs to build
   - Break down the key concepts they'll learn
   - Make it engaging and approachable
   - Use "you" to address the student directly

2. **Real-World Context** (1-2 paragraphs):
   - Explain WHY this skill matters in real web development
   - Give concrete examples of where this is used
   - Connect to actual websites or applications students know
   - Make it practical and relevant

3. **Alternative Solutions** (2-3 different approaches):
   - Each solution should be DIFFERENT in approach or structure
   - Provide complete, working code for each
   - Explain the trade-offs and when to use each approach
   - Label them clearly (e.g., "Semantic HTML Approach", "Minimal Approach", "Accessible Approach")

Return your response as JSON:
{
  "detailedDescription": "...",
  "realWorldContext": "...",
  "alternativeSolutions": [
    {
      "label": "Approach name",
      "files": {
        "index.html": "complete code",
        "style.css": "complete code",
        "script.js": "complete code"
      },
      "explanation": "Why and when to use this approach"
    }
  ]
}`;

async function enhanceTask(task: Task): Promise<EnhancedTask> {
  console.log(`Enhancing: ${task.title}`);

  const taskContext = `
Challenge: ${task.title}
Level: ${task.difficulty}
Category: ${task.category}
Current Description: ${task.description}

Tests to pass:
${task.tests.map((t) => `- ${t.label}`).join("\n")}

Scaffold code:
${Object.entries(task.scaffold)
  .map(([file, code]) => `${file}:\n${code}`)
  .join("\n\n")}

${task.solution ? `Example solution:\n${Object.entries(task.solution).map(([file, code]) => `${file}:\n${code}`).join("\n\n")}` : ""}
`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.7,
      system: ENHANCEMENT_PROMPT,
      messages: [
        {
          role: "user",
          content: `Enhance this coding challenge:\n\n${taskContext}`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = textContent.text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : textContent.text;
    const enhancement = JSON.parse(jsonStr);

    return {
      ...task,
      detailedDescription: enhancement.detailedDescription,
      realWorldContext: enhancement.realWorldContext,
      alternativeSolutions: enhancement.alternativeSolutions,
    };
  } catch (error) {
    console.error(`Error enhancing ${task.title}:`, error);
    // Return task with default enhancements
    return {
      ...task,
      detailedDescription: task.description,
      realWorldContext: `This skill is fundamental to web development and you'll use it frequently in real projects.`,
      alternativeSolutions: task.solution
        ? [
            {
              label: "Basic Solution",
              files: task.solution,
              explanation: "A straightforward approach that meets the requirements.",
            },
          ]
        : [],
    };
  }
}

async function main() {
  // Load tasks
  const cwd = process.cwd();
  let tasksPath = path.join(cwd, "apps/web/data/tasks.levels.json");
  if (!require("fs").existsSync(tasksPath)) {
    tasksPath = path.join(cwd, "data/tasks.levels.json");
  }

  console.log(`Loading tasks from: ${tasksPath}`);
  const tasks: Task[] = JSON.parse(await fs.readFile(tasksPath, "utf-8"));

  console.log(`Loaded ${tasks.length} tasks`);
  console.log("Starting enhancement process...\n");

  const enhancedTasks: EnhancedTask[] = [];

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(tasks.length / batchSize);
    console.log(`\nProcessing batch ${batchNum}/${totalBatches}`);

    const batchResults = await Promise.all(
      batch.map((task) => enhanceTask(task))
    );

    enhancedTasks.push(...batchResults);

    // Save progress after each batch
    const outputPath = path.join(path.dirname(tasksPath), "tasks.levels.enhanced.json");
    await fs.writeFile(outputPath, JSON.stringify(enhancedTasks, null, 2));

    console.log(`Saved progress: ${enhancedTasks.length}/${tasks.length} tasks`);

    // Rate limiting delay
    if (i + batchSize < tasks.length) {
      console.log("Waiting 2 seconds before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const outputPath = path.join(path.dirname(tasksPath), "tasks.levels.enhanced.json");
  await fs.writeFile(outputPath, JSON.stringify(enhancedTasks, null, 2));

  console.log(`\n✅ Enhanced all ${enhancedTasks.length} tasks!`);
  console.log(`Output saved to: ${outputPath}`);
}

main().catch(console.error);
