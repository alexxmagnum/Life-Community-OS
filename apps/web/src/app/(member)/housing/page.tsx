import { redirect } from "next/navigation";

/**
 * Compatibility shim — IA Phase 1 foundation cleanup.
 *
 * There is no Housing / Living product surface yet (D13 pending).
 * This route only prevents a hard 404 for legacy/manual `/housing` hits.
 * It does **not** establish Housing ownership or IA.
 */
export default function HousingCompatibilityPage() {
  redirect("/community");
}
