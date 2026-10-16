// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';
import { createSiweMessage, parseSiweMessage } from '../../src/utils/siwe';

describe('SIWE message formatting and roundtrip', () => {
  it('generates an EIP-4361 compliant message without illegal leading whitespace', () => {
    const params = {
      domain: 'alphabag.xyz',
      address: '0x1111111111111111111111111111111111111111',
      statement: 'Sign in to AlphaBAG Protocol Hub.',
      uri: 'https://alphabag.xyz',
      version: '1',
      chainId: 56,
      nonce: 'a1b2c3d4e5f6',
      issuedAt: '2026-10-15T12:00:00.000Z'
    };

    const message = createSiweMessage(params);

    // Verify every line has no unexpected leading spaces
    const lines = message.split('\n');
    lines.forEach((line) => {
      if (line.length > 0) {
        expect(line).toBe(line.trimStart());
      }
    });

    // Check strict structure
    expect(lines[0]).toBe('alphabag.xyz wants you to sign in with your Ethereum account:');
    expect(lines[1]).toBe(getAddress('0x1111111111111111111111111111111111111111'));
    expect(lines[2]).toBe('');
    expect(lines[3]).toBe('Sign in to AlphaBAG Protocol Hub.');
    expect(lines[4]).toBe('');
    expect(lines[5]).toBe('URI: https://alphabag.xyz');
    expect(lines[6]).toBe('Version: 1');
    expect(lines[7]).toBe('Chain ID: 56');
    expect(lines[8]).toBe('Nonce: a1b2c3d4e5f6');
    expect(lines[9]).toBe('Issued At: 2026-10-15T12:00:00.000Z');
  });

  it('checksums lowercase addresses correctly using viem getAddress', () => {
    const rawLowerAddress = '0x53464971a475e63833180f439c9f488274add5c9';
    const checksummed = getAddress(rawLowerAddress);

    const message = createSiweMessage({
      domain: 'alphabag.xyz',
      address: rawLowerAddress,
      uri: 'https://alphabag.xyz',
      chainId: 1,
      nonce: 'nonce12345678',
      issuedAt: '2026-10-15T12:00:00.000Z'
    });

    expect(message).toContain(checksummed);
  });

  it('round-trips through backend SiweMessage parser without error', () => {
    const originalParams = {
      domain: 'alphabag.xyz',
      address: '0x2222222222222222222222222222222222222222',
      statement: 'Sign in to AlphaBAG Protocol Hub.',
      uri: 'https://alphabag.xyz',
      version: '1',
      chainId: 56,
      nonce: '9876543210ab',
      issuedAt: '2026-10-15T14:30:00.000Z'
    };

    const message = createSiweMessage(originalParams);
    
    // Test direct parsing with the official backend SiweMessage parser
    const backendParsed = new SiweMessage(message);
    expect(backendParsed.domain).toBe(originalParams.domain);
    expect(backendParsed.address).toBe(getAddress(originalParams.address));
    expect(backendParsed.statement).toBe(originalParams.statement);
    expect(backendParsed.uri).toBe(originalParams.uri);
    expect(backendParsed.version).toBe(originalParams.version);
    expect(backendParsed.chainId).toBe(originalParams.chainId);
    expect(backendParsed.nonce).toBe(originalParams.nonce);
    expect(backendParsed.issuedAt).toBe(originalParams.issuedAt);

    // Test helper parseSiweMessage
    const parsed = parseSiweMessage(message);
    expect(parsed).not.toBeNull();
    expect(parsed?.domain).toBe(originalParams.domain);
    expect(parsed?.address).toBe(getAddress(originalParams.address));
  });
});
