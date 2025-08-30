// Enhanced input validation utilities for security

import { ErrorHandler } from './errorHandling';

export interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowedChars?: RegExp;
  required?: boolean;
  sanitizeHtml?: boolean;
}

export class InputValidator {
  // Sanitize input to prevent XSS attacks
  static sanitizeInput(input: string | null | undefined): string {
    if (!input) return '';
    
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .trim();
  }

  // Validate and sanitize text input
  static validateText(
    input: string | null | undefined,
    fieldName: string,
    options: ValidationOptions = {}
  ): string {
    const {
      maxLength = 1000,
      minLength = 0,
      required = false,
      sanitizeHtml = true
    } = options;

    let value = input?.toString() || '';

    // Check if required field is empty
    if (required && !value.trim()) {
      throw new Error(`${fieldName} is required`);
    }

    // Sanitize if needed
    if (sanitizeHtml) {
      value = this.sanitizeInput(value);
    }

    // Length validation
    if (value.length > maxLength) {
      throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }

    if (value.length < minLength) {
      throw new Error(`${fieldName} must be at least ${minLength} characters`);
    }

    // Character validation
    if (options.allowedChars && !options.allowedChars.test(value)) {
      throw new Error(`${fieldName} contains invalid characters`);
    }

    return value;
  }

  // Validate email format
  static validateEmail(email: string | null | undefined): string {
    const sanitizedEmail = this.sanitizeInput(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitizedEmail)) {
      throw new Error('Invalid email format');
    }

    return sanitizedEmail;
  }

  // Validate UUID format
  static validateUuid(uuid: string | null | undefined, fieldName: string = 'UUID'): string {
    const sanitizedUuid = this.sanitizeInput(uuid);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(sanitizedUuid)) {
      throw new Error(`Invalid ${fieldName} format`);
    }

    return sanitizedUuid;
  }

  // Validate file upload data
  static validateFileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): void {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      allowedExtensions = ['.csv', '.xls', '.xlsx']
    } = options;

    // Size validation
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Type validation
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Extension validation
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed`);
    }

    // Additional security check - validate file name
    const sanitizedName = this.sanitizeInput(file.name);
    if (sanitizedName !== file.name) {
      throw new Error('File name contains invalid characters');
    }
  }

  // Validate JSON input to prevent injection
  static validateJsonInput(jsonString: string, maxDepth: number = 10): any {
    try {
      const sanitizedJson = this.sanitizeInput(jsonString);
      const parsed = JSON.parse(sanitizedJson);
      
      // Check depth to prevent deeply nested objects that could cause DoS
      const checkDepth = (obj: any, depth = 0): boolean => {
        if (depth > maxDepth) return false;
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).every(value => checkDepth(value, depth + 1));
        }
        return true;
      };

      if (!checkDepth(parsed)) {
        throw new Error('JSON structure is too deeply nested');
      }

      return parsed;
    } catch (error) {
      ErrorHandler.logError('InputValidator.validateJsonInput', error);
      throw new Error('Invalid JSON format');
    }
  }

  // Validate and sanitize search queries
  static validateSearchQuery(query: string | null | undefined): string {
    const sanitized = this.validateText(query, 'Search query', {
      maxLength: 100,
      sanitizeHtml: true
    });

    // Remove SQL injection patterns  
    return sanitized.replace(/['";-]/g, '');
  }
}

export default InputValidator;