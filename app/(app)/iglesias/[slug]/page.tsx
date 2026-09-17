import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVerifiedChurchBySlug,
  getServiceTimes,
  getUpcomingEvents,
} from "@/server/churches/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const church = await getVerifiedChurchBySlug(slug);
  return { title: church?.name ?? "Iglesia" };
}

export default async function ChurchProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const church = await getVerifiedChurchBySlug(slug);
  if (!church) notFound();

  const [times, events] = await Promise.all([
    getServiceTimes(church.id),
    getUpcomingEvents(church.id, true),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <nav className="text-sm">
        <Link href="/iglesias" className="text-primary hover:underline">
          ← Iglesias
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold">{church.name}</h1>
        {church.generalLocation && (
          <p className="mt-1 text-sm text-muted-foreground">
            {church.generalLocation}
          </p>
        )}
      </header>

      {church.description && (
        <p className="leading-relaxed text-foreground/90">{church.description}</p>
      )}

      <Link
        href={`/iglesias/${church.slug}/contactar`}
        className="self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Contactar a un pastor
      </Link>

      {church.doctrinalStatement && (
        <Section title="Declaración doctrinal">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {church.doctrinalStatement}
          </p>
        </Section>
      )}

      {times.length > 0 && (
        <Section title="Horarios de culto">
          <ul className="text-sm text-muted-foreground">
            {times.map((t) => (
              <li key={t.id}>
                {t.day} · {t.time}
                {t.label ? ` — ${t.label}` : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {events.length > 0 && (
        <Section title="Próximos eventos">
          <ul className="flex flex-col gap-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{e.title}</p>
                <p className="text-muted-foreground">
                  {new Date(e.startsAt).toLocaleString("es-AR")}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {church.website && (
        <a
          href={church.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Sitio web ↗
        </a>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}
