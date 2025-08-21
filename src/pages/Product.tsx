
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Product = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center text-orange-500 hover:text-orange-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Product ID: {id}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Product details page is under construction. This page will display detailed information about the selected product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Product;
