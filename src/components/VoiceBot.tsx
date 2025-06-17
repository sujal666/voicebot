'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceBot() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [spokenLines, setSpokenLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [utterances, setUtterances] = useState<SpeechSynthesisUtterance[]>([])

  // @ts-expect-error: SpeechRecognition is available in browser environments
    let recognition: typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition | null = null
  const startRecognition = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const userInput = event.results[0][0].transcript
      await getAIResponse(userInput)
    }

    recognition.start()
  }

  const getAIResponse = async (input: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ userInput: input }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      const responseText = data.answer
      speakOutLoud(responseText)
    } catch (err) {
      console.error('Error getting AI response:', err)
    }
  }



  const speakOutLoud = (text: string) => {
  const synth = window.speechSynthesis
  synth.cancel() // Cancel any ongoing speech

  // Split text into meaningful chunks (sentences)
  const lines = text.split(/(?<=[.!?])\s+/).filter(line => line.trim().length > 0)
  setSpokenLines(lines)
  setCurrentLineIndex(0)
  setIsSpeaking(true)

  // Get available voices and select a more natural one
  const voices = synth.getVoices()
  // Prefer female voices (they often sound more natural in TTS)
  const preferredVoice = voices.find(voice => 
    voice.name.includes('Female') || 
    voice.name.includes('Karen') || // English (Australia)
    voice.name.includes('Samantha') // English (US)
  )

  // Create an utterance for each line
  const newUtterances = lines.map((line, index) => {
    const utter = new SpeechSynthesisUtterance(line)
    utter.lang = 'en-US'
    
    // Voice customization
    if (preferredVoice) {
      utter.voice = preferredVoice
    }
    utter.rate = 1.0 // Slightly slower than normal (1.0)
    utter.pitch = 1.0 // Neutral pitch
    utter.volume = 1.0

    // Add natural pauses between sentences
    // (To add pauses, you can insert empty utterances or adjust timing between speaks if needed)
    
    // Update caption when each utterance starts
    utter.onstart = () => {
      setCurrentLineIndex(index)
    }

    return utter
  })

  // Handle when all utterances are done
  newUtterances[newUtterances.length - 1].onend = () => {
    setIsSpeaking(false)
    setSpokenLines([])
    setUtterances([])
    startRecognition() // Listen again after speaking
  }

  setUtterances(newUtterances)
  
  // Speak all utterances in sequence
  newUtterances.forEach(utter => {
    synth.speak(utter)
  })
}
  const handleStart = () => {
    if (!isListening && !isSpeaking) {
      startRecognition()
    }
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-semibold mb-4 text-blue-400">Sujal&apos;s Voice Bot</h1>
      <h1 className='text-sm font-semibold text-center mb-4'>Ask me about anything , my past internship experience,<br /> skills, abilities etc  this bot will speak behalf of myslef. </h1>
      <Button
        onClick={handleStart}
        className={`rounded-full p-6 ${isListening ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </Button>
      <p className="mt-4">{isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Tap the mic to start'}</p>
      
      {/* Display current line being spoken */}
      {isSpeaking && spokenLines.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg max-w-md text-center min-h-[4rem] flex items-center justify-center">
          <p className="text-sm text-gray-300">{spokenLines[currentLineIndex]}</p>
        </div>
      )}
    </div>
  )
}