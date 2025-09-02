import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TranslationTestButtonProps {
  structureUuid: string;
  structureName: string;
}

export const TranslationTestButton: React.FC<TranslationTestButtonProps> = ({
  structureUuid,
  structureName
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTriggerTranslations = async () => {
    setIsGenerating(true);
    try {
      console.log(`Triggering translation generation for structure: ${structureUuid}`);
      
      const { data, error } = await supabase.functions.invoke('retroactive-translation-generation', {
        body: { structureUuid }
      });

      if (error) {
        console.error('Translation generation error:', error);
        toast.error(`Translation failed: ${error.message}`);
        return;
      }

      console.log('Translation generation result:', data);
      
      if (data?.success) {
        toast.success(`Translation generation completed! 
          Processed ${data.lineItemsProcessed} line items. 
          Success: ${data.successCount}, Failures: ${data.failureCount}`);
      } else {
        toast.error(`Translation failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to trigger translation generation:', error);
      toast.error(`Translation trigger failed: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded">
      <div className="flex-1">
        <p className="font-medium text-sm">{structureName}</p>
        <p className="text-xs text-muted-foreground">UUID: {structureUuid}</p>
      </div>
      <Button 
        onClick={handleTriggerTranslations}
        disabled={isGenerating}
        size="sm"
        variant="outline"
      >
        {isGenerating ? 'Generating...' : 'Generate Translations'}
      </Button>
    </div>
  );
};