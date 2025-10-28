// apps/web/app/tasks/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { TaskCard } from '../components/TaskCard';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  concepts: Array<{
    concept: {
      id: string;
      name: string;
    };
  }>;
  prerequisites: string[];
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
    // TODO: Load user's completed tasks
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.difficulty === filter);

  const handleSelectTask = (taskId: string) => {
    router.push(`/learn?taskId=${taskId}`);
  };

  const isLocked = (task: Task) => {
    // Check if all prerequisites are completed
    return task.prerequisites.some(preReq => !completedTaskIds.includes(preReq));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Learning Path</h1>
          <p className="text-gray-600 mt-1">Choose your next challenge</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All Levels
          </button>
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === level 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Level {level}
            </button>
          ))}
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No tasks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                completed={completedTaskIds.includes(task.id)}
                locked={isLocked(task)}
                onSelect={() => handleSelectTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}