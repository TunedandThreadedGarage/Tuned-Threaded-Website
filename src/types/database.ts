export type SkillLevel =
  | "weekend_wrench"
  | "home_mechanic"
  | "builder"
  | "pro_shop";

export type BuildStatus = "active" | "completed" | "paused";
export type ModStatus = "installed" | "wishlist";
export type AlbumCategory =
  | "before_after"
  | "build"
  | "rolling"
  | "dyno"
  | "garage"
  | "general";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  location: string | null;
  skill_level: SkillLevel | null;
  settings: Record<string, unknown>;
  onboarding_completed: boolean;
  favorite_manufacturer: string | null;
  favorite_engine: string | null;
  favorite_build_style: string | null;
  favorite_quote: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  accent_color: string | null;
  years_building: number | null;
  reputation_cached: number;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  user_id: string;
  year: number | null;
  make: string;
  model: string;
  trim: string | null;
  notes: string | null;
  is_primary: boolean;
  photo_url: string | null;
  nickname: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  vin: string | null;
  paint_color: string | null;
  mileage: number | null;
  current_hp: number | null;
  target_hp: number | null;
  build_stage: string | null;
  progress_pct: number;
  created_at: string;
  updated_at: string;
};

export type Modification = {
  id: string;
  vehicle_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ModStatus;
  part_brand: string | null;
  part_number: string | null;
  cost_cents: number | null;
  created_at: string;
};

export type Build = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  title: string;
  body: string | null;
  is_public: boolean;
  progress_pct: number;
  current_stage: string | null;
  upcoming_stage: string | null;
  estimated_completion: string | null;
  status: BuildStatus;
  cover_photo_url: string | null;
  tags: string[];
  view_count: number;
  is_featured: boolean;
  is_staff_pick: boolean;
  labor_hours_cached: number | null;
  invested_cents_cached: number | null;
  created_at: string;
  updated_at: string;
};

export type BuildPhoto = {
  id: string;
  build_id: string;
  user_id: string;
  storage_path: string;
  url: string;
  sort_order: number;
  created_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  entry_date: string;
  visibility: "public" | "private";
  status: "draft" | "published";
  category: string | null;
  media_urls: string[];
  build_id: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  action: string | null;
  href: string | null;
  thumbnail_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type BuildLike = {
  build_id: string;
  user_id: string;
  created_at: string;
};

export type BuildComment = {
  id: string;
  build_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  image_url: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type BuildCommentLike = {
  comment_id: string;
  user_id: string;
  created_at: string;
};

export type BuildFollower = {
  build_id: string;
  user_id: string;
  created_at: string;
};

export type BuildTimelineEntry = {
  id: string;
  build_id: string;
  user_id: string;
  title: string;
  description: string | null;
  entry_date: string;
  photos: string[];
  video_url: string | null;
  parts_installed: string | null;
  cost_cents: number | null;
  hours_spent: number | null;
  stage: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type BuildTimelineLike = {
  entry_id: string;
  user_id: string;
  created_at: string;
};

export type BuildTimelineComment = {
  id: string;
  entry_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type BuildVideo = {
  id: string;
  build_id: string;
  user_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type BuildPartStatus = "installed" | "wishlist";

export type BuildPart = {
  id: string;
  build_id: string;
  user_id: string;
  brand: string | null;
  name: string;
  price_cents: number | null;
  purchase_url: string | null;
  install_date: string | null;
  status: BuildPartStatus;
  priority: number;
  created_at: string;
};

export type BuildPerfType = "zero_sixty" | "top_speed" | "track";

export type BuildPerformance = {
  id: string;
  build_id: string;
  user_id: string;
  result_date: string;
  perf_type: BuildPerfType;
  value_numeric: number;
  unit: string;
  notes: string | null;
  created_at: string;
};

export type BuildGoals = {
  build_id: string;
  user_id: string;
  current_goal: string | null;
  next_goal: string | null;
  long_term_goal: string | null;
  budget_remaining_cents: number | null;
  completion_pct: number;
  updated_at: string;
};

export type WishlistItem = {
  id: string;
  wishlist_id: string;
  product_ref: string;
  product_name: string | null;
  product_image_url: string | null;
  created_at: string;
};

export type SavedCartItem = {
  id: string;
  cart_id: string;
  product_ref: string;
  product_name: string | null;
  quantity: number;
  unit_price_cents: number | null;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  summary: string | null;
  tracking_number: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  receipt_url: string | null;
  invoice_url: string | null;
  currency: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_ref: string;
  product_name: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};

export type CommunicationSettingsRow = {
  user_id: string;
  master_enabled: boolean;
  email_frequency: "instant" | "daily" | "weekly" | "never";
  digest_daily: boolean;
  digest_weekly: boolean;
  digest_monthly: boolean;
  marketing_merchandise: boolean;
  marketing_sales: boolean;
  marketing_events: boolean;
  marketing_features: boolean;
  marketing_community: boolean;
  show_activity_status: boolean;
  allow_mentions: boolean;
  allow_messages_from: "everyone" | "followers" | "none";
  created_at: string;
  updated_at: string;
};

export type NotificationChannelPreference = {
  user_id: string;
  event_key: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
};

export type Badge = {
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
};

export type ProfileBadge = {
  profile_id: string;
  badge_key: string;
  awarded_at: string;
};

export type VehicleTimelineEntry = {
  id: string;
  vehicle_id: string;
  user_id: string;
  build_id: string | null;
  title: string;
  description: string | null;
  entry_date: string;
  photos: string[];
  video_url: string | null;
  parts_installed: string | null;
  cost_cents: number | null;
  hours_spent: number | null;
  created_at: string;
  updated_at: string;
};

export type TimelineEntryLike = {
  entry_id: string;
  user_id: string;
  created_at: string;
};

export type TimelineEntryComment = {
  id: string;
  entry_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type VehicleMaintenanceLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  title: string;
  notes: string | null;
  service_date: string;
  mileage: number | null;
  cost_cents: number | null;
  created_at: string;
};

export type VehicleDynoResult = {
  id: string;
  vehicle_id: string;
  user_id: string;
  result_date: string;
  whp: number | null;
  wtq: number | null;
  notes: string | null;
  created_at: string;
};

export type VehicleQuarterMileTime = {
  id: string;
  vehicle_id: string;
  user_id: string;
  result_date: string;
  et_seconds: number | null;
  trap_mph: number | null;
  notes: string | null;
  created_at: string;
};

export type VehiclePhoto = {
  id: string;
  vehicle_id: string;
  user_id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type GarageAlbum = {
  id: string;
  user_id: string;
  name: string;
  category: AlbumCategory;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type GaragePhoto = {
  id: string;
  album_id: string;
  user_id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  category: AlbumCategory;
  sort_order: number;
  created_at: string;
};

export type SavedBuild = {
  user_id: string;
  build_id: string;
  created_at: string;
};

export type CommunityPostType =
  | "photo"
  | "video"
  | "build_update"
  | "maintenance"
  | "dyno"
  | "quarter_mile"
  | "question"
  | "discussion"
  | "status";

export type CommunityPost = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  build_id: string | null;
  post_type: CommunityPostType;
  title: string | null;
  body: string | null;
  media_urls: string[];
  video_url: string | null;
  youtube_url: string | null;
  tags: string[];
  manufacturer: string | null;
  engine: string | null;
  transmission: string | null;
  horsepower: number | null;
  state: string | null;
  location: string | null;
  is_public: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  image_url: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunityLike = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityCommentLike = {
  comment_id: string;
  user_id: string;
  created_at: string;
};

export type CommunitySavedPost = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityTag = {
  key: string;
  label: string;
  sort_order: number;
};

export type CommunityNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  comment_id: string | null;
  message: string | null;
  read_at: string | null;
  created_at: string;
};

export type GarageStats = {
  followers: number;
  following: number;
  vehicles: number;
  builds: number;
  journalEntries: number | null;
  completedProjects: number;
  combinedHp: number;
  reputation: number;
  yearsBuilding: number | null;
  favoriteBrand: string | null;
  favoriteEngine: string | null;
  estimatedInvestedCents: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, "id" | "created_at" | "updated_at" | "progress_pct"> & {
          id?: string;
          progress_pct?: number;
        };
        Update: Partial<Vehicle>;
      };
      modifications: {
        Row: Modification;
        Insert: Omit<Modification, "id" | "created_at" | "status"> & {
          id?: string;
          status?: ModStatus;
        };
        Update: Partial<Modification>;
      };
      builds: {
        Row: Build;
        Insert: Omit<
          Build,
          | "id"
          | "created_at"
          | "updated_at"
          | "progress_pct"
          | "status"
          | "tags"
          | "view_count"
          | "is_featured"
          | "is_staff_pick"
          | "cover_photo_url"
          | "labor_hours_cached"
          | "invested_cents_cached"
        > & {
          id?: string;
          progress_pct?: number;
          status?: BuildStatus;
          tags?: string[];
          view_count?: number;
          is_featured?: boolean;
          is_staff_pick?: boolean;
          cover_photo_url?: string | null;
          labor_hours_cached?: number | null;
          invested_cents_cached?: number | null;
        };
        Update: Partial<Build>;
      };
      build_photos: {
        Row: BuildPhoto;
        Insert: Omit<BuildPhoto, "id" | "created_at"> & { id?: string };
        Update: Partial<BuildPhoto>;
      };
      build_followers: {
        Row: BuildFollower;
        Insert: BuildFollower;
        Update: Partial<BuildFollower>;
      };
      build_timeline_entries: {
        Row: BuildTimelineEntry;
        Insert: Omit<
          BuildTimelineEntry,
          "id" | "created_at" | "updated_at" | "photos" | "like_count"
        > & {
          id?: string;
          photos?: string[];
          like_count?: number;
        };
        Update: Partial<BuildTimelineEntry>;
      };
      build_timeline_likes: {
        Row: BuildTimelineLike;
        Insert: BuildTimelineLike;
        Update: Partial<BuildTimelineLike>;
      };
      build_timeline_comments: {
        Row: BuildTimelineComment;
        Insert: Omit<BuildTimelineComment, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<BuildTimelineComment>;
      };
      build_videos: {
        Row: BuildVideo;
        Insert: Omit<BuildVideo, "id" | "created_at"> & { id?: string };
        Update: Partial<BuildVideo>;
      };
      build_parts: {
        Row: BuildPart;
        Insert: Omit<BuildPart, "id" | "created_at" | "status" | "priority"> & {
          id?: string;
          status?: BuildPartStatus;
          priority?: number;
        };
        Update: Partial<BuildPart>;
      };
      build_performance: {
        Row: BuildPerformance;
        Insert: Omit<BuildPerformance, "id" | "created_at"> & { id?: string };
        Update: Partial<BuildPerformance>;
      };
      build_goals: {
        Row: BuildGoals;
        Insert: Omit<BuildGoals, "updated_at" | "completion_pct"> & {
          completion_pct?: number;
        };
        Update: Partial<BuildGoals>;
      };
      build_comment_likes: {
        Row: BuildCommentLike;
        Insert: BuildCommentLike;
        Update: Partial<BuildCommentLike>;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<
          JournalEntry,
          | "id"
          | "created_at"
          | "updated_at"
          | "visibility"
          | "status"
          | "category"
          | "media_urls"
          | "build_id"
          | "like_count"
          | "comment_count"
        > & {
          id?: string;
          visibility?: JournalEntry["visibility"];
          status?: JournalEntry["status"];
          category?: string | null;
          media_urls?: string[];
          build_id?: string | null;
          like_count?: number;
          comment_count?: number;
        };
        Update: Partial<JournalEntry>;
      };
      follows: { Row: Follow; Insert: Follow; Update: Partial<Follow> };
      notifications: {
        Row: Notification;
        Insert: Omit<
          Notification,
          "id" | "created_at" | "read_at" | "action" | "href" | "thumbnail_url"
        > & {
          id?: string;
          action?: string | null;
          href?: string | null;
          thumbnail_url?: string | null;
        };
        Update: Partial<Notification>;
      };
      build_likes: {
        Row: BuildLike;
        Insert: BuildLike;
        Update: Partial<BuildLike>;
      };
      build_comments: {
        Row: BuildComment;
        Insert: Omit<
          BuildComment,
          "id" | "created_at" | "updated_at" | "like_count" | "parent_id" | "image_url"
        > & {
          id?: string;
          like_count?: number;
          parent_id?: string | null;
          image_url?: string | null;
        };
        Update: Partial<BuildComment>;
      };
      wishlist_items: {
        Row: WishlistItem;
        Insert: Omit<WishlistItem, "id" | "created_at"> & { id?: string };
        Update: Partial<WishlistItem>;
      };
      saved_cart_items: {
        Row: SavedCartItem;
        Insert: Omit<SavedCartItem, "id" | "created_at"> & { id?: string };
        Update: Partial<SavedCartItem>;
      };
      orders: {
        Row: Order;
        Insert: Omit<
          Order,
          | "id"
          | "created_at"
          | "tracking_number"
          | "carrier"
          | "estimated_delivery"
          | "shipped_at"
          | "delivered_at"
          | "cancelled_at"
          | "refunded_at"
          | "receipt_url"
          | "invoice_url"
          | "currency"
        > & {
          id?: string;
          tracking_number?: string | null;
          carrier?: string | null;
          estimated_delivery?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          refunded_at?: string | null;
          receipt_url?: string | null;
          invoice_url?: string | null;
          currency?: string;
        };
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at"> & { id?: string };
        Update: Partial<OrderItem>;
      };
      communication_settings: {
        Row: CommunicationSettingsRow;
        Insert: Partial<CommunicationSettingsRow> & { user_id: string };
        Update: Partial<CommunicationSettingsRow>;
      };
      notification_channel_preferences: {
        Row: NotificationChannelPreference;
        Insert: NotificationChannelPreference;
        Update: Partial<NotificationChannelPreference>;
      };
      badges: { Row: Badge; Insert: Badge; Update: Partial<Badge> };
      profile_badges: {
        Row: ProfileBadge;
        Insert: ProfileBadge;
        Update: Partial<ProfileBadge>;
      };
      vehicle_timeline_entries: {
        Row: VehicleTimelineEntry;
        Insert: Omit<
          VehicleTimelineEntry,
          "id" | "created_at" | "updated_at" | "photos"
        > & { id?: string; photos?: string[] };
        Update: Partial<VehicleTimelineEntry>;
      };
      timeline_entry_likes: {
        Row: TimelineEntryLike;
        Insert: TimelineEntryLike;
        Update: Partial<TimelineEntryLike>;
      };
      timeline_entry_comments: {
        Row: TimelineEntryComment;
        Insert: Omit<TimelineEntryComment, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<TimelineEntryComment>;
      };
      vehicle_maintenance_logs: {
        Row: VehicleMaintenanceLog;
        Insert: Omit<VehicleMaintenanceLog, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<VehicleMaintenanceLog>;
      };
      vehicle_dyno_results: {
        Row: VehicleDynoResult;
        Insert: Omit<VehicleDynoResult, "id" | "created_at"> & { id?: string };
        Update: Partial<VehicleDynoResult>;
      };
      vehicle_quarter_mile_times: {
        Row: VehicleQuarterMileTime;
        Insert: Omit<VehicleQuarterMileTime, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<VehicleQuarterMileTime>;
      };
      vehicle_photos: {
        Row: VehiclePhoto;
        Insert: Omit<VehiclePhoto, "id" | "created_at"> & { id?: string };
        Update: Partial<VehiclePhoto>;
      };
      garage_albums: {
        Row: GarageAlbum;
        Insert: Omit<GarageAlbum, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<GarageAlbum>;
      };
      garage_photos: {
        Row: GaragePhoto;
        Insert: Omit<GaragePhoto, "id" | "created_at"> & { id?: string };
        Update: Partial<GaragePhoto>;
      };
      saved_builds: {
        Row: SavedBuild;
        Insert: SavedBuild;
        Update: Partial<SavedBuild>;
      };
      community_posts: {
        Row: CommunityPost;
        Insert: Omit<
          CommunityPost,
          | "id"
          | "created_at"
          | "updated_at"
          | "like_count"
          | "comment_count"
          | "media_urls"
          | "tags"
        > & {
          id?: string;
          media_urls?: string[];
          tags?: string[];
          like_count?: number;
          comment_count?: number;
        };
        Update: Partial<CommunityPost>;
      };
      community_comments: {
        Row: CommunityComment;
        Insert: Omit<
          CommunityComment,
          "id" | "created_at" | "updated_at" | "like_count"
        > & { id?: string; like_count?: number };
        Update: Partial<CommunityComment>;
      };
      community_likes: {
        Row: CommunityLike;
        Insert: CommunityLike;
        Update: Partial<CommunityLike>;
      };
      community_comment_likes: {
        Row: CommunityCommentLike;
        Insert: CommunityCommentLike;
        Update: Partial<CommunityCommentLike>;
      };
      community_saved_posts: {
        Row: CommunitySavedPost;
        Insert: CommunitySavedPost;
        Update: Partial<CommunitySavedPost>;
      };
      community_tags: {
        Row: CommunityTag;
        Insert: CommunityTag;
        Update: Partial<CommunityTag>;
      };
      community_notifications: {
        Row: CommunityNotification;
        Insert: Omit<CommunityNotification, "id" | "created_at" | "read_at"> & {
          id?: string;
        };
        Update: Partial<CommunityNotification>;
      };
    };
  };
};
