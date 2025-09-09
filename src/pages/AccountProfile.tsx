import { UserProfileDisplay } from '@/features/user-management';
import { UserLanguageSelector } from '@/components/UserLanguageSelector';
import { ContentLanguageSelector } from '@/components/ContentLanguageSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Languages } from 'lucide-react';
import { useLanguageContext } from "@/hooks/useLanguageContext";
import Footer from '@/components/Footer';

export default function AccountProfile() {
  const { t } = useLanguageContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('USER_PROFILE', 'User Profile')}</h1>
          <p className="text-muted-foreground">{t('PROFILE_DESCRIPTION', 'Manage your account settings and preferences')}</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Language Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t('LANGUAGE_PREFERENCES', 'Language Preferences')}
              </CardTitle>
              <CardDescription>
                {t('LANGUAGE_PREFERENCES_DESCRIPTION', 'Configure your language preferences for different parts of the application')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* UI Language */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('INTERFACE_LANGUAGE', 'Interface Language')}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('INTERFACE_LANGUAGE_DESCRIPTION', 'Language for menus, buttons, and interface elements')}
                </p>
                <UserLanguageSelector showLabel={false} />
              </div>
              
              {/* Content Language */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('CONTENT_LANGUAGE', 'Content Language')}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('CONTENT_LANGUAGE_DESCRIPTION', 'Language for report structures, line items, and data content')}
                </p>
                <ContentLanguageSelector showLabel={false} />
              </div>
            </CardContent>
          </Card>

          {/* User Profile Section */}
          <UserProfileDisplay />
        </div>
        
        <Footer />
      </div>
    </div>
  );
}