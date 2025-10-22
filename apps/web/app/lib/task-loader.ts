// apps/web/app/lib/task-loader.ts

import type { Task } from '@aict/services/src/types';

/**
 * Client-side utilities for loading tasks
 */

export async function loadTaskById(taskId: string): Promise<Task | null> {
  try {
    const res = await fetch(`/api/tasks/${taskId}`);
    
    if (!res.ok) {
      console.error(`Failed to load task ${taskId}: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    return data.task;
  } catch (error) {
    console.error('Error loading task:', error);
    return null;
  }
}

export async function loadAllTasks(filters?: {
  difficulty?: number;
  conceptId?: string;
}): Promise<Task[]> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.difficulty) {
      params.append('difficulty', filters.difficulty.toString());
    }
    
    if (filters?.conceptId) {
      params.append('conceptId', filters.conceptId);
    }
    
    const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`Failed to load tasks: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    return data.tasks || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

export async function loadNextTask(
  userId: string,
  strategy: 'just-right' | 'sequential' = 'just-right'
): Promise<Task | null> {
  try {
    const res = await fetch('/api/tasks/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, strategy })
    });
    
    if (!res.ok) {
      console.error(`Failed to get next task: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    
    // Check if all tasks completed
    if (data.message) {
      console.log(data.message);
      return null;
    }
    
    return data.task;
  } catch (error) {
    console.error('Error loading next task:', error);
    return null;
  }
}

// Cache for loaded tasks
const taskCache = new Map<string, Task>();

export function getCachedTask(taskId: string): Task | null {
  return taskCache.get(taskId) || null;
}

export function cacheTask(task: Task): void {
  taskCache.set(task.id, task);
}

export function clearTaskCache(): void {
  taskCache.clear();
}

// Preload tasks for better UX
export async function preloadTasks(taskIds: string[]): Promise<void> {
  const promises = taskIds.map(async (id) => {
    if (!taskCache.has(id)) {
      const task = await loadTaskById(id);
      if (task) cacheTask(task);
    }
  });
  
  await Promise.all(promises);
}