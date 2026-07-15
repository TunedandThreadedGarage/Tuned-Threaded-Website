export type NotificationActor = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type NotificationFeedItem = {
  id: string;
  userId: string;
  actorId: string | null;
  type: string;
  entityType: string | null;
  entityId: string | null;
  message: string;
  action: string | null;
  href: string | null;
  thumbnailUrl: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
};
