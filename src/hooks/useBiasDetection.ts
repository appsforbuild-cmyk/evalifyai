import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BiasIssue {
  type: 'GENDER_BIAS' | 'AGE_BIAS' | 'RECENCY_BIAS' | 'HALO_HORN_EFFECT' | 'ATTRIBUTION_BIAS' | 'VAGUE_LANGUAGE';
  severity: 'low' | 'medium' | 'high';
  text: string;
  suggestion: string;
  position: { start: number; end: number };
  explanation: string;
}

export interface BiasAnalysisResult {
  overallScore: number;
  issues: BiasIssue[];
  suggestions: string[];
  summary: string;
}

interface UseBiasDetectionOptions {
  context?: string;
  debounceMs?: number;
  minTextLength?: number;
  autoAnalyze?: boolean;
}

export function useBiasDetection(options: UseBiasDetectionOptions = {}) {
  const { 
    context = 'performance review', 
    debounceMs = 2000, 
    minTextLength = 20,
    autoAnalyze = true 
  } = options;
  
  const [result, setResult] = useState<BiasAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, BiasAnalysisResult>>(new Map());
  const { toast } = useToast();

  const analyze = useCallback(async (text: string): Promise<BiasAnalysisResult | null> => {
    if (!text || text.trim().length < minTextLength) {
      setResult(null);
      return null;
    }

    // Check cache first
    const cacheKey = `${context}:${text}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResult(cached);
      return cached;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-bias', {
        body: { text, context }
      });

      if (fnError) throw fnError;

      const analysisResult = data as BiasAnalysisResult;
      
      // Cache the result
      cacheRef.current.set(cacheKey, analysisResult);
      
      // Limit cache size
      if (cacheRef.current.size > 50) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      setResult(analysisResult);
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze text';
      setError(errorMessage);
      console.error('Bias analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [context, minTextLength]);

  const analyzeDebounced = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!text || text.trim().length < minTextLength) {
      setResult(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      analyze(text);
    }, debounceMs);
  }, [analyze, debounceMs, minTextLength]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const logBiasAudit = useCallback(async (
    contentType: string,
    originalText: string,
    biasScore: number,
    issues: BiasIssue[],
    suggestionsApplied: string[] = []
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('bias_audit_log').insert({
        user_id: user.id,
        content_type: contentType,
        original_text: originalText,
        bias_score: biasScore,
        issues: issues as any,
        suggestions_applied: suggestionsApplied as any,
        context
      });
    } catch (err) {
      console.error('Failed to log bias audit:', err);
    }
  }, [context]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    result,
    isAnalyzing,
    error,
    analyze,
    analyzeDebounced,
    clearCache,
    logBiasAudit
  };
}

// Bias type display names and colors
export const BIAS_TYPE_INFO: Record<BiasIssue['type'], { label: string; color: string; description: string }> = {
  GENDER_BIAS: {
    label: 'Gender Bias',
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    description: 'Language that reinforces gender stereotypes or makes assumptions based on gender.'
  },
  AGE_BIAS: {
    label: 'Age Bias',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    description: 'References to age, energy levels, or assumptions about capability based on age.'
  },
  RECENCY_BIAS: {
    label: 'Recency Bias',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    description: 'Overweighting recent events while ignoring consistent past performance.'
  },
  HALO_HORN_EFFECT: {
    label: 'Halo/Horn Effect',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Letting one positive or negative trait unduly influence the entire assessment.'
  },
  ATTRIBUTION_BIAS: {
    label: 'Attribution Bias',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Inconsistently attributing outcomes to luck vs. skill or external vs. internal factors.'
  },
  VAGUE_LANGUAGE: {
    label: 'Vague Language',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Non-specific feedback that lacks actionable guidance for improvement.'
  }
};

export const getSeverityColor = (severity: BiasIssue['severity']) => {
  switch (severity) {
    case 'high': return 'bg-destructive/20 border-destructive text-destructive';
    case 'medium': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
    case 'low': return 'bg-blue-50 border-blue-300 text-blue-600';
    default: return 'bg-muted border-border text-muted-foreground';
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-destructive';
};

export const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Significant Issues';
};
