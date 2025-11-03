// src/components/AssetBalance.tsx

'use client';

import { useState, useEffect } from 'react';
// Importar Stellar SDK para consultar la red
import { Horizon } from '@stellar/stellar-sdk';
// Importar constantes
import { HORIZON_URLS, type Asset } from '../lib/constants';
// Importar Spinner
import Spinner from './Spinner';

/**
 * Componente AssetBalance
 * 
 * Propósito: Mostrar el balance de un asset nativo
 * 
 * Props:
 * - publicKey: Public key del usuario
 * - asset: Objeto con { code, issuer } del asset a consultar
 * 
 * MEJORA: Ahora recibe un objeto Asset completo en vez de props separadas
 * Esto hace el componente más flexible y reutilizable
 */
type AssetBalanceProps = {
  publicKey: string;
  asset: Asset;
};

export default function AssetBalance({ publicKey, asset }: AssetBalanceProps) {
  // Estado para guardar el balance
  const [balance, setBalance] = useState<string | null>(null);
  
  // Estado para mostrar loading
  const [loading, setLoading] = useState<boolean>(false);
  
  // Estado para errores
  const [error, setError] = useState<string | null>(null);

  /**
   * Función para consultar el balance desde Stellar
   */
  const fetchBalance = async (): Promise<void> => {
    // Si no hay public key, no hacer nada
    if (!publicKey) {
      setError('Conecta tu wallet primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear conexión al servidor de Stellar (testnet)
      // Usando constante centralizada en vez de hardcodear URL
      const server = new Horizon.Server(HORIZON_URLS.testnet);
      
      // Cargar la cuenta desde la red
      // Esto trae TODOS los datos de la cuenta
      const account = await server.loadAccount(publicKey);

      // account.balances es un array con todos los assets que la cuenta tiene
      // Ejemplo:
      // [
      //   { asset_type: 'native', balance: '100.0000000' },  // XLM
      //   { asset_code: 'USDC', asset_issuer: 'GBBD47...', balance: '50.0000000' },
      //   { asset_code: 'EURC', asset_issuer: 'GBBD47...', balance: '25.0000000' }
      // ]
      
      // Buscar el asset específico que queremos
      // IMPORTANTE: Comparamos AMBOS (código Y issuer)
      const assetBalance = account.balances.find(
        (b: any) => b.asset_code === asset.code && b.asset_issuer === asset.issuer
      );

      // Si encontramos el balance, guardarlo
      // Si no, poner '0' (no tiene trustline o balance vacío)
      setBalance(assetBalance ? assetBalance.balance : '0');
    } catch (err: any) {
      // Manejar diferentes tipos de errores
      if (err?.response?.status === 404) {
        // Cuenta no existe (no está fondeada)
        setError('Cuenta no encontrada. ¿Tienes XLM en testnet?');
      } else {
        // Otro error
        setError(`Error: ${err?.message ?? 'desconocido'}`);
      }
      // eslint-disable-next-line no-console
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * useEffect: Consultar balance automáticamente cuando cambia publicKey o asset
   */
  useEffect(() => {
    if (publicKey) {
      fetchBalance();
    }
  }, [publicKey, asset.code, asset.issuer]); // Dependencias: recarga si cambia el asset

  // ========== RENDER DEL COMPONENTE ==========
  
  return (
    <div className="p-6 card-dark rounded-lg shadow-md">
      {/* Título */}
      <h2 className="text-2xl font-bold mb-2 text-white">
        💰 Balance de {asset.code}
      </h2>

      {/* Mostrar issuer (primeros 8 caracteres para no saturar) */}
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Issuer: {asset.issuer.slice(0, 8)}...
      </p>

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-3 alert-error rounded">
          <p className="text-red-200 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Botón para refrescar balance */}
      <button
        onClick={fetchBalance}
        disabled={loading || !publicKey}
        className="w-full px-4 py-2 btn-primary text-white font-semibold rounded-lg 
                   disabled:cursor-not-allowed transition-colors mb-4 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner />
            <span>Cargando...</span>
          </>
        ) : (
          '🔄 Actualizar Balance'
        )}
      </button>

      {/* Mostrar balance */}
      {balance !== null && (
        <div className="card-success p-6 rounded-lg">
          <p className="text-4xl font-bold text-white text-center">
            {balance} {asset.code}
          </p>

          {/* Mensaje si el balance es 0 */}
          {balance === '0' && (
            <div className="mt-4 p-3 glass-info rounded">
              <p className="text-sm text-white text-center">
                No tienes {asset.code}. 
              </p>
              <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                💡 Tip: Crea una trustline primero, luego usa Stellar Laboratory 
                para enviar {asset.code} de prueba a tu cuenta.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Info adicional */}
      <div className="mt-4 p-3 glass-info rounded-lg">
        <p className="text-xs text-white">
          <strong>💡 ¿Cómo obtener {asset.code} en testnet?</strong>
        </p>
        <ol className="text-xs text-[var(--text-secondary)] mt-2 space-y-1 list-decimal list-inside">
          <li>Ve a <a href="https://laboratory.stellar.org" target="_blank" className="text-[var(--brand-lavender)] hover:text-white underline">Stellar Laboratory</a></li>
          <li>Crea otra cuenta de prueba con Friendbot</li>
          <li>Crea trustline para {asset.code} en esa cuenta</li>
          <li>Usa "Build Transaction" → "Payment" para enviar {asset.code} a tu cuenta</li>
        </ol>
      </div>
    </div>
  );
}