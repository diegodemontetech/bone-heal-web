
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/hooks/use-cart";
import { toast } from "sonner";

export function useCheckout() {
  const session = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const saveOrder = async (
    orderId: string, 
    cartItems: CartItem[], 
    shippingFee: number, 
    discount: number, 
    zipCode: string, 
    appliedVoucher: any
  ) => {
    try {
      const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const total_amount = Math.max(0, subtotal + shippingFee - discount);

      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          user_id: session?.user?.id,
          items: cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name
          })),
          shipping_fee: shippingFee,
          discount: discount,
          subtotal: subtotal,
          total_amount: total_amount,
          status: 'pending',
          shipping_address: {
            zip_code: zipCode
          },
          payment_method: paymentMethod
        });

      if (orderError) throw orderError;

      // Criar registro de pagamento
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          status: 'pending',
          amount: total_amount,
          payment_method: paymentMethod
        });

      if (paymentError) throw paymentError;

      if (appliedVoucher) {
        await supabase
          .from('vouchers')
          .update({ current_uses: (appliedVoucher.current_uses || 0) + 1 })
          .eq('id', appliedVoucher.id);
      }
      
      return orderId;
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      throw error;
    }
  };

  const createMercadoPagoCheckout = async (
    orderId: string,
    cartItems: CartItem[],
    shippingFee: number,
    discount: number
  ) => {
    try {
      const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const total = Math.max(0, subtotal + shippingFee - discount);
      
      if (!session?.user) throw new Error("Usuário não está autenticado");
      
      const items = cartItems.map(item => ({
        title: item.name,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.price
      }));
      
      const { data, error } = await supabase.functions.invoke("mercadopago-checkout", {
        body: {
          orderId,
          items,
          shipping_cost: shippingFee,
          buyer: {
            email: session.user.email,
            name: session.user.user_metadata?.name || "Cliente"
          }
        }
      });
      
      if (error) throw error;
      
      if (!data || !data.init_point) {
        throw new Error("Não foi possível gerar o link de pagamento");
      }
      
      return data.init_point;
    } catch (error) {
      console.error("Erro ao criar checkout do Mercado Pago:", error);
      throw error;
    }
  };

  const handleProcessPayment = async () => {
    if (!orderId) return;
    
    try {
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.error("Erro ao processar pagamento. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    }
  };

  const handleCheckout = async (
    cartItems: CartItem[],
    zipCode: string,
    shippingFee: number,
    discount: number,
    appliedVoucher: any
  ) => {
    if (!cartItems.length) {
      navigate("/products");
      return;
    }

    if (!session?.user) {
      navigate("/login");
      return;
    }

    if (!zipCode) return;

    try {
      setLoading(true);

      const newOrderId = crypto.randomUUID();
      setOrderId(newOrderId);
      
      // Salvar o pedido
      await saveOrder(newOrderId, cartItems, shippingFee, discount, zipCode, appliedVoucher);
      
      // Criar checkout do Mercado Pago
      const checkoutUrl = await createMercadoPagoCheckout(
        newOrderId, 
        cartItems, 
        shippingFee, 
        discount
      );
      
      setPaymentUrl(checkoutUrl);
      
      // Se método de pagamento for processado no front-end
      if (paymentMethod === 'credit' || paymentMethod === 'pix' || paymentMethod === 'boleto') {
        window.location.href = checkoutUrl;
      }
      
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error("Erro ao processar o checkout: " + (error.message || "Tente novamente"));
      setLoading(false);
    }
  };

  return {
    loading,
    paymentMethod,
    setPaymentMethod,
    handleCheckout,
    handleProcessPayment,
    paymentUrl,
    orderId
  };
}
