import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguageQuery } from '../hooks/useLanguageQuery';
import { useLanguageContext } from '@/hooks/useLanguageContext';
import { Badge } from '@/components/ui/badge';

interface LanguageQuerySelectorProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Enhanced language selector with URL parameter support
 * Implements PRD requirement for ?lang=<iso> API support
 */
export function LanguageQuerySelector({ 
  showLabel = true, 
  size = 'md', 
  className = '' 
}: LanguageQuerySelectorProps) {
  const { availableLanguages, t } = useLanguageContext();
  const { activeLanguage, setLanguageParam, hasLanguageParam } = useLanguageQuery();

  const handleLanguageChange = (languageCode: string) => {
    setLanguageParam(languageCode);
  };

  const currentLang = availableLanguages.find(lang => lang.code === activeLanguage);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-muted-foreground">
          {t('LABEL_LANGUAGE', 'Language')}:
        </label>
      )}
      <div className="flex items-center gap-2">
        <Select value={activeLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className={`w-auto min-w-[120px] ${size === 'sm' ? 'h-8 text-sm' : ''}`}>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-muted px-1 rounded">
                    {language.code.toUpperCase()}
                  </span>
                  {language.name}
                  {language.isDefault && (
                    <Badge variant="secondary" className="ml-1">Default</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="orig">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-muted px-1 rounded">ORIG</span>
                Original Language
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {hasLanguageParam && (
          <Badge variant="outline" className="text-xs">
            URL Override
          </Badge>
        )}
      </div>
    </div>
  );
}