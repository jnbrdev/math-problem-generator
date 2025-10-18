import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { supabase } from "../../../lib/supabaseClient"

const apiKey = process.env.GOOGLE_API_KEY
if (!apiKey) {
  console.error("❌ Missing GOOGLE_API_KEY in environment variables.")
}

const genAI = new GoogleGenerativeAI(apiKey || "")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, userAnswer } = body

    if (action === "generate") {
      return await generateProblem()
    }

    if (action === "submit") {
      if (!sessionId || userAnswer === undefined) {
        return NextResponse.json({ error: "Missing sessionId or userAnswer" }, { status: 400 })
      }
      return await submitAnswer(sessionId, userAnswer)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("🚨 API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function generateProblem() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // safer fallback

    const prompt = `
    Generate a math word problem suitable for a Primary 5 student (10–11 years old).
    The problem should involve basic arithmetic (addition, subtraction, multiplication, or division).

    Return ONLY valid JSON in this exact format:
    {
      "problem_text": "A clear, engaging word problem",
      "final_answer": 42
    }
    `

    const result = await model.generateContent(prompt)
    const responseText = result?.response?.text() || ""

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Failed to extract JSON from Gemini response")

    const problemData = JSON.parse(jsonMatch[0])

    if (!problemData.problem_text || typeof problemData.final_answer !== "number") {
      throw new Error("Invalid problem data format")
    }

    const { data, error } = await supabase
      .from("math_problem_sessions")
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer,
      })
      .select()

    if (error) {
      console.error("🗄️ Supabase insert error:", error)
      throw new Error("Failed to save problem to database")
    }

    const session = data?.[0]
    if (!session) throw new Error("Failed to retrieve saved problem")

    return NextResponse.json({
      sessionId: session.id,
      problem: {
        problem_text: problemData.problem_text,
        final_answer: problemData.final_answer,
      },
    })
  } catch (error) {
    console.error("⚠️ Generate Problem Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate problem" },
      { status: 500 }
    )
  }
}

async function submitAnswer(sessionId: string, userAnswer: number) {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from("math_problem_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !sessionData) {
      console.error("🗄️ Supabase fetch error:", sessionError)
      return NextResponse.json({ error: "Problem session not found" }, { status: 404 })
    }

    const isCorrect = Number(userAnswer) === Number(sessionData.correct_answer)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const feedbackPrompt = `
    A Primary 5 student was given this math problem:
    "${sessionData.problem_text}"

    The correct answer is: ${sessionData.correct_answer}
    The student's answer was: ${userAnswer}
    They got it ${isCorrect ? "CORRECT" : "WRONG"}.

    Generate a short, encouraging feedback message (2–3 sentences) for the student.
    ${isCorrect
      ? "Praise them and explain why their answer is correct."
      : "Explain where they went wrong and guide them toward the correct answer."}
    Keep the tone positive and supportive for a 10–11-year-old.
    `

    const feedbackResult = await model.generateContent(feedbackPrompt)
    const feedbackText = feedbackResult?.response?.text() || "Good try! Keep practicing!"

    const { error: insertError } = await supabase
      .from("math_problem_submissions")
      .insert({
        session_id: sessionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        feedback_text: feedbackText,
      })

    if (insertError) {
      console.error("🗄️ Submission insert error:", insertError)
      throw new Error(insertError.message)
    }

    return NextResponse.json({
      isCorrect,
      correctAnswer: sessionData.correct_answer,
      feedback: feedbackText,
    })
  } catch (error) {
    console.error("❌ Submit Answer Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit answer" },
      { status: 500 }
    )
  }
}
