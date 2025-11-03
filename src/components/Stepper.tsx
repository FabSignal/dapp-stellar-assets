// src/components/Stepper.tsx

"use client";

import { motion } from "framer-motion";

type Step = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "done";
  optional?: boolean;
};

type StepperProps = {
  steps: Step[];
  onStepClick?: (stepId: string) => void;
};

export default function Stepper({ steps, onStepClick }: StepperProps) {
  const activeIndex = steps.findIndex(s => s.status === "active");

  return (
    <div className="h-full flex flex-col">
      {/* Header del sidebar */}
      <div className="pb-6 border-b border-[rgba(203,187,246,0.2)]">
        <h3 className="text-lg font-bold text-white mb-1">Tu progreso</h3>
        <p className="text-xs text-[var(--text-muted)]">
          {steps.filter(s => s.status === "done").length} de {steps.length} completados
        </p>
      </div>

      {/* Lista dde pasos */}
      <nav className="flex-1 py-6 space-y-2">
        {steps.map((step, index) => {
          const isActive = step.status === "active";
          const isDone = step.status === "done";
          const isPending = step.status === "pending";
          const canClick = (isDone || isActive) && onStepClick;

          return (
            <motion.button
              key={step.id}
              onClick={() => canClick && onStepClick(step.id)}
              disabled={!canClick}
              className={`
                w-full text-left p-3 rounded-lg transition-all duration-200
                ${canClick ? 'cursor-pointer hover:bg-[rgba(165,147,224,0.1)]' : 'cursor-not-allowed'}
                ${isActive ? 'bg-[rgba(165,147,224,0.15)] border-l-2 border-[var(--brand-lavender)]' : ''}
                ${isPending ? 'opacity-50' : ''}
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-3">
                {/* Círculo indicador de  paso */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                      transition-all duration-200
                      ${
                        isDone
                          ? "bg-[var(--brand-lavender)] text-[var(--brand-navy)]"
                          : isActive
                          ? "bg-[rgba(165,147,224,0.3)] border-2 border-[var(--brand-lavender)] text-white"
                          : "bg-[rgba(48,43,99,0.3)] border border-[rgba(203,187,246,0.2)] text-[var(--text-muted)]"
                      }
                    `}
                  >
                    {isDone ? (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        ✓
                      </motion.span>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Conección línea */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 top-full w-[2px] h-8 -translate-x-1/2">
                      <div className="w-full h-full bg-[rgba(203,187,246,0.1)]" />
                      {isDone && (
                        <motion.div
                          className="absolute top-0 left-0 w-full bg-[var(--brand-lavender)]"
                          initial={{ height: "0%" }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </div>
                  )}

                  {/* Pulso */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[var(--brand-lavender)]"
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`
                        text-sm font-semibold transition-colors
                        ${isDone || isActive ? "text-white" : "text-[var(--text-muted)]"}
                      `}
                    >
                      {step.title}
                    </h4>
                    {step.optional && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(165,147,224,0.2)] text-[var(--brand-lavender)]">
                        OPCIONAL
                      </span>
                    )}
                  </div>
                  <p
                    className={`
                      text-xs mt-0.5 transition-colors
                      ${isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}
                    `}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* Barra de progreso */}
      <div className="pt-6 border-t border-[rgba(203,187,246,0.2)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-1.5 bg-[rgba(203,187,246,0.1)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--brand-purple-mid)] to-[var(--brand-lavender)]"
              initial={{ width: "0%" }}
              animate={{
                width: `${(steps.filter(s => s.status === "done").length / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-semibold text-white">
            {Math.round((steps.filter(s => s.status === "done").length / steps.length) * 100)}%
          </span>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] text-center">
          {activeIndex === steps.length - 1 && steps[activeIndex].status === "done"
            ? "¡Flujo completado!"
            : `Paso ${activeIndex + 1} de ${steps.length}`}
        </p>
      </div>
    </div>
  );
}