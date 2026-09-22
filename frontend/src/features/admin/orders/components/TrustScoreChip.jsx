import { cn } from "@/lib/utils";

/** Steadfast's risk score for a customer's phone, out of 100.
 *
 * The COLOUR is derived from the number, which is the one field whose meaning
 * is unambiguous. The LABEL is Steadfast's own `level` string, shown as they
 * wrote it — their vocabulary ("good", "caution", …) is undocumented and may
 * grow, so an unrecognised level still renders instead of vanishing.
 *
 * `reasons` are deliberately NOT translated. They arrive as codes like
 * "ratio_high", and nothing published says what ratio. A merchant deciding
 * whether to send goods on credit deserves the courier's own words rather than
 * our guess at them, so they render as-is with underscores opened up.
 */
const BANDS = [
  { min: 70, bg: "#EFF5DC", color: "#4F6B0B" }, // comfortable
  { min: 40, bg: "#F7EAD6", color: "#B45309" }, // worth a second look
  { min: 0, bg: "#F9E3E1", color: "#B3261E" }, // treat with care
];

const SIZES = { md: "text-[11.5px] px-3 py-[5px]", sm: "text-[10.5px] px-[11px] py-[5px]" };

export function TrustScoreChip({ fraudCheck, size = "sm", className }) {
  if (!fraudCheck || typeof fraudCheck.score !== "number") return null;

  const band = BANDS.find((b) => fraudCheck.score >= b.min) ?? BANDS[BANDS.length - 1];
  const level = fraudCheck.level ? fraudCheck.level.replace(/_/g, " ") : null;
  const checked = fraudCheck.checkedAt ? new Date(fraudCheck.checkedAt).toLocaleString("en-GB") : null;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-bold", SIZES[size], className)}
      style={{ backgroundColor: band.bg, color: band.color }}
      title={[
        `Steadfast trust score: ${fraudCheck.score}/100`,
        level ? `Level: ${level}` : null,
        fraudCheck.totalReports ? `${fraudCheck.totalReports} fraud report(s)` : "No fraud reports",
        checked ? `Checked ${checked}` : null,
      ]
        .filter(Boolean)
        .join("\n")}
    >
      {fraudCheck.score}
      {level && <span className="font-semibold opacity-80">· {level}</span>}
    </span>
  );
}
