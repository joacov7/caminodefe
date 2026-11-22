/**
 * Formato del texto RVR1909: las palabras entre corchetes son añadidas por los
 * traductores para dar sentido en castellano (no están en los originales). Se
 * muestran en itálica y atenuadas, como en las ediciones impresas.
 */
export type TextSegment = { text: string; added: boolean };

export function splitAddedWords(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), added: false });
    out.push({ text: m[1]!, added: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), added: false });
  return out;
}

/** Texto plano (sin corchetes), para compartir o para metadatos. */
export function plainVerse(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, "$1");
}
