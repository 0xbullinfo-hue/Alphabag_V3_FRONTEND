// Official Bubblemaps B2B API Response & Request Types
// Comprehensive coverage across all Bubblemaps API endpoints

export interface BubblemapsAddressDetails {
  degree: number;
  is_supernode: boolean;
  is_contract: boolean;
  is_cex: boolean;
  is_dex: boolean;
  inward_relations: number;
  outward_relations: number;
  label?: string;
  is_paid_label?: boolean;
  entity_id?: string;
  first_activity_date?: string;
}

export interface BubblemapsHolderData {
  amount: number;
  rank: number;
  share: number; // Percentage of supply (0 - 100)
}

export interface BubblemapsTopHolder {
  address: string;
  address_details: BubblemapsAddressDetails;
  holder_data: BubblemapsHolderData;
  is_shown_on_map: boolean;
}

export interface BubblemapsMagicNode {
  address: string;
  address_details: BubblemapsAddressDetails;
  is_shown_on_map: boolean;
}

export interface BubblemapsRelationshipData {
  total_value: number;
  total_transfers: number;
  first_date: number;
  last_date: number;
  token_key: {
    chain: string;
    address: string;
  };
}

export interface BubblemapsRelationship {
  from_address: string;
  to_address: string;
  data: BubblemapsRelationshipData;
  rel_type: string; // e.g. "GROUPED_TRANSFER"
}

export interface BubblemapsTimeNode {
  address: string;
  relationships: BubblemapsRelationship[];
}

export interface BubblemapsCluster {
  share: number; // Combined % of total supply
  amount: number;
  holder_count: number;
  holders: string[];
  magic_node_count: number;
  magic_nodes: string[];
}

export interface BubblemapsSupplyStats {
  cexs: number;
  dexs: number;
  contracts: number;
  fresh_wallets: number;
  top_10_adjusted: number;
  bundles: number;
}

export interface BubblemapsScores {
  gini_index: number;
  herfindahl_hirschman_index: number;
  nakamoto_coefficient: number;
  bubblemaps_score: number; // 0 - 100
}

export interface BubblemapsMetrics {
  supply_stats: BubblemapsSupplyStats;
  scores: BubblemapsScores;
}

export interface BubblemapsNodes {
  top_holders: BubblemapsTopHolder[];
  magic_nodes: BubblemapsMagicNode[];
  time_nodes?: BubblemapsTimeNode[];
}

// 1. GET /tokens/map/{chain}/{address}
export interface BubblemapsMapResponse {
  metadata: {
    dt_update: string;
    ts_update: number;
  };
  metrics: BubblemapsMetrics;
  nodes: BubblemapsNodes;
  relationships: BubblemapsRelationship[];
  clusters: BubblemapsCluster[];
}

// 2. GET /chains
export interface BubblemapsChainInfo {
  id: string; // e.g. "eth"
  name: string;
  dexscreener_id?: string;
  coingecko_id?: string;
}

// Legacy alias for supported chains
export interface BubblemapsSupportedChain {
  chain: string;
  name: string;
  is_active: boolean;
  native_symbol?: string;
  explorer_url?: string;
  id?: string;
  dexscreener_id?: string;
  coingecko_id?: string;
}

// 3. GET /tokens/screenshot/{chain}/{address}
export interface BubblemapsScreenshotResponse {
  image_url: string;
  updated_at: string;
  screenshot_url?: string;
  image_base64?: string;
  dt_update?: string;
}

// 4. GET /tokens/metrics/{chain}/{address}
export interface BubblemapsTokenMetricsResponse {
  supply_stats: BubblemapsSupplyStats;
  scores: BubblemapsScores;
  metadata?: {
    dt_update: string;
    ts_update: number;
  };
  metrics?: BubblemapsMetrics;
}

// 5. GET /tokens/holders/{chain}/{address}
export type BubblemapsHoldersResponse = BubblemapsTopHolder[];

// Compatibility interface
export interface BubblemapsTopHoldersResponse {
  chain?: string;
  token_address?: string;
  top_holders: BubblemapsTopHolder[];
}

// 6. GET /tokens/search
export interface BubblemapsTokenKey {
  chain: string;
  address: string;
}

export interface BubblemapsTokenSearchMetadata {
  name: string;
  symbol: string;
  is_indexed: boolean;
  img_url?: string;
}

export interface BubblemapsTokenSearchResult {
  token_key: BubblemapsTokenKey;
  metadata: BubblemapsTokenSearchMetadata;
  // Flattened accessors for UI convenience
  chain?: string;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  logo_url?: string;
  has_map?: boolean;
}

// 7. GET /tokens/metadata/{chain}/{address}
export interface BubblemapsTokenStats {
  transfers_count: number;
  min_date: string;
  max_date: string;
}

export interface BubblemapsTokenMetadata {
  token_key: BubblemapsTokenKey;
  metadata: BubblemapsTokenSearchMetadata;
  stats: BubblemapsTokenStats;
  // Flattened compatibility properties
  chain?: string;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  total_supply?: string;
  holder_count?: number;
  verified?: boolean;
}

// 8. POST /tokens/metadata (Batch)
export interface BubblemapsBatchTokenQuery {
  chain: string;
  address: string;
}
export type BubblemapsBatchTokensResponse = BubblemapsTokenMetadata[];

// 9. GET /addresses/metadata/{address}
export interface BubblemapsAddressMetadata {
  address: string;
  address_details: BubblemapsAddressDetails;
  chain?: string;
  details?: BubblemapsAddressDetails;
}

// 10. POST /addresses/metadata (Batch)
export interface BubblemapsBatchAddressesRequest {
  addresses: string[];
}
export type BubblemapsBatchAddressesResponse = BubblemapsAddressMetadata[];
// Compatibility query type
export interface BubblemapsBatchAddressQuery {
  chain?: string;
  address: string;
}

// 11. POST /relationships/subgraph
export interface BubblemapsContextTokenKey {
  chain: string;
  address: string;
}

export interface BubblemapsSubgraphRequest {
  addresses: string[];
  context_token_key?: BubblemapsContextTokenKey;
}

export type BubblemapsSubgraphResponse = BubblemapsRelationship[];

// FastAPI / Pydantic 422 Validation Error Schema
export interface BubblemapsValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface BubblemapsValidationError {
  detail: BubblemapsValidationErrorItem[];
}
