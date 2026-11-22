import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { getChurchesByIds } from "@/server/churches/queries";
import { qrPath } from "@/lib/qr";
import { siteUrl } from "@/lib/site";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cartel de invitación" };

/** Cartel A4 para imprimir o proyectar en el culto. */
export default async function PrintPoster({ searchParams }: { searchParams: Promise<{ church?: string }> }) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);
  const { church } = await searchParams;
  const churches = await getChurchesByIds(ids);
  const c = churches.find((x) => x.id === church) ?? churches[0];
  if (!c) notFound();
  const link = `${siteUrl()}/i/${c.slug}`;
  const qr = qrPath(link);
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white text-[#1b2a2f] print:static">
      <div className="mx-auto flex min-h-full max-w-[210mm] flex-col items-center justify-center gap-8 px-10 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#26604f]">Camino de Fe</p>
        <h1 className="font-serif text-5xl font-semibold leading-tight">{c.name}</h1>
        <p className="max-w-md text-xl">Leamos la Biblia juntos durante la semana y mantenete al tanto de lo que hacemos.</p>
        <svg viewBox={`0 0 ${qr.size + 8} ${qr.size + 8}`} className="h-[90mm] w-[90mm]" shapeRendering="crispEdges" role="img" aria-label="Código QR">
          <rect width={qr.size + 8} height={qr.size + 8} fill="#fff" />
          <path transform="translate(4 4)" fill="#1b2a2f" d={qr.path} />
        </svg>
        <ol className="flex flex-col gap-1 text-lg">
          <li>1. Escaneá el código con la cámara</li>
          <li>2. Tocá «Soy parte de esta iglesia»</li>
          <li>3. Empezá el plan «Esperanza en 7 días»</li>
        </ol>
        <p className="font-mono text-sm text-[#55656b]">{link.replace(/^https?:\/\//, "")}</p>
        <PrintButton />
      </div>
    </div>
  );
}
