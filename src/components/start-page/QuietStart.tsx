import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee } from 'lucide-react';

interface QuietStartProps {
  locale: 'en' | 'de';
}

export function QuietStart({ locale }: QuietStartProps) {
  const greeting = locale === 'de' 
    ? 'Guten Morgen! Bereit für einen produktiven Tag.' 
    : 'Good morning! Ready for a productive day.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto md:max-w-2xl"
    >
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Coffee className="h-6 w-6 text-muted-foreground" />
            <p className="text-base text-muted-foreground">
              {greeting}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}