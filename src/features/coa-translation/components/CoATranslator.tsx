import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Upload, Languages, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/features/imports/shared-pipeline';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useCoATranslation } from '../hooks/useCoATranslation';
import { languages } from '../constants/languages';

export function CoATranslator() {
  const {
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
  } = useCoATranslation();

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
          <CardContent className="space-y-6 pt-6">
            {/* Data Preview */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Data Preview (5 of {uploadedData.length} accounts)</p>
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

            <div className="flex gap-4 justify-end">
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
            {session && (
              <div className="space-y-4">
                <Progress value={session.progress} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Batch {session.currentBatch} of {session.totalBatches}</span>
                  <span>{Math.round(session.progress)}% complete</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isTranslating}>
                Back
              </Button>
              <Button onClick={startTranslation} disabled={isTranslating}>
                {isTranslating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Translating...
                  </>
                ) : (
                  'Start Translation'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results and Export */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Translation Complete
            </CardTitle>
            <CardDescription>
              {translatedData.length} accounts translated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Results Preview */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Results Preview (first 5 accounts)</p>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead className="text-xs">Account</TableHead>
                    <TableHead className="text-xs">Original</TableHead>
                    <TableHead className="text-xs">Translated</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {translatedData.slice(0, 5).map((account, index) => (
                    <tr key={index}>
                      <TableCell className="font-mono text-xs">{account.accountNumber}</TableCell>
                      <TableCell className="text-xs">{account.originalDescription}</TableCell>
                      <TableCell className="text-xs">{account.translatedDescription}</TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Export Options */}
            <div className="flex gap-4 justify-between">
              <Button variant="outline" onClick={resetTranslator}>
                New Translation
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  Export CSV
                </Button>
                <Button onClick={exportToXLSX}>
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}