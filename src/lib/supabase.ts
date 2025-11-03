// src/lib/supabase.ts

// Importar cliente de Supabase
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Obtener credenciales de variables de entorno
const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validar que las credenciales existen
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

// Crear y exportar cliente
// Este cliente se usará en todos los componentes
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!);
