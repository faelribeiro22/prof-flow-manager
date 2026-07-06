#!/usr/bin/env node
/**
 * Script para executar a migração SQL no Supabase
 * Executa: 021_fix_search_teachers_by_day_only.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const MIGRATION_FILE = path.join(__dirname, 'supabase/migrations/021_fix_search_teachers_by_day_only.sql');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

if (!fs.existsSync(MIGRATION_FILE)) {
  console.error(`❌ Erro: Arquivo de migração não encontrado: ${MIGRATION_FILE}`);
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  try {
    console.log('📝 Lendo arquivo de migração...');
    const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');
    
    console.log('🔄 Executando migração...');
    
    // Executar via RPC (admin function)
    // Como alternativa, você pode usar o service role key
    const { error } = await supabase.rpc('execute_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      process.exit(1);
    }
    
    console.log('✅ Migração executada com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

runMigration();
