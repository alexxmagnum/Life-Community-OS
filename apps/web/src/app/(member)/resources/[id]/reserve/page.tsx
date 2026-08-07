import { Suspense } from "react";
import { ReservationConfirmationScreen } from "@/screens/ReservationConfirmationScreen";
import { LoadingState } from "@life-community-os/ui";

export default async function ResourceReservePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState label="Cargando reserva…" />}>
      <ReservationConfirmationScreen resourceId={id} />
    </Suspense>
  );
}
