import { auth } from "@/lib/admin-auth";
import { bad } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { deleteMedia, mediaUsageCount } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await auth("content");
  if (a.deny) return a.deny;
  const id = Number((await params).id);
  if (await mediaUsageCount(`/api/media/${id}`)) return bad("الصورة مستخدمة حاليًا في المتجر ولا يمكن حذفها");
  await deleteMedia(id);
  await logAudit({ user: a.user, action: "delete", entity: "media", entityId: id, summary: `حذف صورة #${id} من مكتبة الصور` });
  return Response.json({ ok: true });
}
