// src/app/page.tsx

'use client';

import { useMemo, useState } from 'react';
import WalletConnect from '../components/WalletConnect';
import AssetBalance from '../components/AssetBalance';
import CreateTrustline from '../components/CreateTrustline';
import PathPayment from '../components/PathPayment';
import Stepper from '../components/Stepper';
import { Asset as SdkAsset } from '@stellar/stellar-sdk';
import { USDC_TESTNET } from '../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

type StepId = 'connect' | 'trustline' | 'balance' | 'payment';

export default function Home() {
  const [publicKey, setPublicKey] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<StepId>('connect');
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  const usdcSdkAsset = useMemo(
    () => new SdkAsset(USDC_TESTNET.code, USDC_TESTNET.issuer),
    []
  );
  const xlmAsset = useMemo(() => SdkAsset.native(), []);

  const getStepStatus = (stepId: StepId): 'pending' | 'active' | 'done' => {
    if (completedSteps.has(stepId)) return 'done';
    if (currentStep === stepId) return 'active';
    return 'pending';
  };

  const steps = useMemo(() => [
    {
      id: 'connect',
      title: 'Conectar Wallet',
      description: 'Conecta tu wallet Freighter para comenzar',
      status: getStepStatus('connect')
    },
    {
      id: 'trustline',
      title: 'Crear Trustline',
      description: 'Autoriza recibir USDC en tu cuenta',
      status: getStepStatus('trustline')
    },
    {
      id: 'balance',
      title: 'Ver Balance',
      description: 'Consulta tu saldo de USDC',
      status: getStepStatus('balance')
    },
    {
      id: 'payment',
      title: 'Path Payment',
      description: 'Intercambia assets automáticamente',
      optional: true,
      status: getStepStatus('payment')
    },
  ], [currentStep, completedSteps]);

  const order: StepId[] = ['connect', 'trustline', 'balance', 'payment'];

  const goToStep = (stepId: string) => {
    const step = stepId as StepId;
    if (completedSteps.has(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    const i = order.indexOf(currentStep);
    if (i < order.length - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      setCurrentStep(order[i + 1]);
    } else {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
    }
  };

  const goPrev = () => {
    const i = order.indexOf(currentStep);
    if (i > 0) setCurrentStep(order[i - 1]);
  };

  const resetFlow = () => {
    setCurrentStep('connect');
    setCompletedSteps(new Set());
    setPublicKey('');
  };

  const handleWalletConnect = (key: string) => {
    setPublicKey(key);
  };

  const handleTrustlineSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'connect':
        return !!publicKey;
      case 'trustline':
      case 'balance':
      case 'payment':
        return true;
      default:
        return false;
    }
  };

  const isFlowComplete = completedSteps.has('balance');

  return (
    <main className="min-h-screen flex flex-col">
      <div className="glass-header border-b flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-1">
              ⚡ Stellar Stablecoin Hub
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Infraestructura segura para operar USDC en la red Stellar.
          </p>
        </div>
      </div>

      <div className="flex-1 flex">
        <aside className="w-80 flex-shrink-0 glass-header border-r border-[rgba(203,187,246,0.2)] p-6 sticky top-0 h-screen overflow-y-auto">
          <Stepper steps={steps} onStepClick={goToStep} />
        </aside>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 'connect' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Conecta tu Wallet</h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Necesitamos conectar tu wallet Freighter para interactuar con Stellar.
                      </p>
                    </div>

                    <WalletConnect onConnect={handleWalletConnect} />
                    
                    <div className="flex justify-end">
                      <button
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="px-6 py-2.5 text-sm rounded-lg bg-[rgba(165,147,224,0.2)] 
                                 border border-[var(--brand-lavender)] text-white font-medium
                                 hover:bg-[rgba(165,147,224,0.3)] transition-all
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continuar →
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'trustline' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Crear Trustline</h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Autoriza tu cuenta para recibir y enviar USDC en la red Stellar.
                      </p>
                    </div>

                    <CreateTrustline asset={USDC_TESTNET} onSuccess={handleTrustlineSuccess} />
                    
                    <div className="flex justify-between">
                      <button
                        onClick={goPrev}
                        className="px-4 py-2 text-sm rounded-lg text-[var(--text-muted)]
                                 hover:text-white hover:bg-[rgba(48,43,99,0.3)] transition-all"
                      >
                        ← Atrás
                      </button>
                      <button
                        onClick={goNext}
                        className="px-6 py-2.5 text-sm rounded-lg bg-[rgba(165,147,224,0.2)] 
                                 border border-[var(--brand-lavender)] text-white font-medium
                                 hover:bg-[rgba(165,147,224,0.3)] transition-all"
                      >
                        Continuar →
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'balance' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Consulta tu Balance</h2>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Verifica cuánto USDC tienes disponible en tu cuenta.
                      </p>
                    </div>

                    <AssetBalance
                      key={refreshKey}
                      publicKey={publicKey}
                      asset={USDC_TESTNET}
                    />
                    
                    <div className="flex justify-between items-center">
                      <button
                        onClick={goPrev}
                        className="px-4 py-2 text-sm rounded-lg text-[var(--text-muted)]
                                 hover:text-white hover:bg-[rgba(48,43,99,0.3)] transition-all"
                      >
                        ← Atrás
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={goNext}
                          className="px-6 py-2.5 text-sm rounded-lg bg-[rgba(165,147,224,0.2)] 
                                   border border-[var(--brand-lavender)] text-white font-medium
                                   hover:bg-[rgba(165,147,224,0.3)] transition-all"
                        >
                          Path Payment (opcional) →
                        </button>
                      </div>
                    </div>

                    {isFlowComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 glass-info rounded-lg border text-center"
                      >
                        <p className="text-white text-sm mb-1">
                          ✅ <strong>¡Flujo básico completado!</strong>
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Ya puedes recibir y enviar USDC. El Path Payment es opcional.
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {currentStep === 'payment' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-white">Path Payment</h2>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-[rgba(165,147,224,0.2)] 
                                       border border-[var(--brand-lavender)] text-white font-semibold">
                          OPCIONAL
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Intercambia assets automáticamente usando el DEX de Stellar.
                      </p>
                    </div>

                    <PathPayment sourceAsset={xlmAsset} destAsset={usdcSdkAsset} />
                    
                    <div className="flex justify-between">
                      <button
                        onClick={goPrev}
                        className="px-4 py-2 text-sm rounded-lg text-[var(--text-muted)]
                                 hover:text-white hover:bg-[rgba(48,43,99,0.3)] transition-all"
                      >
                        ← Atrás
                      </button>
                      <button
                        onClick={resetFlow}
                        className="px-6 py-2.5 text-sm rounded-lg bg-[rgba(165,147,224,0.2)] 
                                 border border-[var(--brand-lavender)] text-white font-medium
                                 hover:bg-[rgba(165,147,224,0.3)] transition-all
                                 flex items-center gap-2"
                      >
                        <span>🔄</span>
                        Reiniciar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-12 p-4 card-gradient rounded-lg border">
              <details className="group">
                <summary className="cursor-pointer text-sm font-semibold text-white flex items-center justify-between">
                  <span>📝 Guía rápida</span>
                  <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--text-secondary)]">
                    <li>
                      <strong>Instala Freighter:</strong>{' '}
                      <a 
                        href="https://www.freighter.app" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--brand-lavender)] hover:text-white hover:underline transition-colors"
                      >
                        https://www.freighter.app
                      </a>
                    </li>
                    <li>
                      <strong>Configura Freighter en testnet</strong> (Settings → Network → Testnet)
                    </li>
                    <li>
                      <strong>Obtén XLM gratis:</strong>{' '}
                      <a 
                        href="https://friendbot.stellar.org" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--brand-lavender)] hover:text-white hover:underline transition-colors"
                      >
                        https://friendbot.stellar.org
                      </a>
                    </li>
                    <li><strong>Conecta tu wallet</strong> con el botón de arriba</li>
                    <li><strong>Crea una trustline</strong> para USDC</li>
                    <li><strong>Verifica tu balance</strong> (debería aparecer 0 USDC)</li>
                  </ol>
                  
                  <div className="mt-4 p-3 glass-info rounded border">
                    <p className="text-xs text-white">
                      💡 <strong>Tip:</strong> Puedes usar{' '}
                      <a 
                        href="https://laboratory.stellar.org" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-[var(--brand-lavender)] transition-colors"
                      >
                        Stellar Laboratory
                      </a>
                      {' '}para enviar USDC de testnet a tu cuenta y probar que funciona.
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(203,187,246,0.2)]">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-[var(--text-secondary)]">
          <p>Desarrollado como parte del programa <strong className="text-white">Código Futura - BDB</strong></p>
          <p className="mt-2 text-xs">
            Construido con 💙 como nueva <strong className="text-white">Blockchain Developer</strong>
          </p>
        </div>
      </div>
    </main>
  );
}