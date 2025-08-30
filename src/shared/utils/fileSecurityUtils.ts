// Enhanced file security utilities
export interface FileSecurityOptions {
  maxSize?: number; // Max file size in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicNumbers?: boolean;
  sanitizeFilename?: boolean;
}

// Magic number signatures for common file types
const MAGIC_NUMBERS: Record<string, number[][]> = {
  'text/csv': [],  // CSV files don't have reliable magic numbers
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0]], // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04], // XLSX (ZIP format)
    [0x50, 0x4B, 0x05, 0x06], // XLSX (ZIP format)
    [0x50, 0x4B, 0x07, 0x08]  // XLSX (ZIP format)
  ]
};

export class FileSecurityValidator {
  static async validateFile(file: File, options: FileSecurityOptions = {}): Promise<void> {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      allowedExtensions = ['.csv', '.xls', '.xlsx'],
      checkMagicNumbers = true,
      sanitizeFilename = true
    } = options;

    // File size validation
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`);
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Filename validation and sanitization
    if (sanitizeFilename) {
      const sanitizedName = this.sanitizeFilename(file.name);
      if (sanitizedName !== file.name) {
        throw new Error('Filename contains invalid characters');
      }
    }

    // Extension validation
    const fileExtension = this.getFileExtension(file.name);
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`File extension ${fileExtension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }

    // MIME type validation
    if (!allowedMimeTypes.includes(file.type)) {
      // For CSV files, browsers might not set the MIME type correctly
      if (fileExtension === '.csv' && (file.type === '' || file.type === 'application/octet-stream')) {
        // Allow CSV files with missing or generic MIME types
      } else {
        throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }
    }

    // Magic number validation (file signature check)
    if (checkMagicNumbers && file.type !== 'text/csv') {
      await this.validateMagicNumbers(file);
    }
  }

  static async validateMagicNumbers(file: File): Promise<void> {
    const buffer = await this.readFileHeader(file, 8);
    const bytes = new Uint8Array(buffer);
    
    const expectedSignatures = MAGIC_NUMBERS[file.type];
    if (!expectedSignatures || expectedSignatures.length === 0) {
      return; // No magic numbers to check for this file type
    }

    const isValidSignature = expectedSignatures.some(signature => {
      return signature.every((expectedByte, index) => {
        return index < bytes.length && bytes[index] === expectedByte;
      });
    });

    if (!isValidSignature) {
      throw new Error(`File signature does not match expected file type ${file.type}`);
    }
  }

  private static readFileHeader(file: File, bytesToRead: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file header'));
      reader.readAsArrayBuffer(file.slice(0, bytesToRead));
    });
  }

  static sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars with underscore
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .substring(0, 255); // Limit filename length
  }

  static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex).toLowerCase() : '';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Content validation helpers
  static async validateCSVContent(file: File): Promise<void> {
    const text = await this.readFileAsText(file, 1024); // Read first 1KB
    
    // Check for suspicious content patterns
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /@import/i,
      /expression\s*\(/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        throw new Error('File contains potentially malicious content');
      }
    }
  }

  private static readFileAsText(file: File, maxBytes?: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file content'));
      
      const fileToRead = maxBytes ? file.slice(0, maxBytes) : file;
      reader.readAsText(fileToRead);
    });
  }
}