import { Suspense } from "react";
import AcceptInviteForm from "./AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 text-sm text-muted-foreground">
          Loading invitation...
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
