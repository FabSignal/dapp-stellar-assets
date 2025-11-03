// src/components/CreateTrustline.tsx

'use client';

import { useState } from 'react';
// Importar clases necesarias de Stellar SDK
import { 
  Horizon,           // Para conectar a Stellar
  TransactionBuilder, // Para construir transacciones
  Operation,        // Para operaciones (ChangeTrust)
  Asset,            // Para definir assets (SIN "as SdkAsset")
  Networks,         // Para especificar red (testnet/mainnet)
  Transaction       // Para reconstruir transacción firmada
} from '@stellar/stellar-sdk';
// Importar Freighter API para firmar
import { getAddress, signTransaction } from '@stellar/freighter-api';
// Importar cliente de Supabase
import { supabase } from '../lib/supabase';
// Importar constantes
import { HORIZON_URLS, type Asset as AssetType } from '../lib/constants';
// Importar Spinner
import Spinner from './Spinner';

type CreateTrustlineProps = {
  asset: AssetType;
  onSuccess?: () => void;
};

type StatusType = '' | 'success' | 'warning' | 'error';

/**
 * Componente CreateTrustline
 * 
 * Propósito: Crear una trustline para un asset nativo
 * 
 * Props:
 * - asset: Objeto { code, issuer } del asset
 * - onSuccess: Callback cuando trustline se crea exitosamente
 * 
 * MEJORA: Ahora valida si la trustline ya existe antes de crearla
 */
export default function CreateTrustline({ asset, onSuccess }: CreateTrustlineProps) {
  // Estado para mostrar loading
  const [loading, setLoading] = useState(false);
  
  // Estado para mensajes de éxito/error
  const [status, setStatus] = useState<{ type: StatusType; message: string }>({ type: '', message: '' });
  
  // Estado para saber si la trustline ya existe
  const [trustlineExists, setTrustlineExists] = useState(false);

  /**
   * Función para verificar si la trustline ya existe
   * Se llama antes de intentar crearla
   */
  const checkExistingTrustline = async (
    publicKey: string
  ): Promise<{ exists: boolean; source: 'blockchain' | 'database' | null }> => {
    try {
      // Verificar en Stellar Network
      const server = new Horizon.Server(HORIZON_URLS.testnet);
      const account = await server.loadAccount(publicKey);
      
      // Buscar si ya existe el asset en los balances
      const existsOnChain = account.balances.some(
        (b: any) => b.asset_code === asset.code && b.asset_issuer === asset.issuer
      );
      
      if (existsOnChain) {
        return { exists: true, source: 'blockchain' };
      }
      
      // Si no existe en blockchain, verificar en Supabase
      // (por si hubo un error anterior y quedó registrado)
      const { data, error } = await supabase
        .from('trustlines')
        .select('*')
        .eq('user_id', publicKey)
        .eq('asset_code', asset.code)
        .eq('asset_issuer', asset.issuer)
        .limit(1);
      
      if (error) {
        console.error('Error checking Supabase:', error);
        return { exists: false, source: null };
      }
      
      if (data && data.length > 0) {
        return { exists: true, source: 'database' };
      }
      
      return { exists: false, source: null };
      
    } catch (err) {
      console.error('Error checking trustline:', err);
      return { exists: false, source: null };
    }
  };

  /**
   * Función principal para crear la trustline
   */
  const createTrustline = async (): Promise<void> => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // ========== PASO 1: OBTENER PUBLIC KEY ==========
      const addressResult = await getAddress();
      
      if (addressResult.error) {
        throw new Error(addressResult.error);
      }
      
      const publicKey = addressResult.address;
      
      if (!publicKey) {
        throw new Error('No se pudo obtener la public key. ¿Está Freighter conectado?');
      }

      console.log('✅ Public Key obtenida:', publicKey);

      // ========== PASO 1.5: VERIFICAR SI YA EXISTE ==========
      // MEJORA: Evitar crear trustlines duplicadas
      const { exists } = await checkExistingTrustline(publicKey);
      
      if (exists) {
        setTrustlineExists(true);
        setStatus({
          type: 'warning',
          message: `⚠️ Ya tienes una trustline para ${asset.code}. No necesitas crear otra.`
        });
        setLoading(false);
        return; // Salir sin crear
      }

      // ========== PASO 2: CONECTAR A STELLAR ==========
      const server = new Horizon.Server(HORIZON_URLS.testnet);
      
      console.log('🔗 Conectando a Stellar Testnet...');
      
      // Cargar la cuenta para obtener su sequence number
      const account = await server.loadAccount(publicKey);
      
      console.log('✅ Cuenta cargada, sequence:', account.sequenceNumber());

      // ========== PASO 3: DEFINIR EL ASSET ==========
      // Crear objeto Asset desde las props
      const stellarAsset = new Asset(asset.code, asset.issuer);
      
      console.log('✅ Asset definido:', asset.code, asset.issuer);

      // ========== PASO 4: CONSTRUIR LA TRANSACCIÓN ==========
      const transaction = new TransactionBuilder(account, {
        // Fee: 100 stroops = 0.00001 XLM
        fee: '100',
        
        // Network: TESTNET (MUY IMPORTANTE)
        networkPassphrase: Networks.TESTNET
      })
        // Agregar la operación ChangeTrust
        .addOperation(
          Operation.changeTrust({
            asset: stellarAsset,    // El asset para crear trustline
            limit: '10000'          // Límite: máximo que quieres tener
          })
        )
        // Timeout: Transacción expira en 30 segundos
        .setTimeout(30)
        // Construir (prepara para firmar)
        .build();

      console.log('✅ Transacción construida');

      // ========== PASO 5: FIRMAR CON FREIGHTER ==========
      // Convertir a XDR (formato que Freighter entiende)
      const xdr = transaction.toXDR();
      
      console.log('📝 XDR sin firmar:', xdr.substring(0, 50) + '...');
      
      // Pedir a Freighter que firme (abre popup)
      const signResult = await signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET
      });
      
      if (signResult.error) {
        throw new Error(signResult.error);
      }
      
      const signedTxXdr = signResult.signedTxXdr;
      
      console.log('✅ Transacción firmada por Freighter');
      console.log('📝 XDR firmado:', signedTxXdr.substring(0, 50) + '...');

      // ========== PASO 6: ENVIAR A STELLAR ==========
      // 🔥 CORRECCIÓN: Usar Transaction.fromXDR en lugar de TransactionBuilder.fromXDR
      const signedTransaction = new Transaction(signedTxXdr, Networks.TESTNET);
      
      console.log('🚀 Enviando transacción a Stellar...');
      
      // Enviar a la red (3-5 segundos)
      const result = await server.submitTransaction(signedTransaction);
      
      console.log('✅ Transacción enviada exitosamente:', result.hash);

      // ========== PASO 7: GUARDAR EN SUPABASE ==========
      // Guardar metadata en nuestra base de datos
      const { error: dbError } = await supabase
        .from('trustlines')
        .insert({
          user_id: publicKey,
          asset_code: asset.code,
          asset_issuer: asset.issuer,
          trust_limit: 10000,
          tx_hash: result.hash  // Hash de blockchain
        });

      if (dbError) {
        console.error('⚠️ Error saving to Supabase:', dbError);
        // No lanzamos error porque la trustline SÍ se creó en Stellar
      } else {
        console.log('✅ Guardado en Supabase');
      }

      // ========== PASO 8: NOTIFICAR ÉXITO ==========
      setStatus({
        type: 'success',
        message: `✅ Trustline creada exitosamente! Ahora puedes recibir ${asset.code}.`
      });
      
      setTrustlineExists(true); // Marcar que ya existe
      
      // Llamar callback si existe
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      // ========== MANEJO DE ERRORES ==========
      console.error('❌ Error creating trustline:', err);
      
      // Diferentes tipos de errores
      let errorMessage = 'Error desconocido';
      
      if (typeof err?.message === 'string' && err.message.includes('User declined')) {
        errorMessage = '❌ Rechazaste la transacción en Freighter';
      } else if (typeof err?.message === 'string' && err.message.includes('User rejected')) {
        errorMessage = '❌ Rechazaste la transacción en Freighter';
      } else if (err?.response?.data) {
        // Errores de Stellar
        const resultCode = err.response.data.extras?.result_codes?.operations?.[0];
        
        if (resultCode === 'op_low_reserve') {
          errorMessage = '💰 Balance insuficiente. Necesitas al menos 0.5 XLM más.';
        } else if (resultCode === 'op_line_full') {
          errorMessage = '⚠️ Ya tienes la trustline creada.';
        } else if (resultCode === 'op_malformed') {
          errorMessage = '🔧 Error en la construcción de la transacción. Verifica el asset.';
        } else {
          errorMessage = `🌐 Error de Stellar: ${resultCode || 'Desconocido'}`;
        }
      } else if (err?.message === 'Request failed with status code 400') {
        errorMessage = '🔧 Error al procesar la transacción firmada. Verifica el formato del XDR.';
      } else if (typeof err?.message === 'string') {
        errorMessage = err.message;
      }
      
      setStatus({
        type: 'error',
        message: `❌ ${errorMessage}`
      });
      
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER DEL COMPONENTE ==========
  
  return (
    <div className="p-6 card-dark rounded-lg shadow-md">
      {/* Título */}
      <h2 className="text-2xl font-bold mb-2 text-white">
        ✅ Crear Trustline
      </h2>
      
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Esto te permitirá recibir y enviar <strong>{asset.code}</strong>
      </p>
      
      {/* Warning sobre el costo */}
      <div className="glass-info p-3 rounded-lg border mb-4">
        <p className="text-sm text-white">
          ⚠️ <strong>Costo:</strong> 0.5 XLM de base reserve (recuperable si eliminas la trustline)
        </p>
      </div>
      
      {/* Mostrar mensaje de status */}
      {status.message && (
        <div className={`p-3 rounded-lg mb-4 ${
          status.type === 'success' 
            ? 'alert-success'
            : status.type === 'warning'
            ? 'glass-info border'
            : 'alert-error'
        }`}>
          <p className="text-sm text-white">{status.message}</p>
        </div>
      )}
      
      {/* Botón para crear trustline */}
      <button
        onClick={createTrustline}
        disabled={loading || trustlineExists}
        className="w-full px-6 py-3 btn-primary text-white font-semibold rounded-lg 
                   disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner />
            <span>Creando...</span>
          </>
        ) : trustlineExists ? (
          '✅ Trustline Ya Existe'
        ) : (
          '✅ Crear Trustline'
        )}
      </button>
      
      {/* Información adicional */}
      <div className="mt-4 p-3 glass-info rounded-lg">
        <p className="text-xs text-white">
          <strong>¿Qué pasa cuando creas una trustline?</strong>
        </p>
        <ul className="text-xs text-[var(--text-secondary)] mt-2 space-y-1 list-disc list-inside">
          <li>Se "congela" 0.5 XLM (base reserve)</li>
          <li>Puedes recibir hasta 10,000 {asset.code}</li>
          <li>La transacción se registra en blockchain</li>
          <li>Freighter te pedirá confirmar (con tu secret key)</li>
          <li>El sistema verifica que no exista una trustline duplicada</li>
        </ul>
      </div>
    </div>
  );
}