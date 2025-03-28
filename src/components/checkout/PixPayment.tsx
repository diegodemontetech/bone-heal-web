
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Copy, AlertTriangle, CheckCircle2, RefreshCw, Loader2, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PixPaymentProps {
  pixCode: string;
  pixQrCodeImage: string;
  orderId?: string;
}

const PixPayment = ({ pixCode, pixQrCodeImage, orderId }: PixPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  // Função para verificar o status do pagamento
  const checkPaymentStatus = async () => {
    if (!orderId || isCheckingPayment) return;
    
    setIsCheckingPayment(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('status, mercadopago_status')
        .eq('order_id', orderId)
        .eq('payment_method', 'pix')
        .single();
      
      if (error) {
        console.error("Erro ao verificar pagamento:", error);
        return;
      }

      if (data) {
        const status = data.status;
        setPaymentStatus(status);
        
        if (status === 'paid' || data.mercadopago_status === 'approved') {
          toast.success("Pagamento PIX confirmado! Seu pedido será processado.");
          // Redirecionar para página de sucesso após confirmação
          setTimeout(() => {
            window.location.href = "/checkout/success";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Erro na verificação:", error);
    } finally {
      setIsCheckingPayment(false);
      setCheckCount(prev => prev + 1);
    }
  };

  // Verificar status automaticamente em intervalos
  useEffect(() => {
    if (!pixCode || !orderId) return;
    
    // Verificação inicial após 15 segundos
    const initialTimer = setTimeout(() => {
      checkPaymentStatus();
    }, 15000);
    
    // Verificações subsequentes a cada 30 segundos, por até 10 vezes (5 minutos)
    const intervalTimer = setInterval(() => {
      if (checkCount < 10 && paymentStatus !== 'paid') {
        checkPaymentStatus();
      } else {
        clearInterval(intervalTimer);
      }
    }, 30000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [pixCode, orderId, checkCount, paymentStatus]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    
    // Reset copied state after 3 seconds
    setTimeout(() => setCopied(false), 3000);
  };

  const handleManualCheck = () => {
    checkPaymentStatus();
    toast.info("Verificando status do pagamento...");
  };

  if (!pixCode) {
    return (
      <div className="space-y-4 bg-gradient-to-b from-white to-green-50 p-6 rounded-xl border border-green-100">
        <div className="flex justify-center mb-4">
          <div className="rounded-full p-4 bg-green-100">
            <QrCode className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-center text-gray-800">Pagamento via PIX</h3>
        
        <p className="text-sm text-gray-600 text-center">
          O pagamento via PIX é rápido, seguro e sem taxas. Após clicar em "Finalizar compra", 
          você receberá um QR code para escanear com seu aplicativo bancário.
        </p>
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="flex items-center space-x-2 text-blue-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <span>O pagamento é processado instantaneamente após a confirmação do PIX.</span>
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <div className="animate-pulse w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
            <QrCode className="w-16 h-16 text-gray-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 border-2 border-green-200 rounded-xl bg-gradient-to-b from-white to-green-50 shadow-sm">
      <div className="w-full flex justify-center mb-4">
        <div className="rounded-full p-3 bg-green-100">
          <QrCode className="h-7 w-7 text-green-600" />
        </div>
      </div>
      
      <h3 className="font-medium text-xl mb-2 text-center text-gray-800">Pagamento PIX gerado!</h3>
      
      <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
        Escaneie o QR code ou copie o código
      </div>
      
      {pixQrCodeImage && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <img 
            src={`data:image/png;base64,${pixQrCodeImage}`}
            alt="QR Code PIX" 
            className="h-56 w-56 mx-auto"
          />
        </div>
      )}
      
      <div className="w-full mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-full p-3 bg-gray-100 rounded-md text-center overflow-hidden">
            <code className="text-xs break-all select-all">{pixCode}</code>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleCopyClick}
            className={`flex-shrink-0 ${copied ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
          >
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Button 
          variant="outline" 
          onClick={handleCopyClick}
          className="w-full border-green-300 bg-white hover:bg-green-50 text-green-700"
        >
          {copied ? "Código copiado!" : "Copiar código PIX"}
        </Button>
      </div>
      
      <div className="space-y-3 w-full">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="flex items-center gap-2 text-amber-800">
            <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <span>Este código PIX expira em <strong>30 minutos</strong>. Realize o pagamento dentro deste prazo.</span>
          </AlertDescription>
        </Alert>
        
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
            <span>Após o pagamento, você receberá a confirmação e poderá acompanhar o pedido na área "Meus Pedidos".</span>
          </AlertDescription>
        </Alert>
      </div>

      <div className="mt-4 w-full">
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-green-300 bg-white hover:bg-green-50 text-green-700"
          onClick={handleManualCheck}
          disabled={isCheckingPayment}
        >
          {isCheckingPayment ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando pagamento...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Verificar status do pagamento
            </>
          )}
        </Button>
        
        {paymentStatus === 'paid' && (
          <Alert className="bg-green-100 border-green-300 mt-3">
            <AlertDescription className="flex items-center gap-2 text-green-800 font-medium">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span>Pagamento confirmado! Redirecionando...</span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default PixPayment;
