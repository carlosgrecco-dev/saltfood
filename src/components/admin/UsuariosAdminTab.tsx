import React, { useCallback, useEffect, useState } from 'react';
import { UserCog, Plus, Trash2, Power, KeyRound, Loader2 } from 'lucide-react';
import { UsuarioAdmin, PapelUsuarioAdmin, PAPEL_USUARIO_ADMIN_LABELS } from '../../types/UsuarioAdmin';
import { fetchUsuariosAdmin, createUsuarioAdmin, updateUsuarioAdmin, deleteUsuarioAdmin } from '../../lib/usuariosAdmin';

interface UsuariosAdminTabProps {
  empresaId: string;
}

const PAPEIS: PapelUsuarioAdmin[] = ['GERENTE', 'OPERADOR_CAIXA', 'ATENDENTE'];
const emptyForm = { nome: '', email: '', senha: '', papel: 'ATENDENTE' as PapelUsuarioAdmin };

const UsuariosAdminTab: React.FC<UsuariosAdminTabProps> = ({ empresaId }) => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [redefinindoSenhaId, setRedefinindoSenhaId] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsuarios(await fetchUsuariosAdmin(empresaId));
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await createUsuarioAdmin(empresaId, form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar o usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarAtivo = async (usuario: UsuarioAdmin) => {
    setProcessandoId(usuario.id);
    try {
      await updateUsuarioAdmin(empresaId, usuario.id, { ativo: !usuario.ativo });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handlePapel = async (usuario: UsuarioAdmin, papel: PapelUsuarioAdmin) => {
    setProcessandoId(usuario.id);
    try {
      await updateUsuarioAdmin(empresaId, usuario.id, { papel });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRedefinirSenha = async (id: string) => {
    if (novaSenha.length < 6) return;
    setProcessandoId(id);
    try {
      await updateUsuarioAdmin(empresaId, id, { senha: novaSenha });
      setRedefinindoSenhaId(null);
      setNovaSenha('');
      alert('Senha redefinida.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Remover este usuário? Ele não vai mais conseguir entrar.')) return;
    await deleteUsuarioAdmin(empresaId, id);
    await load();
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5 max-w-xl">
        Logins adicionais pra sua equipe, com acesso restrito por papel — cada um vê só os menus
        do papel dele no painel. O login principal da loja continua funcionando normalmente e só ele
        pode gerenciar estes usuários.
      </p>

      <form onSubmit={handleCriar} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl items-end">
        <div className="min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Nome</label>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
        </div>
        <div className="min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">E-mail</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1">Senha</label>
          <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Mín. 6 caracteres" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Papel</label>
          <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as PapelUsuarioAdmin })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            {PAPEIS.map((p) => <option key={p} value={p}>{PAPEL_USUARIO_ADMIN_LABELS[p]}</option>)}
          </select>
        </div>
        <button type="submit" disabled={salvando} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Cadastrar
        </button>
      </form>
      {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className={`border rounded-xl p-4 ${u.ativo ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <UserCog className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{u.nome}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={u.papel}
                    onChange={(e) => handlePapel(u, e.target.value as PapelUsuarioAdmin)}
                    disabled={processandoId === u.id}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    {PAPEIS.map((p) => <option key={p} value={p}>{PAPEL_USUARIO_ADMIN_LABELS[p]}</option>)}
                  </select>
                  <button onClick={() => setRedefinindoSenhaId(redefinindoSenhaId === u.id ? null : u.id)} title="Redefinir senha" className="text-gray-400 hover:text-gray-700">
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleAlternarAtivo(u)}
                    disabled={processandoId === u.id}
                    className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                  >
                    <Power className="h-3.5 w-3.5" /> {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => handleExcluir(u.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {redefinindoSenhaId === u.id && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button onClick={() => handleRedefinirSenha(u.id)} disabled={novaSenha.length < 6 || processandoId === u.id} className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-2 rounded-lg disabled:opacity-60">
                    Salvar
                  </button>
                </div>
              )}
            </div>
          ))}
          {usuarios.length === 0 && <p className="text-center text-gray-500 py-10 text-sm">Nenhum usuário de equipe cadastrado ainda.</p>}
        </div>
      )}
    </div>
  );
};

export default UsuariosAdminTab;
