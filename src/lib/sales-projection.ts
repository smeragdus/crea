export type SalesLine = { price: string; orders: string; days: string; monthlyOrders?: string };
export type Season = { highMonths: string; highPercent: string; lowMonths: string; lowPercent: string };

const decimal = /^\d{1,7}(?:[.,]\d{1,2})?$/;
const whole = /^\d{1,6}$/;

function subtotalCents({ price, orders, days, monthlyOrders }: SalesLine) {
  if (!decimal.test(price)) return undefined;
  const cents = Math.round(Number(price.replace(",", ".")) * 100);
  if (monthlyOrders !== undefined) return whole.test(monthlyOrders) ? cents * Number(monthlyOrders) : undefined;
  if (!whole.test(orders) || !whole.test(days) || Number(days) > 31) return undefined;
  return cents * Number(orders) * Number(days);
}

export function monthlySalesSubtotal(line: SalesLine) {
  const cents = subtotalCents(line);
  return cents === undefined ? undefined : cents / 100;
}

export function projectSales(lines: SalesLine[], season: Season) {
  const subtotals = lines.map(subtotalCents);
  if (!lines.length || subtotals.some((subtotal) => subtotal === undefined)) {
    return { error: "Completa el precio y la cantidad de cada plato, bebida o servicio. Si calculas por día, usa hasta 31 días al mes." } as const;
  }
  const seasonValues = Object.values(season);
  if (seasonValues.some((value) => value !== "" && !whole.test(value))) {
    return { error: "Indica meses y porcentajes estacionales con números enteros." } as const;
  }
  const high = Number(season.highMonths);
  const low = Number(season.lowMonths);
  const increase = Number(season.highPercent);
  const decrease = Number(season.lowPercent);
  if (high + low > 12 || increase > 1000 || decrease > 100 || (high > 0 && !season.highPercent) || (low > 0 && !season.lowPercent)) {
    return { error: "Distribuye hasta 12 meses e indica la variación de cada temporada. La baja admite hasta 100 % y el aumento hasta 1 000 %." } as const;
  }

  const regular = subtotals.reduce<number>((sum, subtotal) => sum + (subtotal ?? 0), 0);
  if (regular > 99_999_999_999_900) return { error: "La proyección supera el importe máximo admitido." } as const;
  const peak = Math.round(regular * (1 + increase / 100));
  const quiet = Math.round(regular * (1 - decrease / 100));
  const normalMonths = 12 - high - low;
  const months = [
    ...(normalMonths ? [regular] : []), ...(high ? [peak] : []), ...(low ? [quiet] : []),
  ];
  const annual = (normalMonths * regular + high * peak + low * quiet) / 100;
  if (annual > 999_999_999_999) return { error: "La proyección supera el importe máximo admitido." } as const;
  return { value: { annual, regularMonth: regular / 100, maxMonth: Math.max(...months) / 100, lowMonth: Math.min(...months) / 100 } } as const;
}

export type SalesProjection = NonNullable<ReturnType<typeof projectSales>["value"]>;
