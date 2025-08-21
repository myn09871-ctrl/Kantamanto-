
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: 'customer' | 'vendor' | 'admin';
  created_at: string;
  updated_at: string;
}

interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  description: string;
  location: string;
  profile_picture_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setVendor(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      // If user is a vendor, fetch vendor data
      if (profileData?.role === 'vendor') {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (vendorError) {
          // If no vendor record exists, create one from signup data
          if (vendorError.code === 'PGRST116') {
            const userData = user?.user_metadata;
            if (userData?.shop_name) {
              await createVendorRecord(userData);
            }
          } else {
            console.error('Error fetching vendor:', vendorError);
          }
        } else {
          setVendor(vendorData);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVendorRecord = async (userData: any) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          user_id: user?.id,
          shop_name: userData.shop_name,
          description: userData.description || '',
          location: userData.location || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating vendor record:', error);
        toast({
          title: "Error",
          description: "Failed to create vendor profile",
          variant: "destructive"
        });
      } else {
        setVendor(data);
        toast({
          title: "Vendor Application Submitted",
          description: "Your application is pending approval",
        });
      }
    } catch (error) {
      console.error('Error in createVendorRecord:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  return {
    profile,
    vendor,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
};
