import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, CheckCircle, Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { useBiasDetection, BiasIssue, BIAS_TYPE_INFO, getScoreColor, getScoreLabel, getSeverityColor } from '@/hooks/useBiasDetection';
import { cn } from '@/lib/utils';

interface BiasDetectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: string;
  minRows?: number;
  className?: string;
  disabled?: boolean;
  showScore?: boolean;
  onScoreChange?: (score: number | null) => void;
}

export function BiasDetector({
  value,
  onChange,
  placeholder = "Enter your feedback...",
  context = "performance review",
  minRows = 4,
  className,
  disabled = false,
  showScore = true,
  onScoreChange
}: BiasDetectorProps) {
  const { result, isAnalyzing, analyzeDebounced, analyze } = useBiasDetection({ context });
  const [selectedIssue, setSelectedIssue] = useState<BiasIssue | null>(null);

  useEffect(() => {
    analyzeDebounced(value);
  }, [value, analyzeDebounced]);

  useEffect(() => {
    onScoreChange?.(result?.overallScore ?? null);
  }, [result?.overallScore, onScoreChange]);

  const applySuggestion = (issue: BiasIssue) => {
    if (!issue.position) return;
    
    const before = value.substring(0, issue.position.start);
    const after = value.substring(issue.position.end);
    const newValue = before + issue.suggestion + after;
    onChange(newValue);
    setSelectedIssue(null);
  };

  const getHighlightedText = () => {
    if (!result?.issues?.length || !value) return null;

    // Sort issues by position (start) in descending order to avoid position shifts
    const sortedIssues = [...result.issues]
      .filter(issue => issue.position?.start !== undefined && issue.position?.end !== undefined)
      .sort((a, b) => (b.position?.start ?? 0) - (a.position?.start ?? 0));

    let segments: React.ReactNode[] = [];
    let lastEnd = value.length;

    sortedIssues.forEach((issue, idx) => {
      const start = issue.position?.start ?? 0;
      const end = issue.position?.end ?? start;

      if (end < lastEnd) {
        // Text after this issue
        if (end < lastEnd) {
          segments.unshift(
            <span key={`text-${idx}`}>{value.substring(end, lastEnd)}</span>
          );
        }

        // The highlighted issue
        segments.unshift(
          <Popover key={`issue-${idx}`}>
            <PopoverTrigger asChild>
              <span
                className={cn(
                  "underline decoration-wavy cursor-pointer px-0.5 rounded",
                  issue.severity === 'high' && "decoration-destructive bg-destructive/10",
                  issue.severity === 'medium' && "decoration-yellow-500 bg-yellow-50",
                  issue.severity === 'low' && "decoration-blue-400 bg-blue-50"
                )}
                onClick={() => setSelectedIssue(issue)}
              >
                {value.substring(start, end)}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" side="top">
              <IssuePopoverContent issue={issue} onApply={() => applySuggestion(issue)} />
            </PopoverContent>
          </Popover>
        );

        lastEnd = start;
      }
    });

    // Text before the first issue
    if (lastEnd > 0) {
      segments.unshift(<span key="text-start">{value.substring(0, lastEnd)}</span>);
    }

    return segments;
  };

  const hasHighlights = result?.issues?.some(i => i.position?.start !== undefined);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={minRows}
          className="resize-y min-h-[100px]"
        />
        
        {/* Overlay for highlights - only shown when there are issues with positions */}
        {hasHighlights && (
          <div 
            className="absolute inset-0 pointer-events-none p-3 text-sm whitespace-pre-wrap overflow-hidden opacity-0"
            aria-hidden="true"
          >
            {getHighlightedText()}
          </div>
        )}
      </div>

      {/* Score and status bar */}
      {showScore && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Analyzing for bias...</span>
              </>
            ) : result ? (
              <>
                <div className={cn("h-3 w-3 rounded-full", getScoreColor(result.overallScore))} />
                <span className="font-medium">
                  Fairness Score: {result.overallScore}/100
                </span>
                <Badge variant="outline" className="text-xs">
                  {getScoreLabel(result.overallScore)}
                </Badge>
              </>
            ) : value.length > 0 ? (
              <span className="text-muted-foreground">Type more to analyze...</span>
            ) : null}
          </div>

          {result && !isAnalyzing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => analyze(value)}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-analyze
            </Button>
          )}
        </div>
      )}

      {/* Issues list */}
      {result?.issues && result.issues.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            {result.issues.length} potential issue{result.issues.length !== 1 ? 's' : ''} detected
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.issues.map((issue, idx) => (
              <BiasIssueCard 
                key={idx} 
                issue={issue} 
                onApply={() => applySuggestion(issue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {result?.suggestions && result.suggestions.length > 0 && (
        <div className="space-y-1 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            Suggestions
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
            {result.suggestions.slice(0, 3).map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success state */}
      {result && result.issues.length === 0 && result.overallScore >= 80 && (
        <div className="flex items-center gap-2 text-green-600 text-sm pt-2 border-t">
          <CheckCircle className="h-4 w-4" />
          Great job! Your feedback appears fair and unbiased.
        </div>
      )}
    </div>
  );
}

function IssuePopoverContent({ 
  issue, 
  onApply 
}: { 
  issue: BiasIssue; 
  onApply: () => void;
}) {
  const typeInfo = BIAS_TYPE_INFO[issue.type];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge className={cn("text-xs", getSeverityColor(issue.severity))}>
          {issue.severity.toUpperCase()}
        </Badge>
        <span className="font-medium text-sm">{typeInfo.label}</span>
      </div>
      
      <p className="text-sm text-muted-foreground">{issue.explanation}</p>
      
      <div className="bg-muted/50 p-2 rounded text-sm">
        <div className="text-muted-foreground text-xs mb-1">Suggested alternative:</div>
        <div className="font-medium">{issue.suggestion}</div>
      </div>
      
      <Button size="sm" onClick={onApply} className="w-full">
        Apply Suggestion
      </Button>
    </div>
  );
}

function BiasIssueCard({ 
  issue, 
  onApply 
}: { 
  issue: BiasIssue; 
  onApply: () => void;
}) {
  const typeInfo = BIAS_TYPE_INFO[issue.type];

  return (
    <div className={cn("p-3 rounded-lg border text-sm", typeInfo.color)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{typeInfo.label}</span>
            <Badge variant="outline" className={cn("text-xs", getSeverityColor(issue.severity))}>
              {issue.severity}
            </Badge>
          </div>
          <p className="text-xs opacity-80 mb-2">"{issue.text}"</p>
          <p className="text-xs">{issue.explanation}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onApply} className="shrink-0">
          Fix
        </Button>
      </div>
    </div>
  );
}

export default BiasDetector;
