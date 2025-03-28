
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ShippingCalculationRate } from "@/types/shipping";
import { useOrderValidation } from "./orders/useOrderValidation";
import { useOrderCalculations } from "./orders/useOrderCalculations";
import { useOrderPaymentState } from "./orders/useOrderPaymentState";

export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { validateOrderData } = useOrderValidation();
  const { calculateTotal, calculateDiscount } = useOrderCalculations();
  const {
    paymentMethod, setPaymentMethod,
    voucherCode, setVoucherCode,
    appliedVoucher, setAppliedVoucher,
    isApplyingVoucher, setIsApplyingVoucher,
    shippingFee, setShippingFee,
    selectedShipping, setSelectedShipping
  } = useOrderPaymentState();

  const createOrder = async (
    selectedCustomer: any, 
    selectedProducts: any[],
    shippingOption: ShippingCalculationRate | null
  ) => {
    try {
      console.log("Iniciando criação do pedido...");
      setLoading(true);

      try {
        validateOrderData(selectedCustomer, selectedProducts);
      } catch (validationError: any) {
        toast.error(validationError.message);
        return;
      }

      const orderItems = selectedProducts.map(product => ({
        product_id: product.id,
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        omie_code: product.omie_code || null,
        omie_product_id: product.omie_product_id || null
      }));

      const subtotal = calculateTotal(selectedProducts);
      const shippingFee = shippingOption?.rate || 0;
      const discount = calculateDiscount(subtotal, appliedVoucher);
      const total = subtotal + shippingFee - discount;

      // Valores padrão para endereço, caso não exista
      const shippingAddress = {
        address: selectedCustomer.address || "Endereço não informado",
        city: selectedCustomer.city || "Cidade não informada",
        state: selectedCustomer.state || "UF",
        zip_code: selectedCustomer.zip_code || shippingOption?.zipCode || "00000-000"
      };

      // Informações de frete
      const shippingInfo = shippingOption ? {
        service_type: shippingOption.service_type,
        carrier: shippingOption.name,
        cost: shippingOption.rate,
        estimated_days: shippingOption.delivery_days
      } : null;

      // Preparar dados do pedido
      const orderData = {
        user_id: selectedCustomer.id,
        items: orderItems,
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
        total_amount: total,
        subtotal: subtotal,
        discount: discount,
        status: 'pending',
        omie_status: "novo",
        shipping_address: shippingAddress,
        voucher_id: appliedVoucher?.id || null
      };

      console.log("Criando pedido na base de dados...");
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Erro ao criar pedido:", orderError);
        throw orderError;
      }

      console.log("Pedido criado com sucesso, ID:", order.id);
      
      // Atualizar uso do cupom se aplicado
      if (appliedVoucher) {
        await supabase
          .from("vouchers")
          .update({ current_uses: appliedVoucher.current_uses + 1 })
          .eq("id", appliedVoucher.id);
      }
      
      toast.success("Pedido criado com sucesso!");
      
      // Tentar criar preferência no MercadoPago
      await handleMercadoPagoPreference(order.id, orderItems, shippingFee, discount, selectedCustomer);
      
      // Redirecionar para página do pedido
      navigate(`/admin/vendas`);
      
      return order;
    } catch (error: any) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao criar pedido: " + (error.message || "Erro desconhecido"));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para criar preferência no MercadoPago
  const handleMercadoPagoPreference = async (
    orderId: string, 
    orderItems: any[], 
    shippingFee: number, 
    discount: number, 
    customer: any
  ) => {
    try {
      const { data: prefData, error: prefError } = await supabase.functions.invoke(
        'mercadopago-checkout',
        {
          body: {
            order_id: orderId,
            items: orderItems,
            shipping_cost: shippingFee,
            discount: discount,
            payer: {
              name: customer.full_name || "Cliente",
              email: customer.email || "cliente@example.com",
              identification: {
                type: "CPF",
                number: customer.cpf || "00000000000"
              }
            }
          }
        }
      );

      if (prefError) {
        console.warn("Erro ao criar preferência MP, pedido criado sem opção de pagamento:", prefError);
      } else if (prefData?.preferenceId) {
        await supabase
          .from("orders")
          .update({
            mp_preference_id: prefData.preferenceId
          })
          .eq("id", orderId);
        console.log("Preferência MP criada:", prefData.preferenceId);
      }
    } catch (mpError) {
      console.warn("Erro ao processar pagamento, pedido criado sem opção de pagamento:", mpError);
    }
  };

  return {
    loading,
    createOrder,
    calculateTotal,
    paymentMethod,
    setPaymentMethod,
    voucherCode,
    setVoucherCode,
    appliedVoucher,
    setAppliedVoucher,
    isApplyingVoucher,
    setIsApplyingVoucher,
    calculateDiscount: (subtotal: number) => calculateDiscount(subtotal, appliedVoucher),
    shippingFee,
    setShippingFee,
    selectedShipping,
    setSelectedShipping
  };
};
