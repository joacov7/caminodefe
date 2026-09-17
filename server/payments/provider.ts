/**
 * Capa de abstracción de pagos. La lógica de negocio depende solo de esta
 * interfaz; cambiar a Mercado Pago u otro proveedor no debe tocar el resto.
 *
 * Etapa actual: `ManualProvider` — NO procesa cobros. Registra la intención de
 * aporte como "pendiente" para que el usuario y la entidad tengan trazabilidad,
 * sin fingir que el dinero se movió. Se reemplaza por un proveedor real (con
 * checkout/tokenización, sin almacenar datos de tarjeta) en la Fase de Finanzas.
 */

export type CheckoutRequest = {
  userId: string;
  amountMinor: number;
  currency: string;
  concept: string;
};

export type CheckoutResult = {
  provider: string;
  status: "pending" | "confirmed";
  /** URL de pago cuando el proveedor la ofrece; null si no aplica todavía. */
  checkoutUrl: string | null;
  providerRef: string | null;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
}

/** Proveedor sin cobro: deja todo en "pendiente". */
export class ManualProvider implements PaymentProvider {
  readonly name = "manual";
  async createCheckout(_req: CheckoutRequest): Promise<CheckoutResult> {
    return {
      provider: this.name,
      status: "pending",
      checkoutUrl: null,
      providerRef: null,
    };
  }
}

/**
 * Selecciona el proveedor de pagos. Hoy siempre `manual`. Cuando exista
 * `MERCADOPAGO_ACCESS_TOKEN` (u otro), acá se elige el proveedor real.
 */
export function getPaymentProvider(): PaymentProvider {
  return new ManualProvider();
}

/** ¿Hay cobro real habilitado en este entorno? */
export function isRealPaymentEnabled(): boolean {
  return false;
}
