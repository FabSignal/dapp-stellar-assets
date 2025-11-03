// src/components/WalletConnect.tsx

'use client'; // Necesario para Next.js App Router (componente del cliente)

import { useState, useEffect } from 'react';
// Importar funciones de Freighter API
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';

/**
 * Componente WalletConnect
 * 
 * Propósito: Conectar la wallet Freighter del usuario
 * 
 * Props:
 * - onConnect: Función callback que se llama cuando la wallet se conecta
 *   Recibe la public key como argumento
 */

interface WalletConnectProps {
  onConnect: (publicKey: string) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  // Estado para guardar la public key del usuario
  const [publicKey, setPublicKey] = useState<string>('');
  
  // Estado para mostrar loading
  const [loading, setLoading] = useState<boolean>(false);
  
  // Estado para mostrar errores
  const [error, setError] = useState<string | null>(null);

  /**
   * useEffect: Se ejecuta cuando el componente se monta
   * Verifica si Freighter ya está conectado automáticamente
   */
  useEffect(() => {
    async function checkConnection() {
      setLoading(true);
      try {
        // Verificar si Freighter está instalado y conectado
        const connectedResult = await isConnected();
        
        if (connectedResult.isConnected) {
          // Si está conectado, obtener la public key
          const addressResult = await getAddress();
          
          if (!addressResult.error && addressResult.address) {
            setPublicKey(addressResult.address);
            // Notificar al componente padre (page.jsx)
            onConnect(addressResult.address);
          }
        }
      } catch (err) {
        // Si hay error, no hacer nada (usuario probablemente no tiene Freighter)
        console.log('Freighter not connected:', err);
      } finally {
        setLoading(false);
      }
    }
    
    checkConnection();
  }, [onConnect]); // Solo ejecutar una vez al montar

  /**
   * Función para conectar la wallet manualmente
   * Se ejecuta cuando el usuario hace click en el botón
   */
  const connectWallet = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Solicitar acceso a la public key
      // Esto abre un popup de Freighter pidiendo permiso
      const accessResult = await requestAccess();
      
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }
      
      // Guardar public key en el estado
      setPublicKey(accessResult.address);
      
      // Notificar al componente padre
      onConnect(accessResult.address);
      
    } catch (err) {
      // Manejar error y mostrarlo al usuario
      const errorMessage = (err as Error).message;
      
      // Verificar si el error es porque no tiene Freighter instalada
      if (errorMessage.includes('Freighter') || errorMessage.includes('extension')) {
        setError('Freighter Wallet no está instalada');
      } else {
        setError(errorMessage);
      }
      
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función helper para formatear la public key
   * Muestra solo primeros 4 y últimos 4 caracteres
   * Ejemplo: GABC...XYZ9
   */
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // ========== RENDER DEL COMPONENTE ==========
  
  return (
    <div className="p-6 card-dark rounded-lg shadow-md">
      {/* Título */}
      <h2 className="text-2xl font-bold mb-4 text-white">
        🔗 Conectar Wallet
      </h2>
      
      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-3 alert-error rounded">
          <p className="text-red-200 text-sm">❌ {error}</p>
        </div>
      )}
      
      {/* Condicional: ¿Ya está conectado? */}
      {!publicKey ? (
        /* NO conectado: Mostrar botón */
        <div>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full px-6 py-3 btn-primary text-white font-semibold rounded-lg 
                       disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Conectando...' : '🔗 Conectar Freighter'}
          </button>
          
          {/* Link para descargar Freighter si no la tiene */}
          <p className="text-sm text-[var(--text-secondary)] mt-3 text-center">
            ¿No tienes Freighter?{' '}
            <a 
              href="https://www.freighter.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--brand-lavender)] hover:text-white hover:underline"
            >
              Descárgala aquí
            </a>
          </p>
        </div>
      ) : (
        /* SÍ conectado: Mostrar public key */
        <div className="card-success p-4 rounded-lg">
          <p className="text-white font-bold mb-2">
            ✅ Wallet Conectada
          </p>
          <p className="text-sm text-[var(--brand-lavender-light)] font-mono break-all">
            {formatAddress(publicKey)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Public Key: {publicKey}
          </p>
        </div>
      )}
    </div>
  );
}