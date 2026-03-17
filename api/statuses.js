import { kv } from "@vercel/kv";

const STATUS_KEY   = "leadflow:statuses";
const OUTREACH_KEY = "leadflow:outreach";
const DAILY_KEY    = "leadflow:daily";
const HISTORY_KEY  = "leadflow:daily_history";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Added Authorization to headers
  
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: Publicly accessible ──────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const [statuses, outreach, daily, history] = await Promise.all([
        kv.get(STATUS_KEY),
        kv.get(OUTREACH_KEY),
        kv.get(DAILY_KEY),
        kv.get(HISTORY_KEY),
      ]);
      return res.status(200).json({
        statuses: statuses || {},
        outreach: outreach || [],
        daily:    daily    || null,
        history:  history  || {},
      });
    } catch (err) {
      console.error("KV GET error:", err);
      return res.status(500).json({ error: "Failed to load data" });
    }
  }

  // ── POST: Admin Lock Protected ────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = req.body;
      
      // RECENTLY CHANGED: Check for ADMIN_PASSWORD from Vercel Environment Variables
      // We check the 'auth' field inside the body sent by LeadDashboard.jsx
      if (body.auth !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized: Invalid Admin Key" });
      }

      if (typeof body !== "object" || Array.isArray(body))
        return res.status(400).json({ error: "Expected a JSON object" });

      const ops = [];

      // Update Lead Statuses
      if (body.statuses !== undefined) {
        if (typeof body.statuses !== "object" || Array.isArray(body.statuses))
          return res.status(400).json({ error: "statuses must be an object" });
        ops.push(kv.set(STATUS_KEY, body.statuses));
      }

      // Update Outreach Log
      if (body.outreach !== undefined) {
        if (!Array.isArray(body.outreach))
          return res.status(400).json({ error: "outreach must be an array" });
        ops.push(kv.set(OUTREACH_KEY, body.outreach.slice(0, 500)));
      }

      // Update Daily Stats
      if (body.daily !== undefined) {
        if (typeof body.daily !== "object" || Array.isArray(body.daily))
          return res.status(400).json({ error: "daily must be an object" });

        const incoming     = body.daily;
        const incomingDate = incoming.date;
        const existing     = await kv.get(DAILY_KEY);

        let toSave;
        if (existing && existing.date === incomingDate) {
          // RECENTLY CHANGED: Updated the counters to use message, call, skip, and dismissed
          toSave = {
            date: incomingDate,
            counts: {
              message:   Math.max(existing.counts?.message   || 0, incoming.counts?.message   || 0),
              call:      Math.max(existing.counts?.call      || 0, incoming.counts?.call      || 0),
              skip:      Math.max(existing.counts?.skip      || 0, incoming.counts?.skip      || 0),
              dismissed: Math.max(existing.counts?.dismissed || 0, incoming.counts?.dismissed || 0),
            },
            goal: incoming.goal || existing.goal || 10,
          };
        } else {
          // RECENTLY CHANGED: Updated default empty counters state
          toSave = {
            date:   incomingDate,
            counts: incoming.counts || { message: 0, call: 0, skip: 0, dismissed: 0 },
            goal:   incoming.goal   || (existing ? existing.goal : 10),
          };
        }
        ops.push(kv.set(DAILY_KEY, toSave));

        // Merge today into history
        const existingHistory = await kv.get(HISTORY_KEY) || {};
        // RECENTLY CHANGED: Updated fallback object for history
        const prevDay = existingHistory[incomingDate] || { message: 0, call: 0, skip: 0, dismissed: 0 };
        existingHistory[incomingDate] = {
          message:   Math.max(prevDay.message   || 0, toSave.counts.message   || 0),
          call:      Math.max(prevDay.call      || 0, toSave.counts.call      || 0),
          skip:      Math.max(prevDay.skip      || 0, toSave.counts.skip      || 0),
          dismissed: Math.max(prevDay.dismissed || 0, toSave.counts.dismissed || 0),
        };
        ops.push(kv.set(HISTORY_KEY, existingHistory));
      }

      // Patch History directly (for deletions/edits)
      if (body.history !== undefined) {
        if (typeof body.history !== "object" || Array.isArray(body.history))
          return res.status(400).json({ error: "history must be an object" });
        
        const existingHistory = await kv.get(HISTORY_KEY) || {};
        const merged = { ...existingHistory };
        for (const [date, counts] of Object.entries(body.history)) {
          // RECENTLY CHANGED: Apply the new status counters to the history direct patch payload
          const prev = merged[date] || { message: 0, call: 0, skip: 0, dismissed: 0 };
          merged[date] = {
            message:   Math.max(prev.message   || 0, counts.message   || 0),
            call:      Math.max(prev.call      || 0, counts.call      || 0),
            skip:      Math.max(prev.skip      || 0, counts.skip      || 0),
            dismissed: Math.max(prev.dismissed || 0, counts.dismissed || 0),
          };
        }
        ops.push(kv.set(HISTORY_KEY, merged));
      }

      await Promise.all(ops);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("KV SET error:", err);
      return res.status(500).json({ error: "Failed to save data" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}