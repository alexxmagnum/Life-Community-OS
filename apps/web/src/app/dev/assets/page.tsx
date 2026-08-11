import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssetLibraryBrowser } from "@/screens/dev/AssetLibraryBrowser";

export const metadata: Metadata = {
  title: "3D Asset Library · Dev",
  robots: { index: false, follow: false },
};

/**
 * Internal development visual library.
 * Not linked from product navigation. 404 in production.
 */
export default function DevAssetsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <AssetLibraryBrowser />;
}
