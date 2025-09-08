import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Languages } from 'lucide-react';
import { MultilingualSelector } from '@/components/MultilingualSelector';
import { TranslationEditor } from '@/components/TranslationEditor';
import { TranslationGapsViewer } from '@/components/TranslationGapsViewer';
import { ContentDiscoveryCard } from '@/components/multilingual/ContentDiscoveryCard';
import { IntelligentMigrationCard } from '@/components/multilingual/IntelligentMigrationCard';
import { useLanguagePreference } from '@/hooks/useTranslations';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';

export default function MultilingualManagement() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [translationEditorOpen, setTranslationEditorOpen] = useState(false);
  const { language, changeLanguage } = useLanguagePreference();

  const breadcrumbItems = [
    { label: 'System Tools', path: '/admin/system-tools' },
    { label: 'Multilingual Management', path: '/admin/multilingual-management' }
  ];

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  return (
    <CompactPageLayout 
      breadcrumbItems={breadcrumbItems}
      currentPage="Multilingual Management"
    >
      <div className="space-y-6">

        {/* Content Discovery with Manual Controls */}
        <ContentDiscoveryCard onAnalysisComplete={handleAnalysisComplete} />

        {/* Intelligent Migration with Progress Tracking */}
        <IntelligentMigrationCard analysisData={analysisData} />

        {/* Translation Gaps Details */}
        {analysisData?.translationGaps && analysisData.translationGaps.length > 0 && (
          <TranslationGapsViewer gaps={analysisData.translationGaps} />
        )}


        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current multilingual system configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Translation Capabilities:</span>
                <div className="mt-1 space-x-2">
                  <Badge>Multi-directional</Badge>
                  <Badge variant="secondary">AI Language Detection</Badge>
                  <Badge variant="outline">UI Elements</Badge>
                  <Badge variant="outline">Content Data</Badge>
                </div>
              </div>
              <div>
                <span className="font-medium">Processing Features:</span>
                <div className="mt-1 space-x-2">
                  <Badge variant="outline">Gap Analysis</Badge>
                  <Badge variant="outline">Batch Processing</Badge>
                  <Badge variant="outline">Auto Bootstrap</Badge>
                  <Badge variant="outline">Error Recovery</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CompactPageLayout>
  );
}