import React from 'react';
import { Landing } from '../pages/frontend/Landing';
import { AlphaPasses } from '../pages/frontend/AlphaPasses';
import { GenesisLanding } from '../pages/frontend/GenesisLanding';
import { GenesisManifesto } from '../pages/frontend/GenesisManifesto';
import { Airdrop } from '../pages/frontend/Airdrop';
import staticRoutes from './staticRoutes.json';

export interface PrerenderRoute {
  path: string;
  Component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  getData?: () => Promise<Array<{ slug: string; preloaded?: Record<string, unknown> }>>;
}

const COMPONENT_BY_PATH: Record<string, React.ComponentType<any>> = {
  '/': Landing,
  '/alpha-passes': AlphaPasses,
  '/genesis': GenesisLanding,
  '/genesis-manifesto': GenesisManifesto,
  '/airdrop': Airdrop,
};

export const prerenderRoutes: PrerenderRoute[] = (
  staticRoutes as Array<{ path: string }>
).map((r) => ({
  path: r.path,
  Component: COMPONENT_BY_PATH[r.path] || Landing,
}));
