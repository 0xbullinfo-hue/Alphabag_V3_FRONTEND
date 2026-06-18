/**
 * OpenAPI Contract Types
 *
 * Auto-generated from openapi.yaml
 * Do not edit manually. Regenerate with: node scripts/generate-types-from-openapi.js
 *
 * Import usage:
 *   import { AirdropStatusResponse, Mission } from "./openapi-contracts";
 */

export interface Mission {
  id: string;
  title: string;
  description?: string;
  type: 'SOCIAL' | 'SURVEY' | 'CONTENT' | 'FINAL_REVIEW';
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  rewardTokens: number;
  rewardXP?: number;
  requiresLink?: boolean;
  requiresFeedback?: boolean;
  actionUrl?: string;
  createdAt?: string;
}

export interface MissionListResponse {
  missions: Mission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isDeactivated?: boolean;
  message?: string;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'REJECTED';
  expectedTokens: number;
  walletAddress: string;
  createdAt: string;
  sentAt?: string | null;
  txReference?: string | null;
}

export interface ClaimMissionRequest {
  missionId: string;
  taskId?: string;
  proofLink?: string;
  taskLink?: string;
  feedback?: string;
}

export interface ClaimMissionResponse {
  success: boolean;
  rewardTokens: number;
  rewardXP?: number;
  items: number;
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface AirdropSettings {
  status?: 'ACTIVE' | 'WAITING' | 'ENDED' | 'INACTIVE';
  tokenTicker?: string;
  pointsPerClaim?: number;
  durationDays?: number;
  isSubmissionActive?: boolean;
  isPaused?: boolean;
  itemsToBagRate?: number | null;
  campaignEnded?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UserAirdropStatus {
  points?: number;
  canClaim?: boolean;
  lastClaimTime?: string | null;
  walletSubmitted?: string | null;
  payoutRequest?: PayoutRequest | null;
}

export interface AirdropStatusResponse {
  settings: AirdropSettings;
  reveal: Record<string, any>;
  userStatus?: UserAirdropStatus | null;
}

export interface SubmitWalletRequest {
  bscWallet: string;
  xLink?: string;
  reviewComment?: string;
  isFounderRequest?: boolean;
  projectName?: string;
  projectTicker?: string;
  projectManifesto?: string;
  projectSocial?: string;
  projectWebsite?: string;
  projectContract?: string;
  projectGoals?: string;
  founderSocial?: string;
  projectLogo?: string;
  projectBanner?: string;
  grantReward?: boolean;
}

export interface SubmitWalletResponse {
  success: boolean;
  message: string;
  items: number;
  bagTokens?: number;
  isFounder?: boolean;
}

export interface ConvertItemsResponse {
  success: boolean;
  message: string;
  items: number;
  bagTokens: number;
}

export interface TreasuryStatus {
  id: string;
  minimumClaimBalance: number;
  itemsToBagRate?: number | null;
  isDeactivated?: boolean;
  intelligence: Record<string, any>;
}

export interface UserEarnProfile {
  id: string;
  items: number;
  lifetimeEarned: number;
  bagTokens: number;
  preferredWallet?: string;
  syndicateRank?: string;
  referralCount?: number;
  claimedMissionIds?: string[];
  minimumClaimBalance?: number;
}

export interface PayoutRequestResponse {
  success: boolean;
  message: string;
  requestId: string;
  expectedTokens?: number;
}

// Export all types as a namespace
export namespace OpenAPI {
  export type Mission = import('./openapi-contracts').Mission;
  export type MissionListResponse = import('./openapi-contracts').MissionListResponse;
  export type PayoutRequest = import('./openapi-contracts').PayoutRequest;
  export type ClaimMissionRequest = import('./openapi-contracts').ClaimMissionRequest;
  export type ClaimMissionResponse = import('./openapi-contracts').ClaimMissionResponse;
  export type ErrorResponse = import('./openapi-contracts').ErrorResponse;
  export type AirdropSettings = import('./openapi-contracts').AirdropSettings;
  export type UserAirdropStatus = import('./openapi-contracts').UserAirdropStatus;
  export type AirdropStatusResponse = import('./openapi-contracts').AirdropStatusResponse;
  export type SubmitWalletRequest = import('./openapi-contracts').SubmitWalletRequest;
  export type SubmitWalletResponse = import('./openapi-contracts').SubmitWalletResponse;
  export type ConvertItemsResponse = import('./openapi-contracts').ConvertItemsResponse;
  export type TreasuryStatus = import('./openapi-contracts').TreasuryStatus;
  export type UserEarnProfile = import('./openapi-contracts').UserEarnProfile;
  export type PayoutRequestResponse = import('./openapi-contracts').PayoutRequestResponse;
}
