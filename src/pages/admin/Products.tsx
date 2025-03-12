
import { useAdminProducts } from "@/hooks/use-admin-products";
import ProductForm from "@/components/admin/ProductForm";
import ProductsTable from "@/components/admin/products/ProductsTable";
import ProductsActions from "@/components/admin/products/ProductsActions";
import { parseJsonObject } from "@/utils/supabaseJsonUtils";

const AdminProducts = () => {
  const {
    products,
    isLoading,
    error,
    isSyncing,
    isFormOpen,
    editingProduct,
    handleToggleActive,
    handleDelete,
    syncOmieProducts,
    openProductForm,
    closeProductForm,
    handleFormSuccess
  } = useAdminProducts();

  // Garantindo que products seja sempre um array, mesmo quando é undefined
  const safeProducts = products || [];
  
  // Processando produtos apenas se houver produtos para processar
  const processedProducts = safeProducts.map(product => ({
    ...product,
    technical_details: parseJsonObject(product.technical_details, {})
  }));

  return (
    <div className="p-8">
      <ProductsActions 
        onAddNew={() => openProductForm()}
        onSync={syncOmieProducts}
        isSyncing={isSyncing}
      />

      <ProductsTable
        products={processedProducts}
        isLoading={isLoading}
        error={error}
        onEdit={openProductForm}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onClose={closeProductForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default AdminProducts;
