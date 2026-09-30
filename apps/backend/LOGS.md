# Interviewlyy Backend — Logging Cheat Sheet

This project uses **Pino** for structured JSON logging.

---

## 🚀 Daily Commands

### 1. Local Development (Formatted Logs)
Run the server with single-line, colorized, readable output:
```bash
bun run dev:pretty
```

### 2. View Production Logs Live (PM2)
```bash
bun run logs
```

### 3. View Production Errors Only (PM2)
```bash
bun run logs:err
```

---

## 🔍 How to Debug a Bug (Step-by-Step)

### Step 1: Find recent errors
```bash
bun run logs:err
```
*Look at the output to copy the `interviewId` or `userId` associated with the error.*

### Step 2: Trace the entire interview session
Search for all logs related to that specific interview:
```bash
grep '"interviewId":"<PASTE_INTERVIEW_ID_HERE>"' ~/.pm2/logs/interviewlyy-out.log | bunx pino-pretty
```

---

## ⚙️ Log Level Control

Change the `LOG_LEVEL` environment variable in `apps/backend/.env`:

```env
# Options: fatal, error, warn, info, debug, trace
LOG_LEVEL=info
```

- **`info`** (Default): Recommended for dev & production.
- **`warn`**: Quiet mode (only logs warnings & errors).
- **`debug`**: Verbose output for deep troubleshooting.

---

## 📊 Numeric Log Levels Reference

| Level | Name | Description |
| :---: | :--- | :--- |
| **10** | `TRACE` | Verbose low-level tracing |
| **20** | `DEBUG` | Fine-grained debugging |
| **30** | `INFO` | Standard informational logs |
| **40** | `WARN` | Non-fatal warnings |
| **50** | `ERROR` | Operation errors / exceptions |
| **60** | `FATAL` | Application crashes |
