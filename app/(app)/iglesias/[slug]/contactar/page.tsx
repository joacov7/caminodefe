import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getVerifiedChurchBySlug } from "@/server/churches/queries";
import { reasonFromMotivo } from "@/server/churches/contact";
import { PageHeader, Notice } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contactar a un pastor" };

export default async function ContactarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { slug } = await params;
  const { motivo } = await searchParams;
  const church = await getVerifiedChurchBySlug(slug);
  if (!church) notFound();
  const session = await auth().catch(() => null);
  const cleanMotivo = motivo?.slice(0, 120);

  return (
    <main className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link href={`/iglesias/${church.slug}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <IconArrowLeft className="h-4 w-4" /> {church.name}
        </Link>
      </nav>
      <PageHeader
        eyebrow="Contacto pastoral"
        title="Hablar con un pastor"
        description={`Tu mensaje lo recibe el equipo de ${church.name}. Podés retirarlo mientras no esté resuelto.`}
      />
      <ContactForm
        churchId={church.id}
        churchName={church.name}
        signedIn={Boolean(session?.user?.id)}
        initialReason={reasonFromMotivo(cleanMotivo)}
        initialMessage={cleanMotivo ? `${cleanMotivo}.` : ""}
        callbackUrl={`/iglesias/${church.slug}/contactar${cleanMotivo ? `?motivo=${encodeURIComponent(cleanMotivo)}` : ""}`}
      />
      <Notice>
        No es un servicio de emergencias. Si estás en peligro, llamá al 911; si pensás en hacerte daño, al 135.
      </Notice>
    </main>
  );
}
