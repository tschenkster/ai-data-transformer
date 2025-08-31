import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface QuietToggleProps {
  onClick: () => void;
  locale: 'en' | 'de';
  quietMode: boolean;
}

export function QuietToggle({ onClick, locale, quietMode }: QuietToggleProps) {
  const text = locale === 'de' 
    ? (quietMode ? 'Humor einschalten' : 'Ich mag einen ruhigen Start')
    : (quietMode ? 'Turn on humor' : 'I prefer a quiet start');

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
    >
      {quietMode ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
      {text}
    </Button>
  );
}