import { redirect } from "next/navigation";

/** No list index — Location SoT lives on the map. */
export default function LocationsIndexPage() {
  redirect("/map");
}
