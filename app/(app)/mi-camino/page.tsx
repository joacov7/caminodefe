import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi Camino" };

const secciones = [
  { t: "Planes de lectura", d: "Continuá donde dejaste y seguí tu progreso." },
  { t: "Favoritos", d: "Versículos y contenidos que guardaste." },
  { t: "Notas personales", d: "Privadas. Nadie más las ve por defecto." },
  { t: "Diario espiritual", d: "Tu espacio personal de reflexión." },
  { t: "Temas guardados", d: "Lo que querés seguir estudiando." },
  { t: "Recordatorios", d: "Configurables, sin presión ni culpa." },
];

export default function MiCaminoPage() {
  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Mi Camino</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu espacio personal y privado. Vos controlás qué compartís con tu
          iglesia.
        </p>
      </header>

      <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Requiere iniciar sesión. La persistencia se conecta con la base de datos
        una vez habilitada la autenticación.
      </p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {secciones.map((s) => (
          <article key={s.t} className="rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-primary">{s.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
