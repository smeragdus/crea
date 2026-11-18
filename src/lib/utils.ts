import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

const pen = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function soles(value: number) {
  return pen.format(value);
}

export function searchText(value: string) {
  return value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
}
