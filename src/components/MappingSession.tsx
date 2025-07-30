import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface MappingDecision {
  id: string;
  originalAccount: string;
  suggestedMapping: string;
  confidenceScore: number;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  finalMapping?: string;
}

interface MappingSessionProps {
  sessionId: string;
  decisions: MappingDecision[];
  onDecisionUpdate: (decisionId: string, status: 'approved' | 'rejected', finalMapping?: string) => void;
  onComplete: () => void;
}

export function MappingSession({ sessionId, decisions, onDecisionUpdate, onComplete }: MappingSessionProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customMapping, setCustomMapping] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentDecision = decisions[currentIndex];
  const progress = ((currentIndex + 1) / decisions.length) * 100;
  const pendingDecisions = decisions.filter(d => d.status === 'pending').length;
  const approvedDecisions = decisions.filter(d => d.status === 'approved').length;

  const handleApprove = async () => {
    if (!currentDecision || !user) return;
    
    setIsProcessing(true);
    try {
      await onDecisionUpdate(currentDecision.id, 'approved', currentDecision.suggestedMapping);
      
      // Move to next pending decision or complete
      const nextPendingIndex = decisions.findIndex((d, index) => 
        index > currentIndex && d.status === 'pending'
      );
      
      if (nextPendingIndex !== -1) {
        setCurrentIndex(nextPendingIndex);
      } else if (pendingDecisions <= 1) {
        onComplete();
      } else {
        // Find first pending decision
        const firstPending = decisions.findIndex(d => d.status === 'pending');
        if (firstPending !== -1) {
          setCurrentIndex(firstPending);
        } else {
          onComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve mapping. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentDecision || !user) return;
    
    setIsProcessing(true);
    try {
      const finalMapping = customMapping.trim() || currentDecision.originalAccount;
      await onDecisionUpdate(currentDecision.id, 'rejected', finalMapping);
      setCustomMapping('');
      
      // Move to next pending decision
      const nextPendingIndex = decisions.findIndex((d, index) => 
        index > currentIndex && d.status === 'pending'
      );
      
      if (nextPendingIndex !== -1) {
        setCurrentIndex(nextPendingIndex);
      } else if (pendingDecisions <= 1) {
        onComplete();
      } else {
        const firstPending = decisions.findIndex(d => d.status === 'pending');
        if (firstPending !== -1) {
          setCurrentIndex(firstPending);
        } else {
          onComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject mapping. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const navigateToDecision = (index: number) => {
    setCurrentIndex(index);
    setCustomMapping('');
  };

  if (!currentDecision) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
          <p className="text-muted-foreground">All mappings have been processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mapping Session Progress</span>
            <Badge variant="outline">
              {currentIndex + 1} of {decisions.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Review AI-suggested mappings and approve or provide corrections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{approvedDecisions} approved</span>
            <span>{pendingDecisions} pending</span>
            <span>{decisions.length - approvedDecisions - pendingDecisions} rejected</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Decision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Mapping Suggestion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Original Account</label>
              <p className="text-lg font-mono bg-muted p-3 rounded-md mt-1">
                {currentDecision.originalAccount}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Suggested Mapping</label>
              <p className="text-lg font-mono bg-primary/5 p-3 rounded-md mt-1">
                {currentDecision.suggestedMapping}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">AI Reasoning</label>
            <p className="text-sm bg-muted p-3 rounded-md mt-1">
              {currentDecision.reasoning}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence Score:</span>
            <Badge variant={currentDecision.confidenceScore >= 0.8 ? "default" : 
                          currentDecision.confidenceScore >= 0.6 ? "secondary" : "outline"}>
              {Math.round(currentDecision.confidenceScore * 100)}%
            </Badge>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Custom Mapping (optional)</label>
            <input
              type="text"
              value={customMapping}
              onChange={(e) => setCustomMapping(e.target.value)}
              placeholder="Enter alternative mapping if you disagree with the suggestion"
              className="w-full p-3 border rounded-md"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Suggestion
            </Button>
            <Button 
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {customMapping.trim() ? 'Use Custom Mapping' : 'Keep Original'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Decision List */}
      <Card>
        <CardHeader>
          <CardTitle>All Decisions</CardTitle>
          <CardDescription>Click on any item to jump to that decision</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {decisions.map((decision, index) => (
              <div
                key={decision.id}
                onClick={() => navigateToDecision(index)}
                className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                  index === currentIndex ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                }`}
              >
                <span className="font-mono text-sm truncate flex-1 mr-4">
                  {decision.originalAccount}
                </span>
                <div className="flex items-center gap-2">
                  {decision.status === 'pending' && (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {decision.status === 'approved' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {decision.status === 'rejected' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {Math.round(decision.confidenceScore * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}