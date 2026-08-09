# 🐉 KALI NEXUS — Real Kali Linux Web Platform

تطبيق Kali Linux حقيقي 100% — طرفية PTY فعلية + أدوات اختراق حقيقية + جاهز للنشر على Render.

## ✨ المميزات الجديدة (v1.0)

### ✅ حقيقي 100%
- **PTY Shell حقيقي** عبر `node-pty` — `vim`, `top`, `nano`, `htop` كلها تعمل
- **Metasploit حقيقي** — `msfconsole` كامل عبر WebSocket
- **Wireshark حقيقي** — التقاط حزم شبكة فعلية عبر `tshark`
- **Nmap حقيقي** — فحص شبكي فعلي
- **نظام ملفات حقيقي** — قراءة/كتابة فعلية على السيرفر

### 🛡️ أمان معزز
- فلتر أوامر شامل (regex patterns) يحجب `rm -rf /*`, `mkfs`, fork bombs, `dd to /dev/`, إلخ
- `helmet` للheaders الأمنية
- `express-rate-limit` — 200 طلب/دقيقة لكل IP
- CORS محدود
- مهلة 30 ثانية لكل أمر

### 🎨 واجهة محسّنة
- Scene3D مُدمج كخلفية اختيارية في Lock Screen (زر `◉ 3D`)
- توقيت حقيقي حسب المنطقة الزمنية للمستخدم
- مؤشرات Live/Demo واضحة لكل أداة
- WebSocket reconnect ذكي مع مهلة 8 ثوانٍ (يتعامل مع Render cold start)

## 🚀 النشر على Render

### الطريقة السريعة (5 دقائق)
1. ارفع المشروع إلى GitHub
2. ادخل https://render.com → New + → Web Service → اختر الـ repo
3. سيقرأ `render.yaml` تلقائياً:
   - Runtime: Docker
   - Health check: `/health`
   - Port: 10000
4. اضغط Create Web Service → انتظر 5-10 دقائق (تثبيت metasploit-framework)
5. افتح الرابط — سيعمل كل شيء حقيقي!

### ما الذي يثبته Dockerfile:
- `nmap` — scanner
- `metasploit-framework` — `msfconsole` حقيقي
- `tshark` — التقاط الحزم (wireshark CLI)
- `tcpdump`, `python3`, `curl`, `net-tools`, `dnsutils`, `whois`, `git`

## 💻 التشغيل المحلي

```bash
npm install
# Terminal 1: backend + frontend معاً
npm run dev

# أو منفصلين:
npm run dev:server   # backend على :3001
npm run dev:web      # frontend على :5173
```

ثم افتح http://localhost:5173

> **ملاحظة:** node-pty يحتاج build tools. على Linux: `sudo apt install build-essential python3-dev`. على macOS: `xcode-select --install`. على Windows: `npm install --global windows-build-tools`.

## 📱 PWA — تحويله لتطبيق جوال

بعد النشر، افتح الرابط على جوالك:
- **Android (Chrome):** ⋮ → تثبيت التطبيق
- **iPhone (Safari):** زر المشاركة → إضافة إلى الشاشة الرئيسية

## 📂 الملفات المهمة

| الملف | الوصف |
|---|---|
| `server/index.js` | Backend: API + 3 WebSocket endpoints (/terminal, /metasploit, /wireshark) |
| `Dockerfile` | تثبيت كل أدوات Kali + node-pty build deps |
| `render.yaml` | إعدادات Render Docker service |
| `src/lib/api.ts` | API client + WS factories + demo fallback |
| `src/components/kali/apps/RealTerminal.tsx` | PTY terminal with resize support |
| `src/components/kali/apps/MetasploitApp.tsx` | Real msfconsole over WebSocket |
| `src/components/kali/apps/WiresharkApp.tsx` | Real tshark capture |

## 🔒 الأمان

- الأوامر الخطرة محجوبة: `rm -rf /`, `mkfs`, `dd if=*of=/dev/`, fork bombs, `> /dev/sd*`, `shutdown`, `reboot`, `curl | sh`, إلخ
- لا توجد مصادقة (demo公开) — أضف auth token قبل الإنتاج
- كل أمر له مهلة 30 ثانية
- rate limit 200/min/IP

## ⚠️ ملاحظات

- **Render Free Tier:** الخادم ينام بعد 15 دقيقة ويستيقظ في ~30 ثانية
- **tshark قد يحتاج CAP_NET_RAW** — في Render أضف `capAdd: NET_RAW` للحاوية
- **Metasploit بارد:** أول تشغيل يأخذ 20-30 ثانية (يحمّل قاعدة البيانات)

## 🎯 أدوات تعمل حقيقي 100%

| الأداة | الحالة | كيف |
|---|---|---|
| Real Shell | ✅ PTY حقيقي | node-pty + WebSocket |
| Terminal | ✅ أوامر حقيقية | exec() |
| Files | ✅ FS حقيقي | fs.promises |
| Nmap | ✅ حقيقي | nmap binary |
| Metasploit | ✅ حقيقي | msfconsole via WS |
| Wireshark | ✅ حقيقي | tshark via WS |
| Burp Suite | ⚠️ UI demo | استخدم mitmproxy في Shell |
| Settings | ✅ local state | React state |

## 📜 الترخيص

MIT — استخدم بمسؤولية. اختبر فقط على أنظمة تملكها أو لديك إذن عليها.
