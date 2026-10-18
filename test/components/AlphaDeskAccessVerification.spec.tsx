// SPDX-License-Identifier: MIT
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '../../src/components/frontend/Sidebar';
import Swal from 'sweetalert2';

// Mock Swal
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: false, dismiss: 'cancel' }),
    DismissReason: {
      cancel: 'cancel',
      backdrop: 'backdrop',
      close: 'close',
      esc: 'esc',
      timer: 'timer',
    },
  },
}));

// Mock useFeatures
vi.mock('../../src/hooks/useFeatures', () => ({
  useFeatures: vi.fn().mockReturnValue({
    data: { disabledPages: [] },
    isLoading: false,
  }),
}));

// Auth mock state holder
let mockAuthState = {
  user: null as any,
  isAuthenticated: false,
  logout: vi.fn(),
};

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

describe('Alpha Desk Premium Tier Verification on Navigation & Links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    };
  });

  it('renders Alpha Desk in Sidebar with PRO badge', () => {
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    expect(deskLink).toBeInTheDocument();
    expect(deskLink).toHaveTextContent(/PRO/i);
  });

  it('prompts wallet connection when an unauthenticated user clicks Alpha Desk', () => {
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    fireEvent.click(deskLink);

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'PREMIUM VERIFICATION',
        confirmButtonText: 'CONNECT WALLET',
      })
    );
  });

  it('prompts tier upgrade when an authenticated FREE user clicks Alpha Desk', () => {
    mockAuthState = {
      user: { id: '1', email: 'trader@alphabag.com', tier: 'FREE' },
      isAuthenticated: true,
      logout: vi.fn(),
    };

    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    fireEvent.click(deskLink);

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'PREMIUM TIER REQUIRED',
        confirmButtonText: 'UPGRADE TIER',
      })
    );
  });

  it('allows navigation without warning when user has PREMIUM tier', () => {
    mockAuthState = {
      user: { id: '2', email: 'pro@alphabag.com', tier: 'PREMIUM' },
      isAuthenticated: true,
      logout: vi.fn(),
    };

    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    fireEvent.click(deskLink);

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(deskLink.getAttribute('href')).toBe('/alpha-desk');
  });

  it('allows navigation without warning when user has ALPHA_VIP or ULTIMATE tier', () => {
    mockAuthState = {
      user: { id: '3', email: 'vip@alphabag.com', tier: 'ALPHA_VIP' },
      isAuthenticated: true,
      logout: vi.fn(),
    };

    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    fireEvent.click(deskLink);

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(deskLink.getAttribute('href')).toBe('/alpha-desk');
  });
});
