import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Check, X, Building2, Users, Zap, Shield, Headphones, Globe, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small teams getting started with AI feedback',
    monthlyPrice: 29,
    annualPrice: 23,
    maxUsers: 50,
    popular: false,
    features: [
      { name: 'Up to 50 users', included: true },
      { name: 'Voice feedback recording', included: true },
      { name: 'AI-generated feedback drafts', included: true },
      { name: 'Basic analytics dashboard', included: true },
      { name: 'Email support', included: true },
      { name: 'Bias detection', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'SSO integration', included: false },
      { name: 'White-label branding', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Professional',
    description: 'For growing organizations that need advanced features',
    monthlyPrice: 49,
    annualPrice: 39,
    maxUsers: 500,
    popular: true,
    features: [
      { name: 'Up to 500 users', included: true },
      { name: 'Voice feedback recording', included: true },
      { name: 'AI-generated feedback drafts', included: true },
      { name: 'Basic analytics dashboard', included: true },
      { name: 'Priority support', included: true },
      { name: 'Bias detection', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'SSO integration', included: true },
      { name: 'White-label branding', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    monthlyPrice: null,
    annualPrice: null,
    maxUsers: null,
    popular: false,
    features: [
      { name: 'Unlimited users', included: true },
      { name: 'Voice feedback recording', included: true },
      { name: 'AI-generated feedback drafts', included: true },
      { name: 'Basic analytics dashboard', included: true },
      { name: 'Dedicated success manager', included: true },
      { name: 'Bias detection', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'SSO integration', included: true },
      { name: 'White-label branding', included: true },
      { name: 'API access', included: true },
      { name: 'Custom domain', included: true },
      { name: 'SLA guarantee', included: true },
    ],
  },
];

const allFeatures = [
  { category: 'Core Features', features: [
    { name: 'Voice feedback recording', starter: true, professional: true, enterprise: true },
    { name: 'AI-generated feedback drafts', starter: true, professional: true, enterprise: true },
    { name: 'Feedback templates', starter: '5 templates', professional: 'Unlimited', enterprise: 'Unlimited + Custom' },
    { name: 'Mobile app access', starter: true, professional: true, enterprise: true },
  ]},
  { category: 'Analytics & Reporting', features: [
    { name: 'Basic analytics dashboard', starter: true, professional: true, enterprise: true },
    { name: 'Advanced analytics', starter: false, professional: true, enterprise: true },
    { name: 'Custom reports', starter: false, professional: true, enterprise: true },
    { name: 'Data export (CSV/Excel)', starter: false, professional: true, enterprise: true },
    { name: 'Real-time dashboards', starter: false, professional: true, enterprise: true },
  ]},
  { category: 'AI & Insights', features: [
    { name: 'Bias detection', starter: false, professional: true, enterprise: true },
    { name: 'Sentiment analysis', starter: 'Basic', professional: 'Advanced', enterprise: 'Advanced + Custom models' },
    { name: 'Attrition prediction', starter: false, professional: true, enterprise: true },
    { name: 'Skill gap analysis', starter: false, professional: true, enterprise: true },
  ]},
  { category: 'Security & Compliance', features: [
    { name: 'SSO integration', starter: false, professional: true, enterprise: true },
    { name: 'SAML 2.0', starter: false, professional: false, enterprise: true },
    { name: 'Audit logs', starter: '30 days', professional: '1 year', enterprise: 'Unlimited' },
    { name: 'Custom data retention', starter: false, professional: false, enterprise: true },
    { name: 'SOC 2 compliance', starter: true, professional: true, enterprise: true },
  ]},
  { category: 'Customization', features: [
    { name: 'Custom branding', starter: false, professional: 'Logo only', enterprise: 'Full white-label' },
    { name: 'Custom domain', starter: false, professional: false, enterprise: true },
    { name: 'API access', starter: false, professional: false, enterprise: true },
    { name: 'Webhooks', starter: false, professional: false, enterprise: true },
  ]},
  { category: 'Support', features: [
    { name: 'Email support', starter: true, professional: true, enterprise: true },
    { name: 'Priority support', starter: false, professional: true, enterprise: true },
    { name: 'Phone support', starter: false, professional: false, enterprise: true },
    { name: 'Dedicated success manager', starter: false, professional: false, enterprise: true },
    { name: 'SLA guarantee', starter: false, professional: false, enterprise: '99.9% uptime' },
  ]},
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Start with a 14-day free trial. No credit card required. Choose the plan that fits your team.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                Save 20%
              </Badge>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-glow scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[48px]">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    {plan.monthlyPrice ? (
                      <>
                        <span className="text-5xl font-bold text-primary">
                          ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-muted-foreground">/user/month</span>
                        {isAnnual && (
                          <p className="text-sm text-muted-foreground mt-1">
                            billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-primary">Custom</span>
                        <p className="text-muted-foreground mt-1">Contact us for pricing</p>
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-4">
                  {plan.monthlyPrice ? (
                    <Link to="/signup/organization" className="w-full">
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                      >
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="lg" className="w-full">
                      Book a Demo
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Feature Comparison Toggle */}
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="gap-2"
            >
              {showAllFeatures ? 'Hide' : 'Show'} detailed feature comparison
              <ArrowRight className={`h-4 w-4 transition-transform ${showAllFeatures ? 'rotate-90' : ''}`} />
            </Button>
          </div>

          {/* Detailed Feature Comparison */}
          {showAllFeatures && (
            <div className="overflow-x-auto mb-20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Starter</th>
                    <th className="text-center p-4 font-semibold bg-primary/5">Professional</th>
                    <th className="text-center p-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((category) => (
                    <>
                      <tr key={category.category} className="bg-muted/50">
                        <td colSpan={4} className="p-4 font-semibold text-primary">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature) => (
                        <tr key={feature.name} className="border-b">
                          <td className="p-4">{feature.name}</td>
                          <td className="p-4 text-center">
                            {renderFeatureValue(feature.starter)}
                          </td>
                          <td className="p-4 text-center bg-primary/5">
                            {renderFeatureValue(feature.professional)}
                          </td>
                          <td className="p-4 text-center">
                            {renderFeatureValue(feature.enterprise)}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid md:grid-cols-4 gap-8 py-12 border-t">
            <div className="text-center">
              <Shield className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold mb-1">SOC 2 Compliant</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
            </div>
            <div className="text-center">
              <Users className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold mb-1">10,000+ Users</h3>
              <p className="text-sm text-muted-foreground">Trusted by leading companies</p>
            </div>
            <div className="text-center">
              <Zap className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold mb-1">99.9% Uptime</h3>
              <p className="text-sm text-muted-foreground">Reliable and always available</p>
            </div>
            <div className="text-center">
              <Headphones className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold mb-1">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Help when you need it</p>
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="text-center py-12 bg-muted/30 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is here to help you find the right plan for your organization.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/#faq">
                <Button variant="outline">View FAQ</Button>
              </Link>
              <Button>Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

function renderFeatureValue(value: boolean | string) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-600 mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />;
  }
  return <span className="text-sm">{value}</span>;
}
