import Link from "next/link";

const secciones = [
  { titulo: "Asistente IA", desc: "Preguntá sobre la Biblia en tus palabras." },
  { titulo: "Biblia", desc: "Leé y estudiá con referencias verificables." },
  { titulo: "Mi Camino", desc: "Notas, progreso y oración, en privado." },
  { titulo: "Iglesias", desc: "Encontrá y conectá con tu comunidad local." },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-16">
      <header className="flex flex-col gap-4 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Camino de Fe
        </p>
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
          La Palabra de Dios, cada día, cerca de vos.
        </h1>
        <p className="text-pretty text-lg text-muted-foreground">
          Un asistente bíblico que te ayuda a entender, estudiar y orar, y que te
          conecta con tu iglesia local. Sin reemplazar al pastor ni a la
          comunidad.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/inicio"
            className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Comenzar
          </Link>
          <Link
            href="/biblia"
            className="rounded-full border border-border px-6 py-3 font-medium transition hover:bg-muted"
          >
            Explorar la Biblia
          </Link>
        </div>
      </header>

      <section
        aria-label="Secciones principales"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {secciones.map((s) => (
          <article
            key={s.titulo}
            className="rounded-2xl border border-border bg-muted/40 p-5"
          >
            <h2 className="text-lg font-semibold text-primary">{s.titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
        <p>
          El asistente es una herramienta de orientación y estudio. No sustituye
          el acompañamiento pastoral ni servicios profesionales.
        </p>
      </footer>
    </main>
  );
}
