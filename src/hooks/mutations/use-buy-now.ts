import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { addProductToCart } from "@/actions/add-cart-product";

export const buyNowMutationKey = () => ["buyNow"] as const;

interface BuyNowParams {
  productVariantId: string;
  quantity: number;
}

export const useBuyNow = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: buyNowMutationKey(),
    mutationFn: async ({ productVariantId, quantity }: BuyNowParams) => {
      await addProductToCart({
        productVariantId,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      router.push("/cart/identification");
    },
  });
};
