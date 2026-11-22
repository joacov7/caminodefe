import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/app-nav";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda Camino de Fe, quién puede verlos, cuánto tiempo y cómo ejercer tus derechos.",
};

/**
 * Política de privacidad en lenguaje claro. BORRADOR TÉCNICO: debe ser
 * revisado por asesoría legal antes del lanzamiento público (docs/15).
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <Logo />
        <span className="font-serif text-xl font-semibold">Camino de Fe</span>
      </Link>
      <article className="space-y-6 leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        <h1 className="font-serif text-4xl font-semibold">Política de privacidad</h1>
        <p className="text-sm text-muted-foreground">
          Versión preliminar sujeta a revisión legal. Marco de referencia: Ley 25.326 de Protección de Datos Personales
          (Argentina).
        </p>
        <h2>En pocas palabras</h2>
        <ul>
          <li>Tu diario, tus notas, tus reflexiones, tu progreso y tus conversaciones con el asistente son privados: nadie más los ve, ni tu pastor ni nuestro equipo.</li>
          <li>Tu iglesia solo recibe lo que vos le enviás (un mensaje o tu pedido de ser miembro, con tu nombre y correo).</li>
          <li>No vendemos datos, no mostramos publicidad y no usamos rastreadores de terceros.</li>
          <li>Podés descargar o eliminar tus datos en cualquier momento desde Perfil → Privacidad.</li>
        </ul>
        <h2>Qué datos guardamos</h2>
        <ul>
          <li><strong>Cuenta:</strong> nombre, correo e imagen que provee tu método de ingreso (Google o enlace por correo).</li>
          <li><strong>Contenido personal:</strong> notas, diario, favoritos, reflexiones, progreso del camino y de los planes, recordatorios y conversaciones con el asistente.</li>
          <li><strong>Vínculos con iglesias:</strong> mensajes que enviás y membresías que solicitás.</li>
          <li><strong>Uso técnico del asistente:</strong> cantidad de consultas, tokens y costo estimado por día, sin el contenido.</li>
          <li><strong>Estadísticas anónimas:</strong> totales diarios (p. ej. capítulos leídos), sin identificarte.</li>
        </ul>
        <h2>El asistente bíblico</h2>
        <p>
          Para responder, el texto de tu pregunta se envía a nuestro proveedor de IA (OpenAI) bajo sus condiciones de API.
          No envíes datos sensibles que no sean necesarios. Ante señales de crisis, el asistente no consulta a la IA y te
          muestra recursos de ayuda humana. Las preguntas generales pueden reutilizar respuestas ya verificadas; las
          consultas personales nunca se guardan para otras personas.
        </p>
        <h2>Cuánto tiempo</h2>
        <p>
          Mientras tengas tu cuenta. Si la eliminás, se borran de forma definitiva tus datos personales; conservamos solo
          registros de auditoría sin datos personales y estadísticas anónimas. Las conversaciones que borrás dejan de
          mostrarse de inmediato.
        </p>
        <h2>Tus derechos</h2>
        <p>
          Acceso, rectificación, actualización y supresión. Podés ejercerlos desde la app (descargar y eliminar) o
          escribiéndonos. La Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326.
        </p>
        <h2>Menores de edad</h2>
        <p>
          Camino de Fe está pensado para mayores de 13 años. Las funciones para niños, cuando existan, no usarán IA en vivo
          y requerirán consentimiento de un adulto responsable.
        </p>
      </article>
    </div>
  );
}
