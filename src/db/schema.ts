import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type ProductOption = { label: string; priceDelta: number };

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  nameEn: text("name_en").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  unit: text("unit").notNull().default("م²"),
  minQty: integer("min_qty").notNull().default(1),
  step: integer("step").notNull().default(1),
  images: jsonb("images").$type<string[]>().notNull(),
  options: jsonb("options").$type<ProductOption[]>().notNull(),
  optionsLabel: text("options_label").notNull().default("مستوى التشطيب"),
  features: jsonb("features").$type<string[]>().notNull(),
  badge: text("badge"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sales: integer("sales").notNull().default(0),
  leadTime: text("lead_time").notNull().default("خلال ٣ - ٧ أيام عمل"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sku: text("sku").notNull().default(""),
  brand: text("brand").notNull().default(""),
  stock: integer("stock"), // null = unlimited / not tracked
  available: boolean("available").notNull().default(true),
  newArrival: boolean("new_arrival").notNull().default(false),
  colors: jsonb("colors").$type<{ name: string; hex: string }[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  nameEn: text("name_en").notNull().default(""),
  shortDescriptionEn: text("short_description_en").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  city: text("city"),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  preferredDate: text("preferred_date"),
  notes: text("notes"),
  paymentMethod: text("payment_method").notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  accessToken: text("access_token").notNull().default(""),
  email: text("email"),
  couponCode: text("coupon_code"),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  customerId: integer("customer_id"),
  internalNote: text("internal_note"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  optionLabel: text("option_label"),
  unit: text("unit").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  image: text("image").notNull(),
  variant: text("variant"),
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  image: text("image").notNull(),
  category: text("category").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Auth, roles, audit, drafts                                          */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"), // owner | staff
  passwordHash: text("password_hash").notNull(),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(1),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resetTokens = pgTable("reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name").notNull().default(""),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull().default(""),
  summary: text("summary").notNull().default(""),
  before: jsonb("before"),
  after: jsonb("after"),
  restorable: boolean("restorable").notNull().default(false),
  restoredAt: timestamp("restored_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Unpublished edits made in-place on the storefront. scope = content | product */
export const drafts = pgTable(
  "drafts",
  {
    id: serial("id").primaryKey(),
    scope: text("scope").notNull(),
    ref: text("ref").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedBy: text("updated_by").notNull().default(""),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("drafts_scope_ref").on(t.scope, t.ref)],
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  link: text("link").notNull().default(""),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  ordersCount: integer("orders_count").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"), // percent | fixed
  value: integer("value").notNull().default(10),
  minOrder: integer("min_order").notNull().default(0),
  maxUses: integer("max_uses").notNull().default(0), // 0 = unlimited
  used: integer("used").notNull().default(0),
  expiresAt: text("expires_at").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  regions: text("regions").notNull().default(""), // comma separated cities/governorates; empty = everywhere else
  fee: integer("fee").notNull().default(0),
  freeOver: integer("free_over").notNull().default(0), // 0 = never free
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ------------------------------------------------------------------ */
/* Pages & messages                                                    */
/* ------------------------------------------------------------------ */

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleEn: text("title_en").notNull().default(""),
  body: text("body").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull().default(""),
  questionEn: text("question_en").notNull().default(""),
  answerEn: text("answer_en").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
