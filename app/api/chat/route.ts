import { NextRequest, NextResponse } from 'next/server'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Tool {
  name: string
  description: string
  execute: (args: any) => Promise<any>
}

const tools: Tool[] = [
  {
    name: 'calculate',
    description: 'Perform mathematical calculations. Args: { expression: string }',
    execute: async (args: { expression: string }) => {
      try {
        // Safe eval for basic math
        const result = Function('"use strict"; return (' + args.expression + ')')()
        return { result, success: true }
      } catch (error) {
        return { error: 'Invalid expression', success: false }
      }
    }
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time',
    execute: async () => {
      return { time: new Date().toISOString(), timezone: 'UTC' }
    }
  },
  {
    name: 'generate_random_number',
    description: 'Generate a random number. Args: { min: number, max: number }',
    execute: async (args: { min: number, max: number }) => {
      const min = args.min || 0
      const max = args.max || 100
      return { number: Math.floor(Math.random() * (max - min + 1)) + min }
    }
  },
  {
    name: 'word_count',
    description: 'Count words in text. Args: { text: string }',
    execute: async (args: { text: string }) => {
      const words = args.text.trim().split(/\s+/).filter(w => w.length > 0)
      return { count: words.length, characters: args.text.length }
    }
  }
]

function detectToolUsage(userMessage: string): { tool: Tool | null, args: any } {
  const lower = userMessage.toLowerCase()

  // Calculate detection
  if (lower.match(/calculate|compute|math|what is \d|what's \d|\d+[\+\-\*\/]\d+/)) {
    const mathMatch = userMessage.match(/(\d+[\+\-\*\/\(\)\s]+\d+[\+\-\*\/\(\)\s]*\d*)/i)
    if (mathMatch) {
      return { tool: tools[0], args: { expression: mathMatch[1] } }
    }
  }

  // Time detection
  if (lower.match(/what time|current time|what's the time|date today|current date/)) {
    return { tool: tools[1], args: {} }
  }

  // Random number detection
  if (lower.match(/random number|pick a number|generate.*number/)) {
    const minMatch = userMessage.match(/between (\d+) and (\d+)/)
    if (minMatch) {
      return { tool: tools[2], args: { min: parseInt(minMatch[1]), max: parseInt(minMatch[2]) } }
    }
    return { tool: tools[2], args: { min: 1, max: 100 } }
  }

  // Word count detection
  if (lower.match(/count.*words|how many words|word count/)) {
    const textMatch = userMessage.match(/["'](.+)["']/) || userMessage.match(/count.*words.*[:\-]\s*(.+)$/i)
    if (textMatch) {
      return { tool: tools[3], args: { text: textMatch[1] } }
    }
  }

  return { tool: null, args: null }
}

function generateResponse(userMessage: string, toolResult?: any): string {
  const lower = userMessage.toLowerCase()

  // Greetings
  if (lower.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! I'm your Agentic AI Bot. I can help you with calculations, tell you the time, generate random numbers, count words, and answer questions. What would you like to do?"
  }

  // About/help
  if (lower.match(/what can you do|help|capabilities|features/)) {
    return "I'm an agentic AI with several capabilities:\n\n🧮 Mathematical calculations\n⏰ Current time and date\n🎲 Random number generation\n📝 Word counting\n💬 General conversation\n\nI can autonomously use tools to help you! Just ask me naturally."
  }

  // Tool result responses
  if (toolResult) {
    if (toolResult.result !== undefined) {
      return `The result is: ${toolResult.result}`
    }
    if (toolResult.time) {
      return `The current time is ${new Date(toolResult.time).toLocaleString()}`
    }
    if (toolResult.number !== undefined) {
      return `I generated the random number: ${toolResult.number}`
    }
    if (toolResult.count !== undefined) {
      return `Word count: ${toolResult.count} words, ${toolResult.characters} characters`
    }
  }

  // Default conversational responses
  const responses = [
    "That's interesting! Is there anything specific I can help you with? I can do calculations, check the time, or generate random numbers.",
    "I understand. Would you like me to perform any calculations or use one of my tools?",
    "I'm here to help! You can ask me to calculate something, tell you the time, or generate random numbers.",
    "Got it! Feel free to ask me anything. I have several tools at my disposal to assist you."
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Detect if we should use a tool
    const { tool, args } = detectToolUsage(lastMessage.content)

    let responseContent: string
    let toolCalls: any[] = []

    if (tool) {
      // Execute the tool
      const result = await tool.execute(args)
      toolCalls = [{
        name: tool.name,
        args,
        result
      }]
      responseContent = generateResponse(lastMessage.content, result)
    } else {
      // Generate conversational response
      responseContent = generateResponse(lastMessage.content)
    }

    const assistantMessage = {
      role: 'assistant',
      content: responseContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
