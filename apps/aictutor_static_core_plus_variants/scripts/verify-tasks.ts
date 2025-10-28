import { promises as fs } from "fs";
import path from "path";

async function main() {
  const tasksPath = path.join(process.cwd(), "apps/web/data/tasks.levels.json");
  const tasks = JSON.parse(await fs.readFile(tasksPath, "utf-8"));

  console.log("📊 Task Enhancement Verification\n");
  console.log(`Total tasks: ${tasks.length}`);
  console.log(`\n✅ Sample Task (${tasks[0].id}):`);
  console.log(`- Title: ${tasks[0].title}`);
  console.log(`- Has description: ${!!tasks[0].description}`);
  console.log(`- Description length: ${tasks[0].description?.length || 0} chars`);
  console.log(`- Has realWorldContext: ${!!tasks[0].realWorldContext}`);
  console.log(`- Context length: ${tasks[0].realWorldContext?.length || 0} chars`);
  console.log(`- Has alternativeSolutions: ${!!tasks[0].alternativeSolutions}`);
  console.log(`- Solutions count: ${tasks[0].alternativeSolutions?.length || 0}`);

  // Check all tasks
  const allHaveDescription = tasks.every((t: any) => t.description && t.description.length > 100);
  const allHaveContext = tasks.every((t: any) => t.realWorldContext && t.realWorldContext.length > 100);
  const allHaveSolutions = tasks.every((t: any) => t.alternativeSolutions && t.alternativeSolutions.length >= 2);

  console.log(`\n📈 All Tasks Check:`);
  console.log(`- All have detailed descriptions: ${allHaveDescription ? "✅" : "❌"}`);
  console.log(`- All have real-world context: ${allHaveContext ? "✅" : "❌"}`);
  console.log(`- All have 2+ solutions: ${allHaveSolutions ? "✅" : "❌"}`);

  console.log(`\n📝 First 200 chars of description:`);
  console.log(tasks[0].description.substring(0, 200) + "...");
}

main().catch(console.error);
