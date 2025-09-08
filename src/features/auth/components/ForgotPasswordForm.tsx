import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUITranslations } from '@/hooks/useUITranslations';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useUITranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Reset Request Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSent(true);
        toast({
          title: "Reset Link Sent",
          description: "Check your email for password reset instructions",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Request Failed", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-xl">{t('RESET_PASSWORD', 'Reset Password')}</CardTitle>
            <CardDescription>
              {t('RESET_PASSWORD_DESC', 'Enter your email to receive reset instructions')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {sent ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>{t('CHECK_EMAIL', 'Check your email!')}</strong><br />
              {t('RESET_SENT_TO', 'We\'ve sent password reset instructions to')} <strong>{email}</strong>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('EMAIL_ADDRESS', 'Email Address')}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t('ENTER_EMAIL_PLACEHOLDER', 'Enter your email address')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('BTN_SENDING', 'Sending...')}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t('BTN_SEND_RESET_LINK', 'Send Reset Link')}
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              {t('REMEMBER_PASSWORD', 'Remember your password?')}{' '}
              <button 
                type="button"
                onClick={onBack}
                className="text-primary hover:underline"
              >
                {t('SIGN_IN_INSTEAD', 'Sign in instead')}
              </button>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}