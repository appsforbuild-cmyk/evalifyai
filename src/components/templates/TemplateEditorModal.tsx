import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, Mic, Eye, Save, Send, AlertCircle } from 'lucide-react';
import { QuestionTemplate, TemplateQuestion, TEMPLATE_CATEGORIES, QUESTION_TYPES, QuestionTemplateFormData } from '@/types/questionTemplate';
import { useQuestionTemplates } from '@/hooks/useQuestionTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuestionTemplate | null;
}

const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultQuestion: TemplateQuestion = {
  id: '',
  text: '',
  type: 'text',
  required: true,
  voiceEnabled: true,
};

const TemplateEditorModal = ({ open, onOpenChange, template }: TemplateEditorModalProps) => {
  const { createTemplate, updateTemplate } = useQuestionTemplates();
  const { user } = useAuth();
  const isEditing = !!template;
  
  const [formData, setFormData] = useState<QuestionTemplateFormData>({
    title: '',
    description: '',
    category: 'custom',
    department: null,
    is_default: false,
    questions: [],
  });
  
  const [activeTab, setActiveTab] = useState('editor');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        description: template.description || '',
        category: template.category,
        department: template.department,
        is_default: template.is_default,
        questions: template.questions,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'custom',
        department: null,
        is_default: false,
        questions: [],
      });
    }
    setErrors({});
    setActiveTab('editor');
  }, [template, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }
    
    formData.questions.forEach((q, i) => {
      if (!q.text.trim()) {
        newErrors[`question_${i}`] = 'Question text is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...defaultQuestion, id: generateQuestionId() }],
    }));
  };

  const handleUpdateQuestion = (index: number, updates: Partial<TemplateQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? { ...q, ...updates } : q),
    }));
    
    // Clear error for this question if text was provided
    if (updates.text && updates.text.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`question_${index}`];
        return newErrors;
      });
    }
  };

  const handleDeleteQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.questions.length) return;
    
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSave = async (publish = false) => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    
    try {
      if (isEditing && template) {
        // If template is already published and we're making changes, create new version
        const createNewVersion = template.is_active && publish;
        
        await updateTemplate(template.id, {
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          department: formData.department,
          is_default: formData.is_default,
          is_active: publish,
          questions: formData.questions,
        }, createNewVersion);
      } else {
        await createTemplate({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          department: formData.department,
          is_default: formData.is_default,
          is_active: publish,
          questions: formData.questions,
          created_by: user?.id || null,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" /> Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Template Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="e.g., Quarterly Performance Review"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: typeof formData.category) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of when to use this template..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department (optional)</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value || null }))}
                  placeholder="e.g., Engineering, Sales"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Set as default template</Label>
              </div>
            </div>

            {/* Questions Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Questions</Label>
                <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Question
                </Button>
              </div>
              
              {errors.questions && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.questions}
                </div>
              )}

              <div className="space-y-3">
                {formData.questions.map((question, index) => (
                  <Card key={question.id} className={`border ${errors[`question_${index}`] ? 'border-destructive' : 'border-border'}`}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-2">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                          >
                            <GripVertical className="w-4 h-4 rotate-180" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === formData.questions.length - 1}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                            <Input
                              value={question.text}
                              onChange={(e) => handleUpdateQuestion(index, { text: e.target.value })}
                              placeholder="Enter question text..."
                              className="flex-1"
                            />
                          </div>
                          
                          {errors[`question_${index}`] && (
                            <p className="text-sm text-destructive">{errors[`question_${index}`]}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4">
                            <Select
                              value={question.type}
                              onValueChange={(value: typeof question.type) => 
                                handleUpdateQuestion(index, { type: value })
                              }
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUESTION_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`required_${index}`}
                                checked={question.required}
                                onCheckedChange={(checked) => handleUpdateQuestion(index, { required: checked })}
                              />
                              <Label htmlFor={`required_${index}`} className="text-sm">Required</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`voice_${index}`}
                                checked={question.voiceEnabled}
                                onCheckedChange={(checked) => handleUpdateQuestion(index, { voiceEnabled: checked })}
                              />
                              <Label htmlFor={`voice_${index}`} className="text-sm flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Voice
                              </Label>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {formData.questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <p>No questions added yet</p>
                  <Button variant="link" onClick={handleAddQuestion}>Add your first question</Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{formData.title || 'Untitled Template'}</h2>
                  {formData.description && (
                    <p className="text-muted-foreground mt-1">{formData.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Badge>{formData.category}</Badge>
                    {formData.department && <Badge variant="outline">{formData.department}</Badge>}
                    {formData.is_default && <Badge variant="secondary">Default</Badge>}
                  </div>
                </div>
                
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-medium text-foreground">Questions Preview</h3>
                  
                  {formData.questions.length === 0 ? (
                    <p className="text-muted-foreground italic">No questions to preview</p>
                  ) : (
                    <div className="space-y-4">
                      {formData.questions.map((q, i) => (
                        <div key={q.id} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                          <span className="text-primary font-semibold">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="text-foreground">{q.text || 'Empty question'}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="capitalize">{q.type.replace('_', ' ')}</span>
                              {q.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                              {q.voiceEnabled && (
                                <span className="flex items-center gap-1">
                                  <Mic className="w-3 h-3" /> Voice enabled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> Save as Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
            <Send className="w-4 h-4" /> {isEditing ? 'Publish Changes' : 'Publish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateEditorModal;
