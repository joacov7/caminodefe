import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { BIBLE_BOOKS } from "@/lib/bible/books";
import { GUIDED_PATH } from "@/content/guided-path";
import { READING_PLANS } from "@/content/reading-plans";
import { listVerifiedChurches } from "@/server/churches/queries";
import { listPublicUpcomingEvents } from "@/server/events/queries";

// Dinámico: incluye iglesias y eventos recién verificados/publicados.
export const dynamic = "force-dynamic";

/** Páginas públicas indexables (SEO): Biblia completa, camino, planes, iglesias y eventos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const staticPages = ["", "/camino", "/planes", "/biblia", "/iglesias", "/eventos", "/iglesias/sumar", "/privacidad"].map(
    (p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 }),
  );
  const stages = GUIDED_PATH.map((s) => ({ url: `${base}/camino/${s.id}`, priority: 0.7 }));
  const plans = READING_PLANS.map((p) => ({ url: `${base}/planes/${p.id}`, priority: 0.6 }));
  const bible = BIBLE_BOOKS.flatMap((b) => [
    { url: `${base}/biblia/${b.slug}`, priority: 0.5 },
    ...Array.from({ length: b.chapters }, (_, i) => ({ url: `${base}/biblia/${b.slug}/${i + 1}`, priority: 0.4 })),
  ]);
  const [churches, events] = await Promise.all([
    listVerifiedChurches().catch(() => null),
    listPublicUpcomingEvents({ limit: 200 }).catch(() => null),
  ]);
  return [
    ...staticPages,
    ...stages,
    ...plans,
    ...bible,
    ...(churches ?? []).map((c) => ({ url: `${base}/iglesias/${c.slug}`, priority: 0.7 })),
    ...(events ?? []).map((e) => ({ url: `${base}/eventos/${e.id}`, priority: 0.5 })),
  ];
}
