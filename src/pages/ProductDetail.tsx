
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductTabs from "@/components/product/ProductTabs";
import { useBrowseHistory } from "@/hooks/use-browse-history";
import { useEffect } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToHistory } = useBrowseHistory();
  const isMobile = useIsMobile();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      console.log('Buscando produto com slug:', slug);
      
      if (!slug) {
        console.error('Slug não fornecido');
        throw new Error('Slug não fornecido');
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar produto:', error);
        throw error;
      }

      if (!data) {
        console.error('Produto não encontrado para o slug:', slug);
        return null;
      }

      console.log('Produto encontrado:', data);
      return data as Product;
    },
    enabled: !!slug,
    retry: false,
    meta: {
      errorMessage: "Erro ao carregar produto"
    },
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 1 // 1 minute
  });

  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar produto");
    }
  }, [error]);

  useEffect(() => {
    if (product) {
      addToHistory(product);
    }
  }, [product, addToHistory]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Produto não encontrado
            </h1>
            <p className="text-neutral-600 mb-8">
              O produto que você está procurando não existe ou foi removido.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className={`flex-grow ${isMobile ? 'pt-4' : 'pt-24'}`}>
        <div className="container mx-auto px-4">
          {isMobile && (
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
          )}
          
          <div className="bg-white rounded-xl shadow-sm p-4 lg:p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              <ProductGallery product={product} />
              <ProductInfo product={product} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 lg:p-8">
            <ProductTabs product={product} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
