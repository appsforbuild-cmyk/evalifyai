import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Check, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const testimonials = [
  {
    quote: "EvalifyAI transformed how we deliver feedback. Our managers save 3+ hours per week, and the AI-generated drafts are remarkably insightful.",
    author: "Sarah Chen",
    role: "VP of People",
    company: "TechFlow Inc.",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "The bias detection feature alone is worth the investment. We've seen a 40% improvement in feedback fairness scores across our organization.",
    author: "Marcus Johnson",
    role: "HR Director",
    company: "Global Dynamics",
    avatar: "MJ",
    rating: 5,
  },
  {
    quote: "Finally, a performance tool that managers actually want to use. Voice recording makes giving feedback feel natural and authentic.",
    author: "Priya Sharma",
    role: "Chief People Officer",
    company: "InnovateCo",
    avatar: "PS",
    rating: 5,
  },
  {
    quote: "We reduced our performance review cycle time by 60%. The analytics help us identify skill gaps before they become problems.",
    author: "David Park",
    role: "CEO",
    company: "ScaleUp Ventures",
    avatar: "DP",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer: "Start using EvalifyAI immediately with full access to all Professional features. No credit card required. At the end of 14 days, choose a plan that fits your needs or your account will be paused (your data is safe)."
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at your next billing cycle."
  },
  {
    question: "How does per-user pricing work?",
    answer: "You're charged based on the number of active users in your organization. Active users are those who log in or receive feedback within a billing period. Inactive users don't count toward your limit."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We're SOC 2 Type II certified, use end-to-end encryption for all data, and never use your feedback data to train AI models. Enterprise customers can also choose their data residency region."
  },
  {
    question: "What's included in bias detection?",
    answer: "Our AI analyzes feedback for 12+ types of bias including gender, age, and personality bias. It provides real-time suggestions to help managers write more objective, fair feedback."
  },
  {
    question: "Can I import users from our HR system?",
    answer: "Yes! We support CSV imports, and our Enterprise plan includes integrations with popular HR systems like Workday, BambooHR, and SAP SuccessFactors via API."
  },
  {
    question: "How does voice feedback work?",
    answer: "Managers record their thoughts naturally via voice. Our AI transcribes, structures, and enhances the recording into polished, actionable feedback while preserving the manager's authentic voice and intent."
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer: "Yes, we offer 50% off for qualified nonprofits and educational institutions. Contact our sales team to apply for the discount."
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$29',
    period: '/user/month',
    description: 'For small teams',
    features: ['Up to 50 users', 'Voice feedback', 'Basic analytics', 'Email support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/user/month',
    description: 'For growing teams',
    features: ['Up to 500 users', 'Bias detection', 'Advanced analytics', 'SSO', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: ['Unlimited users', 'White-label', 'Custom domain', 'API access', 'SLA'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-muted/30" id="testimonials">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Loved by HR leaders worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how organizations are transforming their performance management with EvalifyAI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-lg mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingPreviewSection() {
  return (
    <section className="py-20 px-4" id="pricing">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Plans that scale with your team
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.name} 
              className={`relative ${tier.popular ? 'border-primary shadow-glow' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={tier.name === 'Enterprise' ? '#' : '/signup/organization'}>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/pricing">
            <Button variant="link" className="gap-2">
              View full pricing comparison
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  return (
    <section className="py-20 px-4 bg-muted/30" id="faq">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about EvalifyAI
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Button variant="outline">Contact Support</Button>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="gradient-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-12 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to transform your performance management?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of organizations using AI-powered feedback to build stronger teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup/organization">
                  <Button size="lg" variant="secondary" className="gap-2 text-primary">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Book a Demo
                </Button>
              </div>
              <p className="text-sm text-primary-foreground/60 mt-4">
                14-day free trial • No credit card required
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
