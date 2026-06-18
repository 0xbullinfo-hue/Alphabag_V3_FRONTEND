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

export interface GenericSuccessResponse {
  success: boolean;
  message?: string;
}

export interface AdminMissionStatusResponse {
  isPaused: boolean;
  pausedAt?: string | null;
  tgeDate?: string | null;
}

export interface PauseMissionRequest {
  paused: boolean;
}

export interface PauseMissionResponse {
  success: boolean;
  isPaused: boolean;
  message: string;
}

export interface TgeDateRequest {
  tgeDate: string;
}

export interface TgeDateResponse {
  success: boolean;
  tgeDate: string;
}

export interface AdjustTreasuryRequest {
  minimumClaimBalance?: number;
  itemsToBagRate?: number | null;
  campaignEnded?: boolean;
}

export interface AdjustTreasuryResponse {
  success: boolean;
  config: Record<string, any>;
}

export interface AdminWalletEntry {
  id: string;
  email?: string;
  wallet?: string;
  submittedWallet?: string | null;
  xLink?: string;
  reviewComment?: string;
  points?: number;
  referralCount?: number;
  accountType?: string;
  history?: any[];
  isFounderRequest?: boolean;
  isFounderAirdrop?: boolean;
  projectName?: string | null;
  projectTicker?: string | null;
  projectManifesto?: string | null;
  projectSocial?: string | null;
  projectWebsite?: string | null;
  projectContract?: string | null;
  projectGoals?: string | null;
  founderSocial?: string | null;
  airdropSubmittedAt?: string | null;
}

export interface AdminStrikeLogEntry {
  id: string;
  userId?: string;
  adminId?: string;
  reason?: string;
  timestamp?: string;
}

export interface AdminActivityEntry {
  id: string;
  userId?: string;
  missionId?: string;
  rewardTokens?: number;
  pointsEarned?: number;
  createdAt: string;
  user?: Record<string, any>;
  mission?: Record<string, any>;
}

export interface AdminTokenRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'REJECTED';
  expectedTokens: number;
  walletAddress: string;
  createdAt: string;
  sentAt?: string | null;
  txReference?: string | null;
  txHash?: string | null;
  processedBy?: string | null;
  user?: Record<string, any>;
}

export interface ApproveTokenRequestRequest {
  status?: 'APPROVED' | 'REJECTED';
}

export interface ApproveTokenRequestResponse {
  success: boolean;
  message?: string;
  txHash?: string;
}

export interface MarkDoneRequest {
  txReference?: string | null;
}

export interface BulkIdsRequest {
  ids: string[];
}

export interface BonusXpRequest {
  userId: string;
  bonusTokens: number;
}

export interface BonusXpResponse {
  success: boolean;
  message: string;
  newTotal?: number;
  strikes?: number;
  isBanned?: boolean;
}

export interface StrikeRequest {
  userId: string;
  reason?: string;
}

export interface StrikeResponse {
  success: boolean;
  message: string;
  strikes?: number;
  isBanned?: boolean;
}

export interface UnbanRequest {
  userId: string;
}

export interface UnbanResponse {
  success: boolean;
  message: string;
  user?: Record<string, any>;
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
  export type GenericSuccessResponse = import('./openapi-contracts').GenericSuccessResponse;
  export type AdminMissionStatusResponse = import('./openapi-contracts').AdminMissionStatusResponse;
  export type PauseMissionRequest = import('./openapi-contracts').PauseMissionRequest;
  export type PauseMissionResponse = import('./openapi-contracts').PauseMissionResponse;
  export type TgeDateRequest = import('./openapi-contracts').TgeDateRequest;
  export type TgeDateResponse = import('./openapi-contracts').TgeDateResponse;
  export type AdjustTreasuryRequest = import('./openapi-contracts').AdjustTreasuryRequest;
  export type AdjustTreasuryResponse = import('./openapi-contracts').AdjustTreasuryResponse;
  export type AdminWalletEntry = import('./openapi-contracts').AdminWalletEntry;
  export type AdminStrikeLogEntry = import('./openapi-contracts').AdminStrikeLogEntry;
  export type AdminActivityEntry = import('./openapi-contracts').AdminActivityEntry;
  export type AdminTokenRequest = import('./openapi-contracts').AdminTokenRequest;
  export type ApproveTokenRequestRequest = import('./openapi-contracts').ApproveTokenRequestRequest;
  export type ApproveTokenRequestResponse = import('./openapi-contracts').ApproveTokenRequestResponse;
  export type MarkDoneRequest = import('./openapi-contracts').MarkDoneRequest;
  export type BulkIdsRequest = import('./openapi-contracts').BulkIdsRequest;
  export type BonusXpRequest = import('./openapi-contracts').BonusXpRequest;
  export type BonusXpResponse = import('./openapi-contracts').BonusXpResponse;
  export type StrikeRequest = import('./openapi-contracts').StrikeRequest;
  export type StrikeResponse = import('./openapi-contracts').StrikeResponse;
  export type UnbanRequest = import('./openapi-contracts').UnbanRequest;
  export type UnbanResponse = import('./openapi-contracts').UnbanResponse;
}
