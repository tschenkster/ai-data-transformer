// Phase 6 Authentication feature exports with enhanced security

// Components
export { AuthRoute } from './components/AuthRoute';
export { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
export { SecurityAuditDashboard } from './components/SecurityAuditDashboard';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';

// Hooks - Enhanced features now integrated into main useAuth hook

// Services
export { default as SecurityService } from './services/securityService';

// Utils
export { PasswordValidator } from './utils/passwordValidation';
export type { PasswordValidationResult } from './utils/passwordValidation';