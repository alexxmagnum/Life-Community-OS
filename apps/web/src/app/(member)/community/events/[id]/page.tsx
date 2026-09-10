import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { experienceIdForLegacyCommunityEvent } from "@life-community-os/types";
import { backfillCommunityEventsToExperiences } from "@/lib/community/community-event-backfill";
import { getExperienceServer } from "@/lib/experiences/server-experience-repository";

export const runtime = "nodejs";

/**
 * Legacy deep link: /community/events/[id]
 * Resolves backfilled Experience(kind=event) and redirects.
 */
export default async function LegacyCommunityEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const eventId = decodeURIComponent(rawId ?? "").trim();
  if (!eventId) notFound();

  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug")?.trim();
  if (!tenantSlug) notFound();

  await backfillCommunityEventsToExperiences({ tenantId: tenantSlug });
  const { resolveExperienceIdForLegacyCommunityEvent } = await import(
    "@/lib/community/community-event-backfill"
  );
  const resolved =
    (await resolveExperienceIdForLegacyCommunityEvent({
      tenantId: tenantSlug,
      communityEventId: eventId,
    })) ?? experienceIdForLegacyCommunityEvent(eventId);
  const experience =
    (await getExperienceServer(tenantSlug, resolved)) ??
    (await getExperienceServer(tenantSlug, eventId));

  if (!experience) {
    notFound();
  }

  redirect(`/experiences/${encodeURIComponent(experience.id)}`);
}
