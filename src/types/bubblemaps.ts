// Official Bubblemaps B2B API Response Types

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
