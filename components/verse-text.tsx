import { splitAddedWords } from "@/lib/bible/format";

/** Texto de un versículo con las palabras añadidas por traductores en itálica. */
export function VerseText({ text }: { text: string }) {
  return (
    <>
      {splitAddedWords(text).map((s, i) => (s.added ? <em key={i}>{s.text}</em> : <span key={i}>{s.text}</span>))}
    </>
  );
}
