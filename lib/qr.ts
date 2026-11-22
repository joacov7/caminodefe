/**
 * Códigos QR en SVG (servidor, sin imágenes externas). Se usa para que cada
 * iglesia invite a su congregación desde el culto (cartel, proyección).
 */
import qrcode from "qrcode-generator";

export type QrMatrix = { size: number; path: string };

/** Genera la matriz del QR como un único path SVG (módulos oscuros). */
export function qrPath(text: string): QrMatrix {
  const qr = qrcode(0, "M"); // versión automática, corrección media (~15 %)
  qr.addData(text, "Byte");
  qr.make();
  const n = qr.getModuleCount();
  let path = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.isDark(y, x)) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size: n, path };
}

/** SVG completo (con margen de 4 módulos, el mínimo recomendado). */
export function qrSvg(text: string, opts: { fg?: string; bg?: string; label?: string } = {}): string {
  const { size, path } = qrPath(text);
  const m = 4;
  const total = size + m * 2;
  const fg = opts.fg ?? "#1b2a2f";
  const bg = opts.bg ?? "#ffffff";
  const title = (opts.label ?? text).replace(/[<>&"]/g, "");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="${title}">` +
    `<rect width="${total}" height="${total}" fill="${bg}"/>` +
    `<path transform="translate(${m} ${m})" fill="${fg}" d="${path}"/></svg>`
  );
}
