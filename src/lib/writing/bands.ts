export function roundBand(value: number) {
  if (!Number.isFinite(value)) throw new Error("Band must be a finite number.");
  return Math.max(0, Math.min(9, Math.round(value * 2) / 2));
}

export function overallBand(bands: number[]) {
  if (bands.length !== 4) throw new Error("A Writing task band requires exactly four criterion bands.");
  return roundBand(bands.reduce((sum, band) => sum + roundBand(band), 0) / bands.length);
}
