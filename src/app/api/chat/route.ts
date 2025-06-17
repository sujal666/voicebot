import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { sujalPersonaPrompt, sujalQnAOverrides } from '@/lib/persona'

export async function POST(req: Request) {
  const { userInput } = await req.json()
  const question = userInput.toLowerCase().trim()

  // ✅ Check if it matches a prewritten response
  if (sujalQnAOverrides[question]) {
    return NextResponse.json({ answer: sujalQnAOverrides[question] })
  }

  // Otherwise, use OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: sujalPersonaPrompt,
      },
      {
        role: 'user',
        content: userInput,
      },
    ],
     temperature: 0.7, // Slightly higher for more varied responses
    presence_penalty: 0.5, // Encourages some topic variation
  })
  

  const answer = response.choices[0].message.content
  return NextResponse.json({ answer })
}
