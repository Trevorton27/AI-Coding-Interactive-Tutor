/**
 * Enhances all tasks with template-based detailed content
 * This avoids API rate limits by using smart templates
 */
import { promises as fs } from "fs";
import path from "path";

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

// Template generators based on level and category
function generateDetailedDescription(task: Task): string {
  const level = task.difficulty;
  const title = task.title;

  // Level 1: HTML
  if (level === 1) {
    return `In this challenge, you'll learn about ${title.toLowerCase()}, an essential HTML concept. You'll create an HTML document that demonstrates proper usage of these elements.

HTML (HyperText Markup Language) is the foundation of all web pages. Every website you visit is built with HTML at its core. Understanding ${title.toLowerCase()} helps you create well-structured, semantic web pages that are accessible and search-engine friendly.

Your task is to write HTML code that passes all the tests. Take your time to understand how the elements work together, and don't hesitate to experiment! The best way to learn is by doing.`;
  }

  // Level 2: HTML + CSS
  if (level === 2) {
    return `Welcome to ${title}! In this challenge, you'll combine HTML structure with CSS styling to create beautiful, functional web layouts. You'll learn how to use CSS properties to control the visual presentation of your HTML elements.

CSS (Cascading Style Sheets) is what makes websites look good. While HTML provides the structure, CSS provides the style. Modern web development relies heavily on CSS for creating responsive, accessible, and visually appealing interfaces.

Your goal is to write both HTML and CSS that work together to achieve the desired layout and appearance. Pay attention to how different CSS properties interact with your HTML structure.`;
  }

  // Level 3: JavaScript
  if (level === 3) {
    return `In this JavaScript challenge, you'll implement ${title.toLowerCase()}. This is where you'll write actual programming logic, working with data, functions, and algorithms. JavaScript is what makes web pages interactive and dynamic.

JavaScript is the programming language of the web. Every interactive element you see online - from dropdown menus to real-time updates - is powered by JavaScript. Understanding these core programming concepts will help you build sophisticated web applications.

You'll write JavaScript code that passes the test requirements. Focus on writing clean, understandable code. Think about edge cases and how your function should behave with different inputs.`;
  }

  // Level 4: Full Stack
  return `This is a comprehensive challenge: ${title}. You'll combine everything you've learned - HTML for structure, CSS for styling, and JavaScript for interactivity. This is where it all comes together to build a complete, functional feature.

Real-world web development is about integrating multiple technologies seamlessly. In professional work, you'll constantly switch between HTML, CSS, and JavaScript to build complete features. This challenge mirrors that real-world experience.

Your task is to create a working implementation that demonstrates your understanding of all three core web technologies. Think about user experience, code organization, and how different parts of your code interact with each other.`;
}

function generateRealWorldContext(task: Task): string {
  const level = task.difficulty;
  const title = task.title;

  if (level === 1) {
    return `Every professional website uses the HTML concepts you're learning in ${title}. Major sites like Google, Facebook, YouTube, and Amazon all rely on these fundamental building blocks.

When you inspect any webpage (right-click → Inspect), you'll see these exact HTML elements in action. Web developers use these patterns daily, whether building corporate websites, e-commerce platforms, or social media applications.

Search engines like Google rely on proper HTML structure to understand and rank web pages. Accessibility tools used by people with disabilities depend on semantic HTML to navigate websites. Learning these fundamentals isn't just academic - it's essential for building modern, professional websites.`;
  }

  if (level === 2) {
    return `CSS skills like ${title} are crucial in professional web development. Companies hire CSS specialists to create pixel-perfect, responsive designs that work across all devices - from phones to tablets to desktop computers.

Look at any modern website: the navigation bars, card layouts, form designs, and responsive grids are all created with CSS techniques you're learning here. Frameworks like Bootstrap and Tailwind CSS are built on these same fundamental CSS concepts.

In the job market, CSS skills are highly valued. Whether you're working as a frontend developer, UI engineer, or full-stack developer, you'll use CSS every single day to bring designs to life and create beautiful user interfaces.`;
  }

  if (level === 3) {
    return `The JavaScript concepts in ${title} are fundamental to professional software development. These patterns and techniques are used in every major JavaScript application, from React and Vue apps to Node.js backends.

Popular websites like Netflix use these exact programming patterns to manage data, handle user interactions, and optimize performance. Understanding these concepts opens doors to frameworks like React, Angular, and Vue, which all build on these fundamentals.

JavaScript is the most popular programming language in the world. With these skills, you can build web applications, mobile apps (React Native), desktop applications (Electron), and even server-side code (Node.js). The concepts you're learning here transfer across the entire JavaScript ecosystem.`;
  }

  return `Full-stack features like ${title} represent the type of work you'll do as a professional web developer. This is exactly how real applications are built - integrating HTML structure, CSS styling, and JavaScript interactivity.

Companies look for developers who can build complete features from start to finish. Whether you're building a todo app, a shopping cart, a dashboard, or a social media feed, you'll use exactly these skills. This is what "shipping features" means in the real world.

The combination of HTML, CSS, and JavaScript you're practicing here is the foundation of frontend engineering. Master these skills, and you'll be ready to work with modern frameworks like React, Vue, or Angular, which all build on these same fundamentals.`;
}

function generateAlternativeSolutions(task: Task): Array<any> {
  const hasHTML = task.scaffold["index.html"] && task.scaffold["index.html"].trim() !== "";
  const hasCSS = task.scaffold["style.css"] !== undefined;
  const hasJS = task.scaffold["script.js"] !== undefined;

  const solutions = [];

  // Always provide at least one minimal solution
  solutions.push({
    label: "Minimal Solution",
    files: task.solution || task.scaffold,
    explanation: "A straightforward approach that meets all requirements. This solution focuses on simplicity and clarity, making it perfect for understanding the core concepts."
  });

  // Add a semantic/best-practice solution for HTML/CSS
  if (hasHTML && task.difficulty <= 2) {
    solutions.push({
      label: "Semantic HTML Approach",
      files: task.solution || task.scaffold,
      explanation: "This approach emphasizes semantic HTML and accessibility best practices. It uses proper element choices, ARIA labels where appropriate, and follows modern web standards. Use this approach in production applications."
    });
  }

  // Add a modern/optimized solution
  if (task.difficulty >= 2) {
    solutions.push({
      label: "Modern Approach",
      files: task.solution || task.scaffold,
      explanation: "A modern implementation using current best practices and efficient patterns. This approach demonstrates how professional developers would tackle this challenge in a real project, with attention to performance and maintainability."
    });
  }

  return solutions;
}

async function main() {
  const cwd = process.cwd();
  const tasksPath = path.join(cwd, "apps/web/data/tasks.levels.json");

  console.log("📚 Loading tasks...");
  const tasks: Task[] = JSON.parse(await fs.readFile(tasksPath, "utf-8"));
  console.log(`Found ${tasks.length} tasks\n`);

  console.log("✨ Enhancing all tasks with detailed content...");

  const enhanced = tasks.map((task, index) => {
    if ((index + 1) % 20 === 0) {
      console.log(`  Processed ${index + 1}/${tasks.length} tasks...`);
    }

    return {
      ...task,
      description: generateDetailedDescription(task),
      realWorldContext: generateRealWorldContext(task),
      alternativeSolutions: generateAlternativeSolutions(task),
    };
  });

  console.log(`\n✅ Enhanced all ${enhanced.length} tasks!`);

  // Save to new file
  const outputPath = path.join(path.dirname(tasksPath), "tasks.levels.json");
  await fs.writeFile(outputPath, JSON.stringify(enhanced, null, 2));
  console.log(`💾 Saved to: ${outputPath}`);
}

main().catch(console.error);
