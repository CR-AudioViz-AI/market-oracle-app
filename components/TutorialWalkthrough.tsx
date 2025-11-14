'use client'

import { useState, useEffect } from 'react'

interface TutorialStep {
  title: string
  description: string
  element?: string
  action?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Market Oracle! 🎉',
    description: 'Let\'s take a quick tour of the platform. This will only take 2 minutes.',
  },
  {
    title: 'Hot Picks 🔥',
    description: 'These are stocks chosen by multiple AIs or with very high confidence (85%+). They represent the strongest consensus picks.',
  },
  {
    title: 'Dashboard Stats 📊',
    description: 'Click any stat box to dive deeper. Total picks, AI models, confidence scores, top performers - all clickable!',
  },
  {
    title: 'AI Stock Picks 🤖',
    description: 'Each AI independently analyzes the market and makes picks. You can see all picks organized by AI model.',
  },
  {
    title: 'Quick Navigation ⚡',
    description: 'Use these buttons to quickly access key features like backtesting, paper trading, and voting.',
  },
  {
    title: 'Backtesting 📈',
    description: 'Test strategies against historical data to see what would have worked. Learn before you trade!',
  },
  {
    title: 'Paper Trading 📝',
    description: 'Practice trading with $100K virtual money. No risk, real learning. Perfect for beginners!',
  },
  {
    title: 'You\'re Ready! 🚀',
    description: 'That\'s it! Explore the platform, vote on picks, build your watchlist, and have fun learning. Press ? anytime for keyboard shortcuts.',
  },
]

export default function TutorialWalkthrough() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if tutorial has been completed
    const completed = localStorage.getItem('market_oracle_tutorial_completed')
    if (!completed) {
      setShowTutorial(true)
    }
  }, [])

  function nextStep() {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  function skipTutorial() {
    completeTutorial()
  }

  function completeTutorial() {
    localStorage.setItem('market_oracle_tutorial_completed', 'true')
    setShowTutorial(false)
  }

  if (!showTutorial) return null

  const step = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 max-w-md w-full border-2 border-blue-500/50 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {currentStep === 0 ? '👋' :
             currentStep === 1 ? '🔥' :
             currentStep === 2 ? '📊' :
             currentStep === 3 ? '🤖' :
             currentStep === 4 ? '⚡' :
             currentStep === 5 ? '📈' :
             currentStep === 6 ? '📝' :
             '🚀'}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
          <p className="text-slate-300">{step.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
            <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={skipTutorial}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition font-semibold"
            >
              Skip Tutorial
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition font-semibold"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
