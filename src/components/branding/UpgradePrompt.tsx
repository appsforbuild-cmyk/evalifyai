import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredPlan?: 'professional' | 'enterprise';
}

const UpgradePrompt = ({ feature, description, requiredPlan = 'enterprise' }: UpgradePromptProps) => {
  const planName = requiredPlan === 'enterprise' ? 'Enterprise' : 'Professional';
  
  return (
    <Card className="border-dashed bg-muted/30">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{feature}</CardTitle>
        <CardDescription>
          {description || `This feature is available on the ${planName} plan.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild>
          <Link to="/pricing">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to {planName}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
