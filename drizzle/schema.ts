import { sql } from "drizzle-orm"
import { boolean, foreignKey, integer, jsonb, pgEnum,pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"

export const orderStatus = pgEnum("order_status", ['pending', 'paid', 'canceled'])


export const cart = pgTable("cart", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	shippingAddressId: uuid("shipping_address_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "cart_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.shippingAddressId],
			foreignColumns: [shippingAddress.id],
			name: "cart_shipping_address_id_shipping_address_id_fk"
		}).onDelete("set null"),
]);

export const productVariant = pgTable("product_variant", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	color: text().notNull(),
	priceInCents: integer("price_in_cents").notNull(),
	imageUrl: text("image_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "product_variant_product_id_product_id_fk"
		}).onDelete("cascade"),
	unique("product_variant_slug_unique").on(table.slug),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const category = pgTable("category", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("category_slug_unique").on(table.slug),
]);

export const shippingAddress = pgTable("shipping_address", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "shipping_address_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const order = pgTable("order", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	shippingAddressId: uuid("shipping_address_id").notNull(),
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
	status: orderStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "order_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.shippingAddressId],
			foreignColumns: [shippingAddress.id],
			name: "order_shipping_address_id_shipping_address_id_fk"
		}).onDelete("set null"),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const orderItem = pgTable("order_item", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productVariantId: uuid("product_variant_id").notNull(),
	quantity: integer().notNull(),
	priceInCents: integer("price_in_cents").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "order_item_order_id_order_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariant.id],
			name: "order_item_product_variant_id_product_variant_id_fk"
		}).onDelete("restrict"),
]);

export const product = pgTable("product", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "product_category_id_category_id_fk"
		}).onDelete("set null"),
	unique("product_slug_unique").on(table.slug),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const cartItem = pgTable("cart_item", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productVariantId: uuid("product_variant_id").notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [cart.id],
			name: "cart_item_cart_id_cart_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariant.id],
			name: "cart_item_product_variant_id_product_variant_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	activePlan: text("active_plan"),
	planExpiresAt: timestamp("plan_expires_at", { mode: 'string' }),
	stripeSubscriptionId: text("stripe_subscription_id"),
	whatsappNumber: text("whatsapp_number"),
	whatsappVerified: boolean("whatsapp_verified"),
	whatsappVerificationCode: text("whatsapp_verification_code"),
	alertPreferencesReports: boolean("alert_preferences_reports").default(true),
	alertPreferencesMarketClose: boolean("alert_preferences_market_close").default(false),
	alertPreferencesTreasury: boolean("alert_preferences_treasury").default(false),
	alertPreferencesAutoUpdate: boolean("alert_preferences_auto_update").default(false),
	alertPreferencesVariation: boolean("alert_preferences_variation").default(true),
	alertPreferencesYield: boolean("alert_preferences_yield").default(false),
	alertPreferencesFnet: boolean("alert_preferences_fnet").default(false),
	alertPreferencesBitcoin: boolean("alert_preferences_bitcoin").default(false),
	// AI Provider Preferences
	selectedAiProvider: text("selected_ai_provider").default('gemini-flash'),
	aiProviderCustomName: text("ai_provider_custom_name"),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const chatConversation = pgTable("chat_conversation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	isPinned: boolean("is_pinned").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "chat_conversation_user_id_user_id_fk"
	}).onDelete("cascade"),
]);

export const chatMessage = pgTable("chat_message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	role: text().notNull(), // 'user', 'assistant', 'system'
	content: text().notNull(),
	parts: jsonb(), // Array de parts com texto e imagens
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.conversationId],
		foreignColumns: [chatConversation.id],
		name: "chat_message_conversation_id_chat_conversation_id_fk"
	}).onDelete("cascade"),
]);
