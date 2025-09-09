import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Languages } from 'lucide-react';
import { useLanguageContext } from '@/hooks/useLanguageContext';

interface UserLanguageSelectorProps {
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function UserLanguageSelector({ 
  showLabel = true,
  size = 'default',
  className = ''
}: UserLanguageSelectorProps) {
  const { currentLanguage, setCurrentLanguage, availableLanguages, loading, t } = useLanguageContext();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 animate-spin" />
        {showLabel && <span className="text-sm text-muted-foreground">{t('LOADING', 'Loading...')}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-1">
          <Languages className="h-4 w-4" />
          <span className="text-sm font-medium">{t('LABEL_LANGUAGE', 'Language')}:</span>
        </div>
      )}
      <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
        <SelectTrigger className={`w-auto min-w-[120px] ${size === 'sm' ? 'h-8 text-xs' : ''}`}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="uppercase text-xs font-mono">
                {currentLanguage}
              </span>
              {availableLanguages.find(lang => lang.code === currentLanguage) && (
                <>
                  <span>{availableLanguages.find(lang => lang.code === currentLanguage)?.name}</span>
                  {availableLanguages.find(lang => lang.code === currentLanguage)?.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span className="uppercase text-xs font-mono w-6">
                  {language.code}
                </span>
                <span>{language.name}</span>
                {language.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </div>
            </SelectItem>
          ))}
          <div className="border-t mt-1">
            <SelectItem value="orig" className="text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="uppercase text-xs font-mono w-6">orig</span>
                <span>{t('ORIGINAL_LANGUAGE', 'Original Language')}</span>
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}