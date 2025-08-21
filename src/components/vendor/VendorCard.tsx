
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, User } from "lucide-react";

interface VendorCardProps {
  vendor: {
    id: string;
    shop_name: string;
    description: string | null;
    location: string | null;
    profile_picture_url: string | null;
    status: string;
    created_at: string;
    user_id: string;
  };
  showStatus?: boolean;
  productCount?: number;
}

const VendorCard = ({ vendor, showStatus = false, productCount }: VendorCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage 
              src={vendor.profile_picture_url || undefined} 
              alt={vendor.shop_name}
            />
            <AvatarFallback>
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg dark:text-white">{vendor.shop_name}</CardTitle>
            {vendor.location && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {vendor.location}
              </div>
            )}
            {showStatus && (
              <Badge className={`mt-2 ${getStatusColor(vendor.status)}`}>
                {vendor.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {vendor.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
            {vendor.description}
          </p>
        )}
        {productCount !== undefined && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Package className="w-3 h-3 mr-1" />
            {productCount} products
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Joined: {new Date(vendor.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default VendorCard;
