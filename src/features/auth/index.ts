// Components
export { AuthRoute } from './components/AuthRoute';
export { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
export { SecurityAuditDashboard } from './components/SecurityAuditDashboard';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';

// Services
export { default as SecurityService } from './services/securityService';
export { EnhancedSecurityService } from './services/enhancedSecurityService';

// Utils
export { PasswordValidator } from './utils/passwordValidation';
export type { PasswordValidationResult } from './utils/passwordValidation';