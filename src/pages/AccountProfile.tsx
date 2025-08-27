import { UserProfileDisplay } from '@/features/user-management';
import Footer from '@/components/Footer';

export default function AccountProfile() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <UserProfileDisplay />
        
        <Footer />
      </div>
    </div>
  );
}