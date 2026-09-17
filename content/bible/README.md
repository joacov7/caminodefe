# Texto bíblico — RVR1909 (dominio público)

El texto completo de la Reina-Valera 1909 **no se versiona** en este repositorio
por su tamaño (ver `.gitignore`). Se importa a la base de datos con el script
`db/import-bible.ts`.

## Formato esperado

Colocá el archivo en `content/bible/rvr1909.json` con esta forma:

```json
{
  "books": [
    { "name": "Juan", "chapters": [ ["texto v1", "texto v2"], ["…"] ] }
  ]
}
```

- `name` debe coincidir con `BibleBook.name` de `lib/bible/books.ts`
  (p. ej. "Juan", "1 Corintios", "Salmos").
- Los capítulos y versículos se numeran por posición (1-based).

## Importar

```bash
export DATABASE_URL="postgresql://…"   # nunca en el repo
npx tsx db/import-bible.ts
```

## Fuente

La RVR1909 está en **dominio público**. Obtené el dataset de una fuente de
dominio público y verificá su integridad antes de importarlo. Documentá aquí la
fuente exacta utilizada cuando se cargue.
