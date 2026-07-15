"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FollowButton({
  initiallyFollowing = false,
}: {
  initiallyFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);

  return (
    <Button
      variant={following ? "outline" : "primary"}
      size="sm"
      onClick={() => setFollowing((value) => !value)}
      aria-pressed={following}
    >
      {following ? "Following" : "Follow Garage"}
    </Button>
  );
}
