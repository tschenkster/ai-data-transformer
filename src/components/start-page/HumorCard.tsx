import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, Quote, Image as ImageIcon } from 'lucide-react';
import type { StartPageItem } from '@/hooks/use-start-page';

interface HumorCardProps {
  item: StartPageItem;
  localizedContent: {
    title?: string;
    body: string;
    alt?: string;
  };
}

export function HumorCard({ item, localizedContent }: HumorCardProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'joke':
        return <Smile className="h-6 w-6 text-primary" />;
      case 'quote':
        return <Quote className="h-6 w-6 text-primary" />;
      case 'meme':
      case 'illustration':
        return <ImageIcon className="h-6 w-6 text-primary" />;
      default:
        return <Smile className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto md:max-w-2xl"
    >
      <Card className="border-2 border-primary/10 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            <div className="flex-1 space-y-3">
              {localizedContent.title && (
                <h3 className="text-lg font-semibold text-foreground">
                  {localizedContent.title}
                </h3>
              )}
              <p className="text-base text-muted-foreground leading-relaxed">
                {localizedContent.body}
              </p>
              {item.asset_url && (
                <div className="mt-4">
                  <img 
                    src={item.asset_url} 
                    alt={localizedContent.alt || ''}
                    className="w-full max-w-sm mx-auto rounded-lg shadow-sm"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}