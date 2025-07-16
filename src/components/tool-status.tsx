import { memo } from 'react';
import { Loader2, CheckCircle2, Circle, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusMessageProps {
  content: string;
}

export const StatusMessage = memo(function StatusMessage({ content }: StatusMessageProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg mb-2 border-l-4 border-blue-400">
      <Circle className="w-3 h-3 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-800 font-medium">{content}</span>
    </div>
  );
});

interface ThinkingMessageProps {
  content: string;
}

export const ThinkingMessage = memo(function ThinkingMessage({ content }: ThinkingMessageProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg mb-2 border-l-4 border-purple-400">
      <Brain className="w-3 h-3 text-purple-600 flex-shrink-0" />
      <span className="text-sm text-purple-800 font-medium italic">{content}</span>
    </div>
  );
});

interface ToolProgressProps {
  toolName: string;
  description?: string;
  progress?: number;
  progressText?: string;
  isComplete?: boolean;
  completeText?: string;
}

export const ToolProgress = memo(function ToolProgress({
  toolName,
  description,
  progress = 0,
  progressText,
  isComplete = false,
  completeText
}: ToolProgressProps) {
  const toolDisplayName = toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (isComplete) {
    return (
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border border-emerald-200 mb-3 hover:shadow-sm transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 via-transparent to-emerald-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-emerald-900">{toolDisplayName}</h4>
              {completeText && (
                <p className="text-xs text-emerald-700 mt-0.5 font-medium">{completeText}</p>
              )}
            </div>
            <div className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              Done
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border border-slate-200 mb-3 hover:shadow-sm transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-transparent to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative px-4 pt-1.5 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 py-2">
            <h4 className="font-semibold text-sm text-slate-900 !m-0">{toolDisplayName}</h4>
            {description && (
              <p className="text-xs text-slate-600 mt-0.5 !m-0">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
              Running
            </div>
          </div>
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 font-medium">{progressText}</span>
              <span className="text-xs font-bold text-slate-500">{progress}%</span>
            </div>
            <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400/50 to-indigo-500/50 rounded-full animate-pulse"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

interface ToolExecutionProps {
  toolName: string;
  description?: string;
  progressSteps: Array<{
    text: string;
    progress: number;
  }>;
  completeText?: string;
  isComplete?: boolean;
}

export const ToolExecution = memo(function ToolExecution({
  toolName,
  description,
  progressSteps,
  completeText,
  isComplete = false
}: ToolExecutionProps) {
  const latestProgress = progressSteps[progressSteps.length - 1];

  return (
    <ToolProgress
      toolName={toolName}
      description={description}
      progress={latestProgress?.progress || 0}
      progressText={latestProgress?.text}
      isComplete={isComplete}
      completeText={completeText}
    />
  );
}); 

 