import type { Metadata } from "next";
import { getActor } from "@/server/authz/session";
import { managedChurchIds } from "@/server/churches/access";
import { getChurchesByIds } from "@/server/churches/queries";
import { qrPath } from "@/lib/qr";
import { siteUrl } from "@/lib/site";
import { PageHeader, EmptyState, Card, SectionTitle, ButtonLink, Notice } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { IconDownload } from "@/components/icons";
import { ChurchPicker } from "../church-picker";
import { CopyLink } from "./copy-link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitar · Panel pastoral" };

const STEPS = [
  "Proyectá o imprimí el QR el domingo y contá en 1 minuto qué es Camino de Fe.",
  "Pedí que toquen «Soy parte de esta iglesia» y aprobalos en Miembros.",
  "Invitá a todos a empezar juntos el plan «Esperanza en 7 días».",
  "Compartí el enlace en el grupo de WhatsApp de la iglesia.",
];

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ church?: string }> }) {
  const actor = await getActor();
  const ids = managedChurchIds(actor);
  if (ids.length === 0) return <EmptyState title="Acceso restringido">Solo pastores y líderes verificados.</EmptyState>;
  const churches = await getChurchesByIds(ids);
  const { church } = await searchParams;
  const selected = churches.find((c) => c.id === church) ?? churches[0]!;
  const link = `${siteUrl()}/i/${selected.slug}`;
  const qr = qrPath(link);

  return (
    <>
      <ChurchPicker churches={churches} selectedId={selected.id} basePath="/pastoral/invitar" />
      <PageHeader
        eyebrow={selected.name}
        title="Invitá a tu congregación"
        description="Cada iglesia es una puerta: tu comunidad se suma con un toque y cada miembro puede invitar a otros."
      />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="flex flex-col items-center gap-4">
          <svg
            viewBox={`0 0 ${qr.size + 8} ${qr.size + 8}`}
            className="h-56 w-56 rounded-2xl"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`Código QR de invitación a ${selected.name}`}
          >
            <rect width={qr.size + 8} height={qr.size + 8} fill="#ffffff" />
            <path transform="translate(4 4)" fill="#1b2a2f" d={qr.path} />
          </svg>
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href={`/api/qr?iglesia=${selected.slug}`} variant="secondary">
              <IconDownload className="h-4 w-4" /> Descargar QR
            </ButtonLink>
            <ButtonLink href={`/pastoral/invitar/imprimir?church=${selected.id}`} variant="ghost" target="_blank">
              Cartel para imprimir
            </ButtonLink>
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <SectionTitle>Enlace de invitación</SectionTitle>
          <CopyLink link={link} />
          <ShareButton
            title={`Sumate a ${selected.name} en Camino de Fe`}
            text={`Sumate a ${selected.name} en Camino de Fe: leamos la Biblia juntos y mantenete al tanto de lo que hacemos.`}
            path={`/i/${selected.slug}`}
            label="Compartir por WhatsApp u otra app"
            className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          />
          <SectionTitle>Sugerencia para el domingo</SectionTitle>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Card>
      </div>
      <Notice>
        Medimos solo cuántas veces se abrió el enlace (en total y de forma anónima), nunca quién lo abrió.
      </Notice>
    </>
  );
}
