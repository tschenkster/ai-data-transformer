// Enhanced password validation utilities for Phase 6

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
}

export const PasswordValidator = {
  // Enhanced password requirements
  validatePassword: (password: string): PasswordValidationResult => {
    const errors: string[] = [];
    let score = 0;

    // Length requirements
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password);

    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!hasSpecialChars) {
      errors.push('Password must contain at least one special character (!@#$%^&*...)');
    } else {
      score += 1;
    }

    // Common patterns to avoid
    const commonPatterns = [
      /(.)\1{2,}/g, // Repeated characters (aaa, 111)
      /123456|654321|qwerty|password|admin/i, // Common sequences
    ];

    commonPatterns.forEach(pattern => {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns and is not secure');
        score -= 1;
      }
    });

    // Determine strength
    let strength: PasswordValidationResult['strength'];
    if (score >= 6) {
      strength = 'very-strong';
    } else if (score >= 4) {
      strength = 'strong';
    } else if (score >= 2) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return {
      isValid: errors.length === 0 && score >= 4,
      errors,
      strength,
      score: Math.max(0, score)
    };
  },

  // Password confirmation validation
  validatePasswordConfirmation: (password: string, confirmPassword: string): string[] => {
    const errors: string[] = [];
    
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return errors;
  },

  // Generate password strength indicator
  getStrengthColor: (strength: PasswordValidationResult['strength']): string => {
    switch (strength) {
      case 'very-strong': return 'text-green-600';
      case 'strong': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-400';
    }
  },

  getStrengthText: (strength: PasswordValidationResult['strength']): string => {
    switch (strength) {
      case 'very-strong': return 'Very Strong';
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
      default: return 'None';
    }
  }
};

export default PasswordValidator;