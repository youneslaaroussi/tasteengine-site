'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, MapPin, Calendar, Users, DollarSign, Clock, TrendingUp, Heart } from 'lucide-react';

interface PromptCard {
  id: string;
  title: string;
  subtitle?: string;
  prompt: string;
  icon: React.ReactNode;
  gradient: string;
  image?: string;
  price?: string;
  badge?: string;
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
    icon: <Plane className="w-5 h-5" />,
    gradient: 'from-blue-500 to-cyan-500',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop&crop=center',
    price: 'from $240',
    badge: 'Popular'
  },
  {
    id: 'budget-deals',
    title: 'Budget Deals',
    subtitle: 'Best value flights',
    prompt: 'Show me the cheapest flights from Los Angeles to Tokyo in the next 3 months',
    icon: <DollarSign className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-500',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop&crop=center',
    price: 'from $450',
    badge: 'Best Value'
  },
  {
    id: 'weekend-trip',
    title: 'Weekend Getaway',
    subtitle: 'Quick city breaks',
    prompt: 'Plan a weekend trip from Chicago to Miami with flights and hotel recommendations',
    icon: <Calendar className="w-5 h-5" />,
    gradient: 'from-purple-500 to-pink-500',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center',
    price: 'from $180',
    badge: 'Weekend'
  },
  {
    id: 'group-travel',
    title: 'Group Travel',
    subtitle: 'Family & friends',
    prompt: 'Find flights for a group of 6 people from Seattle to London for summer vacation',
    icon: <Users className="w-5 h-5" />,
    gradient: 'from-orange-500 to-red-500',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center',
    price: 'from $520',
    badge: 'Groups'
  },
  {
    id: 'last-minute',
    title: 'Last Minute',
    subtitle: 'Spontaneous travel',
    prompt: 'Show me last-minute flight deals from Boston departing in the next 7 days',
    icon: <Clock className="w-5 h-5" />,
    gradient: 'from-yellow-500 to-orange-500',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=center',
    price: 'from $120',
    badge: 'Urgent'
  },
  {
    id: 'trending',
    title: 'Trending Destinations',
    subtitle: 'Popular right now',
    prompt: 'What are the trending travel destinations right now and show me flights from Dallas',
    icon: <TrendingUp className="w-5 h-5" />,
    gradient: 'from-indigo-500 to-purple-500',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center',
    price: 'from $290',
    badge: 'Trending'
  }
];

export function PromptCards({ onPromptClick }: PromptCardsProps) {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
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
            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-white"
            onClick={() => onPromptClick(card.prompt)}
          >
            {/* Background Image or Gradient */}
            <div className="relative h-48 overflow-hidden">
              {card.image ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${card.image})` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-80`} />
                </div>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
              )}
              
              {/* Badge */}
              {card.badge && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full text-gray-700">
                  {card.badge}
                </div>
              )}
              
              {/* Heart Icon */}
              <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                {card.subtitle && (
                  <p className="text-sm text-gray-600">{card.subtitle}</p>
                )}
              </div>

              {/* Price and Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white`}>
                    {card.icon}
                  </div>
                  {card.price && (
                    <div className="text-sm">
                      <span className="text-gray-600">✈️</span>
                      <span className="font-semibold text-gray-900 ml-1">{card.price}</span>
                    </div>
                  )}
                </div>
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>

              {/* Search Button */}
              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPromptClick(card.prompt);
                }}
              >
                Search flights
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