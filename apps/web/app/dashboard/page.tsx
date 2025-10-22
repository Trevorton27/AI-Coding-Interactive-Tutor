// apps/web/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { MasteryProgress } from '../components/ProgressBar';
import Link from 'next/link';

interface ProgressData {
  concept: string;
  description: string;
  difficulty: number;
  mastery: number;
  attempts: number;
  successes: number;
  successRate: string;
}

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: Get actual user ID from auth
  const userId = 'demo-user';

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const res = await fetch(`/api/mastery?userId=${userId}`);
      const data = await res.json();
      setProgress(data.progress || []);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallMastery = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.mastery, 0) / progress.length)
    : 800;

  const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
  const totalSuccesses = progress.reduce((sum, p) => sum + p.successes, 0);
  const overallSuccessRate = totalAttempts > 0 
    ? ((totalSuccesses / totalAttempts) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your learning progress</p>
          </div>
          <Link
            href="/learn"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Learning
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Overall Mastery</p>
            <p className="text-3xl font-bold text-gray-900">{overallMastery}</p>
            <p className="text-xs text-gray-500 mt-1">600 - 1800 scale</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
            <p className="text-3xl font-bold text-gray-900">{totalAttempts}</p>
            <p className="text-xs text-gray-500 mt-1">{totalSuccesses} successful</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-gray-900">{overallSuccessRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Across all concepts</p>
          </div>
        </div>

        {/* Concept Progress */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Concept Mastery</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-600 py-8">Loading progress...</p>
            ) : progress.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No progress yet</p>
                <Link
                  href="/learn"
                  className="text-blue-600 hover:underline"
                >
                  Start your first task →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {progress.map((item) => (
                  <div key={item.concept} className="space-y-2">
                    <MasteryProgress
                      mastery={item.mastery}
                      conceptName={item.concept}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{item.attempts} attempts</span>
                      <span>{item.successRate}% success rate</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}