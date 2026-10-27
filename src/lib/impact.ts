export const IMPACT_METHOD = "epa-2006-manufacturing-v1";
export const EPA_SOURCE = "https://archive.epa.gov/epawaste/conserve/tools/warm/pdfs/chapter3.pdf";
export const A4_SHEET_GRAMS = 0.21 * 0.297 * 80;
export const IMPACT_FACTORS = { OFFICE_PAPER: 1.13, TEXTBOOK: 2.43 } as const;

type MaterialData = {
  impactMaterial: string;
  paperSheets: number | null;
  weightGrams: number | null;
};

export function estimateImpact(data: MaterialData) {
  if (data.impactMaterial !== "OFFICE_PAPER" && data.impactMaterial !== "TEXTBOOK") return null;
  const material = data.impactMaterial;
  const declaredSheets = material === "OFFICE_PAPER" ? data.paperSheets : null;
  const weightGrams = declaredSheets ? declaredSheets * A4_SHEET_GRAMS : data.weightGrams;
  if (!weightGrams || !Number.isFinite(weightGrams) || weightGrams <= 0) return null;
  const factorKgCo2PerKg = IMPACT_FACTORS[material];
  return {
    material,
    weightGrams,
    paperSheets:
      material === "OFFICE_PAPER"
        ? (declaredSheets ?? Math.floor(weightGrams / A4_SHEET_GRAMS))
        : 0,
    factorKgCo2PerKg,
    co2Grams: Math.round(weightGrams * factorKgCo2PerKg),
    methodVersion: IMPACT_METHOD,
  };
}

export function impactLevel(sheets: number) {
  if (sheets >= 1000) return { name: "Bosque", next: null, goal: 1000, percent: 100, remaining: 0 };
  const goal = sheets >= 200 ? 1000 : 200;
  return {
    name: sheets >= 200 ? "Árbol" : sheets > 0 ? "Brote" : "Semilla",
    next: goal === 1000 ? "Bosque" : "Árbol",
    goal,
    percent: Math.min(100, Math.floor((sheets / goal) * 100)),
    remaining: Math.max(0, goal - sheets),
  };
}

export function impactNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
