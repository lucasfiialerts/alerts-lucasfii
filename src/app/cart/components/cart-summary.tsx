import Image from "next/image";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCentsToBRL } from "@/helpers/money";

interface CartSummaryProps {
  subtotalInCents: number;
  totalInCents: number;
  products: Array<{
    id: string;
    name: string;
    variantName: string;
    quantity: number;
    priceInCents: number;
    imageUrl: string;
  }>;
}

const CartSummary = ({
  subtotalInCents,
  totalInCents,
  products,
}: CartSummaryProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-white border-b">
        <CardTitle className="text-xl font-semibold text-gray-900">
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between py-2">
          <p className="text-sm font-medium text-gray-700">Subtotal</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCentsToBRL(subtotalInCents)}
          </p>
        </div>
        <div className="flex justify-between py-2 border-t border-gray-200">
          <p className="text-base font-semibold text-gray-900">Total</p>
          <p className="text-lg font-bold text-green-600">
            {formatCentsToBRL(totalInCents)}
          </p>
        </div>

        <div className="pt-4">
          <Separator className="bg-gray-200" />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Produtos</h3>
          {products.map((product) => (
            <div className="flex items-center gap-3" key={product.id}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={60}
                height={60}
                className="rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {product.variantName} • Qtd: {product.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCentsToBRL(product.priceInCents * product.quantity)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;
