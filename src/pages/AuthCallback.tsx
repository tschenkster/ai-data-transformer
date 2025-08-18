import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage(`Email verification failed: ${error.message}`);
          return;
        }

        if (data.session?.user) {
          // Check if user was confirmed via email
          if (data.session.user.email_confirmed_at) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to your dashboard...');
            
            // Wait a moment then redirect
            setTimeout(() => {
              navigate('/home');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Email verification is still pending. Please check your email.');
          }
        } else {
          // No session but check URL for confirmation parameters
          const urlParams = new URLSearchParams(window.location.search);
          const errorParam = urlParams.get('error');
          const errorDescriptionParam = urlParams.get('error_description');

          if (errorParam && errorDescriptionParam) {
            setStatus('error');
            setMessage(`Error: ${errorDescriptionParam}`);
          } else {
            setStatus('error');
            setMessage('No confirmation token found. Please check your email link or try signing up again.');
          }
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleReturnToAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'error' && (
            <Button onClick={handleReturnToAuth} className="w-full">
              Return to Sign In
            </Button>
          )}
          
          {status === 'success' && (
            <div className="text-sm text-muted-foreground">
              You will be redirected automatically...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}