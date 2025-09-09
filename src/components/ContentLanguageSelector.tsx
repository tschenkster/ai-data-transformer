import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Loader2 } from 'lucide-react';
import { useUnifiedTranslation } from '@/contexts/UnifiedTranslationProvider';

interface ContentLanguageSelectorProps {
  showLabel?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function ContentLanguageSelector({ 
  showLabel = true, 
  size = 'default',
  className 
}: ContentLanguageSelectorProps) {
  const { contentLanguage, setContentLanguage, availableLanguages, loading, hasUrlOverride } = useUnifiedTranslation();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const currentLang = availableLanguages.find(lang => lang.code === contentLanguage);

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">Content Language</span>
          {hasUrlOverride && (
            <Badge variant="secondary" className="text-xs">
              URL Override
            </Badge>
          )}
        </div>
      )}
      
      <Select 
        value={contentLanguage} 
        onValueChange={setContentLanguage}
        disabled={hasUrlOverride}
      >
        <SelectTrigger className={className}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{contentLanguage.toUpperCase()}</span>
              <span className="text-sm text-muted-foreground">
                {currentLang?.name || contentLanguage}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{language.code.toUpperCase()}</span>
                <span>{language.name}</span>
                {language.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {hasUrlOverride && (
        <p className="text-xs text-muted-foreground">
          Language is overridden by URL parameter (?lang={contentLanguage})
        </p>
      )}
    </div>
  );
}