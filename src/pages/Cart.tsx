import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const session = useSession();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [zipCode, setZipCode] = useState("");
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + (shippingCost || 0);

  const calculateShipping = async () => {
    if (!zipCode || zipCode.length !== 8) {
      toast.error("Por favor, insira um CEP válido");
      return;
    }

    setIsCalculatingShipping(true);
    setShippingError(null);
    
    try {
      // Primeiro, vamos obter o estado do CEP usando a API dos Correios
      const { data: correiosData, error: correiosError } = await supabase.functions.invoke("correios-shipping", {
        body: {
          zipCodeDestination: zipCode,
        },
      });

      if (correiosError) throw correiosError;

      // Agora vamos buscar a taxa de frete baseada no estado
      const { data: shippingRate, error: shippingError } = await supabase
        .from('shipping_rates')
        .select('rate, delivery_days')
        .eq('state', correiosData.state)
        .single();

      if (shippingError) throw shippingError;

      if (!shippingRate) {
        throw new Error("Não foi possível calcular o frete para este CEP");
      }

      setShippingCost(shippingRate.rate);
      toast.success(`Frete calculado: entrega em ${shippingRate.delivery_days} dias úteis`, {
        duration: 3000
      });
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      setShippingError("Erro ao calcular o frete. Por favor, tente novamente.");
      toast.error("Erro ao calcular o frete. Por favor, tente novamente.", {
        duration: 2000
      });
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleCheckout = async () => {
    if (!session) {
      toast.error("Por favor, faça login para continuar", {
        duration: 2000
      });
      return;
    }

    if (!shippingCost) {
      toast.error("Por favor, calcule o frete antes de continuar", {
        duration: 2000
      });
      return;
    }

    try {
      const orderData = {
        user_id: session.user.id,
        total_amount: total,
        subtotal: subtotal,
        shipping_fee: shippingCost,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: {
          zip_code: zipCode
        },
        status: 'pending'
      };

      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar pagamento
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          amount: total,
          payment_method: 'pix',
          status: 'pending'
        });

      if (paymentError) throw paymentError;

      // Redirecionar para checkout
      window.location.href = `/checkout?order_id=${order.id}`;
      
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error("Erro ao processar o pedido. Por favor, tente novamente.", {
        duration: 2000
      });
    }
  };

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-8">
              Que tal explorar nossos produtos e encontrar algo especial?
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/products")}
            >
              Ver Produtos
            </Button>
            <p className="mt-4 text-sm text-gray-500">
              Ou volte para a <Button variant="link" className="p-0" onClick={() => navigate("/")}>página inicial</Button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Carrinho</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Seu carrinho está vazio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white p-4 rounded-lg shadow"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      Quantidade: {item.quantity}
                    </p>
                    <p className="font-medium text-primary">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white p-6 rounded-lg shadow space-y-6">
              <h2 className="text-xl font-bold">Resumo do Pedido</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="zipCode">Calcular Frete</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="zipCode"
                      placeholder="CEP"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                      maxLength={8}
                    />
                    <Button
                      variant="outline"
                      onClick={calculateShipping}
                      disabled={isCalculatingShipping}
                    >
                      {isCalculatingShipping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Calcular"
                      )}
                    </Button>
                  </div>
                  {shippingError && (
                    <p className="text-sm text-red-500 mt-1">{shippingError}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>
                      {shippingCost ? `R$ ${shippingCost.toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!session || !shippingCost}
                >
                  Finalizar Compra
                </Button>

                {!session && (
                  <p className="text-sm text-red-500 text-center">
                    Faça login para continuar com a compra
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
