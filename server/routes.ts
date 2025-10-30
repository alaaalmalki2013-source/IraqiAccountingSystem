import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ensureSnapshotInitialized, getSnapshot, saveSnapshot, VersionConflictError } from "./snapshot";
import { attachRealtime, broadcast } from "./realtime";

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureSnapshotInitialized();

  // النسخة الكاملة للبيانات
  app.get("/api/snapshot", async (_req, res) => {
    try {
      const snapshot = await getSnapshot();
      res.json(snapshot);
    } catch (error) {
      console.error("Get snapshot error:", error);
      res.status(500).json({ error: "فشل في جلب بيانات النظام" });
    }
  });

  app.put("/api/snapshot", async (req, res) => {
    try {
      const { version, data } = req.body ?? {};

      if (typeof version !== "number" || !data) {
        return res.status(400).json({ error: "طلب غير صالح" });
      }

      const clientIdHeader = req.headers["x-client-id"];
      const clientId = Array.isArray(clientIdHeader)
        ? clientIdHeader[0]
        : typeof clientIdHeader === "string"
          ? clientIdHeader
          : undefined;

      const snapshot = await saveSnapshot({ version, data });

      broadcast(
        "snapshot:updated",
        { version: snapshot.version, updatedAt: snapshot.updatedAt },
        { originId: clientId },
      );

      res.json(snapshot);
    } catch (error) {
      if (error instanceof VersionConflictError && error.latest) {
        return res.status(409).json(error.latest);
      }

      console.error("Update snapshot error:", error);
      res.status(500).json({ error: "فشل في حفظ بيانات النظام" });
    }
  });
  // ===================================
  // API Routes للنظام
  // ===================================

  // ===== المستخدمون =====
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'فشل في جلب المستخدمين' });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'فشل في جلب المستخدم' });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'فشل في إنشاء المستخدم' });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'فشل في تحديث المستخدم' });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'فشل في حذف المستخدم' });
    }
  });

  // ===== الإيرادات =====
  app.get("/api/revenues", async (req, res) => {
    try {
      const revenues = await storage.getAllRevenues();
      res.json(revenues);
    } catch (error) {
      console.error('Get revenues error:', error);
      res.status(500).json({ error: 'فشل في جلب الإيرادات' });
    }
  });

  app.post("/api/revenues", async (req, res) => {
    try {
      const revenue = await storage.createRevenue(req.body);
      res.json(revenue);
    } catch (error) {
      console.error('Create revenue error:', error);
      res.status(500).json({ error: 'فشل في إضافة الإيراد' });
    }
  });

  app.patch("/api/revenues/:id", async (req, res) => {
    try {
      const revenue = await storage.updateRevenue(req.params.id, req.body);
      if (!revenue) {
        return res.status(404).json({ error: 'الإيراد غير موجود' });
      }
      res.json(revenue);
    } catch (error) {
      console.error('Update revenue error:', error);
      res.status(500).json({ error: 'فشل في تحديث الإيراد' });
    }
  });

  app.delete("/api/revenues/:id", async (req, res) => {
    try {
      const success = await storage.deleteRevenue(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الإيراد غير موجود' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete revenue error:', error);
      res.status(500).json({ error: 'فشل في حذف الإيراد' });
    }
  });

  // ===== الصرفيات =====
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getAllExpenses();
      res.json(expenses);
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({ error: 'فشل في جلب الصرفيات' });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expense = await storage.createExpense(req.body);
      res.json(expense);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'فشل في إضافة الصرفية' });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ error: 'الصرفية غير موجودة' });
      }
      res.json(expense);
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'فشل في تحديث الصرفية' });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const success = await storage.deleteExpense(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الصرفية غير موجودة' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'فشل في حذف الصرفية' });
    }
  });

  // ===== الموظفون =====
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ error: 'فشل في جلب الموظفين' });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.json(employee);
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ error: 'فشل في إضافة الموظف' });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.updateEmployee(req.params.id, req.body);
      if (!employee) {
        return res.status(404).json({ error: 'الموظف غير موجود' });
      }
      res.json(employee);
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ error: 'فشل في تحديث الموظف' });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const success = await storage.deleteEmployee(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الموظف غير موجود' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete employee error:', error);
      res.status(500).json({ error: 'فشل في حذف الموظف' });
    }
  });

  // ===== السلف =====
  app.get("/api/advances", async (req, res) => {
    try {
      const advances = await storage.getAllAdvances();
      res.json(advances);
    } catch (error) {
      console.error('Get advances error:', error);
      res.status(500).json({ error: 'فشل في جلب السلف' });
    }
  });

  app.post("/api/advances", async (req, res) => {
    try {
      const advance = await storage.createAdvance(req.body);
      res.json(advance);
    } catch (error) {
      console.error('Create advance error:', error);
      res.status(500).json({ error: 'فشل في إضافة السلفة' });
    }
  });

  app.patch("/api/advances/:id", async (req, res) => {
    try {
      const advance = await storage.updateAdvance(req.params.id, req.body);
      if (!advance) {
        return res.status(404).json({ error: 'السلفة غير موجودة' });
      }
      res.json(advance);
    } catch (error) {
      console.error('Update advance error:', error);
      res.status(500).json({ error: 'فشل في تحديث السلفة' });
    }
  });

  app.delete("/api/advances/:id", async (req, res) => {
    try {
      const success = await storage.deleteAdvance(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'السلفة غير موجودة' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete advance error:', error);
      res.status(500).json({ error: 'فشل في حذف السلفة' });
    }
  });

  // ===== المعلقة =====
  app.get("/api/suspended", async (req, res) => {
    try {
      const suspended = await storage.getAllSuspended();
      res.json(suspended);
    } catch (error) {
      console.error('Get suspended error:', error);
      res.status(500).json({ error: 'فشل في جلب المعلقة' });
    }
  });

  app.post("/api/suspended", async (req, res) => {
    try {
      const susp = await storage.createSuspended(req.body);
      res.json(susp);
    } catch (error) {
      console.error('Create suspended error:', error);
      res.status(500).json({ error: 'فشل في إضافة المعلقة' });
    }
  });

  app.patch("/api/suspended/:id", async (req, res) => {
    try {
      const susp = await storage.updateSuspended(req.params.id, req.body);
      if (!susp) {
        return res.status(404).json({ error: 'المعلقة غير موجودة' });
      }
      res.json(susp);
    } catch (error) {
      console.error('Update suspended error:', error);
      res.status(500).json({ error: 'فشل في تحديث المعلقة' });
    }
  });

  app.delete("/api/suspended/:id", async (req, res) => {
    try {
      const success = await storage.deleteSuspended(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'المعلقة غير موجودة' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete suspended error:', error);
      res.status(500).json({ error: 'فشل في حذف المعلقة' });
    }
  });

  // ===== الصرفيات المعلقة =====
  app.get("/api/pending-expenses", async (req, res) => {
    try {
      const pendingExpenses = await storage.getAllPendingExpenses();
      res.json(pendingExpenses);
    } catch (error) {
      console.error('Get pending expenses error:', error);
      res.status(500).json({ error: 'فشل في جلب الصرفيات المعلقة' });
    }
  });

  app.post("/api/pending-expenses", async (req, res) => {
    try {
      const pe = await storage.createPendingExpense(req.body);
      res.json(pe);
    } catch (error) {
      console.error('Create pending expense error:', error);
      res.status(500).json({ error: 'فشل في إضافة الصرفية المعلقة' });
    }
  });

  app.patch("/api/pending-expenses/:id", async (req, res) => {
    try {
      const pe = await storage.updatePendingExpense(req.params.id, req.body);
      if (!pe) {
        return res.status(404).json({ error: 'الصرفية المعلقة غير موجودة' });
      }
      res.json(pe);
    } catch (error) {
      console.error('Update pending expense error:', error);
      res.status(500).json({ error: 'فشل في تحديث الصرفية المعلقة' });
    }
  });

  app.delete("/api/pending-expenses/:id", async (req, res) => {
    try {
      const success = await storage.deletePendingExpense(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الصرفية المعلقة غير موجودة' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete pending expense error:', error);
      res.status(500).json({ error: 'فشل في حذف الصرفية المعلقة' });
    }
  });

  // ===== المواد المخزنية =====
  app.get("/api/inventory-items", async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      console.error('Get inventory items error:', error);
      res.status(500).json({ error: 'فشل في جلب المواد المخزنية' });
    }
  });

  app.post("/api/inventory-items", async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.json(item);
    } catch (error) {
      console.error('Create inventory item error:', error);
      res.status(500).json({ error: 'فشل في إضافة المادة المخزنية' });
    }
  });

  app.patch("/api/inventory-items/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: 'المادة المخزنية غير موجودة' });
      }
      res.json(item);
    } catch (error) {
      console.error('Update inventory item error:', error);
      res.status(500).json({ error: 'فشل في تحديث المادة المخزنية' });
    }
  });

  app.delete("/api/inventory-items/:id", async (req, res) => {
    try {
      const success = await storage.deleteInventoryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'المادة المخزنية غير موجودة' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete inventory item error:', error);
      res.status(500).json({ error: 'فشل في حذف المادة المخزنية' });
    }
  });

  // ===== الإدخال المخزني =====
  app.get("/api/inventory-entries", async (req, res) => {
    try {
      const entries = await storage.getAllInventoryEntries();
      res.json(entries);
    } catch (error) {
      console.error('Get inventory entries error:', error);
      res.status(500).json({ error: 'فشل في جلب الإدخال المخزني' });
    }
  });

  app.post("/api/inventory-entries", async (req, res) => {
    try {
      const entry = await storage.createInventoryEntry(req.body);
      res.json(entry);
    } catch (error) {
      console.error('Create inventory entry error:', error);
      res.status(500).json({ error: 'فشل في إضافة الإدخال المخزني' });
    }
  });

  app.patch("/api/inventory-entries/:id", async (req, res) => {
    try {
      const entry = await storage.updateInventoryEntry(req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ error: 'الإدخال المخزني غير موجود' });
      }
      res.json(entry);
    } catch (error) {
      console.error('Update inventory entry error:', error);
      res.status(500).json({ error: 'فشل في تحديث الإدخال المخزني' });
    }
  });

  app.delete("/api/inventory-entries/:id", async (req, res) => {
    try {
      const success = await storage.deleteInventoryEntry(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الإدخال المخزني غير موجود' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete inventory entry error:', error);
      res.status(500).json({ error: 'فشل في حذف الإدخال المخزني' });
    }
  });

  // ===== الاستخراج المخزني =====
  app.get("/api/inventory-withdrawals", async (req, res) => {
    try {
      const withdrawals = await storage.getAllInventoryWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error('Get inventory withdrawals error:', error);
      res.status(500).json({ error: 'فشل في جلب الاستخراج المخزني' });
    }
  });

  app.post("/api/inventory-withdrawals", async (req, res) => {
    try {
      const withdrawal = await storage.createInventoryWithdrawal(req.body);
      res.json(withdrawal);
    } catch (error) {
      console.error('Create inventory withdrawal error:', error);
      res.status(500).json({ error: 'فشل في إضافة الاستخراج المخزني' });
    }
  });

  app.patch("/api/inventory-withdrawals/:id", async (req, res) => {
    try {
      const withdrawal = await storage.updateInventoryWithdrawal(req.params.id, req.body);
      if (!withdrawal) {
        return res.status(404).json({ error: 'الاستخراج المخزني غير موجود' });
      }
      res.json(withdrawal);
    } catch (error) {
      console.error('Update inventory withdrawal error:', error);
      res.status(500).json({ error: 'فشل في تحديث الاستخراج المخزني' });
    }
  });

  app.delete("/api/inventory-withdrawals/:id", async (req, res) => {
    try {
      const success = await storage.deleteInventoryWithdrawal(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الاستخراج المخزني غير موجود' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete inventory withdrawal error:', error);
      res.status(500).json({ error: 'فشل في حذف الاستخراج المخزني' });
    }
  });

  // ===== الرواتب =====
  app.get("/api/payrolls", async (req, res) => {
    try {
      const payrolls = await storage.getAllPayrolls();
      res.json(payrolls);
    } catch (error) {
      console.error('Get payrolls error:', error);
      res.status(500).json({ error: 'فشل في جلب الرواتب' });
    }
  });

  app.post("/api/payrolls", async (req, res) => {
    try {
      const payroll = await storage.createPayroll(req.body);
      res.json(payroll);
    } catch (error) {
      console.error('Create payroll error:', error);
      res.status(500).json({ error: 'فشل في إضافة الراتب' });
    }
  });

  app.patch("/api/payrolls/:id", async (req, res) => {
    try {
      const payroll = await storage.updatePayroll(req.params.id, req.body);
      if (!payroll) {
        return res.status(404).json({ error: 'الراتب غير موجود' });
      }
      res.json(payroll);
    } catch (error) {
      console.error('Update payroll error:', error);
      res.status(500).json({ error: 'فشل في تحديث الراتب' });
    }
  });

  app.delete("/api/payrolls/:id", async (req, res) => {
    try {
      const success = await storage.deletePayroll(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'الراتب غير موجود' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete payroll error:', error);
      res.status(500).json({ error: 'فشل في حذف الراتب' });
    }
  });

  // ===== سجل النشاطات =====
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getAllActivityLogs();
      res.json(logs);
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ error: 'فشل في جلب سجل النشاطات' });
    }
  });

  app.post("/api/activity-logs", async (req, res) => {
    try {
      const log = await storage.createActivityLog(req.body);
      res.json(log);
    } catch (error) {
      console.error('Create activity log error:', error);
      res.status(500).json({ error: 'فشل في إضافة سجل النشاط' });
    }
  });

  // ===== الإعدادات =====
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'فشل في جلب الإعدادات' });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'فشل في تحديث الإعدادات' });
    }
  });

  const httpServer = createServer(app);
  attachRealtime(httpServer);

  return httpServer;
}
