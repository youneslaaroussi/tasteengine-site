'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Plane, MapPin, Calendar, DollarSign } from 'lucide-react'
import { useChatContext } from '@/contexts/chat-context'
import { useAnalytics } from '@/hooks/use-analytics'

type Props = {
  onPromptClick: () => void
}

export const StarterPrompts = ({ onPromptClick }: Props) => {
  const { trackEvent } = useAnalytics()
  const { handleSubmit } = useChatContext()

  const prompts = [
    {
      icon: <Plane className="w-4 h-4" />,
      text: "Find me flights from New York to San Francisco for next weekend",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      text: "Show me the cheapest flights from Los Angeles to Tokyo in March",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      text: "Plan a weekend trip from Chicago to Miami with flight recommendations",
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      text: "What are the trending travel destinations right now?",
    },
  ]

  const handlePromptClick = (prompt: string) => {
    trackEvent('starter_prompt', 'chat', prompt, 1)
    onPromptClick()
    handleSubmit(undefined, prompt)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plane className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          How can I help you travel today?
        </h1>
        <p className="text-gray-600">
          Find flights, plan trips, and discover destinations with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => handlePromptClick(prompt.text)}
            className="h-auto p-4 text-left justify-start hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3 w-full">
              <div className="text-gray-600 mt-0.5">
                {prompt.icon}
              </div>
              <span className="text-sm text-gray-800 leading-relaxed text-ellipsis overflow-hidden line-clamp-1 w-full">
                {prompt.text}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

StarterPrompts.displayName = 'StarterPrompts'