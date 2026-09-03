import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig } from 'wagmi';
import { config } from '../lib/wagmi';
import { AuthProvider } from '../context/AuthContext';
import { WalletProvider } from '../context/WalletContext';

export interface RenderInput {
  path: string;
  Component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  preloaded?: Record<string, unknown>;
  routePattern?: string;
}

export interface RenderOutput {
  bodyHtml: string;
  headHtml: string;
}

export async function renderRoute(input: RenderInput): Promise<RenderOutput> {
  const routePattern = input.routePattern ?? input.path;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const helmetContext: { helmet?: any } = {};

  const prevCanUseDOM = (HelmetProvider as any).canUseDOM;
  (HelmetProvider as any).canUseDOM = false;

  const prevConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (
      first.includes('useLayoutEffect does nothing on the server') ||
      first.includes('React does not recognize the')
    ) {
      return;
    }
    prevConsoleError(...(args as []));
  };

  try {
    const bodyHtml = renderToString(
      <HelmetProvider context={helmetContext}>
        <WagmiConfig config={config as any}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <WalletProvider>
                <MemoryRouter initialEntries={[input.path]}>
                <Routes>
                  <Route
                    path={routePattern}
                    element={<input.Component {...(input.props ?? {})} />}
                  />
                </Routes>
              </MemoryRouter>
              </WalletProvider>
            </AuthProvider>
          </QueryClientProvider>
        </WagmiConfig>
      </HelmetProvider>
    );

    const h = helmetContext.helmet;
    const headHtml = h
      ? [
          h.title ? h.title.toString() : '',
          h.meta ? h.meta.toString() : '',
          h.link ? h.link.toString() : '',
          h.script ? h.script.toString() : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    return { bodyHtml, headHtml };
  } finally {
    (HelmetProvider as any).canUseDOM = prevCanUseDOM;
    console.error = prevConsoleError;
  }
}

export const DEFAULT_HEAD_PATTERNS: RegExp[] = [
  /<title[^>]*>[\s\S]*?<\/title>/gi,
  /<meta\s+[^>]*name=["']description["'][^>]*>/gi,
  /<meta\s+[^>]*name=["']keywords["'][^>]*>/gi,
  /<link\s+[^>]*rel=["']canonical["'][^>]*>/gi,
  /<meta\s+[^>]*name=["']robots["'][^>]*>/gi,
  /<meta\s+[^>]*property=["']og:[^"']*["'][^>]*>/gi,
  /<meta\s+[^>]*name=["']twitter:[^"']*["'][^>]*>/gi,
  /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
];

export function injectIntoTemplate(
  template: string,
  parts: { headHtml: string; bodyHtml: string; preloaded?: Record<string, unknown> }
): string {
  let html = template;
  for (const re of DEFAULT_HEAD_PATTERNS) {
    html = html.replace(re, '');
  }
  html = html.replace('</head>', `${parts.headHtml}\n</head>`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${parts.bodyHtml}</div>`);
  if (parts.preloaded) {
    const json = JSON.stringify(parts.preloaded).replace(/</g, '\\u003c');
    html = html.replace(
      '<script type="module"',
      `<script>window.__PRELOADED__=${json}</script>\n<script type="module"`
    );
  }
  return html;
}
