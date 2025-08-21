
import ChatDialog from "./ChatDialog";

interface StartConversationProps {
  vendorId: string;
  vendorName?: string;
  vendorImage?: string;
  productId?: string;
  productName?: string;
}

const StartConversation = ({ vendorId, vendorName = "Vendor", vendorImage, productId, productName }: StartConversationProps) => {
  return (
    <ChatDialog 
      vendorId={vendorId}
      vendorName={vendorName}
      vendorImage={vendorImage}
      productId={productId}
      productName={productName}
    />
  );
};

export default StartConversation;
