
import { kv } from "@vercel/kv";

const KEY = "leadflow:leads";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: return stored leads ──────────────────────────
  if (req.method === "GET") {
    try {
      const leads = await kv.get(KEY);
      // null means KV is empty → client should use embedded fallback
      return res.status(200).json(leads || null);
    } catch (err) {
      console.error("KV GET leads error:", err);
      return res.status(500).json({ error: "Failed to load leads" });
    }
  }

  // ── POST: merge incoming leads with existing, save ────
  if (req.method === "POST") {
    try {
      const incoming = req.body;
      if (!Array.isArray(incoming)) {
        return res.status(400).json({ error: "Expected an array of lead objects" });
      }

      // Load existing leads from KV
      let existing = await kv.get(KEY);
      if (!Array.isArray(existing)) existing = [];

      // Build lookup of existing leads by Place ID (most stable unique key)
      const existingById = new Map(existing.map(l => [l.id, l]));

      // Deduplicate incoming by name+phone (same as our CSV processing logic)
      const seen = new Map(); // "name|phone" → lead
      for (const lead of incoming) {
        const key = `${(lead.name || "").trim().toLowerCase()}|${(lead.phone || "").trim()}`;
        if (!seen.has(key)) {
          seen.set(key, lead);
        } else {
          // Keep the one with more reviews
          const prev = seen.get(key);
          if ((lead.reviews || 0) > (prev.reviews || 0)) seen.set(key, lead);
        }
      }
      const deduped = Array.from(seen.values());

      // Merge: new leads that don't exist yet get added
      // Existing leads are untouched (preserves any manual edits)
      let added = 0;
      for (const lead of deduped) {
        if (!existingById.has(lead.id)) {
          existingById.set(lead.id, lead);
          added++;
        }
      }

      const merged = Array.from(existingById.values());
      await kv.set(KEY, merged);

      return res.status(200).json({
        ok: true,
        total: merged.length,
        added,
        skipped: deduped.length - added,
      });
    } catch (err) {
      console.error("KV SET leads error:", err);
      return res.status(500).json({ error: "Failed to save leads" });
    }
  }

  // ── DELETE: wipe all leads (nuclear option) ───────────
  if (req.method === "DELETE") {
    try {
      await kv.del(KEY);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete leads" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}