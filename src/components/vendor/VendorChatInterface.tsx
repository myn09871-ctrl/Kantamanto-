
import { useState } from 'react';
import VendorConversationList from './VendorConversationList';
import VendorChatWindow from './VendorChatWindow';

const VendorChatInterface = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
      <div className="lg:col-span-1">
        <VendorConversationList 
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
      </div>
      
      <div className="lg:col-span-2">
        {selectedConversationId ? (
          <VendorChatWindow conversationId={selectedConversationId} />
        ) : (
          <div className="h-full flex items-center justify-center border rounded-lg bg-card/50 backdrop-blur-sm">
            <div className="text-center p-6 rounded-lg bg-card/80 backdrop-blur-md border shadow-lg">
              <h3 className="text-base font-medium mb-2">Welcome to Customer Chat</h3>
              <p className="text-sm text-muted-foreground">
                Select a customer conversation from the left to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorChatInterface;
