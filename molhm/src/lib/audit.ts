import { adminClient } from "./supabase/admin";
export async function audit(actorId: string | null, action: string, entity: string, entityId?: string, detail?: unknown) {
  try { await adminClient().from("audit_logs").insert({ actor_id: actorId, action, entity, entity_id: entityId, detail: detail ?? null }); }
  catch (e) { console.error("audit failed", e); }
}
