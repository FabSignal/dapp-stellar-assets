# dApp Stellar Assets Nativos

Aplicación descentralizada (dApp) construida con **Next.js 15**, **Stellar SDK** y **Supabase**, diseñada para la gestión de *assets nativos* en la red **Stellar Testnet**.  
Permite conectar una wallet **Freighter**, emitir activos y administrar balances de prueba en un entorno seguro.

## Tecnologías Principales

- **Next.js 15** – Framework React de nueva generación con app router.  
- **Stellar SDK** – Interacción directa con la red Stellar Testnet.  
- **Freighter API** – Conexión segura con wallet del usuario.  
- **Supabase** – Backend as a Service para autenticación y persistencia.  
- **Vercel** – Despliegue serverless optimizado para Next.js.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**: v18.0.0 o superior ([Descargar aquí](https://nodejs.org/))
- **npm** o **yarn**: Gestor de paquetes
- **Freighter Wallet**: Extensión de navegador ([Instalar aquí](https://www.freighter.app/))
- **Cuenta Stellar Testnet**: Con al menos 2 XLM de fondeo

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd dapp-stellar-assets
```

### 2. Instalar dependencias
```bash
npm install
```

> ⚠️ **Importante**: Este proyecto utiliza versiones específicas de las dependencias. Si experimentas errores de compatibilidad, verifica que las versiones en tu `package.json` coincidan con las siguientes:

### 3. Versiones de dependencias requeridas
```json
{
  "@stellar/freighter-api": "^5.0.0",
  "@stellar/stellar-sdk": "^13.0.0",
  "@supabase/supabase-js": "^2.45.0",
  "next": "15.0.2",
  "react": "^19.0.0"
}
```

> 💡 **Nota**: Si tienes errores y tus versiones no coincide , ejecuta:
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 5. Ejecutar 
```
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del Proyecto

```
dapp-stellar-assets/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Página principal
│   │   ├── layout.tsx         # Layout global
│   │   └── globals.css        # Estilos globales
│   │
│   ├── components/
│   │   ├── WalletConnect.tsx  # Conectar wallet
│   │   ├── AssetBalance.tsx   # Ver balance
│   │   ├── CreateTrustline.tsx # Crear trustline
│   │   ├── PathPayment.tsx    # Path payments (opcional)
│   │   ├── Spinner.tsx        # Loading spinner
│   │   └── Stepper.tsx        # Paso a paso
│   │
│   └── lib/
│       ├── supabase.ts        # Cliente de Supabase
│       └── constants.ts       # Constantes (assets, issuers)
│
│
├── .env.local                 # Variables de entorno
├── package.json
├── next.config.js
└── README.md
```
---

## 🔐 Variables de Entorno

Ejemplo de archivo de configuración local:

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```
---

## Solución de Problemas Comunes

### Error: "Module '@stellar/freighter-api' has no exported member 'getPublicKey'"

**Causa**: Estás usando una versión antigua de `@stellar/freighter-api`.

**Solución**:
```bash
npm install @stellar/freighter-api@latest
```

### Error: "Property 'freighter' does not exist on type 'Window'"

**Causa**: Problema de tipos de TypeScript con Freighter.

**Solución**: Este error ya está resuelto en la versión actual del proyecto. Si persiste, asegúrate de tener la última versión del código.

### Error: "Request failed with status code 400" al crear trustline

**Causa**: Incompatibilidad en la reconstrucción de transacciones firmadas.

**Solución**: Este error ya está corregido en la versión actual. Si persiste, verifica que estés usando `@stellar/stellar-sdk` v13.0.0 o superior.

---

## Documentación de la API

- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Freighter API Documentation](https://docs.freighter.app/)
- [Supabase Documentation](https://supabase.com/docs)

---

## ⚠️ Notas Importantes

- **Red**: Este proyecto está configurado para **Stellar Testnet**. No usar en producción sin cambiar a Mainnet.
- **Assets**: Los assets nativos deben tener un issuer válido en Testnet.
- **Fondeo**: Usa [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test) para obtener XLM de prueba.
- **Freighter**: Asegúrate de que tu extensión Freighter esté configurada en **Testnet** (no Mainnet).

---

## Licencia

Este proyecto está disponible bajo la licencia **MIT**.

