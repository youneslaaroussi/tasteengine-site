'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, MapPin, Calendar, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { trackPromptCardClick } from '@/lib/gtag';

interface PromptCard {
  id: string;
  title: string;
  subtitle?: string;
  prompt: string;
  icon: React.ReactNode;
}

interface PromptCardsProps {
  onPromptClick: (prompt: string) => void;
}

const promptCards: PromptCard[] = [
  {
    id: 'flight-search',
    title: 'Find Flights',
    subtitle: 'Search destinations',
    prompt: 'Find me flights from New York to San Francisco for next weekend',
    icon: <Plane className="w-5 h-5" />
  },
  {
    id: 'budget-deals',
    title: 'Budget Deals',
    subtitle: 'Best value flights',
    prompt: 'Show me the cheapest flights from Los Angeles to Tokyo in the next 3 months',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'weekend-trip',
    title: 'Weekend Getaway',
    subtitle: 'Quick city breaks',
    prompt: 'Plan a weekend trip from Chicago to Miami with flights and hotel recommendations',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'group-travel',
    title: 'Group Travel',
    subtitle: 'Family & friends',
    prompt: 'Find flights for a group of 6 people from Seattle to London for summer vacation',
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 'last-minute',
    title: 'Last Minute',
    subtitle: 'Spontaneous travel',
    prompt: 'Show me last-minute flight deals from Boston departing in the next 7 days',
    icon: <Clock className="w-5 h-5" />
  },
  {
    id: 'trending',
    title: 'Trending',
    subtitle: 'Popular right now',
    prompt: 'What are the trending travel destinations right now and show me flights from Dallas',
    icon: <TrendingUp className="w-5 h-5" />
  }
];

export function PromptCards({ onPromptClick }: PromptCardsProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Where would you like to go?</h2>
        <p className="text-gray-600">Get started with these popular travel searches</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promptCards.map((card) => (
          <Card
            key={card.id}
            className="p-4 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => {
              trackPromptCardClick(card.id, card.title);
              onPromptClick(card.prompt);
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-gray-600">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{card.title}</h3>
                  {card.subtitle && (
                    <p className="text-sm text-gray-500">{card.subtitle}</p>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  trackPromptCardClick(card.id, card.title);
                  onPromptClick(card.prompt);
                }}
              >
                Try this search
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-4">
        Or ask me anything about flights, hotels, or travel planning
      </div>
    </div>
  );
} 