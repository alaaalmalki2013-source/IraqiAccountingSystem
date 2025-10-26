import { 
  users, revenues, expenses, employees, advances, suspended, 
  pendingExpenses, inventoryItems, inventoryEntries, inventoryWithdrawals,
  payrolls, activityLogs, settings,
  type User, type InsertUser,
  type Revenue, type InsertRevenue,
  type Expense, type InsertExpense,
  type Employee, type InsertEmployee,
  type Advance, type InsertAdvance,
  type Suspended, type InsertSuspended,
  type PendingExpense, type InsertPendingExpense,
  type InventoryItem, type InsertInventoryItem,
  type InventoryEntry, type InsertInventoryEntry,
  type InventoryWithdrawal, type InsertInventoryWithdrawal,
  type Payroll, type InsertPayroll,
  type ActivityLog, type InsertActivityLog,
  type Settings, type InsertSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

// واجهة التخزين الكاملة لنظام المحاسبة العراقي
export interface IStorage {
  // ===== المستخدمون =====
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // ===== الإيرادات =====
  getAllRevenues(): Promise<Revenue[]>;
  getRevenue(id: string): Promise<Revenue | undefined>;
  createRevenue(revenue: InsertRevenue): Promise<Revenue>;
  updateRevenue(id: string, revenue: Partial<InsertRevenue>): Promise<Revenue | undefined>;
  deleteRevenue(id: string): Promise<boolean>;

  // ===== الصرفيات =====
  getAllExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // ===== الموظفون =====
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // ===== السلف =====
  getAllAdvances(): Promise<Advance[]>;
  getAdvance(id: string): Promise<Advance | undefined>;
  createAdvance(advance: InsertAdvance): Promise<Advance>;
  updateAdvance(id: string, advance: Partial<InsertAdvance>): Promise<Advance | undefined>;
  deleteAdvance(id: string): Promise<boolean>;

  // ===== المعلقة =====
  getAllSuspended(): Promise<Suspended[]>;
  getSuspended(id: string): Promise<Suspended | undefined>;
  createSuspended(susp: InsertSuspended): Promise<Suspended>;
  updateSuspended(id: string, susp: Partial<InsertSuspended>): Promise<Suspended | undefined>;
  deleteSuspended(id: string): Promise<boolean>;

  // ===== الصرفيات المعلقة =====
  getAllPendingExpenses(): Promise<PendingExpense[]>;
  getPendingExpense(id: string): Promise<PendingExpense | undefined>;
  createPendingExpense(pe: InsertPendingExpense): Promise<PendingExpense>;
  updatePendingExpense(id: string, pe: Partial<InsertPendingExpense>): Promise<PendingExpense | undefined>;
  deletePendingExpense(id: string): Promise<boolean>;

  // ===== المواد المخزنية =====
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // ===== الإدخال المخزني =====
  getAllInventoryEntries(): Promise<InventoryEntry[]>;
  getInventoryEntry(id: string): Promise<InventoryEntry | undefined>;
  createInventoryEntry(entry: InsertInventoryEntry): Promise<InventoryEntry>;
  updateInventoryEntry(id: string, entry: Partial<InsertInventoryEntry>): Promise<InventoryEntry | undefined>;
  deleteInventoryEntry(id: string): Promise<boolean>;

  // ===== الاستخراج المخزني =====
  getAllInventoryWithdrawals(): Promise<InventoryWithdrawal[]>;
  getInventoryWithdrawal(id: string): Promise<InventoryWithdrawal | undefined>;
  createInventoryWithdrawal(withdrawal: InsertInventoryWithdrawal): Promise<InventoryWithdrawal>;
  updateInventoryWithdrawal(id: string, withdrawal: Partial<InsertInventoryWithdrawal>): Promise<InventoryWithdrawal | undefined>;
  deleteInventoryWithdrawal(id: string): Promise<boolean>;

  // ===== الرواتب =====
  getAllPayrolls(): Promise<Payroll[]>;
  getPayroll(id: string): Promise<Payroll | undefined>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: string, payroll: Partial<InsertPayroll>): Promise<Payroll | undefined>;
  deletePayroll(id: string): Promise<boolean>;

  // ===== سجل النشاطات =====
  getAllActivityLogs(): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // ===== الإعدادات =====
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  // ===== المستخدمون =====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الإيرادات =====
  async getAllRevenues(): Promise<Revenue[]> {
    return await db.select().from(revenues).orderBy(desc(revenues.createdAt));
  }

  async getRevenue(id: string): Promise<Revenue | undefined> {
    const [revenue] = await db.select().from(revenues).where(eq(revenues.id, id));
    return revenue || undefined;
  }

  async createRevenue(insertRevenue: InsertRevenue): Promise<Revenue> {
    const [revenue] = await db.insert(revenues).values(insertRevenue).returning();
    return revenue;
  }

  async updateRevenue(id: string, updateData: Partial<InsertRevenue>): Promise<Revenue | undefined> {
    const [revenue] = await db.update(revenues).set(updateData).where(eq(revenues.id, id)).returning();
    return revenue || undefined;
  }

  async deleteRevenue(id: string): Promise<boolean> {
    const result = await db.delete(revenues).where(eq(revenues.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الصرفيات =====
  async getAllExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [expense] = await db.update(expenses).set(updateData).where(eq(expenses.id, id)).returning();
    return expense || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الموظفون =====
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db.update(employees).set(updateData).where(eq(employees.id, id)).returning();
    return employee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== السلف =====
  async getAllAdvances(): Promise<Advance[]> {
    return await db.select().from(advances).orderBy(desc(advances.createdAt));
  }

  async getAdvance(id: string): Promise<Advance | undefined> {
    const [advance] = await db.select().from(advances).where(eq(advances.id, id));
    return advance || undefined;
  }

  async createAdvance(insertAdvance: InsertAdvance): Promise<Advance> {
    const [advance] = await db.insert(advances).values(insertAdvance).returning();
    return advance;
  }

  async updateAdvance(id: string, updateData: Partial<InsertAdvance>): Promise<Advance | undefined> {
    const [advance] = await db.update(advances).set(updateData).where(eq(advances.id, id)).returning();
    return advance || undefined;
  }

  async deleteAdvance(id: string): Promise<boolean> {
    const result = await db.delete(advances).where(eq(advances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== المعلقة =====
  async getAllSuspended(): Promise<Suspended[]> {
    return await db.select().from(suspended).orderBy(desc(suspended.createdAt));
  }

  async getSuspended(id: string): Promise<Suspended | undefined> {
    const [susp] = await db.select().from(suspended).where(eq(suspended.id, id));
    return susp || undefined;
  }

  async createSuspended(insertSuspended: InsertSuspended): Promise<Suspended> {
    const [susp] = await db.insert(suspended).values(insertSuspended).returning();
    return susp;
  }

  async updateSuspended(id: string, updateData: Partial<InsertSuspended>): Promise<Suspended | undefined> {
    const [susp] = await db.update(suspended).set(updateData).where(eq(suspended.id, id)).returning();
    return susp || undefined;
  }

  async deleteSuspended(id: string): Promise<boolean> {
    const result = await db.delete(suspended).where(eq(suspended.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الصرفيات المعلقة =====
  async getAllPendingExpenses(): Promise<PendingExpense[]> {
    return await db.select().from(pendingExpenses).orderBy(desc(pendingExpenses.createdAt));
  }

  async getPendingExpense(id: string): Promise<PendingExpense | undefined> {
    const [pe] = await db.select().from(pendingExpenses).where(eq(pendingExpenses.id, id));
    return pe || undefined;
  }

  async createPendingExpense(insertPendingExpense: InsertPendingExpense): Promise<PendingExpense> {
    const [pe] = await db.insert(pendingExpenses).values(insertPendingExpense).returning();
    return pe;
  }

  async updatePendingExpense(id: string, updateData: Partial<InsertPendingExpense>): Promise<PendingExpense | undefined> {
    const [pe] = await db.update(pendingExpenses).set(updateData).where(eq(pendingExpenses.id, id)).returning();
    return pe || undefined;
  }

  async deletePendingExpense(id: string): Promise<boolean> {
    const result = await db.delete(pendingExpenses).where(eq(pendingExpenses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== المواد المخزنية =====
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(insertItem).returning();
    return item;
  }

  async updateInventoryItem(id: string, updateData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db.update(inventoryItems).set(updateData).where(eq(inventoryItems.id, id)).returning();
    return item || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الإدخال المخزني =====
  async getAllInventoryEntries(): Promise<InventoryEntry[]> {
    return await db.select().from(inventoryEntries).orderBy(desc(inventoryEntries.createdAt));
  }

  async getInventoryEntry(id: string): Promise<InventoryEntry | undefined> {
    const [entry] = await db.select().from(inventoryEntries).where(eq(inventoryEntries.id, id));
    return entry || undefined;
  }

  async createInventoryEntry(insertEntry: InsertInventoryEntry): Promise<InventoryEntry> {
    const [entry] = await db.insert(inventoryEntries).values(insertEntry).returning();
    return entry;
  }

  async updateInventoryEntry(id: string, updateData: Partial<InsertInventoryEntry>): Promise<InventoryEntry | undefined> {
    const [entry] = await db.update(inventoryEntries).set(updateData).where(eq(inventoryEntries.id, id)).returning();
    return entry || undefined;
  }

  async deleteInventoryEntry(id: string): Promise<boolean> {
    const result = await db.delete(inventoryEntries).where(eq(inventoryEntries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الاستخراج المخزني =====
  async getAllInventoryWithdrawals(): Promise<InventoryWithdrawal[]> {
    return await db.select().from(inventoryWithdrawals).orderBy(desc(inventoryWithdrawals.createdAt));
  }

  async getInventoryWithdrawal(id: string): Promise<InventoryWithdrawal | undefined> {
    const [withdrawal] = await db.select().from(inventoryWithdrawals).where(eq(inventoryWithdrawals.id, id));
    return withdrawal || undefined;
  }

  async createInventoryWithdrawal(insertWithdrawal: InsertInventoryWithdrawal): Promise<InventoryWithdrawal> {
    const [withdrawal] = await db.insert(inventoryWithdrawals).values(insertWithdrawal).returning();
    return withdrawal;
  }

  async updateInventoryWithdrawal(id: string, updateData: Partial<InsertInventoryWithdrawal>): Promise<InventoryWithdrawal | undefined> {
    const [withdrawal] = await db.update(inventoryWithdrawals).set(updateData).where(eq(inventoryWithdrawals.id, id)).returning();
    return withdrawal || undefined;
  }

  async deleteInventoryWithdrawal(id: string): Promise<boolean> {
    const result = await db.delete(inventoryWithdrawals).where(eq(inventoryWithdrawals.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== الرواتب =====
  async getAllPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls).orderBy(desc(payrolls.createdAt));
  }

  async getPayroll(id: string): Promise<Payroll | undefined> {
    const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, id));
    return payroll || undefined;
  }

  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    const [payroll] = await db.insert(payrolls).values(insertPayroll).returning();
    return payroll;
  }

  async updatePayroll(id: string, updateData: Partial<InsertPayroll>): Promise<Payroll | undefined> {
    const [payroll] = await db.update(payrolls).set(updateData).where(eq(payrolls.id, id)).returning();
    return payroll || undefined;
  }

  async deletePayroll(id: string): Promise<boolean> {
    const result = await db.delete(payrolls).where(eq(payrolls.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ===== سجل النشاطات =====
  async getAllActivityLogs(): Promise<ActivityLog[]> {
    // عرض آخر 500 سجل
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(500);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(insertLog).returning();
    
    // حذف السجلات القديمة (الاحتفاظ بآخر 500 فقط)
    const allLogs = await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
    if (allLogs.length > 500) {
      const oldLogs = allLogs.slice(500);
      for (const oldLog of oldLogs) {
        await db.delete(activityLogs).where(eq(activityLogs.id, oldLog.id));
      }
    }
    
    return log;
  }

  // ===== الإعدادات =====
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.id, 'main_settings'));
    
    // إنشاء إعدادات افتراضية إذا لم تكن موجودة
    if (!setting) {
      const [newSettings] = await db.insert(settings).values({
        id: 'main_settings',
        companyName: 'شركتي',
        masterKey: '8809912@..Alaa',
        expenseCategories: [],
        revenueCategories: [],
        advanceCategories: [],
        departments: [],
        jobTitles: [],
        vendors: [],
        representatives: []
      }).returning();
      return newSettings;
    }
    
    return setting;
  }

  async updateSettings(updateData: Partial<InsertSettings>): Promise<Settings> {
    const [setting] = await db.update(settings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(settings.id, 'main_settings'))
      .returning();
    return setting;
  }
}

export const storage = new DatabaseStorage();
