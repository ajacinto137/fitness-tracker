import type { Units } from "@prisma/client";

const KG_PER_LB = 0.45359237;

/** Convert a weight in kilograms (as stored in the database) to the given display unit. */
export function fromKg(kg: number, units: Units): number {
  return units === "LB" ? kg / KG_PER_LB : kg;
}

/** Convert a weight entered by the user in the given display unit to kilograms for storage. */
export function toKg(value: number, units: Units): number {
  return units === "LB" ? value * KG_PER_LB : value;
}

/** Round a display weight to one decimal place for presentation. */
export function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function unitLabel(units: Units): string {
  return units === "LB" ? "lb" : "kg";
}
