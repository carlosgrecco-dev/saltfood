import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, KeyRound, ClipboardList, Wallet, MessageCircle, Search, ChevronLeft, ChevronRight,
  LayoutGrid, Table as TableIcon, Pencil, Star, Bike, CheckCircle2, XCircle, Navigation, ImageOff,
  Phone, FileCheck2, TrendingUp, Award, ShieldAlert, Loader2,
} from 'lucide-react';
import {
  Motoboy, MotoboyAdminResumo, StatusMotoboyCalculado, STATUS_MOTOBOY_LABELS,
} from '../../types/Motoboy';
import {
  fetchMotoboysAdminResumo, createMotoboy, updateMotoboy, setMotoboyStatus, setMotoboyPin, deleteMotoboy,
} from '../../lib/motoboysApi';
import { onlyDigits } from '../../lib/masks';
import { useTenant } from '../../context/TenantContext';
import BottomSheet from '../BottomSheet';
import FotoInput from './FotoInput';
import MotoboyPagamentosTab from './MotoboyPagamentosTab';

interface MotoboysTabProps {
  empresaId: string;
}

type SubTab = 'cadastro' | 'pagamentos';
type Visao = 'tabela' | 'grade';

const ITENS_POR_PAGINA = 10;

const VEICULO_TIPOS = ['Moto', 'Bicicleta', 'Carro', 'A pé'];

const STATUS_BADGE_CLASS: Record<StatusMotoboyCalculado, string> = {
  DISPONIVEL: 'bg-emerald-100 text-emerald-800',
  EM_ENTREGA: 'bg-blue-100 text-blue-800',
  OFFLINE: 'bg-gray-100 text-gray-500',
  INATIVO: 'bg-red-100 text-red-700',
};

const emptyForm = {
  nome: '',
  telefone: '',
  taxaPadrao: '7.00',
  veiculoTipo: '',
  veiculoPlaca: '',
  turno: '',
  fotoPerfilUrl: '',
  cnhUrl: '',
  documentoVeiculoUrl: '',
  seguroUrl: '',
  comprovanteResidenciaUrl: '',
};

/** Mesmo padrão usado em PedidosTab.tsx pra abrir o WhatsApp com uma mensagem pronta. */
const linkWhatsapp = (telefone: string, mensagem: string): string | null => {
  const digits = onlyDigits(telefone);
  if (!digits) return null;
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
};

const Estrelas: React.FC<{ nota: number | null | undefined; quantidade?: number }> = ({ nota, quantidade }) => {
  if (nota == null) return <span className="text-xs text-gray-400">Sem avaliações</span>;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium text-gray-800 text-sm">{nota.toFixed(1)}</span>
      {quantidade != null && <span className="text-xs text-gray-400">({quantidade})</span>}
    </div>
  );
};

const MotoboysTab: React.FC<MotoboysTabProps> = ({ empresaId }) => {
  const { slug, empresa } = useTenant();
  const [subTab, setSubTab] = useState<SubTab>('cadastro');
  const [resumo, setResumo] = useState<MotoboyAdminResumo | null>(null);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusMotoboyCalculado | ''>('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [visao, setVisao] = useState<Visao>('tabela');
  const [pagina, setPagina] = useState(1);

  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [savingPinFor, setSavingPinFor] = useState<string | null>(null);

  const [sheetAberto, setSheetAberto] = useState(false);
  const [editando, setEditando] = useState<Motoboy | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);

  const load = useCallback(async () => {
    try {
      setResumo(await fetchMotoboysAdminResumo(empresaId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const motoboys = useMemo(() => resumo?.motoboys ?? [], [resumo]);
  const stats = resumo?.stats;

  const turnos = useMemo(
    () => Array.from(new Set(motoboys.map((m) => m.turno).filter((t): t is string => !!t))).sort(),
    [motoboys]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return motoboys.filter((m) => {
      if (termo && !m.nome.toLowerCase().includes(termo) && !(m.telefone || '').includes(termo)) return false;
      if (filtroStatus && m.statusCalculado !== filtroStatus) return false;
      if (filtroTurno && m.turno !== filtroTurno) return false;
      return true;
    });
  }, [motoboys, busca, filtroStatus, filtroTurno]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const pagina_ = filtrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const abrirNovo = () => {
    setEditando(null);
    setForm(emptyForm);
    setSheetAberto(true);
  };

  const abrirEdicao = (m: Motoboy) => {
    setEditando(m);
    setForm({
      nome: m.nome,
      telefone: m.telefone || '',
      taxaPadrao: String(m.taxaPadrao),
      veiculoTipo: m.veiculoTipo || '',
      veiculoPlaca: m.veiculoPlaca || '',
      turno: m.turno || '',
      fotoPerfilUrl: m.fotoPerfilUrl || '',
      cnhUrl: m.cnhUrl || '',
      documentoVeiculoUrl: m.documentoVeiculoUrl || '',
      seguroUrl: m.seguroUrl || '',
      comprovanteResidenciaUrl: m.comprovanteResidenciaUrl || '',
    });
    setSheetAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return;
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        telefone: form.telefone || undefined,
        taxaPadrao: parseFloat(form.taxaPadrao) || 0,
        veiculoTipo: form.veiculoTipo || null,
        veiculoPlaca: form.veiculoPlaca || null,
        turno: form.turno || null,
        fotoPerfilUrl: form.fotoPerfilUrl || null,
        cnhUrl: form.cnhUrl || null,
        documentoVeiculoUrl: form.documentoVeiculoUrl || null,
        seguroUrl: form.seguroUrl || null,
        comprovanteResidenciaUrl: form.comprovanteResidenciaUrl || null,
      };
      if (editando) {
        await updateMotoboy(empresaId, editando.id, payload);
      } else {
        await createMotoboy(empresaId, payload);
      }
      setSheetAberto(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível salvar o motoboy.');
    } finally {
      setSalvando(false);
    }
  };

  const handleUpdateTaxa = async (motoboy: Motoboy, taxaPadrao: number) => {
    await updateMotoboy(empresaId, motoboy.id, { nome: motoboy.nome, telefone: motoboy.telefone || undefined, taxaPadrao });
    load();
  };

  const handleToggleAtivo = async (motoboy: Motoboy) => {
    await setMotoboyStatus(empresaId, motoboy.id, !motoboy.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este motoboy?')) return;
    await deleteMotoboy(empresaId, id);
    load();
  };

  const handleSetPin = async (motoboy: Motoboy) => {
    const pin = pinDrafts[motoboy.id];
    if (!pin || !/^[0-9]{4,6}$/.test(pin)) {
      alert('Digite um PIN numérico de 4 a 6 dígitos.');
      return;
    }
    setSavingPinFor(motoboy.id);
    try {
      await setMotoboyPin(empresaId, motoboy.id, pin);
      setPinDrafts((prev) => ({ ...prev, [motoboy.id]: '' }));

      const link = `${window.location.origin}/${slug}/motoboy`;
      const mensagem = `Olá, ${motoboy.nome}! Você foi cadastrado como motoboy da ${empresa.nome}.\n\nAcesse pelo link: ${link}\n\nSeu login é o telefone cadastrado, e o PIN é: ${pin}`;
      const whatsapp = motoboy.telefone ? linkWhatsapp(motoboy.telefone, mensagem) : null;
      if (whatsapp) {
        window.open(whatsapp, '_blank', 'noopener,noreferrer');
      } else {
        alert(`PIN definido! Repasse ao motoboy o link ${link}, o telefone cadastrado e o PIN: ${pin}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível definir o PIN.');
    } finally {
      setSavingPinFor(null);
    }
  };

  const switcher = (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
      <button
        type="button"
        onClick={() => setSubTab('cadastro')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'cadastro' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <ClipboardList className="h-3.5 w-3.5" /> Cadastro
      </button>
      <button
        type="button"
        onClick={() => setSubTab('pagamentos')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'pagamentos' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <Wallet className="h-3.5 w-3.5" /> Pagamentos
      </button>
    </div>
  );

  if (subTab === 'pagamentos') {
    return (
      <div>
        {switcher}
        <MotoboyPagamentosTab empresaId={empresaId} />
      </div>
    );
  }

  return (
    <div>
      {switcher}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Motoboys</h2>
          <p className="text-sm text-gray-500">Gerencie a equipe de entrega da sua loja</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          <Plus className="h-4 w-4" /> Novo motoboy
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Bike className="h-3.5 w-3.5" /> Total de motoboys</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Ativos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.ativos}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-blue-500" /> Em entrega</p>
            <p className="text-2xl font-bold text-gray-800">{stats.emEntrega}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Disponíveis</p>
            <p className="text-2xl font-bold text-gray-800">{stats.disponiveis}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-gray-400" /> Inativos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.inativos}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => { setFiltroStatus(e.target.value as StatusMotoboyCalculado | ''); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_MOTOBOY_LABELS) as StatusMotoboyCalculado[]).map((s) => (
            <option key={s} value={s}>{STATUS_MOTOBOY_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filtroTurno}
          onChange={(e) => { setFiltroTurno(e.target.value); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os turnos</option>
          {turnos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setVisao('tabela')}
            title="Ver em tabela"
            className={`p-2.5 ${visao === 'tabela' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVisao('grade')}
            title="Ver em grade"
            className={`p-2.5 border-l border-gray-300 ${visao === 'grade' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : visao === 'tabela' ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Motoboy</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Avaliação</th>
                  <th className="py-3 px-4">Entregas</th>
                  <th className="py-3 px-4">Taxa/entrega</th>
                  <th className="py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagina_.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        {m.fotoPerfilUrl ? (
                          <img src={m.fotoPerfilUrl} alt={m.nome} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <ImageOff className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{m.nome}</p>
                          {m.turno && <p className="text-xs text-gray-400">{m.turno}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {m.telefone ? (
                        <a
                          href={linkWhatsapp(m.telefone, `Olá, ${m.nome}!`) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600"
                        >
                          <Phone className="h-3.5 w-3.5" /> {m.telefone}
                        </a>
                      ) : (
                        <span className="text-gray-400">sem telefone</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {m.veiculoTipo ? (
                        <>
                          <p className="text-gray-800">{m.veiculoTipo}</p>
                          {m.veiculoPlaca && <p className="text-xs text-gray-400">{m.veiculoPlaca}</p>}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE_CLASS[m.statusCalculado || 'INATIVO']}`}>
                        {STATUS_MOTOBOY_LABELS[m.statusCalculado || 'INATIVO']}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Estrelas nota={m.avaliacaoMedia} quantidade={m.avaliacaoQuantidade} />
                    </td>
                    <td className="py-3 px-4 text-gray-600">{(m.entregasTotais ?? 0).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={m.taxaPadrao}
                          onBlur={(e) => handleUpdateTaxa(m, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 min-w-[190px]">
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrirEdicao(m)} title="Editar" className="text-gray-400 hover:text-gray-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAtivo(m)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}
                          >
                            {m.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                          <button onClick={() => handleDelete(m.id)} title="Remover" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <KeyRound className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <input
                            placeholder="PIN"
                            inputMode="numeric"
                            maxLength={6}
                            value={pinDrafts[m.id] || ''}
                            onChange={(e) => setPinDrafts((prev) => ({ ...prev, [m.id]: e.target.value.replace(/\D/g, '') }))}
                            className="w-16 px-1.5 py-1 border border-gray-300 rounded-lg text-xs"
                          />
                          <button
                            onClick={() => handleSetPin(m)}
                            disabled={savingPinFor === m.id}
                            title="Definir PIN e enviar por WhatsApp"
                            className="flex items-center gap-1 text-[11px] bg-gray-800 hover:bg-gray-900 text-white px-2 py-1 rounded-lg disabled:opacity-60"
                          >
                            {savingPinFor === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageCircle className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagina_.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum motoboy encontrado.</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {filtrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a{' '}
              {Math.min(paginaAtual * ITENS_POR_PAGINA, filtrados.length)} de {filtrados.length} motoboys
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                    <button
                      onClick={() => setPagina(p)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium ${p === paginaAtual ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pagina_.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                {m.fotoPerfilUrl ? (
                  <img src={m.fotoPerfilUrl} alt={m.nome} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <ImageOff className="h-5 w-5 text-gray-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{m.nome}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE_CLASS[m.statusCalculado || 'INATIVO']}`}>
                    {STATUS_MOTOBOY_LABELS[m.statusCalculado || 'INATIVO']}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">{m.veiculoTipo || 'Veículo não informado'} {m.veiculoPlaca ? `· ${m.veiculoPlaca}` : ''}</p>
              <div className="flex items-center justify-between mt-2 text-sm">
                <Estrelas nota={m.avaliacaoMedia} quantidade={m.avaliacaoQuantidade} />
                <span className="text-gray-600">{m.entregasTotais ?? 0} entregas</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => abrirEdicao(m)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 px-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {pagina_.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Nenhum motoboy encontrado.</p>}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><FileCheck2 className="h-4 w-4 text-orange-500" /> Documentos obrigatórios</p>
            <div className="space-y-2.5">
              {([
                ['Foto de perfil', stats.documentos.foto],
                ['CNH', stats.documentos.cnh],
                ['Documento do veículo', stats.documentos.veiculo],
                ['Seguro', stats.documentos.seguro],
                ['Comprovante de residência', stats.documentos.comprovante],
              ] as [string, number][]).map(([label, qtd]) => {
                const pct = stats.documentos.totalMotoboys > 0 ? (qtd / stats.documentos.totalMotoboys) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-800">{qtd}/{stats.documentos.totalMotoboys}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><TrendingUp className="h-4 w-4 text-orange-500" /> Estatísticas gerais</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Entregas hoje</span>
                <span className="font-bold text-gray-800">{stats.entregasHoje}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Entregas na semana</span>
                <span className="font-bold text-gray-800">{stats.entregasSemana}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Entregas no mês</span>
                <span className="font-bold text-gray-800">{stats.entregasMes}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Tempo médio de entrega</span>
                <span className="font-bold text-gray-800">{stats.taxaMediaEntrega.toFixed(0)} min</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><Award className="h-4 w-4 text-orange-500" /> Performance da equipe</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Avaliação média</span>
                  <span className="font-medium text-gray-800">{stats.avaliacaoMediaGeral.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(stats.avaliacaoMediaGeral / 5) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Taxa de aceitação</span>
                  <span className="font-medium text-gray-800">{stats.taxaAceitacao.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.taxaAceitacao}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-red-400" /> Taxa de cancelamento</span>
                  <span className="font-medium text-gray-800">{stats.taxaCancelamento.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-400" style={{ width: `${stats.taxaCancelamento}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomSheet isOpen={sheetAberto} onClose={() => setSheetAberto(false)} title={editando ? 'Editar motoboy' : 'Novo motoboy'}>
        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Telefone</label>
              <input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Taxa por entrega (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.taxaPadrao}
                onChange={(e) => setForm({ ...form, taxaPadrao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Veículo</label>
              <select
                value={form.veiculoTipo}
                onChange={(e) => setForm({ ...form, veiculoTipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Não informado</option>
                {VEICULO_TIPOS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Placa</label>
              <input
                value={form.veiculoPlaca}
                onChange={(e) => setForm({ ...form, veiculoPlaca: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Turno</label>
              <input
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
                placeholder="Ex: Manhã, Tarde, Noite, Integral"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Documentos</p>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Foto de perfil</label>
              <FotoInput value={form.fotoPerfilUrl} onChange={(url) => setForm({ ...form, fotoPerfilUrl: url })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">CNH</label>
              <FotoInput value={form.cnhUrl} onChange={(url) => setForm({ ...form, cnhUrl: url })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Documento do veículo</label>
              <FotoInput value={form.documentoVeiculoUrl} onChange={(url) => setForm({ ...form, documentoVeiculoUrl: url })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Seguro</label>
              <FotoInput value={form.seguroUrl} onChange={(url) => setForm({ ...form, seguroUrl: url })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Comprovante de residência</label>
              <FotoInput value={form.comprovanteResidenciaUrl} onChange={(url) => setForm({ ...form, comprovanteResidenciaUrl: url })} />
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar motoboy'}
          </button>
        </form>
      </BottomSheet>

      <p className="text-xs text-gray-400 mt-3">
        Ao definir o PIN, o WhatsApp abre automaticamente com o link do app e o acesso prontos pra enviar ao motoboy
        (telefone precisa estar cadastrado). Sem telefone, o PIN aparece num aviso na tela pra você repassar manualmente.
      </p>
    </div>
  );
};

export default MotoboysTab;
