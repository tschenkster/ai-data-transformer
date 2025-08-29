import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TranslationService } from '@/features/coa-translation/services/translationService';
import { AccountData, TranslationSession } from '@/features/coa-translation/types';
import { languages } from '@/features/coa-translation/constants/languages';

export function useCoATranslation(): {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  uploadedData: AccountData[];
  translatedData: AccountData[];
  sourceLanguage: string;
  setSourceLanguage: React.Dispatch<React.SetStateAction<string>>;
  targetLanguage: string;
  setTargetLanguage: React.Dispatch<React.SetStateAction<string>>;
  detectedLanguage: string;
  session: TranslationSession | null;
  isTranslating: boolean;
  isDetectingLanguage: boolean;
  uploadedFileName: string;
  handleFileProcessed: (data: { accounts: AccountData[]; filename: string; totalAccounts: number }) => void;
  startTranslation: () => Promise<void>;
  exportToCSV: () => void;
  exportToXLSX: () => void;
  resetTranslator: () => void;
} {
  const [step, setStep] = useState(1);
  const [uploadedData, setUploadedData] = useState<AccountData[]>([]);
  const [translatedData, setTranslatedData] = useState<AccountData[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [session, setSession] = useState<TranslationSession | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  
  const { toast } = useToast();

  const handleFileProcessed = (data: { accounts: AccountData[]; filename: string; totalAccounts: number }) => {
    setUploadedData(data.accounts);
    setUploadedFileName(data.filename);
    setStep(2);
    
    toast({
      title: "File uploaded successfully",
      description: `Processed ${data.totalAccounts} accounts from ${data.filename}`,
    });

    // Auto-detect language if set to auto
    if (sourceLanguage === 'auto') {
      detectLanguage(data.accounts);
    }
  };

  const detectLanguage = async (data: AccountData[]) => {
    setIsDetectingLanguage(true);
    try {
      const result = await TranslationService.detectLanguage(data);
      
      setDetectedLanguage(result.overallLanguage);
      setSourceLanguage(result.overallLanguage);
      
      // Show appropriate toast based on detection method
      if (result.fallback) {
        toast({
          title: "Language detected (local)",
          description: `Detected source language: ${languages.find(l => l.code === result.overallLanguage)?.name || result.overallLanguage}. AI service unavailable, using pattern matching.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Language detected",
          description: `Detected source language: ${languages.find(l => l.code === result.overallLanguage)?.name || result.overallLanguage}`,
        });
      }
    } catch (error) {
      console.error('Language detection error:', error);
      toast({
        title: "Language detection failed",
        description: "Please select the source language manually",
        variant: "destructive",
      });
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const startTranslation = async () => {
    if (!uploadedData.length || !targetLanguage) return;

    setIsTranslating(true);
    const sessionId = crypto.randomUUID();
    const batchSize = 10;
    const totalBatches = Math.ceil(uploadedData.length / batchSize);

    setSession({
      sessionId,
      status: 'processing',
      progress: 0,
      currentBatch: 0,
      totalBatches
    });

    try {
      // Create session in database
      await TranslationService.createSession(sessionId, {
        filename: uploadedFileName,
        totalAccounts: uploadedData.length,
        sourceLanguage: sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage,
        targetLanguage,
        accounts: uploadedData
      });

      const translated: AccountData[] = [];

      // Process in batches
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, uploadedData.length);
        const batch = uploadedData.slice(start, end);

        const result = await TranslationService.translateBatch(batch, {
          sourceLanguage: sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage,
          targetLanguage,
          sessionId,
          batchInfo: {
            currentBatch: i + 1,
            totalBatches
          }
        });

        // Add translated accounts
        const batchTranslated = result.translations.map((t: any) => ({
          ...t,
          sourceLanguage: sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage,
          targetLanguage
        }));

        translated.push(...batchTranslated);

        // Update progress
        const progress = ((i + 1) / totalBatches) * 100;
        setSession(prev => prev ? {
          ...prev,
          progress,
          currentBatch: i + 1
        } : null);
      }

      setTranslatedData(translated);
      setStep(4);

      // Mark session as completed
      await TranslationService.updateSession(sessionId, 'completed', {
        accounts: uploadedData,
        translations: translated
      });

      toast({
        title: "Translation completed",
        description: `Successfully translated ${translated.length} accounts`,
      });

    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });

      // Mark session as failed
      if (sessionId) {
        await TranslationService.updateSession(sessionId, 'failed');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const exportToCSV = () => {
    try {
      const filename = TranslationService.exportToCSV(translatedData, uploadedFileName);
      toast({
        title: "CSV exported",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export CSV file",
        variant: "destructive",
      });
    }
  };

  const exportToXLSX = () => {
    try {
      const filename = TranslationService.exportToXLSX(translatedData, uploadedFileName);
      toast({
        title: "Excel exported",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export Excel file",
        variant: "destructive",
      });
    }
  };

  const resetTranslator = () => {
    setStep(1);
    setUploadedData([]);
    setTranslatedData([]);
    setSourceLanguage('auto');
    setTargetLanguage('en');
    setDetectedLanguage('');
    setSession(null);
    setIsTranslating(false);
    setUploadedFileName('');
    
    toast({
      title: "Translator reset",
      description: "Ready for a new translation",
    });
  };

  return {
    step,
    setStep,
    uploadedData,
    translatedData,
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    detectedLanguage,
    session,
    isTranslating,
    isDetectingLanguage,
    uploadedFileName,
    handleFileProcessed,
    startTranslation,
    exportToCSV,
    exportToXLSX,
    resetTranslator
  };
}