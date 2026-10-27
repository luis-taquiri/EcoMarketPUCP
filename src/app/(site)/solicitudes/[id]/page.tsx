import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TradeRoom } from "@/components/trade-room";
export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const trade = await db.trade.findFirst({
    where: { id, OR: [{ requesterId: user.id }, { receiverId: user.id }] },
    include: {
      target: true,
      offered: true,
      requester: { select: { name: true } },
      receiver: { select: { name: true } },
      messages: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      reviews: { select: { authorId: true, rating: true, comment: true } },
    },
  });
  if (!trade) notFound();
  return (
    <div className="container page">
      <Link href="/solicitudes" className="back-link">
        <ArrowLeft size={17} />
        Mis Solicitudes
      </Link>
      <TradeRoom trade={trade} userId={user.id} />
    </div>
  );
}
