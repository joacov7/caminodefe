import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerifiedChurchBySlug } from "@/server/churches/queries";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contactar a un pastor" };

export default async function ContactarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const church = await getVerifiedChurchBySlug(slug);
  if (!church) notFound();

  return (
    <main className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link href={`/iglesias/${church.slug}`} className="text-primary hover:underline">
          ← {church.name}
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold">Contactar a un pastor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu solicitud la recibirá el equipo responsable de{" "}
          <strong>{church.name}</strong>. Podés retirarla mientras no haya sido
          resuelta. No se garantiza atención inmediata.
        </p>
      </header>

      <ContactForm churchId={church.id} />
    </main>
  );
}
