
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing admin session on mount
  useEffect(() => {
    const checkAdminSession = () => {
      try {
        const adminSession = localStorage.getItem('adminSession');
        console.log('Checking admin session:', adminSession);
        
        if (adminSession) {
          const session = JSON.parse(adminSession);
          if (session.isAdmin && session.timestamp) {
            // Check if session is not expired (24 hours)
            const now = Date.now();
            const sessionTime = new Date(session.timestamp).getTime();
            const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              console.log('Valid admin session found');
              setIsAdmin(true);
            } else {
              console.log('Admin session expired');
              localStorage.removeItem('adminSession');
              setIsAdmin(false);
            }
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
        localStorage.removeItem('adminSession');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Admin login attempt:', { email });
      
      // Demo admin credentials - be more flexible with validation
      const validEmails = ['admin@kantamanto.com', 'admin@admin.com', 'admin'];
      const validPasswords = ['admin123', 'admin', 'password'];
      
      if (validEmails.includes(email.toLowerCase()) && validPasswords.includes(password)) {
        console.log('Admin credentials valid, setting admin session');
        
        const sessionData = {
          isAdmin: true,
          email: email,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        setIsAdmin(true);
        
        console.log('Admin login successful, isAdmin set to true');
        return true;
      }
      
      console.log('Invalid admin credentials');
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const adminLogout = () => {
    console.log('Admin logout');
    setIsAdmin(false);
    localStorage.removeItem('adminSession');
  };

  const value = {
    isAdmin,
    adminLogin,
    adminLogout,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
