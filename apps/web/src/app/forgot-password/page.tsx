import { Suspense } from "react";
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
