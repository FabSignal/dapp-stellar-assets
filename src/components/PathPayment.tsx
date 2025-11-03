// src/components/PathPayment.tsx

'use client';

import { useState } from 'react';
import { 
  Horizon,
  TransactionBuilder, 
  Operation, 
  Asset, 
  Networks,
  Transaction
} from '@stellar/stellar-sdk';
import { signTransaction, getAddress } from '@stellar/freighter-api';
import { supabase } from '../lib/supabase';
import { HORIZON_URLS } from '../lib/constants';
import Spinner from './Spinner';

/**
 * Props del componente PathPayment
 */
interface PathPaymentProps {
  sourceAsset: Asset;
  destAsset: Asset;
}

type StatusType = '' | 'success' | 'error';

/**
 * Componente PathPayment
 * 
 * Propósito: Realizar pagos con conversión automática de assets
 * usando el DEX de Stellar
 * 
 * Props:
 * - sourceAsset: Asset que se enviará
 * - destAsset: Asset que recibirá el destinatario
 */
export default function PathPayment({ sourceAsset, destAsset }: PathPaymentProps) {
  // Estado para la cantidad a enviar
  const [amount, setAmount] = useState<string>('');
  
  // Estado para la cuenta destino
  const [destination, setDestination] = useState<string>('');
  
  // Estado para mostrar loading
  const [loading, setLoading] = useState<boolean>(false);
  
  // Estado para mensajes de éxito/error
  const [status, setStatus] = useState<{ type: StatusType; message: string }>({ 
    type: '', 
    message: '' 
  });

  /**
   * Función principal para enviar Path Payment
   * Path Payment = Enviar un asset y que el receptor reciba otro
   * Stellar convierte automáticamente usando el DEX
   */
  const sendPathPayment = async (): Promise<void> => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // ========== VALIDACIÓN DE CANTIDAD ==========
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Ingresa una cantidad válida');
      }

      // ========== OBTENER PUBLIC KEY ==========
      const addressResult = await getAddress();
      
      if (addressResult.error) {
        throw new Error(addressResult.error);
      }
      
      const publicKey = addressResult.address;
      
      if (!publicKey) {
        throw new Error('No se pudo obtener la public key. ¿Está Freighter conectado?');
      }

      console.log('✅ Public Key obtenida:', publicKey);

      // Si no hay destino, enviar a sí mismo (para probar)
      const destKey = destination || publicKey;

      // ========== CONECTAR A STELLAR ==========
      const server = new Horizon.Server(HORIZON_URLS.testnet);
      const account = await server.loadAccount(publicKey);

      console.log('✅ Cuenta cargada');

      // ========== CREAR OBJETOS ASSET ==========
      // Si el asset es XLM (nativo), usar Asset.native()
      const source = sourceAsset.getCode() === 'XLM' 
        ? Asset.native() 
        : sourceAsset;
      
      const dest = destAsset.getCode() === 'XLM'
        ? Asset.native()
        : destAsset;

      console.log('✅ Assets definidos:', source.getCode(), '→', dest.getCode());

      // ========== CONSTRUIR TRANSACCIÓN ==========
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.pathPaymentStrictSend({
            sendAsset: source,        // Asset que envías
            sendAmount: amount,        // Cantidad que envías
            destination: destKey,      // Cuenta que recibe
            destAsset: dest,          // Asset que recibe
            destMin: '0.0000001'              // Mínimo aceptable (0 para testnet)
          })
        )
        .setTimeout(30)
        .build();

      console.log('✅ Transacción construida');

      // ========== FIRMAR CON FREIGHTER ==========
      const xdr = transaction.toXDR();
      
      console.log('📝 XDR sin firmar:', xdr.substring(0, 50) + '...');
      
      const signResult = await signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET
      });
      
      if (signResult.error) {
        throw new Error(signResult.error);
      }
      
      const signedTxXdr = signResult.signedTxXdr;
      
      console.log('✅ Transacción firmada');

      // ========== RECONSTRUIR TRANSACCIÓN FIRMADA ==========
      const signedTransaction = new Transaction(signedTxXdr, Networks.TESTNET);

      // ========== ENVIAR A STELLAR ==========
      console.log('🚀 Enviando transacción...');
      
      const result = await server.submitTransaction(signedTransaction);
      
      console.log('✅ Transacción exitosa:', result.hash);

      // ========== GUARDAR EN SUPABASE ==========
      const { error: dbError } = await supabase.from('transactions').insert({
        user_id: publicKey,
        tx_type: 'path_payment',
        tx_hash: result.hash,
        source_asset: sourceAsset.getCode(),
        dest_asset: destAsset.getCode(),
        amount: parseFloat(amount),
      });

      if (dbError) {
        console.error('⚠️ Error guardando en Supabase:', dbError);
        // No lanzamos error porque el path payment SÍ se completó
      } else {
        console.log('✅ Guardado en Supabase');
      }

      // ========== NOTIFICAR ÉXITO ==========
      setStatus({
        type: 'success',
        message: `✅ Path Payment exitoso! Hash: ${result.hash.slice(0, 8)}...`
      });

    } catch (err: any) {
      // ========== MANEJO DE ERRORES ==========
      console.error('❌ Error in path payment:', err);
      
      let errorMessage = 'Error desconocido';
      
      if (typeof err?.message === 'string' && err.message.includes('User declined')) {
        errorMessage = '❌ Rechazaste la transacción';
      } else if (typeof err?.message === 'string' && err.message.includes('User rejected')) {
        errorMessage = '❌ Rechazaste la transacción';
      } else if (err?.response?.data?.extras?.result_codes) {
        // Errores específicos de Stellar
        const code = err.response.data.extras.result_codes.operations?.[0];
        
        if (code === 'op_no_destination') {
          errorMessage = '🔍 La cuenta destino no existe';
        } else if (code === 'op_no_trust') {
          errorMessage = '⚠️ El destino no tiene trustline para ese asset';
        } else if (code === 'op_under_dest_min') {
          errorMessage = '💱 No hay suficiente liquidez en el DEX';
        } else if (code === 'op_over_source_max') {
          errorMessage = '💰 Cantidad insuficiente';
        } else if (code === 'op_underfunded') {
          errorMessage = '💸 Balance insuficiente';
        } else if (code === 'op_src_no_trust') {
          errorMessage = '⚠️ No tienes trustline para el asset origen';
        } else {
          errorMessage = `🌐 Error de Stellar: ${code}`;
        }
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
    <div className="p-6 card-dark rounded-lg shadow-md border-l-4 border-l-[var(--brand-purple-light)]">
      {/* Header con badge */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white">
          💸 Path Payment
        </h2>
        <span className="px-3 py-1 glass-info text-white text-xs font-semibold rounded-full border">
          AVANZADO
        </span>
      </div>
      
      {/* Descripción */}
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Convierte <strong>{sourceAsset.getCode()}</strong> a{' '}
        <strong>{destAsset.getCode()}</strong> automáticamente
      </p>

      {/* Info box */}
      <div className="mb-4 p-3 glass-info rounded-lg border">
        <p className="text-xs text-white">
          💡 Path payment = Envías un asset, receptor recibe otro. 
          Stellar convierte usando el DEX.
        </p>
      </div>

      {/* Input: Cantidad */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-1">
          Cantidad ({sourceAsset.getCode()})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 bg-[rgba(15,12,41,0.6)] border border-[var(--brand-lavender)] rounded-lg 
                     text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-purple-light)]"
          placeholder="Ej: 10"
          min="0"
          step="0.0000001"
        />
      </div>

      {/* Input: Destino */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-1">
          Destino (opcional)
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full p-2 bg-[rgba(15,12,41,0.6)] border border-[var(--brand-lavender)] rounded-lg 
                     text-white text-xs font-mono placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-purple-light)]"
          placeholder="GABC...XYZ o vacío para ti mismo"
        />
      </div>

      {/* Mostrar mensaje de status */}
      {status.message && (
        <div className={`p-3 rounded-lg mb-4 ${
          status.type === 'success'
            ? 'alert-success'
            : 'alert-error'
        }`}>
          <p className="text-sm text-white">{status.message}</p>
        </div>
      )}

      {/* Botón para enviar */}
      <button
        onClick={sendPathPayment}
        disabled={loading || !amount}
        className="w-full px-6 py-3 btn-primary text-white font-semibold rounded-lg 
                   disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner />
            <span>Enviando...</span>
          </>
        ) : (
          '💸 Enviar Path Payment'
        )}
      </button>

      {/* Warning sobre liquidez en testnet */}
      <div className="mt-4 p-3 glass-info rounded-lg border">
        <p className="text-xs text-white">
          ⚠️ En testnet la liquidez es limitada. 
          Puede que no encuentre una ruta de conversión.
        </p>
      </div>
    </div>
  );
}