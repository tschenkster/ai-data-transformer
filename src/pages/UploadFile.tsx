import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { MappingSession } from '@/components/MappingSession';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MappingDecision {
  id: string;
  originalAccount: string;
  suggestedMapping: string;
  confidenceScore: number;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  finalMapping?: string;
}

export default function UploadFile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [mappingDecisions, setMappingDecisions] = useState<MappingDecision[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const processWithAI = async (accounts: string[], sessionId: string) => {
    setIsProcessingAI(true);
    
    try {
      // Call the AI mapping edge function
      const { data, error } = await supabase.functions.invoke('ai-account-mapper', {
        body: { 
          accounts,
          sessionId,
          userId: user?.id 
        }
      });

      if (error) {
        throw error;
      }

      setMappingDecisions(data.decisions);
      
      toast({
        title: "AI Processing Complete",
        description: `Generated ${data.decisions.length} mapping suggestions.`,
      });
      
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: "AI Processing Failed", 
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleFileProcessed = async (data: { accounts: string[]; filename: string; totalAccounts: number }) => {
    if (!user) return;

    try {
      // Create mapping session
      const { data: session, error: sessionError } = await supabase
        .from('mapping_sessions')
        .insert({
          user_id: user.id,
          filename: data.filename,
          total_accounts: data.totalAccounts,
          status: 'processing'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setCurrentSessionId(session.id);
      
      // Process accounts with AI
      await processWithAI(data.accounts, session.id);
      
    } catch (error) {
      console.error('Session creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create mapping session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDecisionUpdate = async (decisionId: string, status: 'approved' | 'rejected', finalMapping?: string) => {
    if (!user || !currentSessionId) return;

    try {
      // Update mapping decision in database
      const { error: decisionError } = await supabase
        .from('mapping_decisions')
        .update({
          status,
          final_mapping: finalMapping,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', decisionId);

      if (decisionError) throw decisionError;

      // Update local state
      setMappingDecisions(prev => prev.map(decision => 
        decision.id === decisionId 
          ? { ...decision, status, finalMapping }
          : decision
      ));

      // If approved, also create/update account mapping
      if (status === 'approved' && finalMapping) {
        const decision = mappingDecisions.find(d => d.id === decisionId);
        if (decision) {
          const { error: mappingError } = await supabase
            .from('account_mappings')
            .upsert({
              user_id: user.id,
              original_account_name: decision.originalAccount,
              mapped_account_name: finalMapping,
              confidence_score: decision.confidenceScore,
              reasoning: decision.reasoning,
              validated: true,
              validated_by: user.id,
              validated_at: new Date().toISOString()
            });

          if (mappingError) throw mappingError;
        }
      }

    } catch (error) {
      console.error('Decision update error:', error);
      throw error;
    }
  };

  const handleSessionComplete = async () => {
    if (!currentSessionId) return;

    try {
      const approvedCount = mappingDecisions.filter(d => d.status === 'approved').length;
      
      // Update session status
      const { error } = await supabase
        .from('mapping_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_accounts: mappingDecisions.length,
          approved_accounts: approvedCount
        })
        .eq('id', currentSessionId);

      if (error) throw error;

      toast({
        title: "Session Complete!",
        description: `Successfully processed ${mappingDecisions.length} accounts with ${approvedCount} approved mappings.`,
      });

      // Navigate back to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Session completion error:', error);
      toast({
        title: "Error",
        description: "Failed to complete session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">File Upload & Account Mapping</h1>
        </div>

        {!currentSessionId && (
          <FileUpload onFileProcessed={handleFileProcessed} />
        )}

        {isProcessingAI && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Processing in Progress</h3>
              <p className="text-muted-foreground">
                Our AI is analyzing your account names and generating intelligent mapping suggestions...
              </p>
            </CardContent>
          </Card>
        )}

        {currentSessionId && mappingDecisions.length > 0 && !isProcessingAI && (
          <MappingSession
            sessionId={currentSessionId}
            decisions={mappingDecisions}
            onDecisionUpdate={handleDecisionUpdate}
            onComplete={handleSessionComplete}
          />
        )}
      </div>
    </div>
  );
}