/**
 * Cria o usuário administrador no Supabase Auth e o vincula à tabela `admins`.
 *
 * Por que um script, e não algo já pronto no banco?
 * O Supabase Auth não permite criar usuários (com senha) via SQL puro — isso
 * precisa passar pela API de administração, que exige a *service role key*
 * (nunca a chave anônima). Este script faz isso uma única vez.
 *
 * COMO USAR:
 * 1. Rode as migrations 0001 e 0002 no seu projeto Supabase.
 * 2. Pegue a "service_role key" em Settings → API (⚠️ NUNCA exponha essa
 *    chave no front-end, ela ignora todo o RLS).
 * 3. Rode no terminal, dentro da pasta do projeto:
 *
 *    SUPABASE_URL=https://SEU-PROJETO.supabase.co \
 *    SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY \
 *    node supabase/seed-admin.mjs
 *
 * Isso cria (ou reaproveita, se já existir) o usuário:
 *   E-mail: carlosgrecco16@gmail.com
 *   Senha:  24151981
 * e insere/atualiza a linha correspondente em `public.admins`.
 *
 * Depois disso, use esse e-mail/senha no "Painel" do site para entrar.
 * Recomendo trocar a senha pelo próprio painel do Supabase assim que possível.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = 'carlosgrecco16@gmail.com';
const ADMIN_PASSWORD = '24151981';
const ADMIN_NAME = 'Carlos Grecco';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Faltam variáveis de ambiente. Rode assim:\n\n' +
      '  SUPABASE_URL=https://SEU-PROJETO.supabase.co SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE node supabase/seed-admin.mjs\n'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`→ Criando/verificando usuário administrador: ${ADMIN_EMAIL}`);

  let userId;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin', name: ADMIN_NAME },
  });

  if (createError) {
    if (createError.message?.toLowerCase().includes('already') || createError.status === 422) {
      console.log('  Usuário já existe no Auth, buscando o id existente...');
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      if (!existing) throw new Error('Não encontrei o usuário existente. Verifique o e-mail.');
      userId = existing.id;
    } else {
      throw createError;
    }
  } else {
    userId = created.user.id;
    console.log('  Usuário criado no Auth com sucesso.');
  }

  const { error: upsertError } = await supabase
    .from('admins')
    .upsert({ id: userId, name: ADMIN_NAME }, { onConflict: 'id' });

  if (upsertError) throw upsertError;

  console.log('✅ Pronto! Login administrativo:');
  console.log(`   E-mail: ${ADMIN_EMAIL}`);
  console.log(`   Senha:  ${ADMIN_PASSWORD}`);
  console.log('   (troque a senha pelo painel do Supabase quando quiser)');
}

main().catch((err) => {
  console.error('❌ Erro ao criar administrador:', err.message || err);
  process.exit(1);
});
