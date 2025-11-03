// src/lib/constants.ts

/**
 * Constantes de Assets para la dApp
 * 
 * IMPORTANTE: Estos issuers son para TESTNET
 * Para mainnet, se debe cambiar los issuers
 */

export type Asset = {
  code: string;
  issuer: string;
};

export type HorizonUrls = {
  testnet: string;
  mainnet: string;
};

export type NetworkPassphrases = {
  testnet: string;
  mainnet: string;
};

// ⚠️ IMPORTANTE: Este es el issuer CORRECTO de USDC para TESTNET
export const USDC_TESTNET: Asset = {
  code: 'USDC',
  issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
};

// Para referencia: USDC en MAINNET 
export const USDC_MAINNET: Asset = {
  code: 'USDC',
  issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
};

// Otros assets útiles en testnet
export const EURC_TESTNET: Asset = {
  code: 'EURC',
  issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
};

// XLM Native (no tiene issuer)
export const XLM = {
  code: 'XLM',
  issuer: null
};

// Horizon endpoints
export const HORIZON_URLS: HorizonUrls = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org'
};

// Network passphrases
export const NETWORK_PASSPHRASES: NetworkPassphrases = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015'
};
