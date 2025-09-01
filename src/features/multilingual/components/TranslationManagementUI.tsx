import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTranslationService } from '@/services/enhancedTranslationService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw, Eye, Edit, Wand2 } from 'lucide-react';

interface TranslationManagementUIProps {
  entityType: 'report_structure' | 'report_line_item';
  entityUuid: string;
  entityName?: string;
}

/**
 * Translation Management UI Component
 * Implements Phase 4 requirement for translation management interface
 */
export function TranslationManagementUI({ 
  entityType, 
  entityUuid, 
  entityName = 'Entity' 
}: TranslationManagementUIProps) {
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('de');
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [entityType, entityUuid]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load system languages
      const langs = await EnhancedTranslationService.getSystemLanguages();
      setLanguages(langs);
      
      // Load entity translations for all languages
      const allTranslations: Record<string, Record<string, string>> = {};
      
      for (const lang of langs) {
        const langTranslations = await EnhancedTranslationService.getEntityTranslations(
          entityType,
          entityUuid,
          lang.language_code
        );
        
        for (const [fieldKey, translatedText] of Object.entries(langTranslations)) {
          if (!allTranslations[fieldKey]) {
            allTranslations[fieldKey] = {};
          }
          allTranslations[fieldKey][lang.language_code] = translatedText;
        }
      }
      
      setTranslations(allTranslations);
      
      // Select first field by default
      const fields = Object.keys(allTranslations);
      if (fields.length > 0) {
        setSelectedField(fields[0]);
      }
      
    } catch (error) {
      console.error('Error loading translation data:', error);
      toast({
        title: "Error",
        description: "Failed to load translation data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTranslations = async () => {
    try {
      setSaving(true);
      
      await EnhancedTranslationService.saveTranslations(
        entityType,
        entityUuid,
        translations
      );
      
      toast({
        title: "Success",
        description: "Translations saved successfully"
      });
      
      setEditMode({});
      
    } catch (error) {
      console.error('Error saving translations:', error);
      toast({
        title: "Error", 
        description: "Failed to save translations",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateAITranslations = async () => {
    try {
      setSaving(true);
      
      await EnhancedTranslationService.generateMissingTranslations(
        entityType,
        entityUuid,
        ['en', 'de']
      );
      
      // Reload translations
      await loadData();
      
      toast({
        title: "Success",
        description: "AI translations generated successfully"
      });
      
    } catch (error) {
      console.error('Error generating AI translations:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI translations", 
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTranslationChange = (fieldKey: string, languageCode: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [languageCode]: value
      }
    }));
  };

  const toggleEditMode = (key: string) => {
    setEditMode(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading translations...
        </CardContent>
      </Card>
    );
  }

  const fieldKeys = Object.keys(translations);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Translation Management: {entityName}
            <div className="flex gap-2">
              <Button 
                onClick={generateAITranslations}
                disabled={saving}
                size="sm"
                variant="outline"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Translations
              </Button>
              <Button 
                onClick={handleSaveTranslations}
                disabled={saving || Object.keys(editMode).length === 0}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage translations for all fields and languages. Use the tabs below to edit translations by field or language.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedField} onValueChange={setSelectedField}>
            <TabsList className="grid grid-cols-auto w-full overflow-x-auto">
              {fieldKeys.map((fieldKey) => (
                <TabsTrigger key={fieldKey} value={fieldKey} className="text-xs">
                  {fieldKey.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            {fieldKeys.map((fieldKey) => (
              <TabsContent key={fieldKey} value={fieldKey} className="space-y-4">
                <div className="grid gap-4">
                  {languages.map((language) => {
                    const translationKey = `${fieldKey}-${language.language_code}`;
                    const isEditing = editMode[translationKey];
                    const translation = translations[fieldKey]?.[language.language_code] || '';
                    
                    return (
                      <div key={language.language_code} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Badge variant={language.is_default ? "default" : "secondary"}>
                              {language.language_code.toUpperCase()}
                            </Badge>
                            {language.language_name}
                            {language.is_default && <Badge variant="outline">Default</Badge>}
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEditMode(translationKey)}
                          >
                            {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                        
                        {isEditing ? (
                          <Textarea
                            value={translation}
                            onChange={(e) => handleTranslationChange(fieldKey, language.language_code, e.target.value)}
                            placeholder={`Translation for ${fieldKey} in ${language.language_name}`}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md min-h-[80px] flex items-start">
                            {translation || (
                              <span className="text-muted-foreground italic">
                                No translation available
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}