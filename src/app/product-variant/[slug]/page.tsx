import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";

import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import ProductList from "@/components/common/product-list";
import { db } from "@/db";
import { productTable, productVariantTable } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";

import ProductActions from "./components/product-actions";
import VariantSelector from "./components/variant-selector";

interface ProductVariantPageProps {
  params: Promise<{ slug: string }>;
}

const ProductVariantPage = async ({ params }: ProductVariantPageProps) => {
  const { slug } = await params;
  const productVariant = await db.query.productVariantTable.findFirst({
    where: eq(productVariantTable.slug, slug),
    with: {
      product: {
        with: {
          variants: true,
        },
      },
    },
  });
  if (!productVariant) {
    return notFound();
  }
  const likelyProducts = await db.query.productTable.findMany({
    where: eq(productTable.categoryId, productVariant.product.categoryId),
    with: {
      variants: true,
    },
  });
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Imagem do produto */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-2xl bg-white shadow-lg">
                <Image
                  src={productVariant.imageUrl}
                  alt={productVariant.name}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  height={600}
                  width={600}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Informações do produto */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {productVariant.product.name}
                </h1>
                <p className="text-lg text-gray-600">
                  {productVariant.name}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-green-600">
                    {formatCentsToBRL(productVariant.priceInCents)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <VariantSelector
                  selectedVariantSlug={productVariant.slug}
                  variants={productVariant.product.variants}
                />
              </div>

              <div className="space-y-4">
                <ProductActions productVariantId={productVariant.id} />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Descrição
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {productVariant.product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Produtos relacionados */}
          <div className="mt-16">
            <ProductList title="Talvez você goste" products={likelyProducts} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductVariantPage;
