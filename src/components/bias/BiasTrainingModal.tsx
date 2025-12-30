import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, BookOpen, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import { BiasIssue, BIAS_TYPE_INFO } from '@/hooks/useBiasDetection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BiasTrainingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  biasType: BiasIssue['type'];
  onComplete?: () => void;
}

const TRAINING_CONTENT: Record<BiasIssue['type'], {
  examples: { biased: string; unbiased: string }[];
  bestPractices: string[];
  quiz: { question: string; options: string[]; correct: number }[];
}> = {
  GENDER_BIAS: {
    examples: [
      {
        biased: "She's too emotional to handle the pressure of leadership.",
        unbiased: "Consider providing coaching on stress management techniques for high-pressure situations."
      },
      {
        biased: "He's aggressive in meetings.",
        unbiased: "He actively shares his perspectives in meetings. Consider balancing assertiveness with active listening."
      }
    ],
    bestPractices: [
      "Use gender-neutral language (they/them when gender is unknown)",
      "Focus on observable behaviors, not personality traits",
      "Apply the same standards regardless of gender",
      "Avoid words with gendered connotations (bossy, aggressive, emotional)"
    ],
    quiz: [
      {
        question: "Which phrase shows gender bias?",
        options: [
          "She demonstrates strong leadership skills",
          "She's surprisingly technical for someone in her role",
          "She communicates clearly with stakeholders",
          "She meets her deadlines consistently"
        ],
        correct: 1
      }
    ]
  },
  AGE_BIAS: {
    examples: [
      {
        biased: "Despite his age, he's still able to keep up with new technology.",
        unbiased: "He demonstrates adaptability by quickly learning new technologies."
      },
      {
        biased: "She brings youthful energy to the team.",
        unbiased: "She brings enthusiasm and fresh perspectives to the team."
      }
    ],
    bestPractices: [
      "Never mention age or age-related characteristics",
      "Focus on skills and achievements, not energy levels",
      "Avoid assumptions about technology comfort",
      "Don't use phrases like 'old school' or 'fresh graduate'"
    ],
    quiz: [
      {
        question: "Which phrase is age-neutral?",
        options: [
          "He's a digital native who understands social media",
          "She demonstrates strong proficiency in digital tools",
          "For someone his age, he's quite tech-savvy",
          "She brings millennial perspectives to the team"
        ],
        correct: 1
      }
    ]
  },
  RECENCY_BIAS: {
    examples: [
      {
        biased: "His Q4 performance was excellent, so he deserves the highest rating.",
        unbiased: "While Q4 showed improvement, his overall annual performance was inconsistent. Consider a balanced rating."
      },
      {
        biased: "She made a mistake last week, which concerns me about her capabilities.",
        unbiased: "She has maintained 98% accuracy over the year. A recent error provides a learning opportunity."
      }
    ],
    bestPractices: [
      "Review performance data from the entire evaluation period",
      "Document examples from different time periods",
      "Weight recent and past performance appropriately",
      "Look for patterns rather than individual events"
    ],
    quiz: [
      {
        question: "How should you handle a recent mistake in an annual review?",
        options: [
          "Focus primarily on the mistake as it's most relevant",
          "Ignore it completely to avoid being negative",
          "Consider it in context of overall yearly performance",
          "Use it to lower the overall rating significantly"
        ],
        correct: 2
      }
    ]
  },
  HALO_HORN_EFFECT: {
    examples: [
      {
        biased: "He's a top performer, so all his work is excellent.",
        unbiased: "While he excels in project delivery, there's room for improvement in documentation practices."
      },
      {
        biased: "She missed that deadline, so I question her overall competence.",
        unbiased: "She met 11 of 12 deadlines this year. Let's discuss strategies for better time estimation."
      }
    ],
    bestPractices: [
      "Evaluate each competency independently",
      "Use specific examples for each rating area",
      "Avoid letting one strength/weakness dominate",
      "Consider getting input from multiple sources"
    ],
    quiz: [
      {
        question: "What is the halo effect?",
        options: [
          "Judging someone based on recent events only",
          "Letting one positive trait influence all assessments",
          "Using gendered language in feedback",
          "Comparing employees to each other"
        ],
        correct: 1
      }
    ]
  },
  ATTRIBUTION_BIAS: {
    examples: [
      {
        biased: "She got lucky with that big client win.",
        unbiased: "She successfully secured a major client through effective relationship building and strategic proposal development."
      },
      {
        biased: "The project failed because of external factors beyond his control.",
        unbiased: "While external factors contributed, let's discuss what could be done differently in risk assessment."
      }
    ],
    bestPractices: [
      "Attribute success to specific actions and skills",
      "Be consistent in how you attribute outcomes",
      "Recognize both effort and results",
      "Avoid dismissing achievements as 'luck'"
    ],
    quiz: [
      {
        question: "Which statement shows attribution bias?",
        options: [
          "She developed a strategy that led to 20% growth",
          "She was in the right place at the right time",
          "She demonstrated strong analytical skills",
          "She collaborated effectively with the sales team"
        ],
        correct: 1
      }
    ]
  },
  VAGUE_LANGUAGE: {
    examples: [
      {
        biased: "He has a good attitude and is a team player.",
        unbiased: "He proactively helps colleagues with tight deadlines and maintains positive communication during challenges."
      },
      {
        biased: "She needs to improve her communication.",
        unbiased: "She should provide weekly status updates to stakeholders and summarize key decisions in writing after meetings."
      }
    ],
    bestPractices: [
      "Include specific examples with dates when possible",
      "Quantify achievements where applicable",
      "Define what 'good' or 'improvement' looks like",
      "Provide actionable next steps"
    ],
    quiz: [
      {
        question: "Which feedback is most actionable?",
        options: [
          "Needs to be more proactive",
          "Should improve communication skills",
          "Send weekly project updates every Friday to the team",
          "Could be a better team player"
        ],
        correct: 2
      }
    ]
  }
};

export function BiasTrainingModal({
  open,
  onOpenChange,
  biasType,
  onComplete
}: BiasTrainingModalProps) {
  const [step, setStep] = useState<'learn' | 'quiz' | 'complete'>('learn');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { toast } = useToast();

  const typeInfo = BIAS_TYPE_INFO[biasType];
  const content = TRAINING_CONTENT[biasType];

  const handleQuizSubmit = async () => {
    const quiz = content.quiz[0];
    const correct = quizAnswer === quiz.correct;
    setIsCorrect(correct);

    if (correct) {
      // Save completion
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('bias_training_completions').upsert({
            user_id: user.id,
            module_type: biasType,
            quiz_score: 100,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,module_type'
          });
        }
      } catch (err) {
        console.error('Failed to save training completion:', err);
      }

      setTimeout(() => {
        setStep('complete');
      }, 1500);
    }
  };

  const handleClose = () => {
    setStep('learn');
    setQuizAnswer(null);
    setIsCorrect(null);
    onOpenChange(false);
    if (step === 'complete') {
      onComplete?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <DialogTitle>Understanding {typeInfo.label}</DialogTitle>
          </div>
          <DialogDescription>
            {typeInfo.description}
          </DialogDescription>
        </DialogHeader>

        {step === 'learn' && (
          <div className="space-y-6 py-4">
            <div>
              <h4 className="font-medium mb-3">Examples</h4>
              <div className="space-y-4">
                {content.examples.map((example, idx) => (
                  <div key={idx} className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                      <Badge variant="destructive" className="mb-2 text-xs">Biased</Badge>
                      <p className="text-sm">{example.biased}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-green-500/30 bg-green-50">
                      <Badge className="mb-2 text-xs bg-green-500">Better</Badge>
                      <p className="text-sm">{example.unbiased}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Best Practices</h4>
              <ul className="space-y-2">
                {content.bestPractices.map((practice, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={() => setStep('quiz')} className="w-full">
              Take Quiz <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'quiz' && (
          <div className="space-y-6 py-4">
            <div>
              <h4 className="font-medium mb-4">{content.quiz[0].question}</h4>
              <RadioGroup
                value={quizAnswer?.toString()}
                onValueChange={(v) => {
                  setQuizAnswer(parseInt(v));
                  setIsCorrect(null);
                }}
              >
                {content.quiz[0].options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {isCorrect !== null && (
              <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isCorrect ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Correct! Well done.</span>
                  </div>
                ) : (
                  <span>Not quite. Try again!</span>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('learn')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Learning
              </Button>
              <Button 
                onClick={handleQuizSubmit} 
                disabled={quizAnswer === null}
                className="flex-1"
              >
                Submit Answer
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Congratulations!</h3>
            <p className="text-muted-foreground">
              You've completed the {typeInfo.label} training module.
            </p>
            <Badge className="bg-green-500">
              {typeInfo.label} Awareness Certified
            </Badge>
            <Button onClick={handleClose} className="w-full mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BiasTrainingModal;
