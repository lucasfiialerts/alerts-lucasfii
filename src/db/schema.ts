import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  activePlan: text("active_plan"), // "basico" ou null
  planExpiresAt: timestamp("plan_expires_at"), // Data de expiração do plano
  stripeSubscriptionId: text("stripe_subscription_id"), // ID da assinatura no Stripe
  whatsappNumber: text("whatsapp_number"), // Número do WhatsApp
  whatsappVerified: boolean("whatsapp_verified").$defaultFn(() => false), // Se o WhatsApp foi verificado
  whatsappVerificationCode: text("whatsapp_verification_code"), // Código de verificação temporário
  
  // Preferências de alertas (baseado na página de configuração)
  alertPreferencesReports: boolean("alert_preferences_reports").default(true), // Relatórios e Eventos
  alertPreferencesMarketClose: boolean("alert_preferences_market_close").default(false), // Fechamento do Mercado
  alertPreferencesTreasury: boolean("alert_preferences_treasury").default(false), // Tesouro Direto
  alertPreferencesAutoUpdate: boolean("alert_preferences_auto_update").default(false), // Atualização Automática
  alertPreferencesVariation: boolean("alert_preferences_variation").default(true), // Variação de Preço
  alertPreferencesYield: boolean("alert_preferences_yield").default(false), // Anúncios de Rendimentos
  alertPreferencesFnet: boolean("alert_preferences_fnet").default(false), // FNet B3 - Documentos Oficiais
  alertPreferencesBitcoin: boolean("alert_preferences_bitcoin").default(false), // Bitcoin - Variação de Preço
  alertPreferencesStatusInvest: boolean("alert_preferences_status_invest").default(false), // Status Invest - Comunicados (Relatórios, Fatos Relevantes, Informes)
  
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const userRelations = relations(userTable, ({ many, one }) => ({
  shippingAddresses: many(shippingAddressTable),
  cart: one(cartTable, {
    fields: [userTable.id],
    references: [cartTable.userId],
  }),
  orders: many(orderTable),
}));

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const accountTable = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const categoryTable = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  products: many(productTable),
}));

export const productTable = pgTable("product", {
  id: uuid().primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categoryTable.id, { onDelete: "set null" }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productRelations = relations(productTable, ({ one, many }) => ({
  category: one(categoryTable, {
    fields: [productTable.categoryId],
    references: [categoryTable.id],
  }),
  variants: many(productVariantTable),
}));

export const productVariantTable = pgTable("product_variant", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  color: text().notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productVariantRelations = relations(
  productVariantTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productVariantTable.productId],
      references: [productTable.id],
    }),
    cartItems: many(cartItemTable),
    orderItems: many(orderItemTable),
  }),
);

export const shippingAddressTable = pgTable("shipping_address", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  recipientName: text().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  complement: text(),
  city: text().notNull(),
  state: text().notNull(),
  neighborhood: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull(),
  phone: text().notNull(),
  email: text().notNull(),
  cpfOrCnpj: text().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shippingAddressRelations = relations(
  shippingAddressTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [shippingAddressTable.userId],
      references: [userTable.id],
    }),
    cart: one(cartTable, {
      fields: [shippingAddressTable.id],
      references: [cartTable.shippingAddressId],
    }),
    orders: many(orderTable),
  }),
);

export const cartTable = pgTable("cart", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id").references(
    () => shippingAddressTable.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartRelations = relations(cartTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [cartTable.userId],
    references: [userTable.id],
  }),
  shippingAddress: one(shippingAddressTable, {
    fields: [cartTable.shippingAddressId],
    references: [shippingAddressTable.id],
  }),
  items: many(cartItemTable),
}));

export const cartItemTable = pgTable("cart_item", {
  id: uuid().primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => cartTable.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartItemRelations = relations(cartItemTable, ({ one }) => ({
  cart: one(cartTable, {
    fields: [cartItemTable.cartId],
    references: [cartTable.id],
  }),
  productVariant: one(productVariantTable, {
    fields: [cartItemTable.productVariantId],
    references: [productVariantTable.id],
  }),
}));

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
]);

export const orderTable = pgTable("order", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id")
    .notNull()
    .references(() => shippingAddressTable.id, { onDelete: "set null" }),
  recipientName: text().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  complement: text(),
  city: text().notNull(),
  state: text().notNull(),
  neighborhood: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull(),
  phone: text().notNull(),
  email: text().notNull(),
  cpfOrCnpj: text().notNull(),
  totalPriceInCents: integer("total_price_in_cents").notNull(),
  status: orderStatus().notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [orderTable.userId],
    references: [userTable.id],
  }),
  shippingAddress: one(shippingAddressTable, {
    fields: [orderTable.shippingAddressId],
    references: [shippingAddressTable.id],
  }),
  items: many(orderItemTable),
}));

export const orderItemTable = pgTable("order_item", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orderTable.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemTable.orderId],
    references: [orderTable.id],
  }),
  productVariant: one(productVariantTable, {
    fields: [orderItemTable.productVariantId],
    references: [productVariantTable.id],
  }),
}));

// Tabelas para FIIs e Relatórios Gerenciais
export const fiiFundTable = pgTable("fii_fund", {
  id: uuid().primaryKey().defaultRandom(),
  ticker: text("ticker").notNull().unique(), // Ex: VTLT11, SAPI11
  name: text("name").notNull(), // Nome completo do fundo
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fiiReportTable = pgTable("fii_report", {
  id: uuid().primaryKey().defaultRandom(),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => fiiFundTable.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date").notNull(), // Data de publicação do relatório
  reportMonth: text("report_month").notNull(), // Ex: "Nov/2025"
  reportUrl: text("report_url"), // Link para o relatório
  downloadUrl: text("download_url"), // Link de download direto
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userFiiFollowTable = pgTable("user_fii_follow", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => fiiFundTable.id, { onDelete: "cascade" }),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  // Configurações de alerta de preço
  priceAlertEnabled: boolean("price_alert_enabled").default(true),
  minVariationPercent: text("min_variation_percent").default("0.1"), // Variação mínima para alerta (%)
  alertFrequency: text("alert_frequency").default("daily"), // daily, hourly, realtime
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Histórico de cotações dos FIIs
export const fiiPriceHistoryTable = pgTable("fii_price_history", {
  id: uuid().primaryKey().defaultRandom(),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => fiiFundTable.id, { onDelete: "cascade" }),
  price: text("price").notNull(), // Preço atual em centavos como string
  variation: text("variation"), // Variação percentual
  volume: text("volume"), // Volume negociado
  marketCap: text("market_cap"), // Valor de mercado
  dividendYield: text("dividend_yield"), // Dividend yield
  recordDate: timestamp("record_date").notNull(), // Data/hora da cotação
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Log de alertas enviados (genérico - para evitar duplicatas)
export const sentAlertTable = pgTable("sent_alert", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  alertKey: text("alert_key").notNull(), // Chave única do alerta (ex: fnet-relatorio-123456)
  alertType: text("alert_type").notNull(), // Tipo do alerta (fnet-relatorio, dividend, etc)
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// Log de alertas enviados
export const fiiAlertLogTable = pgTable("fii_alert_log", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => fiiFundTable.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // price_variation, price_target
  message: text("message").notNull(), // Mensagem enviada
  price: text("price").notNull(), // Preço que gerou o alerta
  variation: text("variation"), // Variação que gerou o alerta
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").default("sent"), // sent, failed, pending
});

export const fiiFundRelations = relations(fiiFundTable, ({ many }) => ({
  reports: many(fiiReportTable),
  followers: many(userFiiFollowTable),
  priceHistory: many(fiiPriceHistoryTable),
  alertLogs: many(fiiAlertLogTable),
}));

export const fiiReportRelations = relations(fiiReportTable, ({ one }) => ({
  fund: one(fiiFundTable, {
    fields: [fiiReportTable.fundId],
    references: [fiiFundTable.id],
  }),
}));

export const userFiiFollowRelations = relations(userFiiFollowTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userFiiFollowTable.userId],
    references: [userTable.id],
  }),
  fund: one(fiiFundTable, {
    fields: [userFiiFollowTable.fundId],
    references: [fiiFundTable.id],
  }),
}));

export const fiiPriceHistoryRelations = relations(fiiPriceHistoryTable, ({ one }) => ({
  fund: one(fiiFundTable, {
    fields: [fiiPriceHistoryTable.fundId],
    references: [fiiFundTable.id],
  }),
}));

// Tabela para histórico de dividendos
export const fiiDividendTable = pgTable("fii_dividend", {
  id: uuid().primaryKey().defaultRandom(),
  ticker: text("ticker").notNull(), // Ex: MXRF11, VTLT11
  assetIssued: text("asset_issued").notNull(), // Código do ativo
  paymentDate: timestamp("payment_date").notNull(), // Data de pagamento
  rate: text("rate").notNull(), // Valor do dividendo
  relatedTo: text("related_to").notNull(), // Período (ex: "Nov/2025")
  label: text("label").notNull(), // Tipo (ex: "JCP", "Dividendo")
  lastDatePrior: timestamp("last_date_prior"), // Data limite para recebimento
  remarks: text("remarks"), // Observações
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Log de alertas de dividendos enviados
export const dividendAlertLogTable = pgTable("dividend_alert_log", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  ticker: text("ticker").notNull(), // Ex: MXRF11
  dividendId: uuid("dividend_id")
    .notNull()
    .references(() => fiiDividendTable.id, { onDelete: "cascade" }),
  message: text("message").notNull(), // Mensagem enviada
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").default("sent"), // sent, failed, pending
  whatsappMessageId: text("whatsapp_message_id"), // ID da mensagem no WhatsApp
});

export const fiiDividendRelations = relations(fiiDividendTable, ({ many }) => ({
  alertLogs: many(dividendAlertLogTable),
}));

export const dividendAlertLogRelations = relations(dividendAlertLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [dividendAlertLogTable.userId],
    references: [userTable.id],
  }),
  dividend: one(fiiDividendTable, {
    fields: [dividendAlertLogTable.dividendId],
    references: [fiiDividendTable.id],
  }),
}));

export const fiiAlertLogRelations = relations(fiiAlertLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [fiiAlertLogTable.userId],
    references: [userTable.id],
  }),
  fund: one(fiiFundTable, {
    fields: [fiiAlertLogTable.fundId],
    references: [fiiFundTable.id],
  }),
}));
