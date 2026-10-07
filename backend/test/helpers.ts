export function categoryFromScore(score: number) {
  if (score <= 39) return "HIGH RISK";
  if (score <= 69) return "MEDIUM RISK";
  if (score <= 84) return "LOW RISK";
  return "VERY LOW RISK";
}
