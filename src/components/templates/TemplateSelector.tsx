import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { QuestionTemplate, TemplateQuestion } from '@/types/questionTemplate';
import { FileText, Mic, GripVertical, X, Plus, Loader2 } from 'lucide-react';

interface TemplateSelectorProps {
  onQuestionsSelected: (questions: TemplateQuestion[]) => void;
  selectedQuestions?: TemplateQuestion[];
}

const TemplateSelector = ({ onQuestionsSelected, selectedQuestions = [] }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customQuestions, setCustomQuestions] = useState<TemplateQuestion[]>(selectedQuestions);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    onQuestionsSelected(customQuestions);
  }, [customQuestions, onQuestionsSelected]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback_question_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('title', { ascending: true });

    if (!error && data) {
      const parsed = data.map((t) => ({
        ...t,
        questions: (t.questions as unknown as TemplateQuestion[]) || [],
        category: t.category as QuestionTemplate['category'],
      }));
      setTemplates(parsed);
      
      // Auto-select default template
      const defaultTemplate = parsed.find(t => t.is_default);
      if (defaultTemplate && customQuestions.length === 0) {
        setSelectedTemplateId(defaultTemplate.id);
        setCustomQuestions(defaultTemplate.questions);
      }
    }
    setLoading(false);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomQuestions(template.questions);
      setIsCustomizing(false);
    }
  };

  const handleToggleCustomize = () => {
    setIsCustomizing(!isCustomizing);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<TemplateQuestion>) => {
    setCustomQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, ...updates } : q)
    );
  };

  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomQuestion = () => {
    const newQuestion: TemplateQuestion = {
      id: `custom_${Date.now()}`,
      text: '',
      type: 'text',
      required: true,
      voiceEnabled: true,
    };
    setCustomQuestions(prev => [...prev, newQuestion]);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customQuestions.length) return;
    
    setCustomQuestions(prev => {
      const newQuestions = [...prev];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return newQuestions;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="template">Question Template</Label>
          <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{template.title}</span>
                    {template.is_default && (
                      <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedTemplateId && (
          <div className="flex items-center gap-2 pt-6">
            <Switch
              id="customize"
              checked={isCustomizing}
              onCheckedChange={handleToggleCustomize}
            />
            <Label htmlFor="customize" className="text-sm">Customize</Label>
          </div>
        )}
      </div>

      {/* Questions Preview/Editor */}
      {customQuestions.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {customQuestions.length} question{customQuestions.length !== 1 ? 's' : ''} to address
              </p>
              {isCustomizing && (
                <Button variant="outline" size="sm" onClick={handleAddCustomQuestion} className="gap-1">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {customQuestions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${isCustomizing ? 'bg-muted/50' : 'bg-muted/30'}`}
                >
                  {isCustomizing && (
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-background rounded disabled:opacity-30"
                      >
                        <GripVertical className="w-3 h-3 rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(index, 'down')}
                        disabled={index === customQuestions.length - 1}
                        className="p-0.5 hover:bg-background rounded disabled:opacity-30"
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <Badge variant="outline" className="shrink-0 mt-0.5">{index + 1}</Badge>
                  
                  <div className="flex-1 min-w-0">
                    {isCustomizing ? (
                      <Input
                        value={question.text}
                        onChange={(e) => handleUpdateQuestion(index, { text: e.target.value })}
                        placeholder="Enter question..."
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-foreground">{question.text}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      {question.voiceEnabled && (
                        <span className="flex items-center gap-1">
                          <Mic className="w-3 h-3" /> Voice
                        </span>
                      )}
                      {question.required && <Badge variant="outline" className="text-xs py-0">Required</Badge>}
                    </div>
                  </div>
                  
                  {isCustomizing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No templates available</p>
          <p className="text-xs">Contact your admin to create feedback templates</p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
