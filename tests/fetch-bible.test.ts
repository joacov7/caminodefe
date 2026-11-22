import { describe, it, expect } from "vitest";
import { deflateRawSync } from "node:zlib";
import { parseVpl, extractFromZip, VPL_CODES } from "@/db/fetch-bible";
import { BIBLE_BOOKS } from "@/lib/bible/books";

/** Genera un VPL sintético válido (1 versículo por capítulo). */
function syntheticVpl(): string {
  return VPL_CODES.map((code, i) =>
    Array.from({ length: BIBLE_BOOKS[i]!.chapters }, (_, c) => `${code} ${c + 1}:1 texto`).join("\n"),
  ).join("\n");
}

/** ZIP mínimo de un archivo con deflate (para probar el extractor). */
function makeZip(name: string, content: Buffer): Buffer {
  const data = deflateRawSync(content);
  const nameBuf = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42);
  const cdOffset = local.length + nameBuf.length + data.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length + nameBuf.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  return Buffer.concat([local, nameBuf, data, central, nameBuf, eocd]);
}

describe("importación RVR1909 (eBible VPL)", () => {
  it("convierte un VPL completo a 66 libros con nombres del canon", () => {
    const ds = parseVpl(syntheticVpl());
    expect(ds.books).toHaveLength(66);
    expect(ds.books[42]!.name).toBe("Juan");
    expect(ds.books[18]!.chapters).toHaveLength(150);
  });

  it("conserva versículos vacíos por versificación (Números 12:16)", () => {
    const vpl = syntheticVpl().replace("NUM 12:1 texto", "NUM 12:1 texto\nNUM 12:2");
    expect(parseVpl(vpl).books[3]!.chapters[11]).toEqual(["texto", ""]);
  });

  it("rechaza libros faltantes, numeración salteada y líneas inválidas", () => {
    expect(() => parseVpl("GEN 1:1 hola")).toThrow(/Falta el libro|capítulos/);
    expect(() => parseVpl(syntheticVpl().replace("GEN 2:1", "GEN 2:3"))).toThrow(/no contigua/);
    expect(() => parseVpl("esto no es vpl")).toThrow(/inválida/);
    expect(() => parseVpl("XXX 1:1 hola")).toThrow(/desconocido/);
  });

  it("extrae un archivo de un ZIP con deflate", () => {
    const zip = makeZip("spaRV1909_vpl.txt", Buffer.from("GEN 1:1 EN el principio"));
    expect(extractFromZip(zip, "_vpl.txt").toString()).toBe("GEN 1:1 EN el principio");
    expect(() => extractFromZip(zip, ".xml")).toThrow();
  });
});
