import { useState, useEffect, useRef } from "react";
import {
  Camera, Image as ImageIcon, CheckCircle2, Circle, XCircle, ArrowRight,
  Search, ClipboardList, Smartphone, User, Phone, ChevronLeft, Trash2,
  Plus, Clock, AlertCircle, X, Wallet, Lock, Unlock, Check, ShoppingBag,
  TrendingUp, Package, ChevronRight, ChevronDown, Printer, PenTool,
  BellRing, Eraser, Minus, LayoutDashboard, Users, Settings, Headset,
  BarChart3, Wrench, Sparkles, ArrowUpRight
} from "lucide-react";

/* ---------------- Supabase ---------------- */
const SUPABASE_URL = "https://rvyjzlgvwpvgvjdqexne.supabase.co";
const SUPABASE_KEY = "sb_publishable_jMQ-tBzmSo2LuxT9vsM9rg_OT2oAyIH";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ---- mapeadores linha do banco <-> objeto usado nos componentes ---- */
function rowToEstoque(r) {
  return { id: r.id, nome: r.nome, categoria: r.categoria, preco: Number(r.preco), custo: Number(r.custo), quantidade: r.quantidade, estoqueMinimo: r.estoque_minimo };
}
function estoqueToRow(p) {
  return { nome: p.nome, categoria: p.categoria, preco: Number(p.preco) || 0, custo: Number(p.custo) || 0, quantidade: Number(p.quantidade) || 0, estoque_minimo: Number(p.estoqueMinimo) || 0 };
}
function rowToCaixa(r) {
  return {
    id: r.id, dataAbertura: r.data_abertura, valorInicial: Number(r.valor_inicial), operador: r.operador || "", observacaoAbertura: r.observacao_abertura || "",
    vendas: [],
  };
}
function rowToVenda(r) {
  return { id: r.id, timestamp: r.timestamp, itens: r.itens, formaPagamento: r.forma_pagamento, total: Number(r.total) };
}
function rowToOSIndex(r) {
  return { id: r.id, numero: r.numero, clienteNome: r.cliente?.nome || "", clienteTelefone: r.cliente?.telefone || "", aparelho: r.aparelho?.marcaModelo || "", status: r.status, dataEntrada: r.data_entrada };
}
function rowToOSDetail(r) {
  return {
    id: r.id, numero: r.numero, dataEntrada: r.data_entrada,
    cliente: r.cliente, aparelho: r.aparelho, problemaRelatado: r.problema_relatado || "",
    checklist: r.checklist || [], condicaoAparelho: r.condicao_aparelho || [], observacoesCondicao: r.observacoes_condicao || "",
    fotos: r.fotos || [], pecasUsadas: r.pecas_usadas || [], timeline: r.timeline || [], notificacoes: r.notificacoes || [],
    termos: r.termos ?? TERMO_PADRAO, assinaturaCliente: r.assinatura_cliente || null, status: r.status,
    valorMaoDeObra: r.valor_mao_de_obra ?? "", valorFinal: r.valor_final ?? "",
  };
}
function osDetailToRow(d) {
  return {
    cliente: d.cliente, aparelho: d.aparelho, problema_relatado: d.problemaRelatado,
    checklist: d.checklist, condicao_aparelho: d.condicaoAparelho, observacoes_condicao: d.observacoesCondicao,
    fotos: d.fotos, pecas_usadas: d.pecasUsadas, timeline: d.timeline, notificacoes: d.notificacoes,
    termos: d.termos, assinatura_cliente: d.assinaturaCliente, status: d.status,
    valor_mao_de_obra: d.valorMaoDeObra === "" || d.valorMaoDeObra === null ? null : Number(d.valorMaoDeObra),
    valor_final: d.valorFinal === "" || d.valorFinal === null ? null : Number(d.valorFinal),
  };
}

/* ---------------- constants ---------------- */
/* Código de acesso pra editar ou excluir uma venda já finalizada.
   Pra trocar, é só mudar esse valor aqui e me pedir pra republicar. */
const PIN_EDICAO = "1234";

const FORMAS = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "Pix" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
];
const STATUS_OS = [
  { id: "recebido", label: "Recebido", color: "#4DA3FF" },
  { id: "diagnostico", label: "Em diagnóstico", color: "#4DA3FF" },
  { id: "aguardando_aprovacao", label: "Aguardando aprovação", color: "#F5A524" },
  { id: "em_reparo", label: "Em reparo", color: "#A855F7" },
  { id: "pronto", label: "Pronto para retirada", color: "#22C55E" },
  { id: "entregue", label: "Entregue", color: "#8A8A96" },
  { id: "cancelado", label: "Cancelado", color: "#EF4444" },
];
const FLUXO_PRINCIPAL = ["recebido", "diagnostico", "aguardando_aprovacao", "em_reparo", "pronto", "entregue"];
const CHECKLIST_PADRAO = [
  "Tela / Display", "Touch", "Botões", "Bateria", "Conector de carga",
  "Alto-falante", "Microfone", "Câmera frontal", "Câmera traseira",
  "Wi-Fi / Bluetooth", "Estrutura / Carcaça", "Liga / Desliga",
];
const CONDICAO_PADRAO = [
  "Liga normalmente", "Tela trincada / rachada", "Riscos na tela",
  "Riscos na carcaça", "Amassados", "Marcas de água", "Tampa / traseira",
  "Botões físicos", "Conectores",
];
const TERMO_PADRAO = `O aparelho ficará à disposição para retirada em até 7 (sete) dias corridos após a notificação de conclusão do serviço. Após esse prazo, poderá ser cobrada taxa de armazenamento por dia de atraso.

Aparelhos não retirados em até 90 (noventa) dias após a notificação de conclusão serão considerados abandonados, podendo ser descartados ou reaproveitados pela assistência técnica, conforme legislação vigente.

A assistência técnica não se responsabiliza por dados, senhas ou contas associadas ao aparelho, sendo de responsabilidade do cliente realizar backup prévio.

Ao assinar, o cliente declara estar ciente e de acordo com as condições descritas nesta ordem de serviço.`;

/* ---------------- helpers ---------------- */
function statusInfo(id) { return STATUS_OS.find((s) => s.id === id) || STATUS_OS[0]; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmt(v) { return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString("pt-BR"); }
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function totaisPorForma(vendas) {
  const t = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };
  vendas.forEach((v) => { t[v.formaPagamento] = (t[v.formaPagamento] || 0) + v.total; });
  return t;
}
function totalGeral(vendas) { return vendas.reduce((s, v) => s + v.total, 0); }
function resizeImage(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------- UI primitives ---------------- */
function Card({ children, className = "" }) {
  return <div className={"rounded-xl border border-[#2A2A34] bg-[#131318] p-4 " + className}>{children}</div>;
}
function Label({ children }) {
  return <div className="text-[11px] tracking-[0.15em] uppercase text-[#8A8A96] mb-1">{children}</div>;
}
function Input(props) {
  return (
    <input {...props} className={
      "w-full bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 py-2.5 text-[#F2F2F5] placeholder-[#5A5A64] outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40 " +
      (props.className || "")
    } />
  );
}
function Textarea(props) {
  return (
    <textarea {...props} className={
      "w-full bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 py-2.5 text-[#F2F2F5] placeholder-[#5A5A64] outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/40 " +
      (props.className || "")
    } />
  );
}
function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:brightness-110",
    ghost: "bg-[#1B1B22] text-[#C9C9D2] border border-[#2A2A34] hover:border-[#3A3A46]",
    danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
  };
  return (
    <button {...props} className={"rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:pointer-events-none " + variants[variant] + " " + className}>
      {children}
    </button>
  );
}
function Stepper({ value, onChange, min = 1 }) {
  return (
    <div className="flex items-center gap-2 bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-1.5 py-1.5">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 flex items-center justify-center rounded-md bg-[#1B1B22] text-[#C9C9D2] active:bg-[#26262E]">
        <Minus size={14} />
      </button>
      <span className="font-mono text-sm w-6 text-center text-[#F2F2F5]">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-purple-600 text-white active:brightness-110">
        <Plus size={14} />
      </button>
    </div>
  );
}
function StatusBadge({ status }) {
  const s = statusInfo(status);
  return (
    <span className="text-[11px] px-2 py-1 rounded-full border tracking-wide" style={{ color: s.color, borderColor: s.color + "55", backgroundColor: s.color + "15" }}>
      {s.label}
    </span>
  );
}
function EstoqueBadge({ item }) {
  const baixo = item.quantidade <= item.estoqueMinimo;
  return (
    <span className={"text-xs font-mono " + (baixo ? "text-red-400" : "text-[#C9C9D2]")}>
      {item.quantidade} un
    </span>
  );
}

/* ============================================================ */
export default function EnigmaSistema() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [saveError, setSaveError] = useState(false);

  const [estoque, setEstoque] = useState([]);
  const [caixaAtual, setCaixaAtual] = useState(null);

  const [osIndex, setOsIndex] = useState([]);
  const [osView, setOsView] = useState("lista"); // lista | nova | detalhe
  const [osDetailId, setOsDetailId] = useState(null);
  const [osDetail, setOsDetail] = useState(null);
  const patchTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [estoqueRows, caixaRows, osRows] = await Promise.all([
          sb("estoque?select=*&order=created_at.desc"),
          sb("caixa_sessoes?select=*&status=eq.aberto&order=data_abertura.desc&limit=1"),
          sb("ordens_servico?select=id,numero,cliente,aparelho,status,data_entrada&order=numero.desc"),
        ]);
        setEstoque((estoqueRows || []).map(rowToEstoque));
        setOsIndex((osRows || []).map(rowToOSIndex));
        if (caixaRows && caixaRows[0]) {
          const c = rowToCaixa(caixaRows[0]);
          const vendaRows = await sb(`vendas?select=*&caixa_id=eq.${c.id}&order=timestamp.asc`);
          c.vendas = (vendaRows || []).map(rowToVenda);
          setCaixaAtual(c);
        }
        setSaveError(false);
      } catch (err) {
        setSaveError(true);
      }
      setLoading(false);
    })();
  }, []);

  /* ---------- estoque ---------- */
  async function addProduto(p) {
    try {
      const rows = await sb("estoque", { method: "POST", body: JSON.stringify(estoqueToRow(p)) });
      setEstoque([rowToEstoque(rows[0]), ...estoque]);
      setSaveError(false);
    } catch (e) { setSaveError(true); }
  }
  async function editarProduto(id, patch) {
    setEstoque(estoque.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      const body = {};
      if ("quantidade" in patch) body.quantidade = patch.quantidade;
      if ("preco" in patch) body.preco = patch.preco;
      if ("custo" in patch) body.custo = patch.custo;
      if ("estoqueMinimo" in patch) body.estoque_minimo = patch.estoqueMinimo;
      await sb(`estoque?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body), prefer: "return=minimal" });
      setSaveError(false);
    } catch (e) { setSaveError(true); }
  }
  async function removerProduto(id) {
    setEstoque(estoque.filter((p) => p.id !== id));
    try {
      await sb(`estoque?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setSaveError(false);
    } catch (e) { setSaveError(true); }
  }
  function ajustarQuantidadeLocal(id, delta) {
    const atual = estoque.find((p) => p.id === id);
    if (!atual) return;
    editarProduto(id, { quantidade: Math.max(0, atual.quantidade + delta) });
  }

  /* ---------- PDV / caixa ---------- */
  async function abrirCaixa({ valorInicial, operador, observacao }) {
    try {
      const rows = await sb("caixa_sessoes", {
        method: "POST",
        body: JSON.stringify({ valor_inicial: Number(valorInicial) || 0, operador: operador || "", observacao_abertura: observacao || "", status: "aberto" }),
      });
      const c = rowToCaixa(rows[0]);
      c.vendas = [];
      setCaixaAtual(c);
      setSaveError(false);
    } catch (e) { setSaveError(true); }
    setTab("pdv");
  }
  async function registrarVenda({ itens, formaPagamento }) {
    if (!caixaAtual) return null;
    const total = itens.reduce((s, it) => s + it.valor * it.qtd, 0);
    try {
      const rows = await sb("vendas", {
        method: "POST",
        body: JSON.stringify({ caixa_id: caixaAtual.id, itens, forma_pagamento: formaPagamento, total }),
      });
      const venda = rowToVenda(rows[0]);
      setCaixaAtual({ ...caixaAtual, vendas: [...caixaAtual.vendas, venda] });
      setSaveError(false);
      const usados = itens.filter((i) => i.estoqueId);
      usados.forEach((u) => ajustarQuantidadeLocal(u.estoqueId, -u.qtd));
      return venda;
    } catch (e) { setSaveError(true); return null; }
  }
  async function fecharCaixa({ valorContado, observacao }) {
    if (!caixaAtual) return;
    const vendas = caixaAtual.vendas;
    const totais = totaisPorForma(vendas);
    const saldoEsperadoDinheiro = caixaAtual.valorInicial + totais.dinheiro;
    const diferenca = (Number(valorContado) || 0) - saldoEsperadoDinheiro;
    try {
      await sb(`caixa_sessoes?id=eq.${caixaAtual.id}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          status: "fechado", data_fechamento: new Date().toISOString(), total_vendas: totalGeral(vendas),
          total_por_forma: totais, saldo_esperado_dinheiro: saldoEsperadoDinheiro, valor_contado: Number(valorContado) || 0,
          diferenca, observacao_fechamento: observacao || "",
        }),
      });
      setCaixaAtual(null);
      setSaveError(false);
    } catch (e) { setSaveError(true); }
    setTab("caixa");
  }

  async function excluirVenda(venda) {
    try {
      await sb(`vendas?id=eq.${venda.id}`, { method: "DELETE", prefer: "return=minimal" });
      const usados = (venda.itens || []).filter((i) => i.estoqueId);
      usados.forEach((u) => ajustarQuantidadeLocal(u.estoqueId, u.qtd));
      if (caixaAtual && caixaAtual.vendas.some((v) => v.id === venda.id)) {
        setCaixaAtual({ ...caixaAtual, vendas: caixaAtual.vendas.filter((v) => v.id !== venda.id) });
      }
      setSaveError(false);
      return true;
    } catch (e) { setSaveError(true); return false; }
  }

  async function editarVenda(venda, novosItens, novaForma) {
    const novoTotal = novosItens.reduce((s, i) => s + i.valor * i.qtd, 0);
    try {
      await sb(`vendas?id=eq.${venda.id}`, {
        method: "PATCH", prefer: "return=minimal",
        body: JSON.stringify({ itens: novosItens, forma_pagamento: novaForma, total: novoTotal }),
      });
      // reconcilia estoque: devolve o que não é mais usado, desconta o que passou a ser usado a mais
      const oldMap = {}; (venda.itens || []).forEach((i) => { if (i.estoqueId) oldMap[i.estoqueId] = (oldMap[i.estoqueId] || 0) + i.qtd; });
      const newMap = {}; novosItens.forEach((i) => { if (i.estoqueId) newMap[i.estoqueId] = (newMap[i.estoqueId] || 0) + i.qtd; });
      const idsEstoque = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
      idsEstoque.forEach((id) => {
        const delta = (oldMap[id] || 0) - (newMap[id] || 0);
        if (delta !== 0) ajustarQuantidadeLocal(id, delta);
      });
      const vendaAtualizada = { ...venda, itens: novosItens, formaPagamento: novaForma, total: novoTotal };
      if (caixaAtual && caixaAtual.vendas.some((v) => v.id === venda.id)) {
        setCaixaAtual({ ...caixaAtual, vendas: caixaAtual.vendas.map((v) => (v.id === venda.id ? vendaAtualizada : v)) });
      }
      setSaveError(false);
      return vendaAtualizada;
    } catch (e) { setSaveError(true); return null; }
  }

  async function buscarVendasPorData(dataISO) {
    const inicio = `${dataISO}T00:00:00`;
    const fim = `${dataISO}T23:59:59.999`;
    const rows = await sb(`vendas?select=*&timestamp=gte.${inicio}&timestamp=lte.${fim}&order=timestamp.desc`);
    return (rows || []).map(rowToVenda);
  }
  async function buscarVendasPorPeriodo(inicioISO, fimISO) {
    const inicio = `${inicioISO}T00:00:00`;
    const fim = `${fimISO}T23:59:59.999`;
    const rows = await sb(`vendas?select=*&timestamp=gte.${inicio}&timestamp=lte.${fim}&order=timestamp.desc`);
    return (rows || []).map(rowToVenda);
  }

  /* ---------- OS ---------- */
  async function abrirDetalheOS(id) {
    setOsDetailId(id);
    setOsView("detalhe");
    setOsDetail(null);
    try {
      const rows = await sb(`ordens_servico?select=*&id=eq.${id}`);
      if (rows && rows[0]) setOsDetail(rowToOSDetail(rows[0]));
      setSaveError(false);
    } catch (e) { setSaveError(true); }
  }
  function salvarDetalheOS(novo) {
    setOsDetail(novo);
    setOsIndex(osIndex.map((it) => (it.id === novo.id ? { ...it, status: novo.status, clienteNome: novo.cliente.nome, aparelho: novo.aparelho.marcaModelo } : it)));
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(async () => {
      try {
        await sb(`ordens_servico?id=eq.${novo.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(osDetailToRow(novo)) });
        setSaveError(false);
      } catch (e) { setSaveError(true); }
    }, 500);
  }
  async function criarOS(form) {
    const novaOS = {
      cliente: { nome: form.clienteNome, telefone: form.clienteTelefone, cpf: form.clienteCpf, endereco: form.clienteEndereco },
      aparelho: { tipo: form.aparelhoTipo, marcaModelo: form.aparelhoMarcaModelo, serial: form.aparelhoSerial },
      problema_relatado: form.problemaRelatado,
      checklist: CHECKLIST_PADRAO.map((item) => ({ id: genId(), item, status: "nao_testado" })),
      condicao_aparelho: CONDICAO_PADRAO.map((item) => ({ id: genId(), item, status: "nao_testado" })),
      observacoes_condicao: "",
      fotos: [], pecas_usadas: [],
      timeline: [{ id: genId(), status: "recebido", timestamp: new Date().toISOString(), obs: "OS criada" }],
      notificacoes: [],
      termos: TERMO_PADRAO,
      assinatura_cliente: null,
      status: "recebido", valor_mao_de_obra: null, valor_final: null,
    };
    try {
      const rows = await sb("ordens_servico", { method: "POST", body: JSON.stringify(novaOS) });
      const criada = rowToOSDetail(rows[0]);
      setOsIndex([rowToOSIndex(rows[0]), ...osIndex]);
      setSaveError(false);
      abrirDetalheOS(criada.id);
    } catch (e) { setSaveError(true); }
  }
  function adicionarPecaNaOS(produtoEstoque, qtd) {
    if (!osDetail) return;
    const peca = { id: genId(), estoqueId: produtoEstoque.id, nome: produtoEstoque.nome, custo: produtoEstoque.custo, preco: produtoEstoque.preco, qtd };
    salvarDetalheOS({ ...osDetail, pecasUsadas: [...osDetail.pecasUsadas, peca] });
    ajustarQuantidadeLocal(produtoEstoque.id, -qtd);
  }
  function removerPecaDaOS(peca) {
    if (!osDetail) return;
    salvarDetalheOS({ ...osDetail, pecasUsadas: osDetail.pecasUsadas.filter((p) => p.id !== peca.id) });
    ajustarQuantidadeLocal(peca.estoqueId, peca.qtd);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const caixaAberto = !!caixaAtual;

  const navigate = (t) => {
    setTab(t);
    if (t === "os") setOsView("lista");
  };

  return (
    <div className="min-h-screen bg-[#09090D] text-[#F2F2F5] font-sans md:pl-64 pb-20 md:pb-0">
      <SideNav tab={tab} setTab={navigate} />
      <Header caixaAberto={caixaAberto} saveError={saveError} tab={tab} osView={osView} onVoltarOS={() => setOsView("lista")} />
      <MobileSectionNav tab={tab} setTab={navigate} />
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-10">
        {tab === "dashboard" && (
          <DashboardTab caixaAtual={caixaAtual} osIndex={osIndex} estoque={estoque} onNavigate={navigate} onNovaOS={() => { setTab("os"); setOsView("nova"); }} />
        )}
        {tab === "atendimento" && (
          <AtendimentoTab osIndex={osIndex} onNovaOS={() => { setTab("os"); setOsView("nova"); }} onAbrirOS={(id) => { setTab("os"); abrirDetalheOS(id); }} />
        )}
        {tab === "pdv" && (
          <PDVTab caixaAtual={caixaAtual} estoque={estoque} onVenda={registrarVenda} onIrParaCaixa={() => setTab("financeiro")} onExcluirVenda={excluirVenda} onEditarVenda={editarVenda} />
        )}
        {tab === "financeiro" && <CaixaTab caixaAtual={caixaAtual} onAbrir={abrirCaixa} onFechar={fecharCaixa} />}
        {tab === "os" && osView === "lista" && (
          <ListaOS index={osIndex} onAbrir={abrirDetalheOS} onNova={() => setOsView("nova")} />
        )}
        {tab === "os" && osView === "nova" && <NovaOS onCriar={criarOS} onCancelar={() => setOsView("lista")} />}
        {tab === "os" && osView === "detalhe" && (
          <DetalheOS detail={osDetail} estoque={estoque} onSalvar={salvarDetalheOS} onAddPeca={adicionarPecaNaOS} onRemovePeca={removerPecaDaOS} />
        )}
        {tab === "clientes" && <ClientesTab osIndex={osIndex} onAbrirOS={(id) => { setTab("os"); abrirDetalheOS(id); }} />}
        {tab === "estoque" && (
          <EstoqueTab estoque={estoque} onAdd={addProduto} onEdit={editarProduto} onRemove={removerProduto} />
        )}
        {tab === "relatorio" && <RelatorioTab caixaAtual={caixaAtual} onBuscarVendas={buscarVendasPorData} onBuscarVendasPeriodo={buscarVendasPorPeriodo} onExcluirVenda={excluirVenda} onEditarVenda={editarVenda} />}
        {tab === "config" && <ConfiguracoesTab />}
      </main>
      <BottomNav tab={tab} setTab={navigate} />
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "atendimento", label: "Atendimento", icon: Headset },
  { id: "os", label: "Ordens de Serviço", short: "OS", icon: ClipboardList },
  { id: "pdv", label: "PDV", icon: ShoppingBag },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "estoque", label: "Estoque", icon: Package },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "relatorio", label: "Relatórios", icon: BarChart3 },
  { id: "config", label: "Configurações", icon: Settings },
];

function SideNav({ tab, setTab }) {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-[#0C0C12] z-20 flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-500/20 border border-purple-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,.12)]">
            <Sparkles size={18} className="text-purple-300" />
          </div>
          <div>
            <div className="text-[10px] tracking-[.24em] uppercase text-[#72727D]">Sistema</div>
            <div className="font-bold tracking-[.22em] text-white">ENIGMA</div>
          </div>
        </div>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition border " + (tab === id ? "bg-purple-500/10 border-purple-500/25 text-white shadow-[inset_3px_0_0_#8B5CF6]" : "border-transparent text-[#8A8A96] hover:text-white hover:bg-white/[.035]") }>
            <Icon size={17} className={tab === id ? "text-purple-300" : ""} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 text-[10px] text-[#50505A] border-t border-white/10">ENIGMA OS · V2</div>
    </aside>
  );
}

function Header({ caixaAberto, saveError, tab, osView, onVoltarOS }) {
  const current = NAV_ITEMS.find((item) => item.id === tab);
  return (
    <header className="border-b border-white/10 bg-[#09090D]/90 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
        {tab === "os" && osView === "detalhe" ? (
          <button onClick={onVoltarOS} className="flex items-center gap-1.5 text-[#C9C9D2] text-sm hover:text-white">
            <ChevronLeft size={18} /> Ordens de Serviço
          </button>
        ) : (
          <div>
            <div className="md:hidden text-[10px] tracking-[0.23em] text-purple-400 uppercase mb-0.5">ENIGMA OS</div>
            <div className="text-lg md:text-xl font-semibold text-white">{current?.label || "ENIGMA"}</div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {saveError && <span className="hidden sm:flex items-center gap-1 text-[11px] text-red-400"><AlertCircle size={13} /> conexão</span>}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[.03]">
            <span className={"w-2 h-2 rounded-full " + (caixaAberto ? "bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,.7)]" : "bg-[#4A4A54]")} />
            <span className="text-[11px] tracking-wide text-[#B5B5BF] hidden sm:block">{caixaAberto ? "Caixa aberto" : "Caixa fechado"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileSectionNav({ tab, setTab }) {
  return (
    <div className="md:hidden sticky top-[65px] z-[9] bg-[#09090D]/95 backdrop-blur-xl border-b border-white/[.06] overflow-x-auto no-scrollbar">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {NAV_ITEMS.map(({ id, short, label }) => (
          <button key={id} onClick={() => setTab(id)} className={"px-3 py-1.5 rounded-lg text-[10px] border transition " + (tab === id ? "border-purple-500/30 bg-purple-500/10 text-purple-200" : "border-transparent text-[#666672]")}>{short || label}</button>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const core = NAV_ITEMS.filter((item) => ["dashboard", "os", "pdv", "estoque", "financeiro"].includes(item.id));
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0C12]/95 backdrop-blur-xl border-t border-white/10 z-20">
      <div className="grid grid-cols-5">
        {core.map(({ id, short, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={"flex flex-col items-center gap-1 py-3 text-[9px] tracking-wide transition-colors " + (tab === id ? "text-purple-300" : "text-[#62626D]")}>
            <Icon size={17} />
            {short || label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ================= DASHBOARD / CRM ================= */
function MetricCard({ label, value, helper, icon: Icon, accent = "purple" }) {
  const accents = {
    purple: "from-purple-500/15 border-purple-500/20 text-purple-300",
    blue: "from-blue-500/15 border-blue-500/20 text-blue-300",
    green: "from-emerald-500/15 border-emerald-500/20 text-emerald-300",
    amber: "from-amber-500/15 border-amber-500/20 text-amber-300",
  };
  return (
    <div className={"rounded-2xl border bg-gradient-to-br to-transparent p-4 " + accents[accent]}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[.13em] uppercase text-[#858590]">{label}</div>
          <div className="text-2xl font-semibold text-white mt-1">{value}</div>
          {helper && <div className="text-xs text-[#6F6F79] mt-1">{helper}</div>}
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/[.045] border border-white/10 flex items-center justify-center"><Icon size={17} /></div>
      </div>
    </div>
  );
}

function DashboardTab({ caixaAtual, osIndex, estoque, onNavigate, onNovaOS }) {
  const vendas = caixaAtual?.vendas || [];
  const totalHoje = totalGeral(vendas);
  const abertas = osIndex.filter((os) => !["entregue", "cancelado"].includes(os.status));
  const aguardando = osIndex.filter((os) => os.status === "aguardando_aprovacao");
  const prontas = osIndex.filter((os) => os.status === "pronto");
  const estoqueBaixo = estoque.filter((p) => p.quantidade <= p.estoqueMinimo);
  const recentes = osIndex.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,.14),transparent_35%),linear-gradient(145deg,#111119,#0D0D13)] p-5 md:p-7 overflow-hidden relative">
        <div className="relative z-[1] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] tracking-[.18em] uppercase text-purple-300 border border-purple-400/20 bg-purple-500/10 rounded-full px-3 py-1 mb-3"><Sparkles size={12}/> Central operacional</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Tudo o que precisa da sua atenção, em um lugar.</h1>
            <p className="text-sm text-[#8E8E99] mt-2 max-w-2xl">Acompanhe vendas, reparos, caixa e estoque sem navegar por várias telas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onNovaOS}><span className="flex items-center gap-2"><Plus size={16}/> Nova OS</span></Button>
            <Button variant="ghost" onClick={() => onNavigate("pdv")}><span className="flex items-center gap-2"><ShoppingBag size={16}/> Nova venda</span></Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Vendas do caixa" value={fmt(totalHoje)} helper={`${vendas.length} venda(s)`} icon={TrendingUp} accent="green" />
        <MetricCard label="OS em andamento" value={abertas.length} helper="não finalizadas" icon={Wrench} accent="purple" />
        <MetricCard label="Aguardando cliente" value={aguardando.length} helper="aprovação pendente" icon={Clock} accent="amber" />
        <MetricCard label="Prontas" value={prontas.length} helper="para retirada" icon={CheckCircle2} accent="blue" />
      </section>

      <section className="grid lg:grid-cols-[1.6fr_.9fr] gap-4">
        <Card className="!rounded-2xl !p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div><div className="font-medium text-white">Ordens recentes</div><div className="text-xs text-[#6F6F79]">Movimentação mais recente da assistência</div></div>
            <button onClick={() => onNavigate("os")} className="text-xs text-purple-300 flex items-center gap-1">Ver todas <ArrowUpRight size={13}/></button>
          </div>
          <div className="divide-y divide-white/[.06]">
            {recentes.length === 0 && <div className="px-5 py-8 text-sm text-[#666672] text-center">Nenhuma OS cadastrada.</div>}
            {recentes.map((os) => (
              <button key={os.id} onClick={() => { onNavigate("os"); }} className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-white/[.025]">
                <div className="min-w-0"><div className="text-sm text-white truncate">#{os.numero} · {os.clienteNome || "Cliente"}</div><div className="text-xs text-[#6F6F79] truncate">{os.aparelho || "Aparelho não informado"}</div></div>
                <StatusBadge status={os.status}/>
              </button>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="!rounded-2xl">
            <div className="flex items-center justify-between mb-3"><div className="font-medium text-white">Estoque crítico</div><Package size={17} className="text-red-300"/></div>
            {estoqueBaixo.length === 0 ? <div className="text-sm text-[#74747F]">Nenhum item em nível crítico.</div> : (
              <div className="space-y-2">{estoqueBaixo.slice(0,5).map((p) => <div key={p.id} className="flex items-center justify-between text-sm"><span className="text-[#BDBDC6] truncate mr-3">{p.nome}</span><span className="font-mono text-red-300">{p.quantidade}</span></div>)}</div>
            )}
            <button onClick={() => onNavigate("estoque")} className="mt-4 text-xs text-purple-300">Abrir estoque →</button>
          </Card>
          <Card className="!rounded-2xl">
            <div className="text-[11px] uppercase tracking-[.14em] text-[#74747F] mb-2">Caixa</div>
            <div className="flex items-center gap-2"><span className={"w-2 h-2 rounded-full " + (caixaAtual ? "bg-emerald-400" : "bg-[#55555F]")}/><span className="text-sm text-white">{caixaAtual ? "Operação aberta" : "Caixa fechado"}</span></div>
            <button onClick={() => onNavigate("financeiro")} className="mt-4 text-xs text-purple-300">Gerenciar caixa →</button>
          </Card>
        </div>
      </section>
    </div>
  );
}

function AtendimentoTab({ osIndex, onNovaOS, onAbrirOS }) {
  const [busca, setBusca] = useState("");
  const filtradas = osIndex.filter((os) => `${os.clienteNome} ${os.clienteTelefone} ${os.aparelho} ${os.numero}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
          <div><div className="font-medium text-white">Atendimento rápido</div><div className="text-xs text-[#74747F]">Localize cliente, aparelho ou OS antes de abrir um novo atendimento.</div></div>
          <Button onClick={onNovaOS}><span className="flex items-center gap-2"><Plus size={15}/> Abrir nova OS</span></Button>
        </div>
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Cliente, telefone, aparelho ou número da OS" className="pl-9"/></div>
      </Card>
      {busca && <Card className="!rounded-2xl !p-0 overflow-hidden"><div className="divide-y divide-white/[.06]">{filtradas.length === 0 ? <div className="p-6 text-sm text-[#696974] text-center">Nenhum atendimento encontrado.</div> : filtradas.slice(0,20).map((os)=><button key={os.id} onClick={()=>onAbrirOS(os.id)} className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[.025]"><div><div className="text-sm text-white">{os.clienteNome || "Cliente"} · #{os.numero}</div><div className="text-xs text-[#6F6F79]">{os.clienteTelefone || "Sem telefone"} · {os.aparelho}</div></div><StatusBadge status={os.status}/></button>)}</div></Card>}
    </div>
  );
}

function ClientesTab({ osIndex, onAbrirOS }) {
  const [busca, setBusca] = useState("");
  const mapa = new Map();
  osIndex.forEach((os) => {
    const key = (os.clienteTelefone || os.clienteNome || `os-${os.id}`).trim().toLowerCase();
    if (!mapa.has(key)) mapa.set(key, { nome: os.clienteNome || "Cliente", telefone: os.clienteTelefone || "", ordens: [] });
    mapa.get(key).ordens.push(os);
  });
  const clientes = [...mapa.values()].filter((c)=>`${c.nome} ${c.telefone}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl"><div className="flex items-center justify-between gap-4 mb-4"><div><div className="font-medium text-white">Base de clientes</div><div className="text-xs text-[#74747F]">Gerada a partir do histórico atual de ordens de serviço.</div></div><div className="text-2xl font-semibold">{clientes.length}</div></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar cliente ou telefone" className="pl-9"/></div></Card>
      <div className="grid md:grid-cols-2 gap-3">{clientes.map((c)=><Card key={`${c.telefone}-${c.nome}`} className="!rounded-2xl"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300"><User size={17}/></div><div className="min-w-0 flex-1"><div className="text-sm font-medium text-white truncate">{c.nome}</div><div className="text-xs text-[#777782]">{c.telefone || "Telefone não informado"}</div><div className="text-xs text-[#5F5F69] mt-2">{c.ordens.length} ordem(ns) de serviço</div></div><button onClick={()=>onAbrirOS(c.ordens[0].id)} className="text-purple-300"><ChevronRight size={18}/></button></div></Card>)}</div>
    </div>
  );
}

function ConfiguracoesTab() {
  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300"><Settings size={18}/></div><div><div className="font-medium text-white">Configurações da ENIGMA</div><div className="text-xs text-[#74747F]">Base preparada para identidade, usuários, permissões e integrações.</div></div></div><div className="grid sm:grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[.02] p-4"><Label>Empresa</Label><div className="text-sm text-white">ENIGMA</div><div className="text-xs text-[#666672] mt-1">Assistência técnica e acessórios</div></div><div className="rounded-xl border border-white/10 bg-white/[.02] p-4"><Label>Versão</Label><div className="text-sm text-white">ENIGMA OS V2</div><div className="text-xs text-[#666672] mt-1">Estrutura de gestão em evolução</div></div></div></Card>
      <Card className="!rounded-2xl border-amber-500/20 bg-amber-500/[.025]"><div className="flex gap-3"><AlertCircle size={18} className="text-amber-300 shrink-0"/><div><div className="text-sm text-white">Próxima etapa técnica</div><div className="text-xs leading-5 text-[#8C8C96] mt-1">Migrar autenticação, permissões, cadastro independente de clientes e configurações da empresa para tabelas próprias no Supabase. A V2 mantém compatibilidade com a base atual para não interromper a operação.</div></div></div></Card>
    </div>
  );
}

/* ================= PDV ================= */
function PDVTab({ caixaAtual, estoque, onVenda, onIrParaCaixa, onExcluirVenda, onEditarVenda }) {
  const [itens, setItens] = useState([]);
  const [modo, setModo] = useState("estoque"); // estoque | manual
  const [busca, setBusca] = useState("");
  const [qtdSel, setQtdSel] = useState(1);
  const [descricao, setDescricao] = useState("");
  const [tipoManual, setTipoManual] = useState("servico");
  const [valorManual, setValorManual] = useState("");
  const [qtdManual, setQtdManual] = useState(1);
  const [forma, setForma] = useState("dinheiro");
  const [cupomAberto, setCupomAberto] = useState(null);
  const [finalizando, setFinalizando] = useState(false);

  if (!caixaAtual) {
    return (
      <Card className="text-center py-10">
        <Lock className="mx-auto mb-3 text-[#5A5A64]" size={28} />
        <div className="text-[#C9C9D2] mb-1">Caixa fechado</div>
        <div className="text-sm text-[#8A8A96] mb-4">Abra o caixa para começar a vender.</div>
        <Button onClick={onIrParaCaixa}>Ir para Caixa</Button>
      </Card>
    );
  }

  const resultados = estoque.filter((p) => p.categoria === "acessorio" && p.nome.toLowerCase().includes(busca.toLowerCase()));

  function addDoEstoque(p) {
    setItens([...itens, { id: genId(), descricao: p.nome, tipo: "produto", valor: p.preco, qtd: qtdSel, estoqueId: p.id }]);
    setBusca(""); setQtdSel(1);
  }
  function addManual() {
    if (!descricao.trim() || !valorManual || Number(valorManual) <= 0) return;
    setItens([...itens, { id: genId(), descricao: descricao.trim(), tipo: tipoManual, valor: Number(valorManual), qtd: qtdManual }]);
    setDescricao(""); setValorManual(""); setQtdManual(1);
  }
  function removeItem(id) { setItens(itens.filter((i) => i.id !== id)); }
  const total = itens.reduce((s, i) => s + i.valor * i.qtd, 0);
  async function finalizar() {
    if (itens.length === 0 || finalizando) return;
    setFinalizando(true);
    const venda = await onVenda({ itens, formaPagamento: forma });
    setFinalizando(false);
    setItens([]); setForma("dinheiro");
    if (venda) setCupomAberto(venda);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-2 mb-3">
          {[{ id: "estoque", label: "Produto do estoque" }, { id: "manual", label: "Serviço / avulso" }].map((m) => (
            <button key={m.id} onClick={() => setModo(m.id)} className={"flex-1 py-1.5 rounded-lg text-xs tracking-wide border " + (modo === m.id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
              {m.label}
            </button>
          ))}
        </div>

        {modo === "estoque" ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]" />
                <Input placeholder="Buscar capinha, película, carregador..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
              </div>
              <Stepper value={qtdSel} onChange={setQtdSel} />
            </div>
            {busca && (
              <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                {resultados.length === 0 && <div className="text-xs text-[#5A5A64] py-2">Nenhum produto encontrado</div>}
                {resultados.map((p) => (
                  <button key={p.id} onClick={() => addDoEstoque(p)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F0F14] border border-[#2A2A34] text-left">
                    <span className="text-sm text-[#E5E5EA]">{p.nome}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#C9C9D2]">{fmt(p.preco)}</span>
                      <EstoqueBadge item={p} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              {["servico", "produto"].map((t) => (
                <button key={t} onClick={() => setTipoManual(t)} className={"flex-1 py-1.5 rounded-lg text-xs tracking-wide uppercase border " + (tipoManual === t ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
                  {t === "servico" ? "Serviço" : "Produto"}
                </button>
              ))}
            </div>
            <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mb-2" />
            <div className="flex gap-2 items-center">
              <Input placeholder="Valor un. (R$)" inputMode="decimal" value={valorManual} onChange={(e) => setValorManual(e.target.value.replace(",", "."))} />
              <Stepper value={qtdManual} onChange={setQtdManual} />
              <Button onClick={addManual} className="px-3"><Plus size={18} /></Button>
            </div>
          </>
        )}
      </Card>

      <Card>
        <Label>Venda atual</Label>
        {itens.length === 0 ? (
          <div className="text-sm text-[#5A5A64] py-4 text-center">Nenhum item adicionado</div>
        ) : (
          <div className="divide-y divide-[#22222A]">
            {itens.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-[#E5E5EA]">{i.descricao}</div>
                  <div className="text-xs text-[#6E6E78]">{i.qtd}x {fmt(i.valor)}{i.estoqueId ? " · estoque" : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[#E5E5EA]">{fmt(i.valor * i.qtd)}</span>
                  <button onClick={() => removeItem(i.id)} className="text-[#6E6E78] hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {itens.length > 0 && (
          <>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2A2A34]">
              <span className="text-sm text-[#8A8A96]">Total</span>
              <span className="font-mono text-xl text-white">{fmt(total)}</span>
            </div>
            <Label><span className="mt-3 block">Forma de pagamento</span></Label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {FORMAS.map((f) => (
                <button key={f.id} onClick={() => setForma(f.id)} className={"py-2 rounded-lg text-[11px] border transition " + (forma === f.id ? "border-fuchsia-500 text-fuchsia-300 bg-fuchsia-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
                  {f.label}
                </button>
              ))}
            </div>
            <Button onClick={finalizar} disabled={finalizando} className="w-full">{finalizando ? "Salvando..." : "Finalizar venda"}</Button>
          </>
        )}
      </Card>
      {cupomAberto && (
        <CupomVenda
          venda={cupomAberto}
          onFechar={() => setCupomAberto(null)}
          onExcluirVenda={onExcluirVenda}
          onEditarVenda={onEditarVenda}
          onAtualizado={(nova) => setCupomAberto(nova)}
        />
      )}
    </div>
  );
}

/* ================= CAIXA ================= */
function CaixaTab({ caixaAtual, onAbrir, onFechar }) {
  const [valorInicial, setValorInicial] = useState("");
  const [operador, setOperador] = useState("");
  const [observacao, setObservacao] = useState("");
  const [fechando, setFechando] = useState(false);
  const [valorContado, setValorContado] = useState("");
  const [obsFechamento, setObsFechamento] = useState("");

  if (!caixaAtual) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4 text-[#C9C9D2]"><Unlock size={16} className="text-purple-400" /><span className="text-sm tracking-wide">Abertura de caixa</span></div>
        <Label>Valor inicial (troco)</Label>
        <Input inputMode="decimal" placeholder="R$ 0,00" value={valorInicial} onChange={(e) => setValorInicial(e.target.value.replace(",", "."))} className="mb-3" />
        <Label>Operador</Label>
        <Input value={operador} onChange={(e) => setOperador(e.target.value)} placeholder="Quem está abrindo o caixa" className="mb-3" />
        <Label>Observação (opcional)</Label>
        <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} className="mb-4" />
        <Button className="w-full" disabled={valorInicial === ""} onClick={() => onAbrir({ valorInicial, operador, observacao })}>Abrir caixa</Button>
      </Card>
    );
  }

  const totais = totaisPorForma(caixaAtual.vendas);
  const totalVendas = totalGeral(caixaAtual.vendas);
  const saldoEsperadoDinheiro = caixaAtual.valorInicial + totais.dinheiro;

  if (!fechando) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-3 text-[#C9C9D2]"><Wallet size={16} className="text-purple-400" /><span className="text-sm tracking-wide">Caixa aberto</span></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Aberto em</Label><div className="text-[#E5E5EA]">{fmtDateTime(caixaAtual.dataAbertura)}</div></div>
            <div><Label>Valor inicial</Label><div className="font-mono text-[#E5E5EA]">{fmt(caixaAtual.valorInicial)}</div></div>
            {caixaAtual.operador && <div className="col-span-2"><Label>Operador</Label><div className="text-[#E5E5EA]">{caixaAtual.operador}</div></div>}
          </div>
        </Card>
        <Card>
          <Label>Vendas por forma de pagamento</Label>
          <div className="space-y-2 mt-1">
            {FORMAS.map((f) => (
              <div key={f.id} className="flex justify-between text-sm"><span className="text-[#8A8A96]">{f.label}</span><span className="font-mono text-[#E5E5EA]">{fmt(totais[f.id])}</span></div>
            ))}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-[#2A2A34]"><span className="text-sm text-[#C9C9D2]">Total vendido</span><span className="font-mono text-lg text-white">{fmt(totalVendas)}</span></div>
          <div className="flex justify-between mt-1 text-xs"><span className="text-[#6E6E78]">Esperado em dinheiro</span><span className="font-mono text-purple-300">{fmt(saldoEsperadoDinheiro)}</span></div>
        </Card>
        <Button variant="danger" className="w-full" onClick={() => setFechando(true)}>
          <span className="flex items-center justify-center gap-2"><Lock size={15} /> Fechar caixa</span>
        </Button>
      </div>
    );
  }

  const contado = Number(valorContado) || 0;
  const diferenca = contado - saldoEsperadoDinheiro;
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4 text-[#C9C9D2]"><Lock size={16} className="text-red-400" /><span className="text-sm tracking-wide">Fechamento de caixa</span></div>
      <div className="text-sm text-[#8A8A96] mb-3">Esperado em dinheiro: <span className="font-mono text-[#E5E5EA]">{fmt(saldoEsperadoDinheiro)}</span></div>
      <Label>Valor contado na gaveta</Label>
      <Input inputMode="decimal" placeholder="R$ 0,00" value={valorContado} onChange={(e) => setValorContado(e.target.value.replace(",", "."))} className="mb-3" />
      {valorContado !== "" && (
        <div className={"flex items-center gap-2 text-sm mb-3 px-3 py-2 rounded-lg border " + (diferenca === 0 ? "border-green-500/30 text-green-400 bg-green-500/10" : diferenca > 0 ? "border-blue-500/30 text-blue-300 bg-blue-500/10" : "border-red-500/30 text-red-400 bg-red-500/10")}>
          {diferenca === 0 ? <Check size={15} /> : <AlertCircle size={15} />}
          {diferenca === 0 ? "Caixa confere" : diferenca > 0 ? `Sobra de ${fmt(diferenca)}` : `Falta de ${fmt(Math.abs(diferenca))}`}
        </div>
      )}
      <Label>Observação (opcional)</Label>
      <Input value={obsFechamento} onChange={(e) => setObsFechamento(e.target.value)} className="mb-4" />
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => setFechando(false)}>Voltar</Button>
        <Button variant="danger" className="flex-1" disabled={valorContado === ""} onClick={() => onFechar({ valorContado, observacao: obsFechamento })}>Confirmar fechamento</Button>
      </div>
    </Card>
  );
}

/* ================= RELATÓRIO ================= */
function RelatorioTab({ caixaAtual, onBuscarVendas, onBuscarVendasPeriodo, onExcluirVenda, onEditarVenda }) {
  const [modo, setModo] = useState("dia"); // dia | periodo
  const [data, setData] = useState(todayISO());
  const [vendasDoDia, setVendasDoDia] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cupomAberto, setCupomAberto] = useState(null);

  const [dataInicio, setDataInicio] = useState(todayISO().slice(0, 8) + "01");
  const [dataFim, setDataFim] = useState(todayISO());
  const [vendasPeriodo, setVendasPeriodo] = useState([]);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(true);
  const [diaExpandido, setDiaExpandido] = useState(null);

  useEffect(() => {
    if (modo !== "dia") return;
    let ativo = true;
    setCarregando(true);
    onBuscarVendas(data)
      .then((vendas) => { if (ativo) setVendasDoDia(vendas); })
      .catch(() => { if (ativo) setVendasDoDia([]); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [data, modo]);

  useEffect(() => {
    if (modo !== "periodo") return;
    let ativo = true;
    setCarregandoPeriodo(true);
    onBuscarVendasPeriodo(dataInicio, dataFim)
      .then((vendas) => { if (ativo) setVendasPeriodo(vendas); })
      .catch(() => { if (ativo) setVendasPeriodo([]); })
      .finally(() => { if (ativo) setCarregandoPeriodo(false); });
    return () => { ativo = false; };
  }, [dataInicio, dataFim, modo]);

  function atualizarListaLocal(vendaAtualizadaOuNull, idOriginal) {
    const id = vendaAtualizadaOuNull ? vendaAtualizadaOuNull.id : idOriginal;
    setVendasDoDia((prev) => (vendaAtualizadaOuNull ? prev.map((v) => (v.id === id ? vendaAtualizadaOuNull : v)) : prev.filter((v) => v.id !== id)));
    setVendasPeriodo((prev) => (vendaAtualizadaOuNull ? prev.map((v) => (v.id === id ? vendaAtualizadaOuNull : v)) : prev.filter((v) => v.id !== id)));
  }

  const totais = totaisPorForma(vendasDoDia);
  const total = totalGeral(vendasDoDia);

  const porDia = {};
  vendasPeriodo.forEach((v) => {
    const d = v.timestamp.slice(0, 10);
    (porDia[d] = porDia[d] || []).push(v);
  });
  const diasOrdenados = Object.keys(porDia).sort().reverse();
  const totalPeriodo = totalGeral(vendasPeriodo);
  const totaisPeriodo = totaisPorForma(vendasPeriodo);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[{ id: "dia", label: "Dia" }, { id: "periodo", label: "Período" }].map((m) => (
          <button key={m.id} onClick={() => setModo(m.id)} className={"flex-1 py-1.5 rounded-lg text-xs tracking-wide border " + (modo === m.id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
            {m.label}
          </button>
        ))}
      </div>

      {modo === "dia" && (
        <>
          <Card><Label>Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Card>
          <Card>
            <div className="flex items-center justify-between mb-1"><span className="text-sm text-[#8A8A96]">Faturamento do dia</span><span className="font-mono text-2xl text-white">{fmt(total)}</span></div>
            <div className="text-xs text-[#6E6E78]">{carregando ? "Carregando..." : `${vendasDoDia.length} venda(s)`}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {FORMAS.map((f) => (
                <div key={f.id} className="rounded-lg border border-[#2A2A34] bg-[#0F0F14] px-3 py-2">
                  <div className="text-[10px] tracking-wide uppercase text-[#6E6E78]">{f.label}</div>
                  <div className="font-mono text-sm text-[#E5E5EA]">{fmt(totais[f.id])}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Vendas <span className="normal-case text-[#5A5A64]">(toque pra ver o cupom)</span></Label>
            {vendasDoDia.length === 0 ? <div className="text-sm text-[#5A5A64] py-6 text-center">{carregando ? "Carregando..." : "Nenhuma venda nesta data"}</div> : (
              <div className="divide-y divide-[#22222A]">
                {vendasDoDia.map((v) => (
                  <button key={v.id} onClick={() => setCupomAberto(v)} className="w-full text-left py-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6E6E78]">{new Date(v.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {FORMAS.find((f) => f.id === v.formaPagamento)?.label}</span>
                      <span className="font-mono text-sm text-[#E5E5EA]">{fmt(v.total)}</span>
                    </div>
                    <div className="text-xs text-[#8A8A96] mt-0.5">{v.itens.map((i) => i.descricao).join(", ")}</div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {modo === "periodo" && (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>De</Label><Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
              <div><Label>Até</Label><Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-1"><span className="text-sm text-[#8A8A96]">Faturamento do período</span><span className="font-mono text-2xl text-white">{fmt(totalPeriodo)}</span></div>
            <div className="text-xs text-[#6E6E78]">{carregandoPeriodo ? "Carregando..." : `${vendasPeriodo.length} venda(s) em ${diasOrdenados.length} dia(s)`}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {FORMAS.map((f) => (
                <div key={f.id} className="rounded-lg border border-[#2A2A34] bg-[#0F0F14] px-3 py-2">
                  <div className="text-[10px] tracking-wide uppercase text-[#6E6E78]">{f.label}</div>
                  <div className="font-mono text-sm text-[#E5E5EA]">{fmt(totaisPeriodo[f.id])}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Por dia</Label>
            {diasOrdenados.length === 0 ? (
              <div className="text-sm text-[#5A5A64] py-6 text-center">{carregandoPeriodo ? "Carregando..." : "Nenhuma venda no período"}</div>
            ) : (
              <div className="divide-y divide-[#22222A]">
                {diasOrdenados.map((d) => {
                  const vendasDia = porDia[d];
                  const totalDia = totalGeral(vendasDia);
                  const aberto = diaExpandido === d;
                  return (
                    <div key={d}>
                      <button onClick={() => setDiaExpandido(aberto ? null : d)} className="w-full flex items-center justify-between py-2.5">
                        <div className="text-left">
                          <div className="text-sm text-[#E5E5EA]">{fmtDate(d)}</div>
                          <div className="text-xs text-[#6E6E78]">{vendasDia.length} venda(s)</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-[#E5E5EA]">{fmt(totalDia)}</span>
                          {aberto ? <ChevronDown size={15} className="text-[#6E6E78]" /> : <ChevronRight size={15} className="text-[#6E6E78]" />}
                        </div>
                      </button>
                      {aberto && (
                        <div className="pb-2 pl-2 space-y-1">
                          {vendasDia.map((v) => (
                            <button key={v.id} onClick={() => setCupomAberto(v)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#0F0F14]">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-[#8A8A96]">{new Date(v.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {FORMAS.find((f) => f.id === v.formaPagamento)?.label}</span>
                                <span className="font-mono text-xs text-[#C9C9D2]">{fmt(v.total)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {cupomAberto && (
        <CupomVenda
          venda={cupomAberto}
          onFechar={() => setCupomAberto(null)}
          onExcluirVenda={onExcluirVenda}
          onEditarVenda={onEditarVenda}
          onAtualizado={(nova) => atualizarListaLocal(nova, cupomAberto.id)}
        />
      )}
    </div>
  );
}

function CupomVenda({ venda, onFechar, onExcluirVenda, onEditarVenda, onAtualizado }) {
  const [modo, setModo] = useState("ver"); // ver | pin | editar | excluir-confirmar
  const [acaoPendente, setAcaoPendente] = useState(null);
  const [pin, setPin] = useState("");
  const [erroPin, setErroPin] = useState(false);
  const [itensEdit, setItensEdit] = useState(venda.itens.map((i) => ({ ...i })));
  const [formaEdit, setFormaEdit] = useState(venda.formaPagamento);
  const [salvando, setSalvando] = useState(false);

  function pedirAcao(acao) {
    setAcaoPendente(acao);
    setModo("pin");
    setPin("");
    setErroPin(false);
  }
  function confirmarPin() {
    if (pin !== PIN_EDICAO) { setErroPin(true); return; }
    if (acaoPendente === "editar") {
      setItensEdit(venda.itens.map((i) => ({ ...i })));
      setFormaEdit(venda.formaPagamento);
      setModo("editar");
    } else if (acaoPendente === "excluir") {
      setModo("excluir-confirmar");
    }
  }
  function removerItemEdit(id) { setItensEdit(itensEdit.filter((i) => i.id !== id)); }
  function mudarQtdEdit(id, qtd) { setItensEdit(itensEdit.map((i) => (i.id === id ? { ...i, qtd } : i))); }
  function mudarValorEdit(id, valor) { setItensEdit(itensEdit.map((i) => (i.id === id ? { ...i, valor } : i))); }
  const totalEdit = itensEdit.reduce((s, i) => s + (Number(i.valor) || 0) * i.qtd, 0);

  async function salvarEdicao() {
    if (itensEdit.length === 0) return;
    setSalvando(true);
    const atualizada = await onEditarVenda(venda, itensEdit.map((i) => ({ ...i, valor: Number(i.valor) || 0 })), formaEdit);
    setSalvando(false);
    if (atualizada) { onAtualizado(atualizada); onFechar(); }
  }
  async function confirmarExclusao() {
    setSalvando(true);
    const ok = await onExcluirVenda(venda);
    setSalvando(false);
    if (ok) { onAtualizado(null); onFechar(); }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-20 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={modo === "ver" ? onFechar : undefined}>
      <div className="bg-[#131318] border border-[#2A2A34] rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] tracking-[0.25em] text-[#8A8A96] uppercase">ENIGMA</div>
              <div className="text-sm text-[#E5E5EA]">
                {modo === "ver" && "Cupom de venda"}
                {modo === "pin" && "Código de acesso"}
                {modo === "editar" && "Editar venda"}
                {modo === "excluir-confirmar" && "Excluir venda"}
              </div>
            </div>
            <button onClick={onFechar} className="text-[#8A8A96]"><X size={18} /></button>
          </div>

          {modo === "ver" && (
            <>
              <div className="text-xs text-[#6E6E78] mb-3">{fmtDateTime(venda.timestamp)}</div>
              <div className="divide-y divide-[#22222A] border-y border-[#2A2A34]">
                {venda.itens.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm text-[#E5E5EA]">{i.descricao}</div>
                      <div className="text-xs text-[#6E6E78]">{i.qtd}x {fmt(i.valor)}</div>
                    </div>
                    <span className="font-mono text-sm text-[#E5E5EA]">{fmt(i.valor * i.qtd)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-[#8A8A96]">Forma de pagamento</span>
                <span className="text-sm text-[#E5E5EA]">{FORMAS.find((f) => f.id === venda.formaPagamento)?.label}</span>
              </div>
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-[#2A2A34]">
                <span className="text-sm text-[#C9C9D2]">Total</span>
                <span className="font-mono text-xl text-white">{fmt(venda.total)}</span>
              </div>
              <Button className="w-full mt-4" onClick={() => window.print()}>
                <span className="flex items-center justify-center gap-2"><Printer size={15} /> Imprimir cupom</span>
              </Button>
              {(onEditarVenda || onExcluirVenda) && (
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => pedirAcao("editar")}>Editar</Button>
                  <Button variant="danger" className="flex-1" onClick={() => pedirAcao("excluir")}>Excluir</Button>
                </div>
              )}
            </>
          )}

          {modo === "pin" && (
            <div>
              <div className="text-xs text-[#8A8A96] mb-3">Digite o código de acesso pra {acaoPendente === "editar" ? "editar" : "excluir"} essa venda.</div>
              <Input
                type="password" inputMode="numeric" placeholder="Código de acesso" value={pin}
                onChange={(e) => { setPin(e.target.value); setErroPin(false); }}
                className="mb-2"
              />
              {erroPin && <div className="text-xs text-red-400 mb-2">Código incorreto.</div>}
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setModo("ver")}>Cancelar</Button>
                <Button className="flex-1" onClick={confirmarPin}>Confirmar</Button>
              </div>
            </div>
          )}

          {modo === "editar" && (
            <div>
              <div className="divide-y divide-[#22222A] border-y border-[#2A2A34] mb-3">
                {itensEdit.map((i) => (
                  <div key={i.id} className="py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#E5E5EA]">{i.descricao}</span>
                      <button onClick={() => removerItemEdit(i.id)} className="text-[#6E6E78] hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stepper value={i.qtd} onChange={(v) => mudarQtdEdit(i.id, v)} />
                      <Input inputMode="decimal" value={i.valor} onChange={(e) => mudarValorEdit(i.id, e.target.value.replace(",", "."))} className="flex-1" />
                    </div>
                  </div>
                ))}
                {itensEdit.length === 0 && <div className="text-xs text-[#5A5A64] py-3 text-center">Sem itens — use Excluir pra remover a venda inteira</div>}
              </div>
              <Label>Forma de pagamento</Label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {FORMAS.map((f) => (
                  <button key={f.id} onClick={() => setFormaEdit(f.id)} className={"py-2 rounded-lg text-[11px] border " + (formaEdit === f.id ? "border-fuchsia-500 text-fuchsia-300 bg-fuchsia-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#8A8A96]">Novo total</span>
                <span className="font-mono text-lg text-white">{fmt(totalEdit)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setModo("ver")}>Cancelar</Button>
                <Button className="flex-1" disabled={itensEdit.length === 0 || salvando} onClick={salvarEdicao}>{salvando ? "Salvando..." : "Salvar alterações"}</Button>
              </div>
            </div>
          )}

          {modo === "excluir-confirmar" && (
            <div>
              <div className="flex items-center gap-2 text-sm text-red-400 mb-3 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10">
                <AlertCircle size={16} /> Essa ação não pode ser desfeita.
              </div>
              <div className="text-sm text-[#C9C9D2] mb-4">Excluir a venda de {fmt(venda.total)} feita em {fmtDateTime(venda.timestamp)}? Itens vinculados ao estoque voltam pra quantidade disponível.</div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setModo("ver")}>Cancelar</Button>
                <Button variant="danger" className="flex-1" disabled={salvando} onClick={confirmarExclusao}>{salvando ? "Excluindo..." : "Confirmar exclusão"}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .print-area { display: none; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { display: block; position: absolute; top: 0; left: 0; width: 100%; padding: 16px; color: #000; background: #fff; font-size: 12px; }
        }
      `}</style>
      <div className="print-area">
        <div style={{ textAlign: "center", fontWeight: "bold" }}>ENIGMA</div>
        <div style={{ textAlign: "center" }}>Cupom de venda</div>
        <div>{fmtDateTime(venda.timestamp)}</div>
        <hr />
        {venda.itens.map((i, idx) => (
          <div key={idx}>{i.qtd}x {i.descricao} — {fmt(i.valor * i.qtd)}</div>
        ))}
        <hr />
        <div>Forma de pagamento: {FORMAS.find((f) => f.id === venda.formaPagamento)?.label}</div>
        <div style={{ fontWeight: "bold" }}>Total: {fmt(venda.total)}</div>
      </div>
    </div>
  );
}

/* ================= ESTOQUE ================= */
function EstoqueTab({ estoque, onAdd, onEdit, onRemove }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("acessorio");
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("2");
  const [busca, setBusca] = useState("");

  function salvar() {
    if (!nome.trim() || preco === "") return;
    onAdd({ nome: nome.trim(), categoria, preco, custo, quantidade, estoqueMinimo });
    setNome(""); setPreco(""); setCusto(""); setQuantidade(""); setEstoqueMinimo("2"); setMostrarForm(false);
  }

  const lista = estoque.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));
  const baixos = estoque.filter((p) => p.quantidade <= p.estoqueMinimo);

  return (
    <div className="space-y-4">
      {baixos.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 text-amber-400 text-sm"><AlertCircle size={15} /> {baixos.length} produto(s) com estoque baixo</div>
        </Card>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]" />
          <Input placeholder="Buscar produto ou peça" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setMostrarForm(!mostrarForm)} className="px-3"><Plus size={18} /></Button>
      </div>

      {mostrarForm && (
        <Card>
          <Label>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Capinha iPhone 12, Tela iPhone 12" className="mb-2" />
          <div className="flex gap-2 mb-2">
            {[{ id: "acessorio", label: "Acessório (balcão)" }, { id: "peca", label: "Peça técnica" }].map((c) => (
              <button key={c.id} onClick={() => setCategoria(c.id)} className={"flex-1 py-1.5 rounded-lg text-xs border " + (categoria === c.id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div><Label>Preço venda</Label><Input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value.replace(",", "."))} /></div>
            <div><Label>Custo</Label><Input inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value.replace(",", "."))} /></div>
            <div><Label>Quantidade</Label><Input inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} /></div>
            <div><Label>Estoque mínimo</Label><Input inputMode="numeric" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} /></div>
          </div>
          <Button className="w-full" onClick={salvar}>Salvar produto</Button>
        </Card>
      )}

      {lista.length === 0 ? (
        <Card className="text-center py-10">
          <Package className="mx-auto mb-3 text-[#5A5A64]" size={26} />
          <div className="text-sm text-[#8A8A96]">Nenhum produto cadastrado</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {lista.map((p) => (
            <ProdutoCard key={p.id} p={p} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProdutoCard({ p, onEdit, onRemove }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Card>
      <button className="w-full flex items-center justify-between" onClick={() => setAberto(!aberto)}>
        <div className="text-left">
          <div className="text-sm text-[#E5E5EA]">{p.nome}</div>
          <div className="text-xs text-[#6E6E78]">{p.categoria === "acessorio" ? "Acessório" : "Peça técnica"} · {fmt(p.preco)}</div>
        </div>
        <div className="flex items-center gap-3">
          <EstoqueBadge item={p} />
          {aberto ? <ChevronDown size={16} className="text-[#6E6E78]" /> : <ChevronRight size={16} className="text-[#6E6E78]" />}
        </div>
      </button>
      {aberto && (
        <div className="mt-3 pt-3 border-t border-[#2A2A34]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8A8A96]">Ajustar quantidade</span>
            <div className="flex items-center gap-2">
              <button onClick={() => onEdit(p.id, { quantidade: Math.max(0, p.quantidade - 1) })} className="w-8 h-8 rounded-lg border border-[#2A2A34] text-[#C9C9D2]">−</button>
              <span className="font-mono w-8 text-center">{p.quantidade}</span>
              <button onClick={() => onEdit(p.id, { quantidade: p.quantidade + 1 })} className="w-8 h-8 rounded-lg border border-[#2A2A34] text-[#C9C9D2]">+</button>
            </div>
          </div>
          <div className="text-xs text-[#6E6E78] mb-3">Custo: {fmt(p.custo)} · Estoque mínimo: {p.estoqueMinimo}</div>
          <Button variant="danger" className="w-full" onClick={() => onRemove(p.id)}>
            <span className="flex items-center justify-center gap-2"><Trash2 size={14} /> Remover produto</span>
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ================= OS: LISTA ================= */
function ListaOS({ index, onAbrir, onNova }) {
  const [filtro, setFiltro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const lista = index.filter((it) => {
    const okStatus = filtroStatus === "todos" || it.status === filtroStatus;
    const okBusca = filtro === "" || (it.clienteNome || "").toLowerCase().includes(filtro.toLowerCase()) || (it.aparelho || "").toLowerCase().includes(filtro.toLowerCase()) || String(it.numero).includes(filtro);
    return okStatus && okBusca;
  });

  return (
    <div className="space-y-3">
      <Button onClick={onNova} className="w-full"><span className="flex items-center justify-center gap-2"><Plus size={16} /> Nova OS</span></Button>

      {index.length === 0 ? (
        <Card className="text-center py-10">
          <ClipboardList className="mx-auto mb-3 text-[#5A5A64]" size={28} />
          <div className="text-sm text-[#8A8A96]">Nenhuma OS registrada</div>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]" />
            <Input placeholder="Buscar por nº, cliente ou aparelho" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["todos", ...STATUS_OS.map((s) => s.id)].map((id) => (
              <button key={id} onClick={() => setFiltroStatus(id)} className={"shrink-0 px-3 py-1.5 rounded-full text-[11px] border tracking-wide " + (filtroStatus === id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
                {id === "todos" ? "Todos" : statusInfo(id).label}
              </button>
            ))}
          </div>
          {lista.map((it) => (
            <button key={it.id} onClick={() => onAbrir(it.id)} className="w-full text-left">
              <Card className="hover:border-[#3A3A46] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#E5E5EA]">OS #{it.numero} · {it.clienteNome || "—"}</div>
                    <div className="text-xs text-[#6E6E78] mt-0.5">{it.aparelho || "—"}</div>
                    <div className="text-[11px] text-[#5A5A64] mt-1">{fmtDateTime(it.dataEntrada)}</div>
                  </div>
                  <StatusBadge status={it.status} />
                </div>
              </Card>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

/* ================= OS: NOVA ================= */
function NovaOS({ onCriar, onCancelar }) {
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [aparelhoTipo, setAparelhoTipo] = useState("smartphone");
  const [aparelhoMarcaModelo, setAparelhoMarcaModelo] = useState("");
  const [aparelhoSerial, setAparelhoSerial] = useState("");
  const [problemaRelatado, setProblemaRelatado] = useState("");
  const podeCriar = clienteNome.trim() && aparelhoMarcaModelo.trim() && problemaRelatado.trim();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-3 text-[#C9C9D2]"><User size={15} className="text-purple-400" /><span className="text-sm tracking-wide">Cliente</span></div>
        <Label>Nome</Label>
        <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="mb-3" />
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label>Telefone</Label>
            <Input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={clienteCpf} onChange={(e) => setClienteCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
        </div>
        <Label>Endereço</Label>
        <Input value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" />
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-3 text-[#C9C9D2]"><Smartphone size={15} className="text-purple-400" /><span className="text-sm tracking-wide">Aparelho</span></div>
        <div className="flex gap-2 mb-3">
          {["smartphone", "notebook", "outro"].map((t) => (
            <button key={t} onClick={() => setAparelhoTipo(t)} className={"flex-1 py-1.5 rounded-lg text-xs uppercase tracking-wide border " + (aparelhoTipo === t ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>{t}</button>
          ))}
        </div>
        <Label>Marca / modelo</Label>
        <Input value={aparelhoMarcaModelo} onChange={(e) => setAparelhoMarcaModelo(e.target.value)} placeholder="Ex: iPhone 12, Dell Inspiron 15" className="mb-3" />
        <Label>Número de série / IMEI (opcional)</Label>
        <Input value={aparelhoSerial} onChange={(e) => setAparelhoSerial(e.target.value)} />
      </Card>
      <Card>
        <Label>Problema relatado pelo cliente</Label>
        <Textarea rows={3} value={problemaRelatado} onChange={(e) => setProblemaRelatado(e.target.value)} />
      </Card>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancelar}>Cancelar</Button>
        <Button className="flex-1" disabled={!podeCriar} onClick={() => onCriar({ clienteNome, clienteTelefone, clienteCpf, clienteEndereco, aparelhoTipo, aparelhoMarcaModelo, aparelhoSerial, problemaRelatado })}>Abrir OS</Button>
      </div>
    </div>
  );
}

/* ================= OS: DETALHE ================= */
function DetalheOS({ detail, estoque, onSalvar, onAddPeca, onRemovePeca }) {
  const [sub, setSub] = useState("checklist");
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const [obsAvanco, setObsAvanco] = useState("");
  const [mostrarAvanco, setMostrarAvanco] = useState(false);
  const [novoStatusSel, setNovoStatusSel] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [buscaPeca, setBuscaPeca] = useState("");
  const [qtdPeca, setQtdPeca] = useState(1);
  const [novoItemCondicao, setNovoItemCondicao] = useState("");
  const [notifMeio, setNotifMeio] = useState("whatsapp");

  if (!detail) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>;
  }

  function toggleChecklist(itemId) {
    const ordem = ["nao_testado", "ok", "defeito"];
    const checklist = detail.checklist.map((c) => c.id !== itemId ? c : { ...c, status: ordem[(ordem.indexOf(c.status) + 1) % ordem.length] });
    onSalvar({ ...detail, checklist });
  }
  function addChecklistItem() {
    if (!novoItem.trim()) return;
    onSalvar({ ...detail, checklist: [...detail.checklist, { id: genId(), item: novoItem.trim(), status: "nao_testado" }] });
    setNovoItem("");
  }
  function removeChecklistItem(itemId) { onSalvar({ ...detail, checklist: detail.checklist.filter((c) => c.id !== itemId) }); }

  function toggleCondicao(itemId) {
    const ordem = ["nao_testado", "ok", "defeito"];
    const condicaoAparelho = (detail.condicaoAparelho || []).map((c) => c.id !== itemId ? c : { ...c, status: ordem[(ordem.indexOf(c.status) + 1) % ordem.length] });
    onSalvar({ ...detail, condicaoAparelho });
  }
  function addCondicaoItem() {
    if (!novoItemCondicao.trim()) return;
    onSalvar({ ...detail, condicaoAparelho: [...(detail.condicaoAparelho || []), { id: genId(), item: novoItemCondicao.trim(), status: "nao_testado" }] });
    setNovoItemCondicao("");
  }
  function removeCondicaoItem(itemId) { onSalvar({ ...detail, condicaoAparelho: (detail.condicaoAparelho || []).filter((c) => c.id !== itemId) }); }

  function registrarNotificacao() {
    const notificacoes = [...(detail.notificacoes || []), { id: genId(), timestamp: new Date().toISOString(), meio: notifMeio }];
    onSalvar({ ...detail, notificacoes });
  }

  async function handleFotos(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const novas = [];
      for (const file of files) {
        const dataUrl = await resizeImage(file);
        novas.push({ id: genId(), dataUrl, legenda: "", timestamp: new Date().toISOString() });
      }
      await onSalvar({ ...detail, fotos: [...detail.fotos, ...novas] });
    } catch (err) {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }
  function removeFoto(id) { onSalvar({ ...detail, fotos: detail.fotos.filter((f) => f.id !== id) }); }

  function confirmarAvanco() {
    if (!novoStatusSel) return;
    onSalvar({ ...detail, status: novoStatusSel, timeline: [...detail.timeline, { id: genId(), status: novoStatusSel, timestamp: new Date().toISOString(), obs: obsAvanco }] });
    setMostrarAvanco(false); setObsAvanco(""); setNovoStatusSel(null);
  }

  const proximoDoFluxo = (() => {
    const i = FLUXO_PRINCIPAL.indexOf(detail.status);
    return i >= 0 && i < FLUXO_PRINCIPAL.length - 1 ? FLUXO_PRINCIPAL[i + 1] : null;
  })();

  const pecasResultados = estoque.filter((p) => p.categoria === "peca" && p.nome.toLowerCase().includes(buscaPeca.toLowerCase()));
  const totalPecas = detail.pecasUsadas.reduce((s, p) => s + p.preco * p.qtd, 0);
  const valorEstimado = (Number(detail.valorMaoDeObra) || 0) + totalPecas;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-sm text-[#E5E5EA]">OS #{detail.numero} · {detail.cliente.nome}</div>
            <div className="text-xs text-[#8A8A96] mt-0.5">{detail.aparelho.marcaModelo}{detail.aparelho.serial ? ` · ${detail.aparelho.serial}` : ""}</div>
            {detail.cliente.telefone && <div className="text-xs text-[#6E6E78] mt-0.5 flex items-center gap-1"><Phone size={11} /> {detail.cliente.telefone}</div>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={detail.status} />
            <button onClick={() => window.print()} className="flex items-center gap-1 text-[11px] text-[#8A8A96] border border-[#2A2A34] rounded-full px-2.5 py-1">
              <Printer size={12} /> Imprimir
            </button>
          </div>
        </div>
        <div className="text-xs text-[#8A8A96] mt-2 border-t border-[#2A2A34] pt-2">{detail.problemaRelatado}</div>

        {!mostrarAvanco ? (
          <div className="flex gap-2 mt-3">
            {proximoDoFluxo && (
              <Button className="flex-1" onClick={() => { setNovoStatusSel(proximoDoFluxo); setMostrarAvanco(true); }}>
                <span className="flex items-center justify-center gap-1">Avançar para {statusInfo(proximoDoFluxo).label} <ArrowRight size={14} /></span>
              </Button>
            )}
            <Button variant="ghost" onClick={() => { setNovoStatusSel(detail.status); setMostrarAvanco(true); }}>Outro status</Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {STATUS_OS.map((s) => (
                <button key={s.id} onClick={() => setNovoStatusSel(s.id)} className="text-[11px] px-2.5 py-1.5 rounded-full border tracking-wide" style={novoStatusSel === s.id ? { color: s.color, borderColor: s.color, backgroundColor: s.color + "20" } : { color: "#8A8A96", borderColor: "#2A2A34" }}>
                  {s.label}
                </button>
              ))}
            </div>
            <Input placeholder="Observação (opcional)" value={obsAvanco} onChange={(e) => setObsAvanco(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setMostrarAvanco(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={confirmarAvanco}>Confirmar</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-2 overflow-x-auto">
        {[{ id: "entrada", label: "Entrada" }, { id: "checklist", label: "Checklist técnico" }, { id: "fotos", label: "Fotos" }, { id: "pecas", label: "Peças" }, { id: "termo", label: "Termo / Assinatura" }, { id: "linha", label: "Linha do tempo" }, { id: "orcamento", label: "Orçamento" }].map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)} className={"shrink-0 px-3 py-1.5 rounded-full text-xs tracking-wide border " + (sub === t.id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === "entrada" && (
        <div className="space-y-4">
          <Card>
            <Label>Dados do proprietário</Label>
            <div className="grid grid-cols-1 gap-2 mt-1">
              <Input placeholder="Nome" value={detail.cliente.nome} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, nome: e.target.value } })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Telefone" value={detail.cliente.telefone || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, telefone: e.target.value } })} />
                <Input placeholder="CPF" value={detail.cliente.cpf || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, cpf: e.target.value } })} />
              </div>
              <Input placeholder="Endereço" value={detail.cliente.endereco || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, endereco: e.target.value } })} />
            </div>
          </Card>
          <Card>
            <Label>Condição física na entrada</Label>
            <div className="text-[11px] text-[#6E6E78] mb-2">Toque no item: não verificado → sem avaria → com avaria</div>
            <div className="divide-y divide-[#22222A]">
              {(detail.condicaoAparelho || []).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <button onClick={() => toggleCondicao(c.id)} className="flex items-center gap-2.5 flex-1 text-left">
                    {c.status === "ok" && <CheckCircle2 size={17} className="text-green-500 shrink-0" />}
                    {c.status === "defeito" && <XCircle size={17} className="text-red-500 shrink-0" />}
                    {c.status === "nao_testado" && <Circle size={17} className="text-[#4A4A54] shrink-0" />}
                    <span className={"text-sm " + (c.status === "defeito" ? "text-red-300" : "text-[#E5E5EA]")}>{c.item}</span>
                  </button>
                  <button onClick={() => removeCondicaoItem(c.id)} className="text-[#5A5A64] hover:text-red-400 ml-2"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#2A2A34]">
              <Input placeholder="Adicionar item" value={novoItemCondicao} onChange={(e) => setNovoItemCondicao(e.target.value)} />
              <Button onClick={addCondicaoItem} className="px-3"><Plus size={16} /></Button>
            </div>
            <Label><span className="mt-3 block">Observações gerais</span></Label>
            <Textarea rows={2} placeholder="Ex: risco no canto superior direito da tela" value={detail.observacoesCondicao || ""} onChange={(e) => onSalvar({ ...detail, observacoesCondicao: e.target.value })} />
          </Card>
        </div>
      )}

      {sub === "checklist" && (
        <Card>
          <Label>Diagnóstico técnico</Label>
          <div className="text-[11px] text-[#6E6E78] mb-2">Toque no item: não testado → OK → defeito</div>
          <div className="divide-y divide-[#22222A]">
            {detail.checklist.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <button onClick={() => toggleChecklist(c.id)} className="flex items-center gap-2.5 flex-1 text-left">
                  {c.status === "ok" && <CheckCircle2 size={17} className="text-green-500 shrink-0" />}
                  {c.status === "defeito" && <XCircle size={17} className="text-red-500 shrink-0" />}
                  {c.status === "nao_testado" && <Circle size={17} className="text-[#4A4A54] shrink-0" />}
                  <span className={"text-sm " + (c.status === "defeito" ? "text-red-300" : "text-[#E5E5EA]")}>{c.item}</span>
                </button>
                <button onClick={() => removeChecklistItem(c.id)} className="text-[#5A5A64] hover:text-red-400 ml-2"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#2A2A34]">
            <Input placeholder="Adicionar item ao checklist" value={novoItem} onChange={(e) => setNovoItem(e.target.value)} />
            <Button onClick={addChecklistItem} className="px-3"><Plus size={16} /></Button>
          </div>
        </Card>
      )}

      {sub === "fotos" && (
        <Card>
          <Label>Fotos do aparelho</Label>
          <div className="text-[11px] text-[#6E6E78] mb-3">Registre a condição na entrada, durante o reparo e na saída.</div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFotos} />
          <Button variant="ghost" className="w-full mb-3" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <span className="flex items-center justify-center gap-2"><Camera size={16} /> {uploading ? "Processando..." : "Adicionar foto"}</span>
          </Button>
          {detail.fotos.length === 0 ? (
            <div className="text-sm text-[#5A5A64] text-center py-6 flex flex-col items-center gap-2"><ImageIcon size={22} className="text-[#3A3A46]" />Nenhuma foto ainda</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {detail.fotos.map((f) => (
                <div key={f.id} className="relative group">
                  <img src={f.dataUrl} onClick={() => setFotoAmpliada(f)} className="w-full aspect-square object-cover rounded-lg border border-[#2A2A34] cursor-pointer" />
                  <button onClick={() => removeFoto(f.id)} className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {sub === "pecas" && (
        <Card>
          <Label>Peças usadas no reparo</Label>
          <div className="text-[11px] text-[#6E6E78] mb-3">Ao adicionar, a peça sai automaticamente do estoque.</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]" />
              <Input placeholder="Buscar peça no estoque" value={buscaPeca} onChange={(e) => setBuscaPeca(e.target.value)} className="pl-9" />
            </div>
            <Stepper value={qtdPeca} onChange={setQtdPeca} />
          </div>
          {buscaPeca && (
            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
              {pecasResultados.length === 0 && <div className="text-xs text-[#5A5A64] py-2">Nenhuma peça encontrada</div>}
              {pecasResultados.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F0F14] border border-[#2A2A34]">
                  <div>
                    <div className="text-sm text-[#E5E5EA]">{p.nome}</div>
                    <div className="text-xs text-[#6E6E78]">{fmt(p.preco)} · <EstoqueBadge item={p} /> disponível</div>
                  </div>
                  <Button
                    className="px-3 py-1.5"
                    disabled={p.quantidade < qtdPeca}
                    onClick={() => { onAddPeca(p, qtdPeca); setBuscaPeca(""); setQtdPeca(1); }}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {detail.pecasUsadas.length === 0 ? (
            <div className="text-sm text-[#5A5A64] text-center py-4">Nenhuma peça adicionada</div>
          ) : (
            <div className="divide-y divide-[#22222A]">
              {detail.pecasUsadas.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-[#E5E5EA]">{p.nome}</div>
                    <div className="text-xs text-[#6E6E78]">{p.qtd}x {fmt(p.preco)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-[#E5E5EA]">{fmt(p.preco * p.qtd)}</span>
                    <button onClick={() => onRemovePeca(p)} className="text-[#6E6E78] hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {detail.pecasUsadas.length > 0 && (
            <div className="flex justify-between mt-3 pt-3 border-t border-[#2A2A34]">
              <span className="text-sm text-[#8A8A96]">Total em peças</span>
              <span className="font-mono text-[#E5E5EA]">{fmt(totalPecas)}</span>
            </div>
          )}
        </Card>
      )}

      {sub === "termo" && (
        <div className="space-y-4">
          <Card>
            <Label>Termo de condições de serviço</Label>
            <Textarea rows={8} value={detail.termos ?? TERMO_PADRAO} onChange={(e) => onSalvar({ ...detail, termos: e.target.value })} className="text-xs leading-relaxed" />
          </Card>
          <Card>
            <Label>Assinatura do cliente</Label>
            <div className="text-[11px] text-[#6E6E78] mb-2">O cliente assina na tela confirmando ciência dos termos acima.</div>
            <SignaturePad
              assinatura={detail.assinaturaCliente}
              onSalvar={(dataUrl) => onSalvar({ ...detail, assinaturaCliente: { dataUrl, timestamp: new Date().toISOString() } })}
              onLimpar={() => onSalvar({ ...detail, assinaturaCliente: null })}
            />
          </Card>
        </div>
      )}

      {sub === "linha" && (
        <div className="space-y-4">
          <Card>
            <Label>Andamento</Label>
            <div className="mt-2 space-y-0">
              {[...detail.timeline].reverse().map((t, idx) => (
                <div key={t.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ backgroundColor: statusInfo(t.status).color }} />
                    {idx < detail.timeline.length - 1 && <span className="w-px flex-1 bg-[#2A2A34]" />}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm text-[#E5E5EA]">{statusInfo(t.status).label}</div>
                    <div className="text-[11px] text-[#6E6E78] flex items-center gap-1 mt-0.5"><Clock size={10} /> {fmtDateTime(t.timestamp)}</div>
                    {t.obs && <div className="text-xs text-[#8A8A96] mt-1">{t.obs}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Notificações ao cliente</Label>
            <div className="text-[11px] text-[#6E6E78] mb-3">Registre quando o cliente foi avisado que o aparelho está pronto — importante para a taxa de armazenamento após 7 dias.</div>
            <div className="flex gap-2 mb-3">
              {[{ id: "whatsapp", label: "WhatsApp" }, { id: "ligacao", label: "Ligação" }, { id: "presencial", label: "Presencial" }].map((m) => (
                <button key={m.id} onClick={() => setNotifMeio(m.id)} className={"flex-1 py-1.5 rounded-lg text-xs border " + (notifMeio === m.id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
                  {m.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mb-3" onClick={registrarNotificacao}>
              <span className="flex items-center justify-center gap-2"><BellRing size={15} /> Registrar notificação enviada</span>
            </Button>
            {(detail.notificacoes || []).length === 0 ? (
              <div className="text-sm text-[#5A5A64] text-center py-2">Nenhuma notificação registrada</div>
            ) : (
              <div className="divide-y divide-[#22222A]">
                {[...detail.notificacoes].reverse().map((n) => (
                  <div key={n.id} className="py-2 text-sm text-[#C9C9D2] flex items-center justify-between">
                    <span className="capitalize">{n.meio}</span>
                    <span className="text-xs text-[#6E6E78]">{fmtDateTime(n.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {sub === "orcamento" && (
        <Card>
          <Label>Mão de obra</Label>
          <Input inputMode="decimal" placeholder="R$ 0,00" value={detail.valorMaoDeObra} onChange={(e) => onSalvar({ ...detail, valorMaoDeObra: e.target.value.replace(",", ".") })} className="mb-3" />
          <div className="flex justify-between text-sm mb-1"><span className="text-[#8A8A96]">Peças</span><span className="font-mono text-[#E5E5EA]">{fmt(totalPecas)}</span></div>
          <div className="flex justify-between items-center mb-3 pt-2 border-t border-[#2A2A34]"><span className="text-sm text-[#C9C9D2]">Total estimado</span><span className="font-mono text-lg text-white">{fmt(valorEstimado)}</span></div>
          <Label>Valor final cobrado</Label>
          <Input inputMode="decimal" placeholder="R$ 0,00" value={detail.valorFinal} onChange={(e) => onSalvar({ ...detail, valorFinal: e.target.value.replace(",", ".") })} />
        </Card>
      )}

      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black/90 z-20 flex items-center justify-center p-4" onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada.dataUrl} className="max-w-full max-h-[80vh] rounded-lg" />
        </div>
      )}

      <style>{`
        .print-area { display: none; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { display: block; position: absolute; top: 0; left: 0; width: 100%; padding: 24px; color: #000; background: #fff; font-size: 12px; }
          .print-area h1 { font-size: 18px; margin-bottom: 2px; }
          .print-area h2 { font-size: 13px; margin: 14px 0 6px; border-bottom: 1px solid #999; padding-bottom: 3px; }
        }
      `}</style>
      <div className="print-area">
        <h1>ENIGMA — Ordem de Serviço #{detail.numero}</h1>
        <div>Data de entrada: {fmtDateTime(detail.dataEntrada)} · Status atual: {statusInfo(detail.status).label}</div>

        <h2>Proprietário</h2>
        <div>Nome: {detail.cliente.nome}</div>
        <div>Telefone: {detail.cliente.telefone || "—"} · CPF: {detail.cliente.cpf || "—"}</div>
        <div>Endereço: {detail.cliente.endereco || "—"}</div>

        <h2>Aparelho</h2>
        <div>{detail.aparelho.marcaModelo} ({detail.aparelho.tipo}){detail.aparelho.serial ? ` · série/IMEI: ${detail.aparelho.serial}` : ""}</div>
        <div>Problema relatado: {detail.problemaRelatado}</div>

        <h2>Condição na entrada</h2>
        {(detail.condicaoAparelho || []).map((c) => (
          <div key={c.id}>{c.item}: {c.status === "ok" ? "sem avaria" : c.status === "defeito" ? "com avaria" : "não verificado"}</div>
        ))}
        {detail.observacoesCondicao && <div>Observações: {detail.observacoesCondicao}</div>}

        <h2>Checklist técnico</h2>
        {detail.checklist.map((c) => (
          <div key={c.id}>{c.item}: {c.status === "ok" ? "OK" : c.status === "defeito" ? "defeito" : "não testado"}</div>
        ))}

        {detail.pecasUsadas.length > 0 && (
          <>
            <h2>Peças utilizadas</h2>
            {detail.pecasUsadas.map((p) => (<div key={p.id}>{p.qtd}x {p.nome} — {fmt(p.preco * p.qtd)}</div>))}
          </>
        )}

        <h2>Valores</h2>
        <div>Mão de obra: {fmt(detail.valorMaoDeObra)} · Peças: {fmt(totalPecas)} · Total estimado: {fmt(valorEstimado)}</div>
        {detail.valorFinal && <div>Valor final cobrado: {fmt(detail.valorFinal)}</div>}

        <h2>Termo de condições</h2>
        <div style={{ whiteSpace: "pre-line" }}>{detail.termos ?? TERMO_PADRAO}</div>

        <h2>Assinatura do cliente</h2>
        {detail.assinaturaCliente ? (
          <>
            <img src={detail.assinaturaCliente.dataUrl} style={{ maxWidth: "260px", borderBottom: "1px solid #000" }} />
            <div>Assinado em {fmtDateTime(detail.assinaturaCliente.timestamp)}</div>
          </>
        ) : (
          <div>Assinatura pendente ______________________________</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- SignaturePad ---------------- */
function SignaturePad({ assinatura, onSalvar, onLimpar }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);

  function pos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function start(e) {
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = pos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = pos(e, canvas);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#0A0A0F";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    hasStroke.current = true;
  }
  function end() { drawing.current = false; }
  function limpar() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasStroke.current = false;
    onLimpar();
  }
  function salvar() {
    if (!hasStroke.current) return;
    onSalvar(canvasRef.current.toDataURL("image/png"));
  }

  if (assinatura) {
    return (
      <div>
        <img src={assinatura.dataUrl} className="w-full bg-white rounded-lg border border-[#2A2A34]" style={{ maxHeight: "160px", objectFit: "contain" }} />
        <div className="text-[11px] text-[#6E6E78] mt-2">Assinado em {fmtDateTime(assinatura.timestamp)}</div>
        <Button variant="ghost" className="w-full mt-2" onClick={onLimpar}>
          <span className="flex items-center justify-center gap-2"><Eraser size={14} /> Refazer assinatura</span>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={340}
        height={140}
        className="w-full bg-white rounded-lg touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div className="flex gap-2 mt-2">
        <Button variant="ghost" className="flex-1" onClick={limpar}>
          <span className="flex items-center justify-center gap-2"><Eraser size={14} /> Limpar</span>
        </Button>
        <Button className="flex-1" onClick={salvar}>
          <span className="flex items-center justify-center gap-2"><PenTool size={14} /> Salvar assinatura</span>
        </Button>
      </div>
    </div>
  );
}
