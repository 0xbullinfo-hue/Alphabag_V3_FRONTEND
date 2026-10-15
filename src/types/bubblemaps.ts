// Official Bubblemaps B2B API Response & Request Types
// Comprehensive coverage across all 11 Bubblemaps API endpoints

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

export interface BubblemapsRelationship {
  from_address: string;
  to_address: string;
  data: {
    total_value: number;
    total_transfers: number;
    first_date: number;
    last_date: number;
    token_key: {
      chain: string;
      address: string;
    };
  };
  rel_type: string;
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

// 1. GET /tokens/map/{chain}/{address}
export interface BubblemapsMapResponse {
  metadata: {
    dt_update: string;
    ts_update: number;
  };
  metrics: BubblemapsMetrics;
  nodes: {
    top_holders: BubblemapsTopHolder[];
    magic_nodes: BubblemapsMagicNode[];
    time_nodes?: Array<{
      address: string;
      relationships: BubblemapsRelationship[];
    }>;
  };
  relationships: BubblemapsRelationship[];
  clusters: BubblemapsCluster[];
}

// 2. GET /chains/supported
export interface BubblemapsSupportedChain {
  chain: string;
  name: string;
  is_active: boolean;
  native_symbol?: string;
  explorer_url?: string;
}

// 3. GET /tokens/screenshot/{chain}/{address}
export interface BubblemapsScreenshotResponse {
  screenshot_url?: string;
  image_base64?: string;
  dt_update?: string;
}

// 4. GET /tokens/metrics/{chain}/{address}
export interface BubblemapsTokenMetricsResponse {
  metadata: {
    dt_update: string;
    ts_update: number;
  };
  metrics: BubblemapsMetrics;
}

// 5. GET /tokens/top-holders/{chain}/{address}
export interface BubblemapsTopHoldersResponse {
  chain: string;
  token_address: string;
  top_holders: BubblemapsTopHolder[];
}

// 6. GET /tokens/search?q={query}&chain={chain}
export interface BubblemapsTokenSearchResult {
  chain: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo_url?: string;
  has_map: boolean;
}

// 7. GET /tokens/metadata/{chain}/{address}
export interface BubblemapsTokenMetadata {
  chain: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply?: string;
  holder_count?: number;
  verified?: boolean;
}

// 8. POST /tokens/metadata-batch
export interface BubblemapsBatchTokenQuery {
  chain: string;
  address: string;
}

// 9. GET /addresses/metadata/{chain}/{address}
export interface BubblemapsAddressMetadata {
  chain: string;
  address: string;
  details: BubblemapsAddressDetails;
}

// 10. POST /addresses/metadata-batch
export interface BubblemapsBatchAddressQuery {
  chain: string;
  address: string;
}

// 11. POST /relationships/subgraph
export interface BubblemapsSubgraphRequest {
  chain: string;
  addresses: string[];
}

export interface BubblemapsSubgraphResponse {
  nodes: BubblemapsAddressDetails[];
  relationships: BubblemapsRelationship[];
}
