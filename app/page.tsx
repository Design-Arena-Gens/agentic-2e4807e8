'use client'

import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: Array<{
    name: string
    args: any
    result?: any
  }>
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🤖 Agentic AI Bot</h1>
        <p>Your intelligent assistant with tool-using capabilities</p>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome">
              <h2>Welcome! I'm your Agentic AI Assistant</h2>
              <p>I can help you with various tasks using intelligent reasoning and tools.</p>

              <div className="capabilities">
                <div className="capability">
                  <div className="capability-icon">🧮</div>
                  <div className="capability-title">Calculations</div>
                  <div className="capability-desc">Perform math operations</div>
                </div>
                <div className="capability">
                  <div className="capability-icon">🌐</div>
                  <div className="capability-title">Web Search</div>
                  <div className="capability-desc">Find information online</div>
                </div>
                <div className="capability">
                  <div className="capability-icon">💬</div>
                  <div className="capability-title">Conversation</div>
                  <div className="capability-desc">Natural dialogue</div>
                </div>
                <div className="capability">
                  <div className="capability-icon">🔧</div>
                  <div className="capability-title">Tool Usage</div>
                  <div className="capability-desc">Execute actions autonomously</div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  {msg.content}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div>
                      {msg.toolCalls.map((tool, tidx) => (
                        <div key={tidx} className="tool-call">
                          <div className="tool-name">🔧 {tool.name}</div>
                          <div>Args: {JSON.stringify(tool.args)}</div>
                          {tool.result && <div>Result: {JSON.stringify(tool.result)}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant">
              <div className="avatar">🤖</div>
              <div className="message-content thinking">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <form onSubmit={sendMessage} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="send-button"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
