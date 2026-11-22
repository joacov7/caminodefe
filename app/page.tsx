import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/app-nav";
import { buttonClass } from "@/components/ui";
import { IconPath, IconBook, IconChurch, IconChat, IconShield, IconHeart, IconCheck } from "@/components/icons";
import { GUIDED_PATH } from "@/content/guided-path";

export const metadata: Metadata = {
  title: { absolute: "Camino de Fe — Conocé a Jesús, leé la Biblia y encontrá tu iglesia" },
  description:
    "Un camino guiado para dar tus primeros pasos en la fe, la Biblia completa en español, planes de lectura y las iglesias de tu zona. Gratis, privado y sin publicidad.",
};

const PILLARS = [
  {
    icon: <IconPath />,
    title: "Un camino, paso a paso",
    text: "Diez etapas para conocer a Jesús, entender el Evangelio, aprender a orar y leer la Biblia. Sin puntajes ni comparaciones.",
  },
  {
    icon: <IconBook />,
    title: "La Biblia completa",
    text: "Reina-Valera 1909 en español, siempre gratis, también sin conexión. Planes de lectura de 7 y 30 días.",
  },
  {
    icon: <IconChurch />,
    title: "Tu iglesia, cerca",
    text: "Iglesias verificadas con horarios, eventos y un pastor dispuesto a escucharte. La fe se vive en comunidad.",
  },
  {
    icon: <IconChat />,
    title: "Preguntas con respuestas responsables",
    text: "Un asistente que cita la Biblia y verifica cada referencia. Distingue el texto de la interpretación y te deriva a personas reales.",
  },
];

const PROMISES = [
  "La Biblia y la ayuda espiritual nunca se pagan",
  "Tu diario y tus conversaciones son solo tuyos",
  "Sin publicidad y sin vender datos",
  "Interdenominacional: lo central del Evangelio, con respeto",
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ cuenta?: string }> }) {
  const { cuenta } = await searchParams;
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-serif text-xl font-semibold tracking-tight">Camino de Fe</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/iglesias/sumar" className="hidden rounded-full px-4 py-2 font-medium text-muted-foreground hover:text-foreground sm:block">
            Para iglesias
          </Link>
          <Link href="/ingresar" className={buttonClass("secondary", "px-4 py-2")}>
            Ingresar
          </Link>
        </nav>
      </header>

      <main id="contenido">
        {cuenta === "eliminada" && (
          <p role="status" className="mx-auto max-w-3xl rounded-2xl bg-muted px-4 py-3 text-center text-sm">
            Tu cuenta y tus datos fueron eliminados. Gracias por haber sido parte.
          </p>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
            <div className="absolute right-[-8rem] top-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          </div>
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20">
            <p className="animate-rise rounded-full border border-border bg-surface/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
              Gratis · Privado · En español
            </p>
            <h1 className="mt-6 animate-rise text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
              Tu camino de fe empieza con un paso.
            </h1>
            <p className="mt-6 max-w-2xl animate-rise text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Conocé a Jesús, leé la Biblia cada día y encontrá una iglesia que te reciba. Camino de Fe te acompaña, sin
              reemplazar a tu comunidad ni a tu pastor.
            </p>
            <div className="mt-9 flex animate-rise flex-col gap-3 sm:flex-row">
              <Link href="/camino" className={buttonClass("primary", "px-7 py-3.5 text-base")}>
                Empezar el camino
              </Link>
              <Link href="/biblia/juan/1" className={buttonClass("secondary", "px-7 py-3.5 text-base")}>
                Leer la Biblia
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No necesitás crear una cuenta para empezar.</p>
          </div>
        </section>

        {/* Pilares */}
        <section aria-label="Qué encontrás" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <article key={p.title} className="rounded-4xl border border-border/80 bg-surface p-7 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">{p.icon}</span>
                <h2 className="mt-5 font-serif text-2xl font-semibold">{p.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Camino */}
        <section aria-label="El camino guiado" className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Camino guiado</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight">De la primera pregunta a una comunidad.</h2>
              <p className="mt-4 text-lg leading-relaxed text-primary-foreground/80">
                Cada etapa trae un pasaje bíblico, una explicación sencilla, preguntas para pensar y una práctica. Y en
                cada paso, la posibilidad de hablar con un pastor.
              </p>
              <Link href="/camino" className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-soft transition hover:bg-accent/90">
                Ver las 10 etapas
              </Link>
            </div>
            <ol className="grid gap-2 sm:grid-cols-2">
              {GUIDED_PATH.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-primary-foreground/10 px-4 py-3 backdrop-blur">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-foreground/15 font-serif text-sm font-semibold">
                    {s.number}
                  </span>
                  <span className="text-sm font-medium">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Para iglesias */}
        <section aria-label="Para iglesias" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 rounded-4xl border border-border/80 bg-surface p-8 shadow-soft md:grid-cols-2 md:p-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Para pastores y líderes</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight">Herramientas para recibir y acompañar.</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Perfil público, eventos, bandeja de pedidos de oración y visitantes, y gestión de miembros. Gratis para
                empezar.
              </p>
              <Link href="/iglesias/sumar" className={buttonClass("primary", "mt-6")}>
                Sumar mi iglesia
              </Link>
            </div>
            <ul className="flex flex-col gap-3 self-center">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <IconShield className="h-4 w-4" /> El asistente orienta y estudia contigo; no sustituye el acompañamiento pastoral
            ni servicios profesionales.
          </p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
            <Link href="/iglesias" className="hover:text-foreground">Iglesias</Link>
            <Link href="/apoyar" className="inline-flex items-center gap-1 hover:text-foreground">
              <IconHeart className="h-3.5 w-3.5" /> Apoyar
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
