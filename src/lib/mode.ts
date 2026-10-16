import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { can, getUser, type AuthUser } from "./admin-auth";

export type Mode = "edit" | "preview" | "live";

export const PREVIEW_COOKIE = "rashid_preview";
export const MODE_COOKIE = "rashid_mode";

export async function getPreviewToken() {
  const [row] = await db.select().from(settings).where(eq(settings.key, "previewToken"));
  return row?.value ?? null;
}

export type View = {
  user: AuthUser | null;
  /** edit = owner/staff editing (drafts visible, tools shown); preview = drafts visible read-only; live = published only */
  mode: Mode;
  showDrafts: boolean;
  /** true when the viewer arrived through the shareable preview link (no account) */
  viewerPreview: boolean;
  canEdit: boolean;
};

export const getView = cache(async (): Promise<View> => {
  const user = await getUser();
  const jar = await cookies();
  const isEditor = !!user && !user.mustChangePassword && (can(user, "content") || can(user, "products"));

  if (isEditor) {
    const m = jar.get(MODE_COOKIE)?.value;
    const mode: Mode = m === "live" || m === "preview" || m === "edit" ? m : "edit";
    return { user, mode, showDrafts: mode !== "live", viewerPreview: false, canEdit: mode === "edit" };
  }

  const tok = jar.get(PREVIEW_COOKIE)?.value;
  if (tok) {
    const current = await getPreviewToken();
    if (current && tok === current) {
      return { user: null, mode: "preview", showDrafts: true, viewerPreview: true, canEdit: false };
    }
  }
  return { user: null, mode: "live", showDrafts: false, viewerPreview: false, canEdit: false };
});
