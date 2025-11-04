// تحميل ملف البيئة (.env) حتى يتمكن النظام من قراءة DATABASE_URL
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import os from "os";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // استخدم Vite في وضع التطوير فقط
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const findLanAddress = () => {
    if (process.env.HOST && process.env.HOST !== "127.0.0.1") {
      return process.env.HOST;
    }

    const interfaces = os.networkInterfaces();
    for (const value of Object.values(interfaces)) {
      if (!value) continue;
      for (const iface of value) {
        if (iface && iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
    return "127.0.0.1";
  };

  // تشغيل السيرفر على المنفذ المحدد في البيئة أو الافتراضي 5000
  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      const lanAddress = findLanAddress();
      log(`✅ Connected to database and serving locally on http://127.0.0.1:${port}`);
      if (lanAddress && lanAddress !== "127.0.0.1") {
        log(`🌍 يمكنك الدخول من الأجهزة الأخرى عبر: http://${lanAddress}:${port}`);
      } else {
        log("🌍 يمكنك الدخول من الأجهزة الأخرى عبر: http://<ip>:5000");
      }
    }
  );
})();
