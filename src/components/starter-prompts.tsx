'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Brain, Target, TrendingUp, Users } from 'lucide-react'
import { useChatContext } from '@/contexts/chat-context'
import { useFlightSearch } from '@/contexts/flight-search-provider'
import { useAnalytics } from '@/hooks/use-analytics'
import Image from 'next/image'

type Props = {
  onPromptClick: () => void
}

export const StarterPrompts = ({ onPromptClick }: Props) => {
  const { trackEvent } = useAnalytics()
  const { handleSubmit } = useChatContext()
  const { flights, searchId } = useFlightSearch()

  const prompts = [
    {
      icon: <Target className="w-4 h-4" />,
      text: "Create a comprehensive brand positioning strategy for a luxury hospitality client",
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "Analyze consumer sentiment trends for emerging food & beverage categories",
    },
    {
      icon: <Brain className="w-4 h-4" />,
      text: "Generate actionable insights for cross-cultural marketing expansion",
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: "Identify high-affinity audience segments for premium lifestyle brands",
    },
  ]

  const handlePromptClick = (prompt: string) => {
    trackEvent('starter_prompt', 'campaign', prompt, 1)
    onPromptClick()
    
    // Include current flight data context
    const flightData = {
      searchId: searchId,
      flights: flights,
    }
    
    handleSubmit(undefined, prompt, flightData)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Image src="/qloo.png" alt="Qloo" width={100} height={32} className="h-16" />
        </div>
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          How can I accelerate your marketing intelligence today?
        </h1>
        <p className="text-gray-600">
          Powered by Qloo's cultural AI to deliver strategic insights, consumer intelligence, and data-driven marketing solutions
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