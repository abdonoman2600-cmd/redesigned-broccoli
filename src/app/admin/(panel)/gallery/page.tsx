import { getGallery } from "@/lib/data";
import GalleryManager from "@/components/admin/GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGallery() {
  const items = await getGallery({ includeHidden: true });
  return (
    <div>
      <h1 className="text-4xl font-bold">معرض الأعمال</h1>
      <p className="mb-8 mt-2 text-muted">انشر صور أعمالك، غيّر عناوينها، رتّبها، أخفِها أو احذفها. كل تعديل يُحفظ تلقائيًا.</p>
      <GalleryManager initial={items} />
    </div>
  );
}
