import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import { BiasIssue, BIAS_TYPE_INFO } from '@/hooks/useBiasDetection';
import { Badge } from '@/components/ui/badge';

interface BiasWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  issues: BiasIssue[];
  onConfirm: () => void;
  onReview: () => void;
}

export function BiasWarningModal({
  open,
  onOpenChange,
  score,
  issues,
  onConfirm,
  onReview
}: BiasWarningModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm();
      setAcknowledged(false);
    }
  };

  const highSeverityCount = issues.filter(i => i.severity === 'high').length;
  const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-yellow-100">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Potential Bias Detected
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Your feedback has a fairness score of <strong>{score}/100</strong>, 
                which indicates potential bias concerns.
              </p>

              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="text-sm font-medium">Issues found:</div>
                <div className="flex flex-wrap gap-2">
                  {highSeverityCount > 0 && (
                    <Badge variant="destructive">
                      {highSeverityCount} high severity
                    </Badge>
                  )}
                  {mediumSeverityCount > 0 && (
                    <Badge className="bg-yellow-500">
                      {mediumSeverityCount} medium severity
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {issues.slice(0, 3).map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span>•</span>
                      <span>{BIAS_TYPE_INFO[issue.type].label}</span>
                    </div>
                  ))}
                  {issues.length > 3 && (
                    <div className="text-muted-foreground">
                      +{issues.length - 3} more issues
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm">
                We recommend reviewing and addressing the suggestions before publishing. 
                Publishing biased feedback can harm employee trust and organizational culture.
              </p>

              <div className="flex items-start gap-2 p-3 border rounded-lg bg-background">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <label 
                  htmlFor="acknowledge" 
                  className="text-sm cursor-pointer leading-relaxed"
                >
                  I understand the potential issues and have reviewed my feedback. 
                  I take responsibility for publishing this content.
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReview}>
            Review Suggestions
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!acknowledged}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Publish Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default BiasWarningModal;
