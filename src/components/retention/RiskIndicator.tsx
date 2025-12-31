import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface RiskIndicatorProps {
  employeeId: string;
  showLabel?: boolean;
}

export function RiskIndicator({ employeeId, showLabel = false }: RiskIndicatorProps) {
  const [riskData, setRiskData] = useState<{ risk_level: string; risk_score: number } | null>(null);

  useEffect(() => {
    const fetchRisk = async () => {
      const { data } = await supabase
        .from('attrition_predictions')
        .select('risk_level, risk_score')
        .eq('employee_id', employeeId)
        .single();
      
      if (data) {
        setRiskData(data);
      }
    };

    fetchRisk();
  }, [employeeId]);

  if (!riskData || (riskData.risk_level !== 'high' && riskData.risk_level !== 'critical')) {
    return null;
  }

  const isCritical = riskData.risk_level === 'critical';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isCritical ? 'destructive' : 'secondary'}
            className={`cursor-help ${isCritical ? '' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
          >
            {isCritical ? (
              <AlertCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {showLabel && (isCritical ? 'Critical' : 'At Risk')}
            {!showLabel && riskData.risk_score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Attrition Risk: {riskData.risk_level.toUpperCase()}</p>
          <p className="text-xs text-muted-foreground">Score: {riskData.risk_score}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
