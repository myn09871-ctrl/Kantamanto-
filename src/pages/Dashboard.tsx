
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useProfile } from '@/hooks/useProfile';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { profile, vendor, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Wait for all loading states to complete
    if (authLoading || adminLoading || profileLoading || hasRedirected) {
      return;
    }

    console.log('Dashboard redirect logic:', { 
      user: !!user, 
      isAdmin, 
      profile: profile?.role, 
      vendor: !!vendor 
    });

    // Check admin first (highest priority)
    if (isAdmin) {
      console.log('Redirecting to admin panel');
      setHasRedirected(true);
      navigate('/admin-panel', { replace: true });
      return;
    }

    // If no user, redirect to auth
    if (!user) {
      console.log('No user, redirecting to auth');
      setHasRedirected(true);
      navigate('/auth', { replace: true });
      return;
    }

    // If user but no profile yet, wait for profile to load
    if (!profile) {
      console.log('Waiting for profile to load...');
      return;
    }

    // Redirect based on user role
    if (profile.role === 'admin') {
      console.log('Redirecting admin to admin panel');
      setHasRedirected(true);
      navigate('/admin-panel', { replace: true });
    } else if (vendor && profile.role === 'vendor') {
      console.log('Redirecting vendor to vendor dashboard');
      setHasRedirected(true);
      navigate('/vendor-dashboard', { replace: true });
    } else {
      console.log('Redirecting customer to shop');
      setHasRedirected(true);
      navigate('/shop', { replace: true });
    }
  }, [user, profile, vendor, isAdmin, authLoading, adminLoading, profileLoading, navigate, hasRedirected]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Dashboard;
