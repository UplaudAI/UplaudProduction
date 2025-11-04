export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const USERS = process.env.AIRTABLE_USERS_TABLE;
    const REVIEWS = process.env.AIRTABLE_REVIEWS_TABLE;
    const headers = { Authorization: `Bearer ${API_KEY}` };
    const slugify = s => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"");
    const last3 = s => (String(s||"").replace(/\D/g,"").slice(-3)||"000").padStart(3,"0");

    const idParam = String(id||"").trim();
    const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
    const targetBase = m ? m[1] : idParam;
    const targetSuffix = m && m[2] ? m[2] : null;

    let found=null, offset;
    while (!found) {
      const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${USERS}`);
      url.searchParams.set("pageSize","100");
      if (offset) url.searchParams.set("offset", offset);
      const r = await fetch(url, { headers }); const j = await r.json();

      const candidates = (j.records||[]).filter(rec => {
        const name = rec.fields?.Name || "";
        return slugify(name) === targetBase || slugify(name) === idParam;
      });

      for (const rec of candidates) {
        const f = rec.fields||{};
        let phone = f.Phone || "";
        if (!phone) {
          const rv = new URL(`https://api.airtable.com/v0/${BASE_ID}/${REVIEWS}`);
          rv.searchParams.set("pageSize","1");
          rv.searchParams.set("filterByFormula", `{Name_Creator}="${f.Name}"`);
          const rr = await fetch(rv, { headers }); const jr = await rr.json();
          const r0 = jr.records?.[0];
          phone = r0?.fields?.ReviewerPhoneNumber || r0?.fields?.Phone || "";
        }
        const l3 = last3(phone);
        const baseSlug = slugify(f.Name||"user");
        const canonical = `${baseSlug}-${l3}`;
        const ok = targetSuffix ? canonical===idParam : baseSlug===targetBase;
        if (ok) {
          // Normalize expert field and return boolean flag isExpert
          const expertRaw = f.Expert ?? "";
          const isExpert = String(expertRaw || "").trim().toLowerCase() === "yes";

          found = {
            id: String(f.ID ?? ""),
            airtableId: rec.id,
            name: f.Name || "",
            phone, image: Array.isArray(f.image)? f.image[0]?.url : f.image,
            autogenInvite: f["Autogen Invite"] ?? "",
            bio: f["Bio"] ?? "", location: f["Location"] ?? "", gender: f["Gender"] || "Male",
            handle: baseSlug, canonicalSlug: canonical,
            // NEW — expose expert info to client
            expert: expertRaw,
            isExpert
          };
          break;
        }
      }
      offset = j.offset; if (!offset) break;
    }
    res.status(200).json({ user: found });
  } catch (e) { res.status(500).json({ error: "server error" }); }
}