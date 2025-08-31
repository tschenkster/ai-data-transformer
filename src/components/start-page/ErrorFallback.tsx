import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorFallbackProps {
  message: string;
  locale: 'en' | 'de';
}

export function ErrorFallback({ message, locale }: ErrorFallbackProps) {
  const title = locale === 'de' ? 'Guten Morgen!' : 'Good Morning!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto md:max-w-2xl"
    >
      <Card className="border-2 border-orange-200 bg-orange-50/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-orange-900">
                {title}
              </h3>
              <p className="text-base text-orange-700 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}