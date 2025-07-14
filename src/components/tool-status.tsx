import { memo } from 'react';
import { Loader2, CheckCircle2, Circle, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusMessageProps {
  content: string;
}

export const StatusMessage = memo(function StatusMessage({ content }: StatusMessageProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
      <Circle className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-800">{content}</span>
    </div>
  );
});

interface ThinkingMessageProps {
  content: string;
}

export const ThinkingMessage = memo(function ThinkingMessage({ content }: ThinkingMessageProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg mb-3">
      <Brain className="w-4 h-4 text-purple-600 flex-shrink-0" />
      <span className="text-sm text-purple-800 italic">{content}</span>
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
  
  return (
    <div className={cn(
      "border rounded-lg p-4 mb-3 transition-all duration-200",
      isComplete 
        ? "bg-green-50 border-green-200" 
        : "bg-gray-50 border-gray-200"
    )}>
      {/* Tool Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          isComplete 
            ? "bg-green-600" 
            : "bg-blue-600"
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <Zap className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h4 className={cn(
            "font-medium text-sm",
            isComplete ? "text-green-900" : "text-gray-900"
          )}>
            {toolDisplayName}
          </h4>
          {description && (
            <p className={cn(
              "text-xs mt-1",
              isComplete ? "text-green-700" : "text-gray-600"
            )}>
              {description}
            </p>
          )}
        </div>
        {!isComplete && (
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        )}
      </div>

      {/* Progress Bar */}
      {!isComplete && progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-600">{progressText}</span>
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Completion Message */}
      {isComplete && completeText && (
        <div className="text-sm text-green-800 font-medium">
          {completeText}
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