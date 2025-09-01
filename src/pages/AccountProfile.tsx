import { UserProfileDisplay } from '@/features/user-management';
import { UserLanguageSelector } from '@/components/UserLanguageSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguageContext } from '@/components/LanguageProvider';
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
          {/* Language Preference Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('LANGUAGE_PREFERENCES', 'Language Preferences')}</CardTitle>
              <CardDescription>
                {t('LANGUAGE_PREFERENCES_DESC', 'Choose your preferred language for the user interface')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    {t('INTERFACE_LANGUAGE', 'Interface Language')}
                  </label>
                  <UserLanguageSelector showLabel={false} />
                </div>
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