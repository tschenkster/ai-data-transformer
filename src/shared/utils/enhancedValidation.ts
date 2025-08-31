// Enhanced input validation with security-focused checks
import { ErrorHandler } from './errorHandling';

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: 'email' | 'alphanumeric' | 'no_special_chars' | 'phone' | 'password';
  customPattern?: RegExp;
  sanitize?: boolean;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class EnhancedValidator {
  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\\x27)|(\\x2D\\x2D))/gi,
    /(\b(OR|AND)\b.*[=<>])/gi,
  ];

  static validateField(value: any, fieldName: string, rule: ValidationRule): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value;

    try {
      // Type check
      if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
        errors.push(`${fieldName} must be a string or number`);
        return { isValid: false, errors };
      }

      const stringValue = value?.toString() || '';

      // Required field check
      if (rule.required && (!stringValue || stringValue.trim() === '')) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
      }

      // Skip further validation if field is empty and not required
      if (!stringValue && !rule.required) {
        return { isValid: true, errors: [], sanitizedData: sanitizedValue };
      }

      // Length checks
      if (rule.minLength && stringValue.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && stringValue.length > rule.maxLength) {
        errors.push(`${fieldName} cannot exceed ${rule.maxLength} characters`);
      }

      // XSS prevention
      if (this.containsXSS(stringValue)) {
        errors.push(`${fieldName} contains potentially malicious content`);
      }

      // SQL injection prevention
      if (this.containsSQLInjection(stringValue)) {
        errors.push(`${fieldName} contains potentially harmful SQL patterns`);
      }

      // Pattern validation
      if (rule.pattern) {
        const patternResult = this.validatePattern(stringValue, rule.pattern, fieldName);
        if (!patternResult.isValid) {
          errors.push(...patternResult.errors);
        }
      }

      // Custom pattern validation
      if (rule.customPattern && !rule.customPattern.test(stringValue)) {
        errors.push(`${fieldName} does not match required format`);
      }

      // Sanitization
      if (rule.sanitize) {
        sanitizedValue = this.sanitizeInput(stringValue);
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: sanitizedValue
      };
    } catch (error) {
      ErrorHandler.logError('EnhancedValidator.validateField', error, { fieldName, rule });
      return {
        isValid: false,
        errors: [`Validation error for ${fieldName}`]
      };
    }
  }

  static validateSchema(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    try {
      // Validate each field according to schema
      for (const [fieldName, rule] of Object.entries(schema)) {
        const fieldValue = data?.[fieldName];
        const result = this.validateField(fieldValue, fieldName, rule);
        
        if (!result.isValid) {
          errors.push(...result.errors);
        } else {
          sanitizedData[fieldName] = result.sanitizedData;
        }
      }

      // Check for unexpected fields (potential injection attempt)
      if (data && typeof data === 'object') {
        const schemaFields = Object.keys(schema);
        const dataFields = Object.keys(data);
        const unexpectedFields = dataFields.filter(field => !schemaFields.includes(field));
        
        if (unexpectedFields.length > 0) {
          ErrorHandler.logWarning('EnhancedValidator', 'Unexpected fields detected', { unexpectedFields });
          // Copy expected fields only
          for (const field of unexpectedFields) {
            if (!field.startsWith('_') && !field.startsWith('$')) {
              sanitizedData[field] = data[field];
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData
      };
    } catch (error) {
      ErrorHandler.logError('EnhancedValidator.validateSchema', error, { schema });
      return {
        isValid: false,
        errors: ['Schema validation failed']
      };
    }
  }

  private static validatePattern(value: string, pattern: ValidationRule['pattern'], fieldName: string): ValidationResult {
    const patterns = {
      email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      alphanumeric: /^[A-Za-z0-9]+$/,
      no_special_chars: /^[A-Za-z0-9\s._-]+$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    };

    const regex = patterns[pattern!];
    if (!regex) {
      return { isValid: false, errors: [`Invalid pattern type for ${fieldName}`] };
    }

    if (!regex.test(value)) {
      const errorMessages = {
        email: `${fieldName} must be a valid email address`,
        alphanumeric: `${fieldName} must contain only letters and numbers`,
        no_special_chars: `${fieldName} contains invalid characters`,
        phone: `${fieldName} must be a valid phone number`,
        password: `${fieldName} must contain at least 8 characters, including uppercase, lowercase, number, and special character`
      };

      return { isValid: false, errors: [errorMessages[pattern!]] };
    }

    return { isValid: true, errors: [] };
  }

  private static containsXSS(value: string): boolean {
    return this.XSS_PATTERNS.some(pattern => pattern.test(value));
  }

  private static containsSQLInjection(value: string): boolean {
    return this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
  }

  private static sanitizeInput(value: string): string {
    return value
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['";]/g, '') // Remove quotes that could break SQL
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }

  // Rate limiting check for validation operations
  static async checkValidationRateLimit(identifier: string): Promise<boolean> {
    try {
      // This would integrate with the enhanced_check_rate_limit function
      // For now, implement basic client-side rate limiting
      const rateLimitKey = `validation_${identifier}`;
      const now = Date.now();
      const window = 60000; // 1 minute
      const maxAttempts = 50; // Allow 50 validation attempts per minute

      const attempts = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
      const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < window);
      
      if (recentAttempts.length >= maxAttempts) {
        ErrorHandler.logWarning('EnhancedValidator', 'Rate limit exceeded', { identifier });
        return false;
      }

      recentAttempts.push(now);
      localStorage.setItem(rateLimitKey, JSON.stringify(recentAttempts));
      return true;
    } catch (error) {
      ErrorHandler.logError('EnhancedValidator.checkValidationRateLimit', error);
      return true; // Fail open for validation
    }
  }
}

// Common validation schemas
export const CommonSchemas = {
  userProfile: {
    first_name: { required: true, maxLength: 50, pattern: 'no_special_chars' as const, sanitize: true },
    last_name: { required: true, maxLength: 50, pattern: 'no_special_chars' as const, sanitize: true },
    email: { required: true, maxLength: 254, pattern: 'email' as const },
    phone_number: { required: false, maxLength: 20, pattern: 'phone' as const, sanitize: true },
  },
  
  fileUpload: {
    filename: { required: true, maxLength: 255, pattern: 'no_special_chars' as const, sanitize: true },
    description: { required: false, maxLength: 500, sanitize: true },
  },

  entityData: {
    entity_name: { required: true, maxLength: 100, pattern: 'no_special_chars' as const, sanitize: true },
    entity_code: { required: true, maxLength: 20, pattern: 'alphanumeric' as const, sanitize: true },
    description: { required: false, maxLength: 500, sanitize: true },
  }
} as const;