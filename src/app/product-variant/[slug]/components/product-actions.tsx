"use client";

import { Loader2,MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useBuyNow } from "@/hooks/mutations/use-buy-now";

import AddToCartButton from "./add-to-cart-button";

interface ProductActionsProps {
  productVariantId: string;
}

const ProductActions = ({ productVariantId }: ProductActionsProps) => {
  const [quantity, setQuantity] = useState(1);
  const buyNowMutation = useBuyNow();

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleBuyNow = () => {
    buyNowMutation.mutate({
      productVariantId,
      quantity,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Quantidade</h3>
        <div className="flex w-[120px] items-center justify-between rounded-lg border border-gray-300 bg-white">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleDecrement}
            className="h-10 w-10 hover:bg-gray-100"
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">{quantity}</span>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleIncrement}
            className="h-10 w-10 hover:bg-gray-100"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        <AddToCartButton
          productVariantId={productVariantId}
          quantity={quantity}
        />
        <Button 
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
          size="lg"
          onClick={handleBuyNow}
          disabled={buyNowMutation.isPending}
        >
          {buyNowMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Comprar agora
        </Button>
      </div>
    </div>
  );
};

export default ProductActions;
