import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Save, Languages, Loader2 } from 'lucide-react';
import { TranslationService, SystemLanguage } from '@/services/translationService';
import { useToast } from '@/hooks/use-toast';

interface TranslationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'report_structure' | 'report_line_item';
  entityUuid: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'input' | 'textarea';
    required?: boolean;
  }>;
  onSave?: () => void;
}

interface FieldTranslations {
  [fieldKey: string]: {
    [languageCode: string]: string;
  };
}

export function TranslationEditor({
  open,
  onOpenChange,
  entityType,
  entityUuid,
  fields,
  onSave
}: TranslationEditorProps) {
  const [languages, setLanguages] = useState<SystemLanguage[]>([]);
  const [translations, setTranslations] = useState<FieldTranslations>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('de');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, entityUuid]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load languages
      const languagesData = await TranslationService.getLanguages();
      setLanguages(languagesData);
      
      // Set default active tab
      const defaultLang = languagesData.find(lang => lang.is_default)?.language_code || 'de';
      setActiveTab(defaultLang);

      // Load existing translations
      const translationsData = await TranslationService.getEntityTranslations(entityType, entityUuid);
      
      // Organize translations by field and language
      const organized: FieldTranslations = {};
      fields.forEach(field => {
        organized[field.key] = {};
        languagesData.forEach(lang => {
          const key = `${field.key}_${lang.language_code}`;
          organized[field.key][lang.language_code] = translationsData[key] || '';
        });
      });
      
      setTranslations(organized);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load translations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, languageCode: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [languageCode]: value
      }
    }));
  };

  const generateTranslations = async () => {
    setGenerating(true);
    try {
      // Get source texts from German (default)
      const sourceTexts = fields
        .map(field => ({
          field_key: field.key,
          text: translations[field.key]?.['de'] || ''
        }))
        .filter(item => item.text.trim());

      if (sourceTexts.length === 0) {
        toast({
          title: "No Source Text",
          description: "Please add German text first to generate translations",
          variant: "destructive",
        });
        return;
      }

      const result = await TranslationService.generateTranslations({
        texts: sourceTexts,
        sourceLanguage: 'de',
        targetLanguages: ['en'],
        entityType,
        entityUuid,
        autoSave: false
      });

      // Update local state with generated translations
      if (result.success && result.translations) {
        const newTranslations = { ...translations };
        result.translations.forEach((langResult: any) => {
          langResult.translations.forEach((translation: any) => {
            if (newTranslations[translation.field_key]) {
              newTranslations[translation.field_key][translation.lang_code] = translation.text_value;
            }
          });
        });
        setTranslations(newTranslations);
        
        toast({
          title: "Success",
          description: "AI translations generated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate translations",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveTranslations = async () => {
    setSaving(true);
    try {
      // Prepare translations for saving
      const translationsToSave: Array<{ field_key: string; lang_code: string; text_value: string }> = [];
      
      Object.entries(translations).forEach(([fieldKey, langMap]) => {
        Object.entries(langMap).forEach(([langCode, text]) => {
          if (text.trim()) {
            translationsToSave.push({
              field_key: fieldKey,
              lang_code: langCode,
              text_value: text
            });
          }
        });
      });

      await TranslationService.saveTranslations(
        entityType,
        entityUuid,
        translationsToSave,
        'de'
      );

      toast({
        title: "Success",
        description: "Translations saved successfully",
      });

      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save translations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translation Editor
          </DialogTitle>
          <DialogDescription>
            Manage translations for {entityType.replace('_', ' ')} fields in different languages
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                {languages.map(lang => (
                  <TabsTrigger key={lang.language_code} value={lang.language_code}>
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-xs">{lang.language_code}</span>
                      {lang.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <Button
                onClick={generateTranslations}
                disabled={generating}
                variant="outline"
                size="sm"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                Generate AI Translations
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[400px] space-y-1">
              {languages.map(lang => (
                <TabsContent key={lang.language_code} value={lang.language_code} className="space-y-4 mt-0">
                  {fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={`${field.key}-${lang.language_code}`}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={`${field.key}-${lang.language_code}`}
                          value={translations[field.key]?.[lang.language_code] || ''}
                          onChange={(e) => handleFieldChange(field.key, lang.language_code, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()} in ${lang.language_name}`}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={`${field.key}-${lang.language_code}`}
                          value={translations[field.key]?.[lang.language_code] || ''}
                          onChange={(e) => handleFieldChange(field.key, lang.language_code, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()} in ${lang.language_name}`}
                        />
                      )}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveTranslations} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Translations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}