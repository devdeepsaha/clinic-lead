// api/summaries.js
// Stores call summaries keyed by lead ID.
// Structure in KV: { [leadId]: { text, ts, leadName, category } }

import { kv } from "@vercel/kv";

const KEY = "leadflow:summaries";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: fetch all summaries (or a single one via ?id=xxx) ───────────────
  if (req.method === "GET") {
    try {
      const all = (await kv.get(KEY)) || {};
      const { id } = req.query;
      if (id) return res.status(200).json(all[id] || null);
      return res.status(200).json(all);
    } catch (err) {
      console.error("Summaries GET error:", err);
      return res.status(500).json({ error: "Failed to load summaries" });
    }
  }

  // ── POST: save / update a summary for a lead ────────────────────────────
  // Body: { auth, leadId, leadName, category, text }
  if (req.method === "POST") {
    try {
      const body = req.body;

      if (body.auth !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { leadId, leadName, category, text } = body;
      if (!leadId || typeof text !== "string") {
        return res.status(400).json({ error: "leadId and text are required" });
      }

      const all = (await kv.get(KEY)) || {};

      if (text.trim() === "") {
        // Empty text = delete the summary for this lead
        delete all[leadId];
      } else {
        all[leadId] = {
          text: text.trim(),
          leadName: leadName || "",
          category: category || "",
          ts: Date.now(),
        };
      }

      await kv.set(KEY, all);
      return res.status(200).json({ ok: true, total: Object.keys(all).length });
    } catch (err) {
      console.error("Summaries POST error:", err);
      return res.status(500).json({ error: "Failed to save summary" });
    }
  }

  // ── DELETE: wipe all summaries ───────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const body = req.body || {};
      if (body.auth !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await kv.del(KEY);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete summaries" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}