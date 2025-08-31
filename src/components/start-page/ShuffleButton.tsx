import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

interface ShuffleButtonProps {
  onClick: () => void;
  locale: 'en' | 'de';
  disabled?: boolean;
}

export function ShuffleButton({ onClick, locale, disabled }: ShuffleButtonProps) {
  const text = locale === 'de' ? 'Zeig mir noch eins' : 'Show me another one';

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Shuffle className="h-4 w-4" />
      {text}
    </Button>
  );
}