import { PasswordValidator, PasswordValidationResult } from '../utils/passwordValidation';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Shield, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  showSecurityTips?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = false,
  showSecurityTips = false 
}: PasswordStrengthIndicatorProps) {
  const validation = PasswordValidator.validatePassword(password);
  
  const getProgressValue = () => {
    switch (validation.strength) {
      case 'weak': return 25;
      case 'medium': return 50;
      case 'strong': return 75;
      case 'very-strong': return 100;
      default: return 0;
    }
  };

  const getProgressColor = () => {
    switch (validation.strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-blue-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength:</span>
        <span className={`text-sm font-medium ${PasswordValidator.getStrengthColor(validation.strength)}`}>
          {PasswordValidator.getStrengthText(validation.strength)}
        </span>
      </div>
      
      <div className="relative">
        <Progress value={getProgressValue()} className="h-2" />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${getProgressValue()}%` }}
        />
      </div>

      {showRequirements && (
        <div className="space-y-1 text-xs">
          <RequirementItem 
            met={password.length >= 8} 
            text="At least 8 characters" 
          />
          <RequirementItem 
            met={/[A-Z]/.test(password)} 
            text="One uppercase letter" 
          />
          <RequirementItem 
            met={/[a-z]/.test(password)} 
            text="One lowercase letter" 
          />
          <RequirementItem 
            met={/\d/.test(password)} 
            text="One number" 
          />
          <RequirementItem 
            met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)} 
            text="One special character" 
          />
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {showSecurityTips && validation.strength !== 'very-strong' && (
        <Alert className="mt-2">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Security Tip:</strong> Use a unique password that you haven't used elsewhere. 
            Consider using a password manager to generate and store strong passwords.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-green-600' : 'text-gray-500'}`}>
      <CheckCircle className={`h-3 w-3 ${met ? 'text-green-600' : 'text-gray-400'}`} />
      <span>{text}</span>
    </div>
  );
}