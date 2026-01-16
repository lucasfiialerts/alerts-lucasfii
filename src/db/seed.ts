import crypto from "crypto";

import { db } from ".";
import { 
  cartItemTable,
  cartTable,
  categoryTable, 
  orderItemTable,
  orderTable,
  productTable, 
  productVariantTable} from "./schema";

const productImages = {
  "BÁSICO": {
    Padrao: [
      "https://static.vecteezy.com/system/resources/previews/019/004/541/non_2x/tariff-plans-subscription-line-icon-illustration-vector.jpg",
    ],
  },
  "Anual BÁSICO": {
    Padrao: [
      "https://static.vecteezy.com/ti/vetor-gratis/p1/10331668-tarifario-planos-assinatura-cor-icone-ilustracao-vetor.jpg",
    ],
  },
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

const categories = [
  {
    name: "Planos",
    description: "Planos de assinatura disponíveis",
  },
];

const products = [
  {
    name: "BÁSICO",
    description: "Plano básico mensal com recursos essenciais.",
    categoryName: "Planos",
    variants: [
      { color: "Padrao", price: 3999 },
    ],
  },
  {
    name: "Anual BÁSICO",
    description: "Plano básico anual com desconto especial.",
    categoryName: "Planos",
    variants: [
      { color: "Padrao", price: 29999 },
    ],
  },
];

async function main() {
  console.log("🌱 Iniciando o seeding do banco de dados...");

  try {
    // Limpar dados existentes
    console.log("🧹 Limpando dados existentes...");
    await db.delete(orderItemTable);
    await db.delete(orderTable);
    await db.delete(cartItemTable);
    await db.delete(cartTable);
    await db.delete(productVariantTable);
    await db.delete(productTable);
    await db.delete(categoryTable);
    console.log("✅ Dados limpos com sucesso!");

    // Inserir categorias primeiro
    const categoryMap = new Map<string, string>();

    console.log("📂 Criando categorias...");
    for (const categoryData of categories) {
      const categoryId = crypto.randomUUID();
      const categorySlug = generateSlug(categoryData.name);

      console.log(`  📁 Criando categoria: ${categoryData.name}`);

      await db.insert(categoryTable).values({
        id: categoryId,
        name: categoryData.name,
        slug: categorySlug,
      });

      categoryMap.set(categoryData.name, categoryId);
    }

    // Inserir produtos
    for (const productData of products) {
      const productId = crypto.randomUUID();
      const productSlug = generateSlug(productData.name);
      const categoryId = categoryMap.get(productData.categoryName);

      if (!categoryId) {
        throw new Error(
          `Categoria "${productData.categoryName}" não encontrada`,
        );
      }

      console.log(`📦 Criando produto: ${productData.name}`);

      await db.insert(productTable).values({
        id: productId,
        name: productData.name,
        slug: productSlug,
        description: productData.description,
        categoryId: categoryId,
      });

      // Inserir variantes do produto
      for (const variantData of productData.variants) {
        const variantId = crypto.randomUUID();
        const productKey = productData.name as keyof typeof productImages;
        const variantImages =
          productImages[productKey]?.[
            variantData.color as keyof (typeof productImages)[typeof productKey]
          ] || [];

        console.log(`  🎨 Criando variante: ${variantData.color}`);

        await db.insert(productVariantTable).values({
          id: variantId,
          name: variantData.color,
          productId: productId,
          color: variantData.color,
          imageUrl: variantImages[0] || "",
          priceInCents: variantData.price,
          slug: generateSlug(`${productData.name}-${variantData.color}`),
        });
      }
    }

    console.log("✅ Seeding concluído com sucesso!");
    console.log(
      `📊 Foram criadas ${categories.length} categorias, ${
        products.length
      } produtos com ${products.reduce(
        (acc, p) => acc + p.variants.length,
        0,
      )} variantes.`,
    );
  } catch (error) {
    console.error("❌ Erro durante o seeding:", error);
    throw error;
  }
}

main().catch(console.error);
