import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

interface PrimaryCTAProps {
  locale: 'en' | 'de';
  className?: string;
}

export function PrimaryCTA({ locale, className }: PrimaryCTAProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/convert');
  };

  const text = locale === 'de' 
    ? 'DATEV-Datei konvertieren' 
    : 'Convert DATEV File';

  return (
    <div className={className}>
      <Button
        onClick={handleClick}
        size="lg"
        className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Upload className="h-5 w-5" />
        {text}
      </Button>
    </div>
  );
}