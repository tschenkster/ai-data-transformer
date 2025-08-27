// Phase 6 Enhanced Password Strength Indicator
import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import SecurityService from '../services/securityService';

interface EnhancedPasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export function EnhancedPasswordStrengthIndicator({ 
  password, 
  showDetails = true 
}: EnhancedPasswordStrengthIndicatorProps) {
  const validation = useMemo(() => {
    if (!password) {
      return { 
        isValid: false, 
        violations: [], 
        strength: 0,
        strengthLabel: 'None' 
      };
    }

    const result = SecurityService.validatePasswordPolicy(password);
    
    // Calculate strength score (0-100)
    let score = 0;
    const maxScore = 100;
    
    // Length scoring (0-40 points)
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;
    if (password.length >= 24) score += 5;
    
    // Character variety (0-40 points)
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
    
    // Complexity bonuses (0-20 points)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 5;
    if (!/(.)\1{2,}/.test(password)) score += 5; // No triple repeating chars
    if (!/012|123|234|345|456|567|678|789|890/.test(password)) score += 5; // No sequences
    if (password.length > 0 && !/^[a-zA-Z]*$/.test(password)) score += 5; // Not all letters
    
    // Determine strength label
    let strengthLabel = 'Weak';
    if (score >= 90) strengthLabel = 'Very Strong';
    else if (score >= 70) strengthLabel = 'Strong';
    else if (score >= 50) strengthLabel = 'Moderate';
    else if (score >= 30) strengthLabel = 'Fair';
    
    return {
      ...result,
      strength: Math.min(score, maxScore),
      strengthLabel
    };
  }, [password]);

  const getStrengthColor = (strength: number) => {
    if (strength >= 70) return 'text-green-600';
    if (strength >= 50) return 'text-yellow-600';
    if (strength >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (strength: number) => {
    if (strength >= 70) return 'bg-green-600';
    if (strength >= 50) return 'bg-yellow-600';
    if (strength >= 30) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <span className={`text-sm font-medium ${getStrengthColor(validation.strength)}`}>
          {validation.strengthLabel}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={validation.strength} 
          className="h-2"
        />
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getProgressColor(validation.strength)}`}
          style={{ width: `${validation.strength}%` }}
        />
      </div>

      {showDetails && (
        <div className="space-y-2">
          {/* Policy Requirements */}
          <div className="space-y-1">
            <RequirementItem 
              met={password.length >= 12}
              text="At least 12 characters"
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
              met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}
              text="One special character"
            />
            <RequirementItem 
              met={!/123456|password|qwerty|admin|letmein/i.test(password)}
              text="No common patterns"
            />
          </div>

          {/* Violations */}
          {validation.violations.length > 0 && (
            <div className="mt-3 space-y-1">
              {validation.violations.map((violation, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-red-600">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{violation}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bonus Criteria */}
          {password && (
            <div className="mt-3 pt-3 border-t space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Strength Bonuses:</p>
              <RequirementItem 
                met={password.length >= 16}
                text="16+ characters (stronger)"
                bonus
              />
              <RequirementItem 
                met={new Set(password).size >= password.length * 0.7}
                text="High character variety"
                bonus
              />
              <RequirementItem 
                met={!/(.)\1{2,}/.test(password)}
                text="No repeating patterns"
                bonus
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
  bonus?: boolean;
}

function RequirementItem({ met, text, bonus = false }: RequirementItemProps) {
  const IconComponent = met ? CheckCircle : (bonus ? AlertCircle : XCircle);
  const color = met ? 'text-green-600' : (bonus ? 'text-muted-foreground' : 'text-red-600');
  
  return (
    <div className={`flex items-center gap-2 text-sm ${color}`}>
      <IconComponent className="h-3 w-3 flex-shrink-0" />
      <span className={bonus && !met ? 'opacity-60' : ''}>{text}</span>
    </div>
  );
}