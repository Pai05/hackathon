import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { initDb, getDb } from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const OTP_TTL_MS = 5 * 60 * 1000;
const VERIFIED_TTL_MS = 10 * 60 * 1000;

await initDb();

function otpKey(email, purpose) {
  return `${String(email || "").trim().toLowerCase()}::${purpose}`;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function validatePurpose(purpose) {
  return purpose === "register" || purpose === "login";
}

async function cleanupExpired(db) {
  const now = Date.now();
  await db.run('DELETE FROM otps WHERE expiresAt <= ?', [now]);
}

async function sendOtpEmail(email, otp, purpose) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass || !from) {
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const label = purpose === "register" ? "registration" : "login";

  await transporter.sendMail({
    from,
    to: email,
    subject: `ResearchHub ${label} OTP`,
    text: `Your ResearchHub OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your <strong>ResearchHub</strong> OTP is:</p><h2 style="letter-spacing:2px">${otp}</h2><p>This code expires in 5 minutes.</p>`,
  });

  return { sent: true };
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "glow-research-backend",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const db = await getDb();
    await cleanupExpired(db);

    const email = String(req.body?.email || "").trim().toLowerCase();
    const purpose = String(req.body?.purpose || "").trim();

    if (!email || !validatePurpose(purpose)) {
      return res.status(400).json({ error: "Invalid email or purpose" });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (purpose === "login" && !existingUser) {
      return res.status(404).json({ error: "No account found for this email" });
    }

    if (purpose === "register" && existingUser) {
      return res.status(409).json({ error: "Account already exists for this email" });
    }

    const otp = generateOtp();
    const key = otpKey(email, purpose);
    const expiresAt = Date.now() + OTP_TTL_MS;

    await db.run(`
      INSERT INTO otps (key, otp, expiresAt, isVerified) 
      VALUES (?, ?, ?, 0) 
      ON CONFLICT(key) DO UPDATE SET 
      otp=excluded.otp, expiresAt=excluded.expiresAt, isVerified=0
    `, [key, otp, expiresAt]);

    const mailResult = await sendOtpEmail(email, otp, purpose);

    if (!mailResult.sent) {
      console.log(`[DEV OTP] ${purpose} ${email}: ${otp}`);
      return res.json({
        ok: true,
        message: "OTP generated. SMTP not configured; using dev OTP mode.",
        dev_otp: otp,
      });
    }

    return res.json({
      ok: true,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const db = await getDb();
    await cleanupExpired(db);

    const email = String(req.body?.email || "").trim().toLowerCase();
    const purpose = String(req.body?.purpose || "").trim();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp || !validatePurpose(purpose)) {
      return res.status(400).json({ error: "Invalid verification payload" });
    }

    const key = otpKey(email, purpose);
    const pending = await db.get('SELECT * FROM otps WHERE key = ? AND isVerified = 0', [key]);

    if (!pending) {
      return res.status(400).json({ error: "OTP expired or not requested" });
    }

    if (pending.otp !== otp) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    const expiresAt = Date.now() + VERIFIED_TTL_MS;
    await db.run('UPDATE otps SET isVerified = 1, expiresAt = ? WHERE key = ?', [expiresAt, key]);

    return res.json({ ok: true, message: "OTP verified" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

async function consumeVerifiedOtp(db, email, purpose) {
  await cleanupExpired(db);
  const key = otpKey(email, purpose);
  const verified = await db.get('SELECT * FROM otps WHERE key = ? AND isVerified = 1', [key]);
  if (!verified) return false;
  await db.run('DELETE FROM otps WHERE key = ?', [key]);
  return true;
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const db = await getDb();
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: "Account already exists" });
    }

    const id = crypto.randomUUID();
    await db.run('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, password]);

    return res.json({ ok: true, user: { id, name, email } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to register" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const db = await getDb();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const stored = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!stored || stored.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({ ok: true, user: { id: stored.id, name: stored.name, email: stored.email } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// History Routes
app.get("/api/history", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const db = await getDb();
    const historyRows = await db.all('SELECT * FROM research_history WHERE userId = ? ORDER BY viewedAt DESC LIMIT 12', [userId]);
    const history = historyRows.map(row => ({
      id: row.id,
      query: row.query,
      viewedAt: row.viewedAt,
      result: JSON.parse(row.resultData)
    }));
    return res.json({ ok: true, history });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/history", async (req, res) => {
  const userId = String(req.body?.userId || "");
  const query = String(req.body?.query || "");
  const resultData = req.body?.result;

  if (!userId || !query || !resultData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    const viewedAt = new Date().toISOString();
    
    // Upsert equivalent based on query might be needed later, for now we just insert
    await db.run('INSERT INTO research_history (id, userId, query, resultData, viewedAt) VALUES (?, ?, ?, ?, ?)', [
      id, userId, query, JSON.stringify(resultData), viewedAt
    ]);

    // Keep only top 12
    const all = await db.all('SELECT id FROM research_history WHERE userId = ? ORDER BY viewedAt DESC', [userId]);
    if (all.length > 12) {
      const toDelete = all.slice(12).map(r => r.id);
      await db.run(`DELETE FROM research_history WHERE id IN (${toDelete.map(() => '?').join(',')})`, toDelete);
    }

    return res.json({ ok: true, id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save history" });
  }
});

import { startResearchJob, getJobStatus, synthesizeJob, chatWithAgent, getSuggestions, extractKeywordsFromPaper } from './agent.js';

// --- Research Agent APIs Below ---
app.get("/api/research/suggestions", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) return res.json({ suggestions: [] });
  try {
    const result = await getSuggestions(query);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/research/keywords", async (req, res) => {
  const { title, abstract, key_findings } = req.body || {};
  if (!title) return res.status(400).json({ error: "Missing title" });
  try {
    const result = await extractKeywordsFromPaper({ title, abstract, key_findings });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/research/start", async (req, res) => {
  const query = String(req.body?.query || "");
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const result = await startResearchJob(query);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/research/status/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const status = getJobStatus(jobId);
  return res.json(status);
});

app.post("/api/research/synthesize/:jobId", async (req, res) => {
  const jobId = req.params.jobId;
  try {
    const result = await synthesizeJob(jobId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/research/chat/:jobId", async (req, res) => {
  const jobId = req.params.jobId;
  const history = req.body?.history || [];
  const message = req.body?.message || "";
  
  if (!message) return res.status(400).json({ error: "Missing message" });
  
  try {
    const result = await chatWithAgent(jobId, history, message);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
