export type GarageRank =
  | "Apprentice"
  | "Builder"
  | "Tuner"
  | "Fabricator"
  | "Master Mechanic"
  | "Legend";

export type BadgeId =
  | "first_build"
  | "weekend_wrench"
  | "engine_builder"
  | "forced_induction"
  | "community_favorite"
  | "top_contributor"
  | "photographer"
  | "helpful_member";

export type BadgeDefinition = {
  id: BadgeId;
  label: string;
  emoji: string;
  description: string;
};

export type SocialLinks = {
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
};

export type GarageProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  accentColor: string;
  bio: string;
  location: string;
  memberSince: string;
  garageRank: GarageRank;
  favoriteManufacturer: string;
  favoriteEngine: string;
  favoriteBuildStyle: string;
  favoriteQuote?: string;
  socialLinks: SocialLinks;
  badges: BadgeId[];
  stats: GarageStats;
  isFollowing?: boolean;
};

export type GarageStats = {
  followers: number;
  following: number;
  vehicles: number;
  builds: number;
  journalEntries: number;
  completedProjects: number;
  combinedHorsepower: number;
  reputationScore: number;
  yearsBuilding: number;
  estimatedInvested: number;
};

export type BuildStage =
  | "Planning"
  | "Disassembly"
  | "Fabrication"
  | "Assembly"
  | "Tuning"
  | "Detailing"
  | "Complete";

export type Vehicle = {
  id: string;
  ownerId: string;
  photoUrl: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  mileage: number;
  currentHorsepower: number;
  targetHorsepower: number;
  currentStage: BuildStage;
  upcomingStage?: BuildStage;
  progressPercent: number;
  estimatedCompletion?: string;
  notes?: string;
  futureGoals?: string[];
};

export type Part = {
  id: string;
  vehicleId: string;
  name: string;
  brand: string;
  category: string;
  installed: boolean;
  cost?: number;
  installedAt?: string;
};

export type TimelineUpdate = {
  id: string;
  vehicleId: string;
  title: string;
  date: string;
  description: string;
  photos: string[];
  videoUrl?: string;
  partsInstalled: string[];
  cost?: number;
  timeSpentHours?: number;
  likes: number;
  comments: number;
  likedByViewer?: boolean;
  savedByViewer?: boolean;
};

export type TimelineComment = {
  id: string;
  updateId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  body: string;
  createdAt: string;
};

export type MaintenanceEntry = {
  id: string;
  vehicleId: string;
  title: string;
  date: string;
  mileage: number;
  notes: string;
  cost?: number;
};

export type DynoResult = {
  id: string;
  vehicleId: string;
  date: string;
  horsepower: number;
  torque: number;
  boostPsi?: number;
  notes?: string;
  sheetUrl?: string;
};

export type QuarterMileTime = {
  id: string;
  vehicleId: string;
  date: string;
  et: number;
  trapSpeed: number;
  reactionTime?: number;
  notes?: string;
};

export type GalleryAlbum =
  | "Build Photos"
  | "Before / After"
  | "Rolling Shots"
  | "Dyno Sheets"
  | "Garage Photos";

export type GalleryPhoto = {
  id: string;
  ownerId: string;
  vehicleId?: string;
  url: string;
  caption?: string;
  album: GalleryAlbum;
  createdAt: string;
};

export type PublicUserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  garageRank: GarageRank;
  location?: string;
};

export type VehicleDetail = {
  vehicle: Vehicle;
  timeline: TimelineUpdate[];
  installedParts: Part[];
  futureParts: Part[];
  maintenance: MaintenanceEntry[];
  dynoResults: DynoResult[];
  quarterMileTimes: QuarterMileTime[];
  photos: GalleryPhoto[];
};

export type FullGarage = {
  profile: GarageProfile;
  vehicles: Vehicle[];
  gallery: GalleryPhoto[];
  followers: PublicUserSummary[];
  following: PublicUserSummary[];
};
