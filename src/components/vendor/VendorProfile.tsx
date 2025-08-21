
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";

interface VendorData {
  id: string;
  shop_name: string;
  description: string | null;
  location: string | null;
  profile_picture_url: string | null;
  status: string;
  created_at: string;
}

const VendorProfile = () => {
  const { user } = useAuth();
  const { vendor: contextVendor } = useProfile();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    fetchVendorProfile();
  }, [user]);

  const fetchVendorProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setVendor(data);
        setFormData({
          shop_name: data.shop_name || '',
          description: data.description || '',
          location: data.location || '',
        });
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (file: File): Promise<string> => {
    const fileName = `profile_${user?.id}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('vendor-documents')
      .upload(`profile-pictures/${fileName}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('vendor-documents')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      let profilePictureUrl = vendor?.profile_picture_url;

      // Upload new profile image if selected
      if (profileImage) {
        profilePictureUrl = await uploadProfileImage(profileImage);
      }

      const updateData = {
        shop_name: formData.shop_name,
        description: formData.description,
        location: formData.location,
        profile_picture_url: profilePictureUrl,
        updated_at: new Date().toISOString()
      };

      if (vendor) {
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update(updateData)
          .eq('id', vendor.id);

        if (error) throw error;
      } else {
        // Create new vendor profile
        const { error } = await supabase
          .from('vendors')
          .insert({
            user_id: user.id,
            ...updateData,
            status: 'pending'
          });

        if (error) throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your vendor profile has been saved successfully"
      });

      // Refresh the profile data
      fetchVendorProfile();
      setProfileImage(null);

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="dark:text-white">Vendor Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={profileImage ? URL.createObjectURL(profileImage) : vendor?.profile_picture_url || undefined} 
                alt={vendor?.shop_name || 'Vendor profile'}
              />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('profile-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProfileImage(file);
                }}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG up to 5MB
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                placeholder="Shop Name"
                value={formData.shop_name}
                onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                required
              />
              <Input
                placeholder="Location (e.g., Accra, Ghana)"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <Textarea
                placeholder="Shop Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-32"
              />
            </div>
          </div>

          {vendor && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2 dark:text-white">Application Status</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: <span className="font-medium">{vendor.status}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Applied: {new Date(vendor.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VendorProfile;
