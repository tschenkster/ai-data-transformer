import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Upload, Languages, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';
import { LanguageSelector } from '@/components/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface AccountData {
  accountNumber: string;
  originalDescription: string;
  translatedDescription?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

interface TranslationSession {
  sessionId: string;
  status: 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentBatch: number;
  totalBatches: number;
}

export default function CoATranslator() {
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

  const languages = [
    { code: 'auto', name: 'Auto-detect', flag: '🔍' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
    { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
    { code: 'et', name: 'Estonian', flag: '🇪🇪' },
    { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
    { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' }
  ];

  const handleFileProcessed = (data: { accounts: AccountData[]; filename: string; totalAccounts: number }) => {
    console.log('File processed:', data);
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
      const { data: result, error } = await supabase.functions.invoke('detect-language', {
        body: { accounts: data.slice(0, 10) } // Sample first 10 for detection
      });

      if (error) throw error;

      console.log('Language detection result:', result);
      setDetectedLanguage(result.overallLanguage);
      setSourceLanguage(result.overallLanguage);
      
      toast({
        title: "Language detected",
        description: `Detected source language: ${languages.find(l => l.code === result.overallLanguage)?.name || result.overallLanguage}`,
      });
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
      await supabase.from('coa_translation_sessions').insert({
        session_id: sessionId,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        filename: uploadedFileName,
        total_accounts: uploadedData.length,
        source_language: sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage,
        target_language: targetLanguage,
        session_data: { accounts: uploadedData } as any
      });

      const translated: AccountData[] = [];

      // Process in batches
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, uploadedData.length);
        const batch = uploadedData.slice(start, end);

        const { data: result, error } = await supabase.functions.invoke('translate-accounts', {
          body: {
            accounts: batch,
            sourceLanguage: sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage,
            targetLanguage,
            sessionId,
            batchInfo: {
              currentBatch: i + 1,
              totalBatches
            }
          }
        });

        if (error) throw error;

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
      await supabase
        .from('coa_translation_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          session_data: { accounts: uploadedData, translations: translated } as any
        })
        .eq('session_id', sessionId);

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
        await supabase
          .from('coa_translation_sessions')
          .update({ status: 'failed' })
          .eq('session_id', sessionId);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const exportToCSV = () => {
    // Get language codes for headers
    const sourceLang = translatedData[0]?.sourceLanguage || sourceLanguage;
    const targetLang = translatedData[0]?.targetLanguage || targetLanguage;
    
    // Create data with custom headers
    const dataWithCustomHeaders = translatedData.map(row => ({
      'Account Number': row.accountNumber,
      [`Account Description [${sourceLang.toUpperCase()}]`]: row.originalDescription,
      [`Account Description [${targetLang.toUpperCase()}]`]: row.translatedDescription,
      'Source Language': row.sourceLanguage,
      'Target Language': row.targetLanguage
    }));

    const csvData = Papa.unparse(dataWithCustomHeaders, {
      header: true
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${uploadedFileName.replace(/\.[^/.]+$/, '')}_translated_${timestamp}.csv`;

    saveAs(new Blob([csvData], { type: 'text/csv;charset=utf-8;' }), filename);
    
    toast({
      title: "CSV exported",
      description: `Downloaded ${filename}`,
    });
  };

  const exportToXLSX = () => {
    // Get language codes for headers
    const sourceLang = translatedData[0]?.sourceLanguage || sourceLanguage;
    const targetLang = translatedData[0]?.targetLanguage || targetLanguage;
    
    // Create data with custom headers
    const dataWithCustomHeaders = translatedData.map(row => ({
      'Account Number': row.accountNumber,
      [`Account Description [${sourceLang.toUpperCase()}]`]: row.originalDescription,
      [`Account Description [${targetLang.toUpperCase()}]`]: row.translatedDescription,
      'Source Language': row.sourceLanguage,
      'Target Language': row.targetLanguage
    }));

    const ws = XLSX.utils.json_to_sheet(dataWithCustomHeaders);
    ws['!cols'] = [
      { wch: 15 }, // Account Number
      { wch: 40 }, // Account Description (Source)
      { wch: 40 }, // Account Description (Target)
      { wch: 15 }, // Source Language
      { wch: 15 }  // Target Language
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Translated Accounts');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${uploadedFileName.replace(/\.[^/.]+$/, '')}_translated_${timestamp}.xlsx`;

    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Excel exported",
      description: `Downloaded ${filename}`,
    });
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chart of Accounts Translator</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 p-4 bg-muted rounded-lg">
        {[
          { step: 1, title: 'Upload', icon: Upload },
          { step: 2, title: 'Configure', icon: Languages },
          { step: 3, title: 'Translate', icon: RefreshCw },
          { step: 4, title: 'Download', icon: Download }
        ].map(({ step: stepNum, title, icon: Icon }, index) => (
          <div key={stepNum} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step >= stepNum ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`ml-2 font-medium ${step >= stepNum ? 'text-primary' : 'text-muted-foreground'}`}>
              {title}
            </span>
            {index < 3 && <ArrowRight className="w-5 h-5 mx-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: File Upload */}
      {step === 1 && (
        <FileUpload 
          onFileProcessed={handleFileProcessed}
          mode="coa-translation"
        />
      )}

      {/* Step 2: Language Configuration */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Languages className="w-5 h-5 mr-2" />
              Language Configuration
            </CardTitle>
            <CardDescription>
              Configure source and target languages for translation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Preview */}
            <div>
              <h3 className="font-semibold mb-2">Data Preview ({uploadedData.length} accounts)</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium text-xs">Account Number</th>
                      <th className="text-left p-2 font-medium text-xs">Description</th>
                      <th className="text-left p-2 font-medium text-xs">Source Language</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.slice(0, 5).map((account, index) => {
                      const accountLanguage = detectedLanguage || 'en';
                      const languageInfo = languages.find(l => l.code === accountLanguage);
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-mono text-xs">{account.accountNumber}</td>
                          <td className="p-2 text-xs">{account.originalDescription}</td>
                          <td className="p-2 text-xs">
                            {isDetectingLanguage ? (
                              <div className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span className="text-muted-foreground">Detecting...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-base">{languageInfo?.flag || '🏳️'}</span>
                                <span className="font-mono font-medium uppercase">{accountLanguage}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Language Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Source Language</label>
                <LanguageSelector
                  languages={languages}
                  value={sourceLanguage}
                  onChange={setSourceLanguage}
                />
                {detectedLanguage && sourceLanguage === 'auto' && (
                  <Badge variant="secondary" className="mt-2">
                    Detected: {languages.find(l => l.code === detectedLanguage)?.name}
                  </Badge>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Language</label>
                <LanguageSelector
                  languages={languages.filter(l => l.code !== 'auto')}
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!targetLanguage || (!detectedLanguage && sourceLanguage === 'auto')}
              >
                Continue to Translation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Translation Progress */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Translation Progress
            </CardTitle>
            <CardDescription>
              AI translation in progress using Claude 3.5 Haiku
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isTranslating && !session && (
              <div className="text-center space-y-4">
                <p>Ready to translate {uploadedData.length} accounts</p>
                <p className="text-sm text-muted-foreground">
                  From {languages.find(l => l.code === (sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage))?.name} 
                  to {languages.find(l => l.code === targetLanguage)?.name}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={startTranslation}>
                    Start Translation
                  </Button>
                </div>
              </div>
            )}

            {session && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Progress</span>
                  <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                    {session.status === 'processing' ? 'In Progress' : 
                     session.status === 'completed' ? 'Completed' : session.status}
                  </Badge>
                </div>
                
                <Progress value={session.progress} className="w-full" />
                
                <div className="text-sm text-muted-foreground text-center">
                  Batch {session.currentBatch} of {session.totalBatches} 
                  ({Math.round(session.progress)}% complete)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Download Results */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Download Translated Results
            </CardTitle>
            <CardDescription>
              Review and download your translated Chart of Accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Results Preview */}
            <div>
              <h3 className="font-semibold mb-2">Translation Results ({translatedData.length} accounts)</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Account #</th>
                      <th className="text-left p-3 font-medium">Original</th>
                      <th className="text-left p-3 font-medium">Translated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {translatedData.slice(0, 5).map((account, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 font-mono">{account.accountNumber}</td>
                        <td className="p-3">{account.originalDescription}</td>
                        <td className="p-3">{account.translatedDescription}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex flex-wrap gap-4">
              <Button onClick={exportToCSV} variant="outline">
                Export as CSV
              </Button>
              <Button onClick={exportToXLSX} variant="outline">
                Export as Excel
              </Button>
              <Button onClick={resetTranslator} variant="secondary">
                Start New Translation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}