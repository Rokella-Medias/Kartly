import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface RequireProfileProps {
  children: React.ReactNode;
}

export function RequireProfile({ children }: RequireProfileProps) {
  const { user, loading: authLoading } = useAuth();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setProfileComplete(null);
      return;
    }

    const checkProfile = async () => {
      // First, check if the user is an admin.
      // Admins should bypass the onboarding profile completion check.
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleData) {
        setProfileComplete(true);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfileComplete(
        !!data?.full_name?.trim() && !!data?.business_name?.trim()
      );
    };

    checkProfile();
  }, [user]);

  if (authLoading || (user && profileComplete === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? "/admin-login" : "/login"} replace />;
  }

  if (!profileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
