"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  hrefForTab,
  useGarageHubOptional,
} from "@/features/garage-hub/GarageHubContext";

export function OpenVehicleEditorButton({
  label,
  variant = "secondary",
  vehicleId,
}: {
  label: string;
  variant?: "primary" | "secondary";
  vehicleId?: string;
}) {
  const hub = useGarageHubOptional();
  const router = useRouter();
  const mode = vehicleId ?? "new";

  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => {
        if (hub) {
          hub.openEditor(mode);
          return;
        }
        router.push(hrefForTab("vehicles", mode));
      }}
    >
      {label}
    </Button>
  );
}

export function OpenVehicleEditorLink({
  label,
  vehicleId,
  className,
}: {
  label: string;
  vehicleId?: string;
  className?: string;
}) {
  const hub = useGarageHubOptional();
  const router = useRouter();
  const mode = vehicleId ?? "new";

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (hub) {
          hub.openEditor(mode);
          return;
        }
        router.push(hrefForTab("vehicles", mode));
      }}
    >
      {label}
    </button>
  );
}
