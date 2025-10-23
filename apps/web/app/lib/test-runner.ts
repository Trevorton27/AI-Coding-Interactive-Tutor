// apps/web/app/lib/test-runner.ts

import type { TestResult } from '@aict/services/types';

/**
 * Client-side test execution utilities
 */

export async function runTests(
  task: any,
  files: Record<string, string>
): Promise<TestResult> {
  try {
    const res = await fetch('/api/eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, files })
    });
    
    if (!res.ok) {
      throw new Error(`Test execution failed: ${res.status}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Error running tests:', error);
    
    return {
      passed: false,
      passedIds: [],
      failedIds: [],
      messages: {
        error: 'Failed to execute tests. Please try again.'
      }
    };
  }
}

// Validate code before running tests
export function validateCode(files: Record<string, string>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if HTML exists
  const hasHtml = Object.keys(files).some(
    key => key.endsWith('.html')
  );
  
  if (!hasHtml) {
    errors.push('No HTML file found');
  }
  
  // Check for basic syntax issues
  Object.entries(files).forEach(([filename, content]) => {
    if (filename.endsWith('.html')) {
      if (!content.includes('<html') && !content.includes('<!DOCTYPE')) {
        errors.push(`${filename}: Missing HTML structure`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Format test results for display
export function formatTestResults(result: TestResult): string {
  const total = result.passedIds.length + result.failedIds.length;
  const passed = result.passedIds.length;
  
  return `${passed}/${total} tests passed`;
}

// Get test status emoji
export function getTestStatusEmoji(result: TestResult): string {
  if (result.passed) return '✅';
  
  const passRate = result.passedIds.length / 
    (result.passedIds.length + result.failedIds.length);
  
  if (passRate >= 0.75) return '🟡';
  if (passRate >= 0.5) return '🟠';
  return '❌';
}

// Analyze which concepts the student is struggling with
export function analyzeTestFailures(
  result: TestResult,
  task: any
): string[] {
  const conceptTags: string[] = [];
  
  // Map failed test IDs to concept tags
  result.failedIds.forEach((testId: string) => {
    const test = task.tests?.find((t: any) => t.id === testId);
    if (test?.conceptTag) {
      conceptTags.push(test.conceptTag);
    }
  });
  
  // Return unique concept tags
  return [...new Set(conceptTags)];
}