import type {
  HousingListing,
  HousingListingStatus,
  HousingListingType,
} from "@life-community-os/types";

export function housingCategoryLabel(type: HousingListingType): string {
  switch (type) {
    case "rent":
      return "Alquiler";
    case "sale":
      return "Venta";
    case "land":
      return "Terreno";
    case "commercial":
      return "Local";
  }
}

export function housingStatusLabel(status: HousingListingStatus): string {
  switch (status) {
    case "draft":
      return "Borrador";
    case "pending_review":
      return "En revisión";
    case "published":
      return "Publicado";
    case "reserved":
      return "Reservado";
    case "closed":
      return "Cerrado";
    case "archived":
      return "Archivado";
  }
}

export function housingPriceLabel(listing: HousingListing): string | undefined {
  if (listing.priceAmount == null) return undefined;
  const amount = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: listing.currency ?? "EUR",
    maximumFractionDigits: 0,
  }).format(listing.priceAmount);
  if (listing.pricePeriodLabel) {
    return `${amount} / ${listing.pricePeriodLabel}`;
  }
  return amount;
}

export function housingLocationLabel(listing: HousingListing): string {
  return (
    [listing.property.areaLabel, listing.property.addressLabel]
      .filter(Boolean)
      .join(" · ") || "Ubicación no indicada"
  );
}

export function housingListingFacts(listing: HousingListing): string[] {
  const facts: string[] = [];
  if (listing.property.bedrooms != null) {
    facts.push(`${listing.property.bedrooms} hab.`);
  }
  if (listing.property.bathrooms != null) {
    facts.push(`${listing.property.bathrooms} baños`);
  }
  if (listing.property.builtAreaM2 != null) {
    facts.push(`${listing.property.builtAreaM2} m²`);
  }
  if (listing.property.landAreaM2 != null) {
    facts.push(`Parcela ${listing.property.landAreaM2} m²`);
  }
  if (listing.property.floor != null) {
    facts.push(
      listing.property.floor === 0
        ? "Planta calle"
        : `Planta ${listing.property.floor}`,
    );
  }
  return facts;
}

export function housingCoverUrl(listing: HousingListing): string | undefined {
  const media = [...(listing.media ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  return media.find((m) => m.kind === "image")?.url;
}
