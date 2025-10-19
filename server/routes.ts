import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Chatbot Support Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'رسالة غير صالحة' });
      }

      // System prompt for Iraqi Accounting System
      const systemPrompt = `أنت مساعد ذكي لنظام المحاسبة العراقي. مهمتك هي مساعدة المستخدمين في فهم واستخدام النظام.

النظام يحتوي على الأقسام التالية:
1. **الرئيسية (Dashboard)**: عرض الإحصائيات المالية، الإيرادات، المصروفات، والرسوم البيانية
2. **الإيرادات**: إضافة وتعديل وحذف الإيرادات مع تصنيفها حسب الفئات
3. **المصروفات**: تسجيل المصروفات مع تفاصيل الموردين والمندوبين
4. **الموظفين**: إدارة بيانات الموظفين وأعياد الميلاد
5. **السلف**: إدارة السلف المالية للموظفين (شخصية، طارئة، علاجية، عائلية، أخرى)
6. **المبالغ المعلقة**: تتبع المدفوعات المعلقة والديون
7. **الإدخال المخزني**: إدخال فواتير المشتريات مع autocomplete ذكي
8. **المخزون**: إدارة المواد والباركود والمشتريات
9. **الرواتب**: إدارة رواتب الموظفين مع المكافآت والخصومات
10. **الإعدادات**: إدارة الفئات والأقسام والموردين

المميزات الرئيسية:
- الوضع الداكن/الفاتح
- قائمة جانبية قابلة للطي
- طباعة السندات والكشوفات
- تصدير البيانات إلى CSV
- بحث متقدم يدعم الأرقام العربية

قدم إجابات واضحة ومختصرة بالعربية. ساعد المستخدمين في:
- فهم كيفية استخدام كل قسم
- كيفية إضافة/تعديل/حذف البيانات
- استخدام المميزات المتقدمة
- حل المشاكل الشائعة`;

      // Build conversation messages
      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: messages,
        max_completion_tokens: 8192,
      });

      const reply = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من فهم سؤالك.';

      res.json({ 
        reply,
        conversationHistory: [
          ...conversationHistory,
          { role: "user", content: message },
          { role: "assistant", content: reply }
        ]
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({ error: 'حدث خطأ في المساعد الذكي' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
