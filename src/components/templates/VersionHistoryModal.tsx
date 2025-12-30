import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuestionTemplate } from '@/types/questionTemplate';
import { format } from 'date-fns';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface VersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: QuestionTemplate | null;
  versions: QuestionTemplate[];
}

const VersionHistoryModal = ({ open, onOpenChange, template, versions }: VersionHistoryModalProps) => {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Version History: {template.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No version history available</p>
              </div>
            ) : (
              versions.map((version, index) => (
                <Card 
                  key={version.id} 
                  className={`border ${version.id === template.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={version.id === template.id ? 'default' : 'outline'}>
                            v{version.version}
                          </Badge>
                          {index === 0 && <Badge variant="secondary">Latest</Badge>}
                          {version.is_active ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          {version.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(version.updated_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {version.questions.length} question{version.questions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Questions Summary */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Questions in this version:</p>
                      <div className="space-y-1">
                        {version.questions.slice(0, 3).map((q, i) => (
                          <p key={q.id} className="text-sm text-foreground truncate">
                            {i + 1}. {q.text}
                          </p>
                        ))}
                        {version.questions.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{version.questions.length - 3} more question{version.questions.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistoryModal;
