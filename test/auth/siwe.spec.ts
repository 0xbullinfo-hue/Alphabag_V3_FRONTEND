import { describe, it, expect } from 'vitest';
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
    expect(lines[1]).toBe('0x1111111111111111111111111111111111111111');
    expect(lines[2]).toBe('');
    expect(lines[3]).toBe('Sign in to AlphaBAG Protocol Hub.');
    expect(lines[4]).toBe('');
    expect(lines[5]).toBe('URI: https://alphabag.xyz');
    expect(lines[6]).toBe('Version: 1');
    expect(lines[7]).toBe('Chain ID: 56');
    expect(lines[8]).toBe('Nonce: a1b2c3d4e5f6');
    expect(lines[9]).toBe('Issued At: 2026-10-15T12:00:00.000Z');
  });

  it('correctly parses an EIP-4361 formatted message back to its parameters', () => {
    const originalParams = {
      domain: 'alphabag.xyz',
      address: '0x2222222222222222222222222222222222222222',
      statement: 'Sign in to AlphaBAG Protocol Hub.',
      uri: 'https://alphabag.xyz',
      version: '1',
      chainId: 1,
      nonce: '9876543210ab',
      issuedAt: '2026-10-15T14:30:00.000Z'
    };

    const message = createSiweMessage(originalParams);
    const parsed = parseSiweMessage(message);

    expect(parsed).not.toBeNull();
    expect(parsed?.domain).toBe(originalParams.domain);
    expect(parsed?.address).toBe(originalParams.address);
    expect(parsed?.uri).toBe(originalParams.uri);
    expect(parsed?.version).toBe(originalParams.version);
    expect(parsed?.chainId).toBe(originalParams.chainId);
    expect(parsed?.nonce).toBe(originalParams.nonce);
    expect(parsed?.issuedAt).toBe(originalParams.issuedAt);
  });
});
