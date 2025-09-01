import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Languages, Globe } from 'lucide-react';
import { TranslationService, SystemLanguage } from '@/services/translationService';
import { useToast } from '@/hooks/use-toast';

interface MultilingualSelectorProps {
  currentLanguage?: string;
  onLanguageChange: (languageCode: string) => void;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function MultilingualSelector({ 
  currentLanguage, 
  onLanguageChange,
  showLabel = true,
  size = 'default'
}: MultilingualSelectorProps) {
  const [languages, setLanguages] = useState<SystemLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const { EnhancedTranslationService } = await import('@/services/enhancedTranslationService');
      const data = await EnhancedTranslationService.getSystemLanguages();
      setLanguages(data.map(lang => ({
        language_code: lang.language_code,
        language_name: lang.language_name,
        is_default: lang.is_default,
        is_enabled: lang.is_enabled
      })));
      
      if (!currentLanguage && data.length > 0) {
        const defaultLang = data.find(lang => lang.is_default)?.language_code || data[0].language_code;
        onLanguageChange(defaultLang);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load languages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentLangData = languages.find(lang => lang.language_code === currentLanguage);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 animate-spin" />
        {showLabel && <span className="text-sm text-muted-foreground">Loading...</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <div className="flex items-center gap-1">
          <Languages className="h-4 w-4" />
          <span className="text-sm font-medium">Language:</span>
        </div>
      )}
      <Select value={currentLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className={`w-auto min-w-[120px] ${size === 'sm' ? 'h-8 text-xs' : ''}`}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="uppercase text-xs font-mono">
                {currentLanguage || 'DE'}
              </span>
              {currentLangData && (
                <>
                  <span>{currentLangData.language_name}</span>
                  {currentLangData.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.language_code} value={language.language_code}>
              <div className="flex items-center gap-2">
                <span className="uppercase text-xs font-mono w-6">
                  {language.language_code}
                </span>
                <span>{language.language_name}</span>
                {language.is_default && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </div>
            </SelectItem>
          ))}
          <div className="border-t mt-1">
            <SelectItem value="orig" className="text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="uppercase text-xs font-mono w-6">orig</span>
                <span>Original Language</span>
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}