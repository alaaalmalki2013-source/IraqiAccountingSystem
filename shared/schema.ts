import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===================================
// 1. جدول المستخدمين
// ===================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('general_manager'),
  permissions: jsonb("permissions").notNull().default('{}'),
  customPermissions: jsonb("custom_permissions").default('{}'),
  darkMode: boolean("dark_mode").default(false),
  sidebarCollapsed: boolean("sidebar_collapsed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ===================================
// 2. جدول الإيرادات
// ===================================
export const revenues = pgTable("revenues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  date: text("date").notNull(), // DD/MM/YYYY format
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertRevenueSchema = createInsertSchema(revenues).omit({ id: true, createdAt: true });
export const selectRevenueSchema = createSelectSchema(revenues);
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;
export type Revenue = typeof revenues.$inferSelect;

// ===================================
// 3. جدول الصرفيات
// ===================================
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const selectExpenseSchema = createSelectSchema(expenses);
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// ===================================
// 4. جدول الموظفين
// ===================================
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"), // DD/MM/YYYY
  department: text("department"),
  jobTitle: text("job_title"),
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const selectEmployeeSchema = createSelectSchema(employees);
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// ===================================
// 5. جدول السلف
// ===================================
export const advances = pgTable("advances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeName: text("employee_name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertAdvanceSchema = createInsertSchema(advances).omit({ id: true, createdAt: true });
export const selectAdvanceSchema = createSelectSchema(advances);
export type InsertAdvance = z.infer<typeof insertAdvanceSchema>;
export type Advance = typeof advances.$inferSelect;

// ===================================
// 6. جدول المعلقة (قيد التسوية)
// ===================================
export const suspended = pgTable("suspended", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientName: text("recipient_name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertSuspendedSchema = createInsertSchema(suspended).omit({ id: true, createdAt: true });
export const selectSuspendedSchema = createSelectSchema(suspended);
export type InsertSuspended = z.infer<typeof insertSuspendedSchema>;
export type Suspended = typeof suspended.$inferSelect;

// ===================================
// 7. جدول الصرفيات المعلقة
// ===================================
export const pendingExpenses = pgTable("pending_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'expense' or 'advance'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  employeeName: text("employee_name"), // للسلف فقط
  date: text("date").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'paid', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPendingExpenseSchema = createInsertSchema(pendingExpenses).omit({ id: true, createdAt: true });
export const selectPendingExpenseSchema = createSelectSchema(pendingExpenses);
export type InsertPendingExpense = z.infer<typeof insertPendingExpenseSchema>;
export type PendingExpense = typeof pendingExpenses.$inferSelect;

// ===================================
// 8. جدول المواد المخزنية
// ===================================
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  barcode: text("barcode"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull().default('0'),
  count: integer("count").notNull().default(0),
  purchaseHistory: jsonb("purchase_history").default('[]'), // [{date, price, quantity, vendor}]
  invoiceImageUrl: text("invoice_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, createdAt: true });
export const selectInventoryItemSchema = createSelectSchema(inventoryItems);
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// ===================================
// 9. جدول الإدخال المخزني (الفواتير)
// ===================================
export const inventoryEntries = pgTable("inventory_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  vendor: text("vendor").notNull(),
  representative: text("representative"),
  items: jsonb("items").notNull(), // [{name, quantity, price, category}]
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'approved_cash', 'approved_credit', 'cancelled'
  invoiceImageUrl: text("invoice_image_url"),
  cancellationReason: text("cancellation_reason"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

export const insertInventoryEntrySchema = createInsertSchema(inventoryEntries).omit({ id: true, createdAt: true, approvedAt: true });
export const selectInventoryEntrySchema = createSelectSchema(inventoryEntries);
export type InsertInventoryEntry = z.infer<typeof insertInventoryEntrySchema>;
export type InventoryEntry = typeof inventoryEntries.$inferSelect;

// ===================================
// 10. جدول الاستخراج المخزني
// ===================================
export const inventoryWithdrawals = pgTable("inventory_withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  items: jsonb("items").notNull(), // [{name, count, barcode, category}]
  notes: text("notes"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertInventoryWithdrawalSchema = createInsertSchema(inventoryWithdrawals).omit({ id: true, createdAt: true });
export const selectInventoryWithdrawalSchema = createSelectSchema(inventoryWithdrawals);
export type InsertInventoryWithdrawal = z.infer<typeof insertInventoryWithdrawalSchema>;
export type InventoryWithdrawal = typeof inventoryWithdrawals.$inferSelect;

// ===================================
// 11. جدول الرواتب
// ===================================
export const payrolls = pgTable("payrolls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeName: text("employee_name").notNull(),
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }).notNull(),
  bonuses: decimal("bonuses", { precision: 15, scale: 2 }).default('0'),
  deductions: decimal("deductions", { precision: 15, scale: 2 }).default('0'),
  absenceDays: integer("absence_days").default(0),
  absenceDeduction: decimal("absence_deduction", { precision: 15, scale: 2 }).default('0'),
  overtimeHours: integer("overtime_hours").default(0),
  overtimeAmount: decimal("overtime_amount", { precision: 15, scale: 2 }).default('0'),
  netSalary: decimal("net_salary", { precision: 15, scale: 2 }).notNull(),
  month: text("month").notNull(), // format: YYYY-MM
  paid: boolean("paid").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPayrollSchema = createInsertSchema(payrolls).omit({ id: true, createdAt: true });
export const selectPayrollSchema = createSelectSchema(payrolls);
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrolls.$inferSelect;

// ===================================
// 12. جدول سجل النشاطات
// ===================================
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  action: text("action").notNull(), // 'إضافة', 'تعديل', 'حذف', 'موافقة', 'إلغاء'
  module: text("module").notNull(), // 'revenues', 'expenses', etc.
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: varchar("user_id").references(() => users.id),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });
export const selectActivityLogSchema = createSelectSchema(activityLogs);
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// ===================================
// 13. جدول الإعدادات
// ===================================
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default('main_settings'),
  companyName: text("company_name").notNull().default('شركتي'),
  companyLogoUrl: text("company_logo_url"),
  googleDriveFolderUrl: text("google_drive_folder_url"), // رابط مجلد Google Drive للفواتير والمستمسكات
  systemExpiryDate: text("system_expiry_date"), // DD/MM/YYYY
  masterKey: text("master_key").notNull().default('8809912@..Alaa'),
  expenseCategories: jsonb("expense_categories").default('[]'),
  revenueCategories: jsonb("revenue_categories").default('[]'),
  advanceCategories: jsonb("advance_categories").default('[]'),
  departments: jsonb("departments").default('[]'),
  jobTitles: jsonb("job_titles").default('[]'),
  vendors: jsonb("vendors").default('[]'),
  representatives: jsonb("representatives").default('[]'), // [{name, vendor}]
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const selectSettingsSchema = createSelectSchema(settings);
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// ===================================
// العلاقات (Relations)
// ===================================
export const usersRelations = relations(users, ({ many }) => ({
  revenues: many(revenues),
  expenses: many(expenses),
  advances: many(advances),
  suspended: many(suspended),
  pendingExpenses: many(pendingExpenses),
  inventoryEntries: many(inventoryEntries),
  inventoryWithdrawals: many(inventoryWithdrawals),
  payrolls: many(payrolls),
  activityLogs: many(activityLogs),
}));

export const revenuesRelations = relations(revenues, ({ one }) => ({
  createdByUser: one(users, {
    fields: [revenues.createdBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

export const advancesRelations = relations(advances, ({ one }) => ({
  createdByUser: one(users, {
    fields: [advances.createdBy],
    references: [users.id],
  }),
}));

export const suspendedRelations = relations(suspended, ({ one }) => ({
  createdByUser: one(users, {
    fields: [suspended.createdBy],
    references: [users.id],
  }),
}));

export const pendingExpensesRelations = relations(pendingExpenses, ({ one }) => ({
  createdByUser: one(users, {
    fields: [pendingExpenses.createdBy],
    references: [users.id],
  }),
}));

export const inventoryEntriesRelations = relations(inventoryEntries, ({ one }) => ({
  createdByUser: one(users, {
    fields: [inventoryEntries.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [inventoryEntries.approvedBy],
    references: [users.id],
  }),
}));

export const inventoryWithdrawalsRelations = relations(inventoryWithdrawals, ({ one }) => ({
  createdByUser: one(users, {
    fields: [inventoryWithdrawals.createdBy],
    references: [users.id],
  }),
}));

export const payrollsRelations = relations(payrolls, ({ one }) => ({
  createdByUser: one(users, {
    fields: [payrolls.createdBy],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ===================================
// 14. جدول المستندات والفواتير المرفوعة
// ===================================
export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  employeeName: text("employee_name").notNull(),
  documentType: text("document_type").notNull(), // 'invoice', 'id_card', 'certificate', 'contract', 'other'
  documentName: text("document_name").notNull(),
  fileData: text("file_data"), // base64 encoded file data
  fileType: text("file_type"), // 'image/png', 'image/jpeg', 'application/pdf', etc.
  fileSize: integer("file_size"), // in bytes
  notes: text("notes"),
  uploadDate: text("upload_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({ id: true, createdAt: true });
export const selectEmployeeDocumentSchema = createSelectSchema(employeeDocuments);
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
  createdByUser: one(users, {
    fields: [employeeDocuments.createdBy],
    references: [users.id],
  }),
}));

// ===================================
// 15. جدول النسخة المركزية للبيانات
// ===================================
export const dataSnapshots = pgTable("data_snapshots", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull().default(sql`'{}'::jsonb`),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DataSnapshot = typeof dataSnapshots.$inferSelect;
