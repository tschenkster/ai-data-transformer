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
        // Parse both hash and search params (Supabase commonly uses hash)
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(window.location.search);

        // Handle explicit error returned from Supabase
        const errorParam = hashParams.get('error') || searchParams.get('error');
        const errorDescriptionParam = hashParams.get('error_description') || searchParams.get('error_description');

        if (errorParam) {
          console.error('Auth callback error from provider:', errorParam, errorDescriptionParam);
          setStatus('error');
          const code = hashParams.get('error_code') || searchParams.get('error_code');
          if (code === 'otp_expired') {
            setMessage('This confirmation link has expired. Please sign in or sign up again to receive a new email.');
          } else {
            setMessage(`Error: ${errorDescriptionParam || 'Authentication failed.'}`);
          }
          return;
        }

        // If tokens are present in hash, establish the session
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setError) {
            console.error('setSession error:', setError);
            setStatus('error');
            setMessage(`Could not establish session: ${setError.message}`);
            return;
          }
        } else {
          // If PKCE code exists (OAuth/magic-link variants), exchange it
          const code = searchParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('exchangeCodeForSession error:', exchangeError);
              setStatus('error');
              setMessage(`Could not complete sign-in: ${exchangeError.message}`);
              return;
            }
          }
        }

        // Finally, verify session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('getSession error:', error);
          setStatus('error');
          setMessage(`Email verification failed: ${error.message}`);
          return;
        }

        if (data.session?.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to your dashboard...');
          setTimeout(() => {
            navigate('/home');
          }, 1200);
        } else {
          setStatus('error');
          setMessage('No active session found. Please sign in to continue.');
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