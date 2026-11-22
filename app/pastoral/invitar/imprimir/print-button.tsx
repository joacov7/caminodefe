"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-[#26604f] px-6 py-3 font-semibold text-white print:hidden">
      Imprimir
    </button>
  );
}
