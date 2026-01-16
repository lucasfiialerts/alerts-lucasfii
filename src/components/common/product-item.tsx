import Image from "next/image";
import Link from "next/link";

import { productTable, productVariantTable } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";
import { cn } from "@/lib/utils";

interface ProductItemProps {
  product: typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  };
  textContainerClassName?: string;
}

const ProductItem = ({ product, textContainerClassName }: ProductItemProps) => {
  const firstVariant = product.variants[0];
  return (
    <Link
      href={`/product-variant/${firstVariant.slug}`}
      className="flex flex-col gap-4 lg:min-w-0"
    >
      <Image
        src={firstVariant.imageUrl}
        alt={firstVariant.name}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, (max-width: 1600px) 33vw, 25vw"
        height={0}
        width={0}
        className="h-auto w-full rounded-3xl lg:aspect-square lg:object-cover"
      />
      <div
        className={cn(
          "flex max-w-[200px] flex-col gap-1 lg:max-w-none",
          textContainerClassName,
        )}
      >
        <p className="truncate text-sm font-medium lg:text-base">{product.name}</p>
        <p className="text-muted-foreground truncate text-xs font-medium lg:text-sm">
          {product.description}
        </p>
        <p className="truncate text-sm font-semibold lg:text-base">
          {formatCentsToBRL(firstVariant.priceInCents)}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
