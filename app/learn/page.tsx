'use client'

import { useState } from 'react'
import { BookOpen, GraduationCap } from 'lucide-react'

const LESSONS = {
  beginner: [
    {
      id: 1,
      title: 'Understanding Stock Picks',
      description: 'Learn how to read and interpret AI stock recommendations',
      duration: '10 min',
      content: `# Understanding Stock Picks

## What is a Stock Pick?
A stock pick is a recommendation from our AI models to buy a specific stock at a specific price (entry price) with a target sell price.

## Key Components:
1. **Symbol**: The stock ticker (e.g., AAPL for Apple)
2. **Entry Price**: The recommended buying price
3. **Target Price**: The expected selling price
4. **Confidence Score**: How confident the AI is (0-100%)

## How to Evaluate a Pick:
- Higher confidence (80%+) = AI is more certain
- Larger gap between entry and target = higher potential gain
- Multiple AIs agreeing = stronger signal

## Example:
If Javari AI picks TSLA at $150 (entry) with $180 target and 85% confidence:
- Potential gain: 20% ($30 profit per share)
- High confidence suggests strong analysis
- Check if other AIs also picked TSLA`
    },
    {
      id: 2,
      title: 'Reading Confidence Scores',
      description: 'Understand what confidence scores mean',
      duration: '8 min',
      content: `# Reading Confidence Scores

## What is Confidence?
Confidence represents how certain the AI is about its pick. Higher is better.

## Score Ranges:
- **80-100%**: High confidence - AI is very certain
- **60-79%**: Medium confidence - Good pick but more risk
- **Below 60%**: Low confidence - Higher risk, potentially higher reward

## How AIs Calculate Confidence:
- Historical data analysis
- Market trend analysis
- Technical indicators
- News sentiment
- Company fundamentals`
    }
  ],
  intermediate: [
    {
      id: 3,
      title: 'Portfolio Management Basics',
      description: 'Learn how to build and manage a diversified portfolio',
      duration: '15 min',
      content: `# Portfolio Management

## Diversification
Never put all eggs in one basket. Spread risk across multiple stocks.

## Position Sizing
- Conservative: 5-10% per stock
- Moderate: 10-15% per stock
- Aggressive: 15-20% per stock

## Risk Management
- Set stop losses
- Take profits at targets
- Rebalance quarterly`
    }
  ],
  advanced: [
    {
      id: 4,
      title: 'Comparing AI Strategies',
      description: 'Advanced analysis of different AI approaches',
      duration: '20 min',
      content: `# Comparing AI Strategies

## Different AI Approaches:
1. **Javari AI**: Focuses on technical analysis
2. **Claude**: Balanced fundamental + technical
3. **GPT-4**: Heavy on sentiment analysis
4. **Gemini**: Quantitative models
5. **Perplexity**: News-driven picks

## Creating Your Strategy:
- Track which AIs perform best
- Combine multiple AI signals
- Use backtesting to validate`
    }
  ]
}

export default function LearnPage() {
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [selectedLesson, setSelectedLesson] = useState<any>(null)

  const lessons = LESSONS[selectedLevel]

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <GraduationCap className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Learn</span>
        </h1>
        <p className="text-xl text-slate-300">Master stock trading with AI-powered insights</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
          <button
            key={level}
            onClick={() => { setSelectedLevel(level); setSelectedLesson(null) }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all capitalize ${
              selectedLevel === level
                ? 'bg-gradient-to-r from-brand-cyan to-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {selectedLesson ? (
        <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-800">
          <button
            onClick={() => setSelectedLesson(null)}
            className="mb-6 text-brand-cyan hover:underline"
          >
            ← Back to lessons
          </button>
          <h2 className="text-3xl font-bold mb-4">{selectedLesson.title}</h2>
          <div className="prose prose-invert max-w-none">
            {selectedLesson.content.split('\n').map((line: string, i: number) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>
              if (line.startsWith('- ')) return <li key={i} className="ml-6 text-slate-300">{line.slice(2)}</li>
              if (line.trim()) return <p key={i} className="mb-4 text-slate-300 leading-relaxed">{line}</p>
              return null
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => setSelectedLesson(lesson)}
              className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 hover:border-brand-cyan/50 transition-all cursor-pointer card-hover"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-brand-cyan to-blue-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{lesson.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{lesson.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>⏱️ {lesson.duration}</span>
                    <span>📚 {selectedLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
