import { parsePackageInfo, convertToBaseUnits } from "./apify.js";
import { todayStr } from "./ingredients.js";

// Merge a selected Checkers product onto an ingredient DB entry.
// Returns the updated ingredient record (does not mutate the original).
export function applySelectedProduct(ingredient, product) {
  const titleStr = product.name || product.title || "";
  const priceRaw = product.price ?? product.currentPrice ?? product.pricePerUnit ?? null;
  const price    = typeof priceRaw === "string" ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) : Number(priceRaw ?? 0);
  const { packageValue, packageUnit, rawMatchedPackageText } = parsePackageInfo(titleStr);
  const { baseQuantity, baseUnit } = convertToBaseUnits(packageValue, packageUnit);
  const pricePerBaseUnit = price > 0 && baseQuantity > 0 ? price / baseQuantity : null;

  let costPerUnit = ingredient.costPerUnit;
  const ingUnit = (ingredient.unit || "").toLowerCase();
  if (pricePerBaseUnit != null) {
    if (baseUnit === "g"     && ingUnit === "g")    costPerUnit = pricePerBaseUnit;
    if (baseUnit === "g"     && ingUnit === "kg")   costPerUnit = pricePerBaseUnit * 1000;
    if (baseUnit === "ml"    && ingUnit === "ml")   costPerUnit = pricePerBaseUnit;
    if (baseUnit === "ml"    && ingUnit === "l")    costPerUnit = pricePerBaseUnit * 1000;
    if (baseUnit === "units" && ingUnit === "each") costPerUnit = price > 0 ? price / (packageValue || 1) : costPerUnit;
    if (ingUnit === "each" && (baseUnit === "g" || baseUnit === "ml") && price > 0) costPerUnit = price;
  }

  const newUnit = baseUnit || ingredient.unit;
  const newPkg  = baseQuantity && baseUnit
    ? `${baseQuantity}${baseUnit} · R${price?.toFixed(2) ?? product.price}`
    : ingredient.pkg;

  return {
    ...ingredient,
    costPerUnit,
    needsCosting: false,
    dateLastUpdated: todayStr(),
    matchedProductName: titleStr,
    retailer: "checkers",
    latestPrice: price,
    packageValue,
    packageUnit,
    baseQuantity,
    baseUnit,
    pricePerBaseUnit,
    rawMatchedPackageText,
    unit: newUnit,
    pkg: newPkg,
  };
}
