// Phase 6 Authentication feature exports with enhanced security

// Components
export { AuthRoute } from './components/AuthRoute';
export { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
export { EnhancedPasswordStrengthIndicator } from './components/EnhancedPasswordStrengthIndicator';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { SecurityAuditDashboard } from './components/SecurityAuditDashboard';

// Hooks
export { useEnhancedAuth } from './hooks/useEnhancedAuth';

// Services
export { default as SecurityService } from './services/securityService';

// Utils
export { PasswordValidator } from './utils/passwordValidation';
export type { PasswordValidationResult } from './utils/passwordValidation';