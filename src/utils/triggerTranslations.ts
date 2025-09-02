import { supabase } from '@/integrations/supabase/client';

// Utility function to trigger translation generation for a specific structure
export const triggerTranslationGeneration = async (structureUuid: string) => {
  try {
    console.log(`Triggering translation generation for structure: ${structureUuid}`);
    
    const { data, error } = await supabase.functions.invoke('retroactive-translation-generation', {
      body: { structureUuid }
    });

    if (error) {
      console.error('Translation generation error:', error);
      return { success: false, error: error.message };
    }

    console.log('Translation generation result:', data);
    return data;
  } catch (error) {
    console.error('Failed to trigger translation generation:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Trigger for the specific uploaded structure
triggerTranslationGeneration('a4d2f1fc-9d58-4ee3-b2c4-b453b3612f3a')
  .then(result => {
    console.log('Translation trigger result:', result);
  })
  .catch(error => {
    console.error('Translation trigger failed:', error);
  });