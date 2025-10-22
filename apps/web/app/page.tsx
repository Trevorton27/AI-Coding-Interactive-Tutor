// apps/web/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Learn to Code with AI Guidance
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Master web development through hands-on practice with an intelligent tutor 
          that guides you to discover solutions yourself.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/learn"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
          >
            Start Learning
          </Link>
          <Link
            href="/tasks"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-medium text-lg"
          >
            Browse Tasks
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI-Powered Hints</h3>
            <p className="text-gray-600">
              Get personalized guidance at three levels: conceptual, API reference, or code patterns
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="text-xl font-bold mb-2">Real Code Editor</h3>
            <p className="text-gray-600">
              Write code in a professional Monaco editor with syntax highlighting and live preview
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">Instant Feedback</h3>
            <p className="text-gray-600">
              Run automated tests to validate your solution and track your progress
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Choose a Task</h3>
                <p className="text-gray-600">
                  Start with beginner-friendly tasks and progress to advanced projects
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Write Code</h3>
                <p className="text-gray-600">
                  Use the integrated editor to write HTML, CSS, and JavaScript
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Get Help When Stuck</h3>
                <p className="text-gray-600">
                  Ask the AI tutor for hints - it will guide you without giving away the answer
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Test Your Solution</h3>
                <p className="text-gray-600">
                  Run automated tests to verify your code works correctly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
        <p className="text-gray-600 mb-8">Join thousands of students learning to code the right way</p>
        <Link
          href="/learn"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
        >
          Get Started Free
        </Link>
      </section>
    </div>
  );
}