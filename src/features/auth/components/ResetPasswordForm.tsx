import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { PasswordValidator } from '@/features/auth/utils/passwordValidation';
import { useUITranslations } from '@/hooks/useUITranslations';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useUITranslations();

  useEffect(() => {
    // Handle the reset password callback
    const handleAuthCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setError('Invalid or expired reset link');
        }
      } else {
        setError('Invalid reset link');
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    // Validate password strength
    const validation = PasswordValidator.validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    // Validate password confirmation
    const confirmationErrors = PasswordValidator.validatePasswordConfirmation(password, confirmPassword);
    if (confirmationErrors.length > 0) {
      setError(confirmationErrors[0]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated",
        });
        navigate('/auth');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('SET_NEW_PASSWORD', 'Set New Password')}
          </CardTitle>
          <CardDescription>
            {t('ENTER_STRONG_PASSWORD', 'Enter a strong password for your account')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('NEW_PASSWORD', 'New Password')}</Label>
              <Input
                id="new-password"
                type="password"
                placeholder={t('ENTER_NEW_PASSWORD_PLACEHOLDER', 'Enter your new password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <PasswordStrengthIndicator password={password} showRequirements />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">{t('CONFIRM_PASSWORD', 'Confirm Password')}</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder={t('CONFIRM_NEW_PASSWORD_PLACEHOLDER', 'Confirm your new password')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600">{t('PASSWORDS_DO_NOT_MATCH', 'Passwords do not match')}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('BTN_UPDATING_PASSWORD', 'Updating Password...')}
                </>
              ) : (
                t('BTN_UPDATE_PASSWORD', 'Update Password')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}