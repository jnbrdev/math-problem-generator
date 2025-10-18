'use client'

import { useState } from 'react'

interface MathProblem {
  problem_text: string
  final_answer: number
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  const generateProblem = async () => {
    setIsLoading(true)
    setError('')
    setProblem(null)
    setUserAnswer('')
    setFeedback('')
    setIsCorrect(null)

    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate problem')
      }

      const data = await response.json()
      setProblem(data.problem)
      setSessionId(data.sessionId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate problem'
      setError('Server currently overloaded, Please try again')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!sessionId || !userAnswer) {
      setError('Please enter an answer')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const userNum = parseFloat(userAnswer)
      
      if (isNaN(userNum)) {
        setError('Please enter a valid number')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          sessionId,
          userAnswer: userNum,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit answer')
      }

      const data = await response.json()
      setFeedback(data.feedback)
      setIsCorrect(data.isCorrect)
      
      if (data.isCorrect) {
        setUserAnswer('')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer'
      setError(errorMessage)
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #E5E9C5 0%, #9ECFD4 50%, #70B2B2 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#016B61' }}>
            Math Problem Generator
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#016B61' }}>
            Generate and solve math problems
          </p>
        </div>
        
        <div style={{ borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#E5E9C5' }}>
          <button
            onClick={generateProblem}
            disabled={isLoading}
            style={{ 
              width: '100%',
              fontWeight: 'bold',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: isLoading ? '#70B2B2' : '#016B61',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading ? 'Generating...' : 'Generate New Problem'}
          </button>
        </div>

        {error && (
          <div style={{ borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#E5E9C5', border: '2px solid #016B61' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#016B61' }}>❌ Error</h2>
            <p style={{ color: '#016B61' }}>{error}</p>
          </div>
        )}

        {problem && (
          <div style={{ borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#E5E9C5' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#016B61' }}>Problem:</h2>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.5', marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#9ECFD4', color: '#016B61' }}>
              {problem.problem_text}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="answer" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#016B61' }}>
                  Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '2px solid #70B2B2',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ffffff',
                    fontSize: '1rem',
                  }}
                  placeholder="Enter your answer"
                  disabled={isLoading}
                  required
                />
              </div>
              
              <button
                onClick={submitAnswer}
                disabled={!userAnswer || isLoading}
                style={{ 
                  width: '100%',
                  fontWeight: 'bold',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: !userAnswer || isLoading ? '#70B2B2' : '#016B61',
                  color: 'white',
                  cursor: !userAnswer || isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  opacity: !userAnswer || isLoading ? 0.7 : 1,
                  fontSize: '1rem',
                }}
                onMouseEnter={(e) => (!userAnswer || isLoading) ? null : (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isLoading ? 'Checking...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div style={{ borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', backgroundColor: '#E5E9C5', border: '2px solid #016B61' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#016B61' }}>
              {isCorrect ? '✅ Correct!' : '❌ Not quite right'}
            </h2>
            <p style={{ lineHeight: '1.5', marginBottom: '1rem', color: '#016B61' }}>{feedback}</p>
            <button
              onClick={generateProblem}
              style={{ 
                width: '100%',
                fontWeight: 'bold',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#016B61',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                fontSize: '1rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Try Another Problem
            </button>
          </div>
        )}
      </div>
    </div>
  )
}