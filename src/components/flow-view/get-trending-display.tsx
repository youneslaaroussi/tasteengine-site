import React from 'react'
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target, Timer, Zap } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GetTrendingDisplayProps {
  content: string
}

interface TrendingDataPoint {
  date: string
  population_percentile: number
  population_rank: string
  population_rank_velocity: number
  velocity_fold_change: number
  population_percent_delta: number
}

interface TrendingSummary {
  averageRank: number
  peakDate: string
  peakRank: number
  overallTrend: string
}

interface TrendingEntity {
  entity_id: string
  name: string
  types: string[]
}

interface GetTrendingData {
  success: boolean
  entity: TrendingEntity
  trendingData: TrendingDataPoint[]
  summary: TrendingSummary
  duration: number
}

export function GetTrendingDisplay({ content }: GetTrendingDisplayProps) {
  // Extract JSON from tool content
  const extractJsonFromContent = (content: string) => {
    try {
      // Find the JSON part after tool_description and before endtool
      const jsonMatch = content.match(/{% tool_description %}.*?{% end_tool_description %}\s*\n([\s\S]*?)\n{% endtool %}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // Fallback patterns
      const fallbackMatch = content.match(/}\s*\n(\{[\s\S]*?\})\s*\n{% endtool %}/);
      if (fallbackMatch) {
        return JSON.parse(fallbackMatch[1].trim());
      }
      
      const simpleMatch = content.match(/\n(\{[\s\S]*?\})\s*\n{% endtool %}/);
      if (simpleMatch) {
        return JSON.parse(simpleMatch[1].trim());
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing get_trending JSON:', error);
      return null;
    }
  }

  const data: GetTrendingData | null = extractJsonFromContent(content)

  if (!data || !data.success) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded">
        <div className="flex items-center gap-2 text-red-700">
          <TrendingDown className="w-4 h-4" />
          <span className="font-medium">Error loading trending data</span>
        </div>
      </div>
    )
  }

  const getTrendIcon = () => {
    switch (data.summary.overallTrend.toLowerCase()) {
      case 'increasing':
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decreasing':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <BarChart3 className="w-4 h-4 text-blue-600" />
    }
  }

  const getTrendColor = () => {
    switch (data.summary.overallTrend.toLowerCase()) {
      case 'increasing':
      case 'rising':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'decreasing':
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  // Calculate some interesting metrics
  const latestData = data.trendingData[0]
  const oldestData = data.trendingData[data.trendingData.length - 1]
  const dateRange = data.trendingData.length
  
  // Calculate average percentile
  const avgPercentile = data.trendingData.reduce((sum, point) => 
    sum + point.population_percentile, 0) / data.trendingData.length

  // Find highest velocity change
  const maxVelocity = Math.max(...data.trendingData.map(d => d.velocity_fold_change))

  // Transform data for charts (reverse to show chronological order)
  const chartData = data.trendingData
    .slice()
    .reverse()
    .map(point => ({
      date: point.date,
      dateLabel: new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      percentile: point.population_percentile * 100,
      rank: parseInt(point.population_rank),
      velocity: point.velocity_fold_change,
      hasVelocity: point.velocity_fold_change > 0
    }))

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs">
          <p className="font-medium text-gray-900 mb-1">{data.dateLabel}</p>
          <p className="text-blue-600">
            <span className="font-medium">Percentile:</span> {data.percentile.toFixed(1)}%
          </p>
          <p className="text-purple-600">
            <span className="font-medium">Rank:</span> #{data.rank}
          </p>
          {data.velocity > 0 && (
            <p className="text-orange-600">
              <span className="font-medium">Velocity:</span> {data.velocity.toLocaleString()}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {getTrendIcon()}
        <div className="flex-1">
          <div className="font-medium text-sm">Trending Analysis</div>
          <div className="text-xs text-gray-600">
            Entity: {data.entity.entity_id.substring(0, 8)}...
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor()}`}>
          {data.summary.overallTrend}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2 rounded border border-blue-200">
          <div className="flex items-center gap-1 font-medium text-blue-800 mb-1">
            <Target className="w-3 h-3" />
            Current Rank
          </div>
          <div className="text-blue-700">
            #{latestData.population_rank}
            <span className="text-xs text-blue-600 ml-1">
              ({(latestData.population_percentile * 100).toFixed(1)}th percentile)
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-2 rounded border border-purple-200">
          <div className="flex items-center gap-1 font-medium text-purple-800 mb-1">
            <Zap className="w-3 h-3" />
            Peak Velocity
          </div>
          <div className="text-purple-700">
            {maxVelocity.toLocaleString()}
            <span className="text-xs text-purple-600 ml-1">
              max change
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded border border-green-200">
          <div className="flex items-center gap-1 font-medium text-green-800 mb-1">
            <BarChart3 className="w-3 h-3" />
            Avg Percentile
          </div>
          <div className="text-green-700">
            {(avgPercentile * 100).toFixed(1)}%
            <span className="text-xs text-green-600 ml-1">
              consistency
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-2 rounded border border-orange-200">
          <div className="flex items-center gap-1 font-medium text-orange-800 mb-1">
            <Timer className="w-3 h-3" />
            Duration
          </div>
          <div className="text-orange-700">
            {data.duration} days
            <span className="text-xs text-orange-600 ml-1">
              tracked
            </span>
          </div>
        </div>
      </div>

      {/* Percentile Trend Chart */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <BarChart3 className="w-3 h-3" />
          Percentile Over Time ({dateRange} data points)
        </div>
        
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="percentileGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis 
                dataKey="dateLabel" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[95, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="percentile"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#percentileGradient)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity Changes Chart */}
      {maxVelocity > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <Zap className="w-3 h-3" />
            Velocity Changes
          </div>
          
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="dateLabel" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="velocity"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>From: {new Date(oldestData.date).toLocaleDateString()}</span>
        </div>
        <div>
          To: {new Date(latestData.date).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
} 