import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos } from "@/lib/constants";
import { ListingForm } from "@/components/listing-form";
import { PageTitle } from "@/components/ui";
export default async function Publish({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await searchParams;
  const item = id ? await db.listing.findUnique({ where: { id } }) : null;
  if (id && (!item || item.userId !== user.id || !["AVAILABLE", "ARCHIVED"].includes(item.status)))
    notFound();
  return (
    <div className="container narrow page">
      <PageTitle
        eyebrow={id ? "TU PUBLICACIÓN" : "NUEVA PUBLICACIÓN"}
        title={id ? "Editar material" : "Publicar material"}
        description="Comparte aquello que ya no usas con la comunidad PUCP."
      />
      <ListingForm
        initial={item ? { ...item, images: photos(item.images) } : { faculty: user.faculty }}
      />
    </div>
  );
}
