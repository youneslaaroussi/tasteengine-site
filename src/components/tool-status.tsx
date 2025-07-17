import { memo } from 'react';
import { Loader2, CheckCircle2, Circle, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusMessageProps {
  content: string;
}

export const StatusMessage = memo(function StatusMessage({ content }: StatusMessageProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-200">
      <Circle className="w-3 h-3 text-gray-400 flex-shrink-0" />
      <span>{content}</span>
    </div>
  );
});

interface ThinkingMessageProps {
  content: string;
}

export const ThinkingMessage = memo(function ThinkingMessage({ content }: ThinkingMessageProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-md text-sm text-purple-600 border border-purple-200">
      <Brain className="w-3 h-3 text-purple-400 flex-shrink-0" />
      <span className="italic">{content}</span>
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-md text-sm text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
        <span className="font-medium">{toolDisplayName}</span>
        {completeText && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-green-600">{completeText}</span>
          </>
        )}
        <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
          Done
        </span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 rounded-md border border-blue-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />
        <span className="text-sm font-medium text-blue-700">{toolDisplayName}</span>
        {description && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-blue-600">{description}</span>
          </>
        )}
      </div>

      {progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600">{progressText}</span>
            <span className="text-xs font-medium text-blue-500">{progress}%</span>
          </div>
          <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
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

 