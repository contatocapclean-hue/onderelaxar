export type AttendanceType = "own_place" | "client_home" | "both";
export type ProfileStatus = "draft" | "pending_review" | "published" | "rejected" | "suspended";
export type VerificationStatus = "unverified" | "verified";
export type Visibility = "public" | "on_request" | "hidden";
export type PlanCode = "free" | "featured" | "premium";

export interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  isActive: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface ContactInfo {
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  whatsappVisibility: Visibility;
  phoneVisibility: Visibility;
  emailVisibility: Visibility;
  instagramVisibility: Visibility;
}

export interface Photo {
  id: string;
  url: string;
  kind: "profile" | "venue" | "gallery";
  order: number;
}

export interface ProfileStatistics {
  views: number;
  whatsappClicks: number;
  contactClicks: number;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  professionalName: string;
  slug: string;
  description: string;
  city: City;
  neighborhood: string;
  profilePhoto: string | null;
  attendanceType: AttendanceType;
  venueName: string | null;
  venueAddress: string | null;
  verificationStatus: VerificationStatus;
  profileStatus: ProfileStatus;
  isFeatured: boolean;
  featuredUntil: string | null;
  plan: PlanCode;
  createdAt: string;
  categories: ServiceCategory[];
  photos: Photo[];
  contact: ContactInfo;
  stats: ProfileStatistics;
  walletBalanceCents: number;
}

export interface SiteSettings {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  footerDescription: string;
  systemStory: {
    mediaUrl: string | null;
    mediaType: "image" | "video" | null;
    updatedAt: string | null;
  };
}

export interface Review {
  id: string;
  professionalId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export type SortOption = "recent" | "most_viewed" | "featured";

export interface CityFilters {
  neighborhood?: string;
  categorySlug?: string;
  attendanceType?: AttendanceType;
  verifiedOnly?: boolean;
  sort?: SortOption;
}

export interface Story {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  professionalPhoto: string | null;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
  expiresAt: string;
}

export type WalletTransactionType = "deposit" | "featured_purchase" | "story_purchase" | "refund";

export interface WalletTransaction {
  id: string;
  professionalId: string;
  type: WalletTransactionType;
  amountCents: number;
  description: string | null;
  createdAt: string;
}

export type DepositStatus = "pending" | "approved" | "rejected" | "expired";

export interface WalletDeposit {
  id: string;
  amountCents: number;
  status: DepositStatus;
  qrCode: string | null;
  qrCodeBase64: string | null;
}

export interface WalletPricing {
  featuredPriceCents: number;
  featuredDays: number;
  storyPriceCents: number;
}
