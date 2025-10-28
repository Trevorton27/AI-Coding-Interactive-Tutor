// apps/web/app/lib/utils.ts

/**
 * Utility functions for the application
 */

// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Format date relative to now
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Sleep utility for delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Generate random ID
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if object is empty
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Classify mastery level
export function getMasteryLevel(score: number): {
  label: string;
  color: 'red' | 'yellow' | 'blue' | 'green';
} {
  if (score < 800) return { label: 'Beginner', color: 'red' };
  if (score < 1000) return { label: 'Learning', color: 'yellow' };
  if (score < 1200) return { label: 'Intermediate', color: 'blue' };
  if (score < 1500) return { label: 'Advanced', color: 'blue' };
  return { label: 'Expert', color: 'green' };
}

// Parse error messages
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Validate file extension
export function getFileLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

// Format mastery score for display
export function formatMastery(score: number): string {
  return `${score} / 1800`;
}

// Calculate percentage from mastery score
export function masteryToPercentage(score: number): number {
  return Math.round(((score - 600) / 1200) * 100);
}