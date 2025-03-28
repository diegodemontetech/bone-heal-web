
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppInstances } from "@/hooks/admin/whatsapp/useWhatsAppInstances";
import { useWhatsAppMessages } from "@/hooks/admin/whatsapp/useWhatsAppMessages";
import { useWhatsAppDialog } from "@/hooks/admin/whatsapp/useWhatsAppDialog";
import { useWhatsAppTabs } from "@/hooks/admin/whatsapp/useWhatsAppTabs";
import { useWhatsAppInstanceActions } from "@/hooks/admin/whatsapp/useWhatsAppInstanceActions";

export const useWhatsAppDashboard = () => {
  const [userId, setUserId] = useState<string | null>(null);
  
  const { 
    isOpen: isDialogOpen, 
    setIsOpen: setIsDialogOpen 
  } = useWhatsAppDialog();
  
  const {
    activeTab,
    setActiveTab,
    selectedInstanceId,
    selectInstance
  } = useWhatsAppTabs();
  
  const { 
    instances, 
    isLoading, 
    error, 
    fetchInstances
  } = useWhatsAppInstances();
  
  const { 
    messages, 
    loading: messagesLoading, 
    sendMessage 
  } = useWhatsAppMessages(selectedInstanceId || "");
  
  const {
    handleCreateInstance,
    handleDeleteInstance,
    handleRefreshQr,
    isCreating
  } = useWhatsAppInstanceActions();

  // Fetch instances on component mount
  useEffect(() => {
    fetchInstances();
    
    // Get current user ID
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  const handleSelectInstance = (instanceId: string): void => {
    selectInstance(instanceId);
  };

  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!selectedInstanceId || !message.trim()) return false;
    
    try {
      const success = await sendMessage(message);
      return success;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return false;
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    selectedInstanceId,
    activeTab,
    setActiveTab,
    instances,
    isLoading,
    error,
    messages,
    messagesLoading,
    isCreating,
    handleCreateInstance,
    handleDeleteInstance,
    handleSelectInstance,
    handleSendMessage,
    handleRefreshQr
  };
};
