import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Camera, Image as ImageIcon, CheckCircle2, Circle, XCircle, ArrowRight,
  Search, ClipboardList, Smartphone, User, Phone, ChevronLeft, Trash2,
  Plus, Clock, AlertCircle, X, Wallet, Lock, Unlock, Check, ShoppingBag,
  TrendingUp, Package, ChevronRight, ChevronDown, Printer, PenTool,
  BellRing, Eraser, Minus, LayoutDashboard, Users, Settings, Headset,
  BarChart3, Wrench, Sparkles, ArrowUpRight, QrCode, Copy, ExternalLink, Send, RefreshCw, UserCheck, Layers, Upload, Link as LinkIcon
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

async function rpc(name, body = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase RPC ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}


/* ---- mapeadores linha do banco <-> objeto usado nos componentes ---- */
function rowToEstoque(r) {
  return {
    id: r.id, nome: r.nome, categoria: r.categoria, preco: Number(r.preco), custo: Number(r.custo),
    quantidade: Number(r.quantidade) || 0, estoqueMinimo: Number(r.estoque_minimo) || 0,
    sku: r.sku || "", codigoBarras: r.codigo_barras || "", marca: r.marca || "",
    compatibilidade: r.compatibilidade || "", fornecedor: r.fornecedor || "", ativo: r.ativo !== false
  };
}
function estoqueToRow(p) {
  return {
    nome: p.nome, categoria: p.categoria, preco: Number(p.preco) || 0, custo: Number(p.custo) || 0,
    quantidade: Number(p.quantidade) || 0, estoque_minimo: Number(p.estoqueMinimo) || 0,
    sku: p.sku || null, codigo_barras: p.codigoBarras || null, marca: p.marca || null,
    compatibilidade: p.compatibilidade || null, fornecedor: p.fornecedor || null,
    ativo: p.ativo !== false, updated_at: new Date().toISOString()
  };
}
function rowToCaixa(r) {
  return {
    id: r.id, dataAbertura: r.data_abertura, valorInicial: Number(r.valor_inicial), operador: r.operador || "", observacaoAbertura: r.observacao_abertura || "",
    vendas: [],
  };
}
function rowToVenda(r) {
  return {
    id: r.id,
    timestamp: r.timestamp || r.created_at,
    itens: r.itens || [],
    formaPagamento: r.forma_pagamento,
    pagamentos: r.pagamentos || (r.forma_pagamento ? [{ forma:r.forma_pagamento, valor:Number(r.total)||0 }] : []),
    subtotal: Number(r.subtotal ?? r.total ?? 0),
    desconto: Number(r.desconto || 0),
    descontoTipo: r.desconto_tipo || "valor",
    total: Number(r.total),
    clienteId: r.cliente_id || null,
    clienteNome: r.cliente_nome || "",
    clienteTelefone: r.cliente_telefone || "",
    status: r.status || "concluida",
    canceladoEm: r.cancelado_em || r.estornado_em || null,
    motivoCancelamento: r.motivo_cancelamento || r.motivo_estorno || ""
  };
}
function rowToOSIndex(r) {
  return { id: r.id, numero: r.numero, clienteId: r.cliente_id || null, clienteNome: r.cliente?.nome || "", clienteTelefone: r.cliente?.telefone || "", aparelho: r.aparelho?.marcaModelo || "", aparelhoTipo:r.aparelho?.tipo || "", aparelhoSerial:r.aparelho?.serial || "", aparelhoCor:r.aparelho?.cor || "", status: r.status, dataEntrada: r.data_entrada, valorFinal:Number(r.valor_final||0) };
}
function rowToOSDetail(r) {
  return {
    id: r.id, numero: r.numero, dataEntrada: r.data_entrada,
    cliente: r.cliente, clienteId: r.cliente_id || null, aparelho: r.aparelho, problemaRelatado: r.problema_relatado || "",
    checklist: r.checklist || [], condicaoAparelho: r.condicao_aparelho || [], observacoesCondicao: r.observacoes_condicao || "",
    fotos: r.fotos || [], pecasUsadas: r.pecas_usadas || [], timeline: r.timeline || [], notificacoes: r.notificacoes || [],
    termos: r.termos ?? TERMO_PADRAO, assinaturaCliente: r.assinatura_cliente || null, status: r.status,
    valorMaoDeObra: r.valor_mao_de_obra ?? "", valorFinal: r.valor_final ?? "",
    diagnosticoTecnico: r.diagnostico_tecnico || "", orcamento: r.orcamento || {}, entrega: r.entrega || {},
    acessoriosRecebidos: r.acessorios_recebidos || "", previsaoEntrega: r.previsao_entrega || "",
  };
}
function osDetailToRow(d) {
  return {
    cliente: d.cliente, cliente_id: d.clienteId || null, aparelho: d.aparelho, problema_relatado: d.problemaRelatado,
    checklist: d.checklist, condicao_aparelho: d.condicaoAparelho, observacoes_condicao: d.observacoesCondicao,
    fotos: d.fotos, pecas_usadas: d.pecasUsadas, timeline: d.timeline, notificacoes: d.notificacoes,
    termos: d.termos, assinatura_cliente: d.assinaturaCliente, status: d.status,
    valor_mao_de_obra: d.valorMaoDeObra === "" || d.valorMaoDeObra === null ? null : Number(d.valorMaoDeObra),
    valor_final: d.valorFinal === "" || d.valorFinal === null ? null : Number(d.valorFinal),
    diagnostico_tecnico: d.diagnosticoTecnico || "", orcamento: d.orcamento || {}, entrega: d.entrega || {},
    acessorios_recebidos: d.acessoriosRecebidos || "", previsao_entrega: d.previsaoEntrega || null,
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
  (vendas || []).filter(v => v.status !== "estornada").forEach((v) => {
    const pagamentos = Array.isArray(v.pagamentos) && v.pagamentos.length
      ? v.pagamentos
      : [{ forma: v.formaPagamento, valor: v.total }];
    pagamentos.forEach((p) => {
      const forma = p.forma || v.formaPagamento;
      if (!forma) return;
      t[forma] = (t[forma] || 0) + Number(p.valor || 0);
    });
  });
  return t;
}
function totalGeral(vendas) {
  return (vendas || []).filter(v => v.status !== "estornada").reduce((s, v) => s + Number(v.total || 0), 0);
}
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


/* ---------------- rota pública para assinatura ---------------- */
export default function AppRouter() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("assinar");
  const orcamentoToken = params.get("orcamento");
  if (orcamentoToken) return <OrcamentoPublico token={orcamentoToken} />;
  if (token) return <AssinaturaPublica token={token} />;
  return <EnigmaSistema />;
}

/* ============================================================ */
function EnigmaSistema() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [saveError, setSaveError] = useState(false);

  const [estoque, setEstoque] = useState([]);
  const [caixaAtual, setCaixaAtual] = useState(null);

  const [osIndex, setOsIndex] = useState([]);
  const [osView, setOsView] = useState("lista"); // lista | nova | detalhe
  const [osDetailId, setOsDetailId] = useState(null);
  const [osDetail, setOsDetail] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [seminovos, setSeminovos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const patchTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [estoqueRows, caixaRows, osRows, clienteRows] = await Promise.all([
          sb("estoque?select=*&order=created_at.desc"),
          sb("caixa_sessoes?select=*&status=eq.aberto&order=data_abertura.desc&limit=1"),
          sb("ordens_servico?select=id,numero,cliente,aparelho,status,data_entrada&order=numero.desc"),
          sb("clientes?select=*&order=nome.asc"),
        ]);
        setEstoque((estoqueRows || []).map(rowToEstoque));
        setOsIndex((osRows || []).map(rowToOSIndex));
        setClientes(clienteRows || []);
        if (caixaRows && caixaRows[0]) {
          const c = rowToCaixa(caixaRows[0]);
          const vendaRows = await sb(`vendas?select=*&caixa_id=eq.${c.id}&order=timestamp.asc`);
          c.vendas = (vendaRows || []).map(rowToVenda);
          setCaixaAtual(c);
        }
        setSaveError(false);
        try {
          const avRows = await sb("avaliacoes_usados?select=*&order=created_at.desc");
          setAvaliacoes(avRows || []);
        } catch (avErr) {
          console.warn("Módulo de avaliações ainda não disponível:", avErr);
        }
        try {
          const semiRows = await sb("seminovos?select=*&order=created_at.desc");
          setSeminovos(semiRows || []);
        } catch (semiErr) {
          console.warn("Módulo de seminovos ainda não disponível:", semiErr);
        }
      } catch (err) {
        setSaveError(true);
      }
      setLoading(false);
    })();
  }, []);

  /* ---------- clientes ---------- */
  async function adicionarCliente(payload) {
    const nome=(payload?.nome||"").trim();
    if(!nome) return null;
    const telefone=(payload.telefone||"").trim();
    const telNorm=telefone.replace(/\D/g,"");
    if(telNorm){
      const existente=clientes.find(c=>String(c.telefone||"").replace(/\D/g,"")===telNorm);
      if(existente){
        alert(`Este telefone já pertence a ${existente.nome}. Use o cadastro existente.`);
        return existente;
      }
    }
    try{
      const rows=await sb("clientes",{method:"POST",body:JSON.stringify({
        nome,
        telefone:telefone||null,
        email:(payload.email||"").trim()||null,
        documento:(payload.documento||"").trim()||null,
        observacoes:(payload.observacoes||"").trim()||null,
        updated_at:new Date().toISOString()
      })});
      const criado=rows?.[0];
      if(criado) setClientes(prev=>[...prev,criado].sort((a,b)=>String(a.nome).localeCompare(String(b.nome),"pt-BR")));
      setSaveError(false);
      return criado||null;
    }catch(e){
      console.error("Falha ao cadastrar cliente:",e);
      alert("Não foi possível cadastrar o cliente. Confira se o telefone já está cadastrado.");
      setSaveError(true);
      return null;
    }
  }

  async function atualizarCliente(id,patch){
    try{
      const body={...patch,updated_at:new Date().toISOString()};
      const rows=await sb(`clientes?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(body)});
      const atualizado=rows?.[0]||{...clientes.find(c=>c.id===id),...body};
      setClientes(prev=>prev.map(c=>c.id===id?atualizado:c).sort((a,b)=>String(a.nome).localeCompare(String(b.nome),"pt-BR")));
      setSaveError(false);
      return atualizado;
    }catch(e){setSaveError(true);return null;}
  }

  /* ---------- estoque ---------- */
  async function registrarMovimentoEstoque({ estoqueId, tipo, quantidade, anterior, posterior, custoUnitario=0, origem="manual", origemId=null, observacao="" }) {
    try {
      await sb("estoque_movimentacoes", {
        method:"POST",
        body:JSON.stringify({
          estoque_id:estoqueId, tipo, quantidade:Number(quantidade)||0,
          quantidade_anterior:Number(anterior)||0, quantidade_posterior:Number(posterior)||0,
          custo_unitario:Number(custoUnitario)||0, origem, origem_id:origemId?String(origemId):null,
          observacao:observacao||null, dados:{}
        })
      });
      return true;
    } catch(e) {
      console.warn("Movimentação de estoque não registrada:",e);
      return false;
    }
  }

  async function addProduto(p) {
    try {
      const rows = await sb("estoque", { method: "POST", body: JSON.stringify(estoqueToRow(p)) });
      const criado=rowToEstoque(rows[0]);
      setEstoque(prev=>[criado,...prev]);
      if(criado.quantidade>0) await registrarMovimentoEstoque({
        estoqueId:criado.id,tipo:"entrada",quantidade:criado.quantidade,anterior:0,posterior:criado.quantidade,
        custoUnitario:criado.custo,origem:"cadastro_inicial",origemId:criado.id,observacao:"Saldo inicial do cadastro"
      });
      setSaveError(false);
      return criado;
    } catch (e) { setSaveError(true); return null; }
  }

  async function editarProduto(id, patch) {
    const atual=estoque.find(p=>p.id===id);
    if(!atual) return null;
    const local={...atual,...patch};
    setEstoque(prev=>prev.map(p=>p.id===id?local:p));
    try {
      const body = {};
      if ("quantidade" in patch) body.quantidade = Number(patch.quantidade)||0;
      if ("preco" in patch) body.preco = Number(patch.preco)||0;
      if ("custo" in patch) body.custo = Number(patch.custo)||0;
      if ("estoqueMinimo" in patch) body.estoque_minimo = Number(patch.estoqueMinimo)||0;
      if ("nome" in patch) body.nome = patch.nome;
      if ("categoria" in patch) body.categoria = patch.categoria;
      if ("sku" in patch) body.sku = patch.sku || null;
      if ("codigoBarras" in patch) body.codigo_barras = patch.codigoBarras || null;
      if ("marca" in patch) body.marca = patch.marca || null;
      if ("compatibilidade" in patch) body.compatibilidade = patch.compatibilidade || null;
      if ("fornecedor" in patch) body.fornecedor = patch.fornecedor || null;
      if ("ativo" in patch) body.ativo = patch.ativo;
      body.updated_at=new Date().toISOString();
      await sb(`estoque?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body), prefer: "return=minimal" });
      setSaveError(false);
      return local;
    } catch (e) { setSaveError(true); return null; }
  }

  async function movimentarEstoque(id,{tipo,quantidade,origem="manual",origemId=null,observacao=""}) {
    const atual=estoque.find(p=>p.id===id);
    if(!atual) return false;
    const q=Math.abs(Number(quantidade)||0);
    if(!q) return false;
    const entrada=["entrada","ajuste_positivo","devolucao"].includes(tipo);
    const posterior=Math.max(0,Number(atual.quantidade)+(entrada?q:-q));
    if(!entrada && q>Number(atual.quantidade)) {
      alert(`Estoque insuficiente para ${atual.nome}. Disponível: ${atual.quantidade}`);
      return false;
    }
    const ok=await editarProduto(id,{quantidade:posterior});
    if(!ok) return false;
    await registrarMovimentoEstoque({
      estoqueId:id,tipo,quantidade:q,anterior:atual.quantidade,posterior,
      custoUnitario:atual.custo,origem,origemId,observacao
    });
    return true;
  }

  async function removerProduto(id) {
    setEstoque(prev=>prev.filter((p) => p.id !== id));
    try {
      await sb(`estoque?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setSaveError(false);
    } catch (e) { setSaveError(true); }
  }

  function ajustarQuantidadeLocal(id, delta) {
    const tipo=delta>=0?"ajuste_positivo":"ajuste_negativo";
    return movimentarEstoque(id,{tipo,quantidade:Math.abs(delta),origem:"ajuste_sistema",observacao:"Ajuste automático"});
  }


  async function atualizarSeminovo(id, patch) {
    const atual = seminovos.find((x) => x.id === id);
    if (!atual) return null;
    const body = { ...patch, updated_at: new Date().toISOString() };
    try {
      const rows = await sb(`seminovos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) });
      const novo = rows?.[0] || { ...atual, ...body };
      setSeminovos((prev) => prev.map((x) => x.id === id ? novo : x));
      setSaveError(false);
      return novo;
    } catch (e) {
      console.error("Falha ao atualizar seminovo:", e);
      setSaveError(true);
      return null;
    }
  }


  async function registrarFinanceiroAutomatico({ tipo, categoriaNome, descricao, valor, formaPagamento, origem, origemId, dados = {} }) {
    try {
      let categoriaId = null;
      if (categoriaNome) {
        const cats = await sb(`financeiro_categorias?select=id&nome=eq.${encodeURIComponent(categoriaNome)}&tipo=eq.${tipo}&limit=1`);
        categoriaId = cats?.[0]?.id || null;
      }
      const body = {
        tipo,
        categoria_id: categoriaId,
        descricao,
        valor: Number(valor) || 0,
        forma_pagamento: formaPagamento || null,
        data_competencia: new Date().toISOString().slice(0,10),
        data_pagamento: new Date().toISOString(),
        status: "pago",
        origem,
        origem_id: String(origemId || ""),
        dados,
        updated_at: new Date().toISOString(),
      };
      const existentes = origemId ? await sb(`financeiro_lancamentos?select=id&origem=eq.${origem}&origem_id=eq.${encodeURIComponent(String(origemId))}&limit=1`) : [];
      if (existentes?.length) return existentes[0];
      const rows = await sb("financeiro_lancamentos", { method:"POST", body:JSON.stringify(body) });
      return rows?.[0] || null;
    } catch (e) {
      console.warn("Lançamento financeiro automático não registrado:", e);
      return null;
    }
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
  async function registrarVenda({ itens, formaPagamento, clienteId = null }) {
    if (!caixaAtual) return null;
    const total = itens.reduce((s, it) => s + it.valor * it.qtd, 0);
    const seminovosVenda = itens.filter((i) => i.seminovoId);
    try {
      // Revalida cada unidade antes de vender para impedir venda duplicada.
      for (const item of seminovosVenda) {
        const rows = await sb(`seminovos?select=id,status,dados&id=eq.${item.seminovoId}&limit=1`);
        const atual = rows?.[0];
        if (!atual || atual.status === "vendido") throw new Error(`Seminovo ${item.descricao} não está mais disponível.`);
      }

      const rows = await sb("vendas", {
        method: "POST",
        body: JSON.stringify({
          caixa_id: caixaAtual.id,
          cliente_id: clienteId || null,
          itens,
          forma_pagamento: formaPagamento,
          pagamentos: [{ forma:formaPagamento, valor:total }],
          subtotal: total,
          desconto: 0,
          desconto_tipo: "valor",
          total
        }),
      });
      let venda = rowToVenda(rows[0]);
      const clienteVenda=clienteId?clientes.find(c=>c.id===clienteId):null;
      if(clienteVenda) venda={...venda,clienteNome:clienteVenda.nome,clienteTelefone:clienteVenda.telefone||""};

      await registrarFinanceiroAutomatico({
        tipo: "entrada",
        categoriaNome: seminovosVenda.length && seminovosVenda.length === itens.length ? "Venda de Seminovos" : "Venda PDV",
        descricao: seminovosVenda.length && seminovosVenda.length === itens.length ? "Venda de seminovo" : "Venda PDV",
        valor: total,
        formaPagamento,
        origem: "pdv",
        origemId: venda.id,
        dados: { itens, clienteId: clienteId || null }
      });

      // Baixa individual dos seminovos vendidos.
      for (const item of seminovosVenda) {
        const atual = seminovos.find((x) => x.id === item.seminovoId);
        const dados = {
          ...(atual?.dados || {}),
          venda: {
            vendaId: venda.id,
            valorVenda: Number(item.valor) || 0,
            formaPagamento,
            vendidoEm: new Date().toISOString(),
            custoAquisicao: Number(atual?.custo_aquisicao) || 0,
            custoReparos: Number(atual?.custo_reparos_previsto) || 0,
            lucroBruto: (Number(item.valor)||0) - (Number(atual?.custo_aquisicao)||0) - (Number(atual?.custo_reparos_previsto)||0),
          }
        };
        await atualizarSeminovo(item.seminovoId, { status: "vendido", dados });
      }

      setCaixaAtual({ ...caixaAtual, vendas: [...caixaAtual.vendas, venda] });
      setSaveError(false);
      const usados = itens.filter((i) => i.estoqueId);
      for (const u of usados) {
        await movimentarEstoque(u.estoqueId,{tipo:"venda",quantidade:u.qtd,origem:"pdv",origemId:venda.id,observacao:`Venda PDV ${venda.id}`});
      }
      return venda;
    } catch (e) {
      console.error("Falha ao registrar venda:", e);
      alert(e?.message || "Não foi possível finalizar a venda.");
      setSaveError(true);
      return null;
    }
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
          status: "fechado",
          data_fechamento: new Date().toISOString(),
          total_vendas: totalGeral(vendas),
          total_por_forma: totais,
          saldo_esperado_dinheiro: saldoEsperadoDinheiro,
          valor_contado: Number(valorContado) || 0,
          diferenca,
          observacao_fechamento: observacao || "",
        }),
      });
      setCaixaAtual(null);
      setSaveError(false);
    } catch (e) { setSaveError(true); }
    setTab("financeiro");
  }

  async function excluirVenda(venda, motivo="Estorno solicitado no PDV") {
    if (!venda || venda.status === "estornada") return false;
    try {
      const agora=new Date().toISOString();

      await sb(`vendas?id=eq.${venda.id}`, {
        method:"PATCH", prefer:"return=minimal",
        body:JSON.stringify({status:"estornada",cancelado_em:agora,motivo_cancelamento:motivo,updated_at:agora})
      });

      try {
        await sb("vendas_estornos", {
          method:"POST",
          body:JSON.stringify({
            venda_id:venda.id,motivo,valor_estornado:Number(venda.total)||0,
            itens:venda.itens||[],forma_pagamento:venda.formaPagamento||null,
            operador:caixaAtual?.operador||null,dados:{origem:"pdv"}
          })
        });
      } catch(e) {
        console.warn("Registro formal de estorno:",e);
      }

      // Mantém o lançamento para auditoria, porém deixa de compor os totais financeiros.
      try {
        await sb(`financeiro_lancamentos?origem=eq.pdv&origem_id=eq.${encodeURIComponent(String(venda.id))}`, {
          method:"PATCH",prefer:"return=minimal",
          body:JSON.stringify({status:"cancelado",observacao:`Venda estornada: ${motivo}`,updated_at:agora})
        });
      } catch {}

      // Devolve produtos ao estoque com rastreabilidade.
      const usados=(venda.itens||[]).filter(i=>i.estoqueId);
      for(const u of usados){
        await movimentarEstoque(u.estoqueId,{
          tipo:"devolucao",quantidade:u.qtd,origem:"estorno_pdv",
          origemId:venda.id,observacao:`Estorno da venda: ${motivo}`
        });
      }

      // Restaura seminovos vendidos.
      const semiItens=(venda.itens||[]).filter(i=>i.seminovoId);
      for(const i of semiItens){
        const atual=seminovos.find(x=>x.id===i.seminovoId);
        const dados={...(atual?.dados||{})};
        if(dados.venda?.vendaId===venda.id) delete dados.venda;
        await atualizarSeminovo(i.seminovoId,{status:"disponivel",dados});
      }

      const vendaAtualizada={...venda,status:"estornada",canceladoEm:agora,motivoCancelamento:motivo};
      if(caixaAtual && caixaAtual.vendas.some(v=>v.id===venda.id)){
        setCaixaAtual({...caixaAtual,vendas:caixaAtual.vendas.map(v=>v.id===venda.id?vendaAtualizada:v)});
      }
      setSaveError(false);
      return true;
    } catch(e){
      console.error("Falha ao estornar venda:",e);
      setSaveError(true);
      return false;
    }
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
      cliente_id: form.clienteId || null,
      cliente: { nome: form.clienteNome, telefone: form.clienteTelefone, cpf: form.clienteCpf, endereco: form.clienteEndereco },
      aparelho: { tipo: form.aparelhoTipo, marcaModelo: form.aparelhoMarcaModelo, serial: form.aparelhoSerial, cor: form.aparelhoCor || "" },
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
      diagnostico_tecnico: "", orcamento: { status: "rascunho", desconto: 0 }, entrega: { garantiaDias: 90, observacoes: "" },
      acessorios_recebidos: form.acessoriosRecebidos || "", previsao_entrega: form.previsaoEntrega || null,
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
    movimentarEstoque(produtoEstoque.id,{tipo:"os",quantidade:qtd,origem:"os",origemId:osDetail.id,observacao:`Uso na OS ${osDetail.numero||osDetail.id}`});
  }
  function removerPecaDaOS(peca) {
    if (!osDetail) return;
    salvarDetalheOS({ ...osDetail, pecasUsadas: osDetail.pecasUsadas.filter((p) => p.id !== peca.id) });
    if (peca.estoqueId) movimentarEstoque(peca.estoqueId,{tipo:"devolucao",quantidade:peca.qtd,origem:"os_estorno",origemId:osDetail.id,observacao:`Remoção de peça da OS ${osDetail.numero||osDetail.id}`});
  }


  /* ---------- Avaliação / compra de usados ---------- */
  async function salvarAvaliacaoUsado(payload) {
    try {
      const body = {
        vendedor: payload.vendedor || {},
        aparelho: payload.aparelho || {},
        inspecao: payload.inspecao || {},
        testes: payload.testes || {},
        precificacao: payload.precificacao || {},
        oferta: payload.oferta || {},
        aquisicao: payload.aquisicao || {},
        etapa: payload.etapa || "identificar",
        status: payload.status || "avaliacao",
        updated_at: new Date().toISOString(),
      };
      if (payload.id) {
        const rows = await sb(`avaliacoes_usados?id=eq.${payload.id}`, { method: "PATCH", body: JSON.stringify(body) });
        const atualizado = rows?.[0] || { ...payload, ...body };
        setAvaliacoes((prev) => prev.map((a) => a.id === payload.id ? atualizado : a));
        return atualizado;
      }
      const rows = await sb("avaliacoes_usados", { method: "POST", body: JSON.stringify(body) });
      const criado = rows?.[0];
      if (criado) setAvaliacoes((prev) => [criado, ...prev]);
      return criado;
    } catch (e) {
      console.error(e);
      setSaveError(true);
      throw e;
    }
  }


  async function registrarAquisicaoComEstoque(payload) {
    try {
      let avaliacao = payload;
      if (!avaliacao?.id) {
        avaliacao = await salvarAvaliacaoUsado(payload);
      }
      if (!avaliacao?.id) throw new Error("A avaliação precisa estar salva antes da aquisição.");

      const valorPago = Number(avaliacao?.aquisicao?.valorFechado || avaliacao?.oferta?.valorFinal || 0);
      const testes = avaliacao?.testes || {};
      const falhas = Object.entries(testes).filter(([,v]) => v === "falha").map(([k]) => k);
      const custoReparos = somaCustosFalhas(falhas, avaliacao?.aparelho, estoque, avaliacao?.precificacao || {});
      const statusSeminovo = falhas.length ? "em_preparacao" : "disponivel";
      const aparelho = avaliacao?.aparelho || {};
      const inspecao = avaliacao?.inspecao || {};

      // Impede duplicidade pela avaliação antes do insert.
      const existentes = await sb(`seminovos?select=id&avaliacao_id=eq.${avaliacao.id}&limit=1`);
      let seminovo = existentes?.[0];

      if (!seminovo) {
        const bodySeminovo = {
          avaliacao_id: avaliacao.id,
          marca: aparelho.marca || "",
          modelo: aparelho.modelo || "",
          armazenamento: aparelho.armazenamento || "",
          cor: aparelho.cor || "",
          imei: aparelho.imei || "",
          serial: aparelho.serial || "",
          bateria: aparelho.bateria === "" ? null : Number(aparelho.bateria) || null,
          custo_aquisicao: valorPago,
          custo_reparos_previsto: custoReparos,
          status: statusSeminovo,
          dados: {
            inspecao,
            testes,
            falhas,
            precificacao: avaliacao.precificacao || {},
            aquisicao: avaliacao.aquisicao || {},
            origem: "avaliacao_usados",
          },
          updated_at: new Date().toISOString(),
        };
        const rows = await sb("seminovos", { method: "POST", body: JSON.stringify(bodySeminovo) });
        seminovo = rows?.[0];
        if (seminovo) setSeminovos(prev => [seminovo, ...prev.filter(x => x.id !== seminovo.id)]);
      }

      const next = {
        ...avaliacao,
        status: "comprado",
        aquisicao: {
          ...(avaliacao.aquisicao || {}),
          valorFechado: valorPago,
          compradoEm: avaliacao?.aquisicao?.compradoEm || new Date().toISOString(),
          registroAquisicao: avaliacao?.aquisicao?.registroAquisicao || ("AQ-" + Date.now()),
          seminovoId: seminovo?.id || null,
          estoqueCriado: true,
        }
      };
      const salvo = await salvarAvaliacaoUsado(next);
      await registrarFinanceiroAutomatico({
        tipo: "saida",
        categoriaNome: "Compra de Seminovos",
        descricao: `Aquisição seminovo — ${aparelho.marca || ""} ${aparelho.modelo || ""}`.trim(),
        valor: valorPago,
        formaPagamento: avaliacao?.aquisicao?.formaPagamento || avaliacao?.aquisicao?.forma || null,
        origem: "seminovo_compra",
        origemId: seminovo?.id || avaliacao.id,
        dados: { avaliacaoId: avaliacao.id, seminovoId: seminovo?.id || null }
      });
      return { avaliacao: salvo || next, seminovo };
    } catch (e) {
      console.error("Falha ao registrar aquisição e estoque:", e);
      setSaveError(true);
      throw e;
    }
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
          <AtendimentoTab osIndex={osIndex} clientes={clientes} onNovaOS={() => { setTab("os"); setOsView("nova"); }} onAbrirOS={(id) => { setTab("os"); abrirDetalheOS(id); }} onAbrirCliente={() => setTab("clientes")} />
        )}
        {tab === "pdv" && (
          <PDVTab caixaAtual={caixaAtual} estoque={estoque} seminovos={seminovos} clientes={clientes} onAddCliente={adicionarCliente} onVenda={registrarVenda} onIrParaCaixa={() => setTab("financeiro")} onExcluirVenda={excluirVenda} onEditarVenda={editarVenda} />
        )}
        {tab === "financeiro" && <FinanceiroTab caixaAtual={caixaAtual} seminovos={seminovos} onAbrir={abrirCaixa} onFechar={fecharCaixa} />}
        {tab === "os" && osView === "lista" && (
          <ListaOS index={osIndex} onAbrir={abrirDetalheOS} onNova={() => setOsView("nova")} />
        )}
        {tab === "os" && osView === "nova" && <NovaOS clientes={clientes} onAddCliente={adicionarCliente} onCriar={criarOS} onCancelar={() => setOsView("lista")} />}
        {tab === "os" && osView === "detalhe" && (
          <DetalheOS detail={osDetail} estoque={estoque} onSalvar={salvarDetalheOS} onAddPeca={adicionarPecaNaOS} onRemovePeca={removerPecaDaOS} />
        )}
        {tab === "clientes" && <ClientesTab clientes={clientes} osIndex={osIndex} onAdd={adicionarCliente} onEdit={atualizarCliente} onAbrirOS={(id) => { setTab("os"); abrirDetalheOS(id); }} />}
        {tab === "avaliacao" && <AvaliacaoUsadosTab avaliacoes={avaliacoes} estoque={estoque} onSalvar={salvarAvaliacaoUsado} onRegistrarCompra={registrarAquisicaoComEstoque} />}
        {tab === "estoque" && (
          <EstoqueTab estoque={estoque} seminovos={seminovos} onAtualizarSeminovo={atualizarSeminovo} onMovimentar={movimentarEstoque} onAdd={addProduto} onEdit={editarProduto} onRemove={removerProduto} />
        )}
        {tab === "compras" && <ComprasTab estoque={estoque} onMovimentar={movimentarEstoque} />}
        {tab === "peliculas" && <TabelaPeliculasTab estoque={estoque} />}
        {tab === "relatorio" && <RelatorioTab caixaAtual={caixaAtual} estoque={estoque} onBuscarVendas={buscarVendasPorData} onBuscarVendasPeriodo={buscarVendasPorPeriodo} onExcluirVenda={excluirVenda} onEditarVenda={editarVenda} />}
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
  { id: "avaliacao", label: "Avaliação de Usados", short: "Usados", icon: Smartphone },
  { id: "estoque", label: "Estoque", icon: Package },
  { id: "compras", label: "Compras & Reposição", short: "Compras", icon: ClipboardList },
  { id: "peliculas", label: "Tabela de Películas", short: "Películas", icon: Layers },
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
      <div className="p-4 text-[10px] text-[#50505A] border-t border-white/10">ENIGMA OS · V3.6</div>
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
  const [periodo,setPeriodo]=useState(7);
  const [dados,setDados]=useState({vendas:[],movs:[],vendasAnteriores:[]});
  const [loading,setLoading]=useState(true);
  const [mostrarInsights,setMostrarInsights]=useState(false);

  function intervaloAtual(){
    const fim=new Date();
    fim.setHours(23,59,59,999);
    const inicio=new Date();
    inicio.setDate(inicio.getDate()-(periodo-1));
    inicio.setHours(0,0,0,0);
    return {inicio,fim};
  }

  async function carregarDashboard(){
    setLoading(true);
    const {inicio,fim}=intervaloAtual();
    const inicioISO=inicio.toISOString();
    const fimISO=fim.toISOString();
    const inicioDia=inicio.toISOString().slice(0,10);
    const fimDia=fim.toISOString().slice(0,10);

    const fimAnterior=new Date(inicio);
    fimAnterior.setMilliseconds(-1);
    const inicioAnterior=new Date(inicio);
    inicioAnterior.setDate(inicioAnterior.getDate()-periodo);
    const inicioAnteriorISO=inicioAnterior.toISOString();
    const fimAnteriorISO=fimAnterior.toISOString();

    try{
      const [vendasRows,movsRows,vendasAnterioresRows]=await Promise.all([
        sb(`vendas?select=*&timestamp=gte.${inicioISO}&timestamp=lte.${fimISO}&order=timestamp.asc`),
        sb(`financeiro_movimentacoes?select=*&data_competencia=gte.${inicioDia}&data_competencia=lte.${fimDia}&order=data_competencia.asc`),
        sb(`vendas?select=*&timestamp=gte.${inicioAnteriorISO}&timestamp=lte.${fimAnteriorISO}&order=timestamp.asc`)
      ]);
      setDados({
        vendas:(vendasRows||[]).map(rowToVenda),
        movs:movsRows||[],
        vendasAnteriores:(vendasAnterioresRows||[]).map(rowToVenda)
      });
    }catch(e){
      console.warn("Dashboard visual:",e);
      setDados({vendas:caixaAtual?.vendas||[],movs:[],vendasAnteriores:[]});
    }
    setLoading(false);
  }

  useEffect(()=>{carregarDashboard();},[periodo,caixaAtual?.id]);

  const vendasValidas=dados.vendas.filter(v=>v.status!=="estornada");
  const faturamento=totalGeral(vendasValidas);
  const ticketMedio=vendasValidas.length?faturamento/vendasValidas.length:0;
  const itensVendidos=vendasValidas.reduce((a,v)=>a+(v.itens||[]).reduce((b,i)=>b+(Number(i.qtd)||0),0),0);

  let custoEstimado=0;
  vendasValidas.forEach(v=>(v.itens||[]).forEach(i=>{
    const produto=estoque.find(x=>x.id===i.estoqueId);
    if(produto) custoEstimado+=(Number(produto.custo)||0)*(Number(i.qtd)||0);
  }));
  const lucroEstimado=faturamento-custoEstimado;
  const margem=faturamento>0?(lucroEstimado/faturamento)*100:0;

  const {inicio,fim}=intervaloAtual();
  const dias=[];
  for(let d=new Date(inicio);d<=fim;d.setDate(d.getDate()+1)){
    const chave=d.toISOString().slice(0,10);
    const vendasDia=vendasValidas.filter(v=>String(v.timestamp||"").slice(0,10)===chave);
    dias.push({
      chave,
      label:d.toLocaleDateString("pt-BR",{day:"2-digit",month:periodo>7?"2-digit":undefined,weekday:periodo<=7?"short":undefined}).replace(".",""),
      valor:totalGeral(vendasDia),
      vendas:vendasDia.length
    });
  }

  const pagamentos=totaisPorForma(vendasValidas);
  const totalPagamentos=Object.values(pagamentos).reduce((a,b)=>a+Number(b||0),0);
  const formas=[
    {id:"pix",label:"Pix",valor:pagamentos.pix||0,classe:"bg-purple-400"},
    {id:"dinheiro",label:"Dinheiro",valor:pagamentos.dinheiro||0,classe:"bg-cyan-400"},
    {id:"debito",label:"Débito",valor:pagamentos.debito||0,classe:"bg-blue-400"},
    {id:"credito",label:"Crédito",valor:pagamentos.credito||0,classe:"bg-fuchsia-400"}
  ];

  let acumulado=0;
  const donutStops=formas.map((f,idx)=>{
    const ini=totalPagamentos?acumulado/totalPagamentos*100:0;
    acumulado+=f.valor;
    const fimP=totalPagamentos?acumulado/totalPagamentos*100:0;
    const cores=["#a855f7","#22d3ee","#60a5fa","#e879f9"];
    return `${cores[idx]} ${ini}% ${fimP}%`;
  }).join(",");

  const topMap={};
  vendasValidas.forEach(v=>(v.itens||[]).forEach(i=>{
    const nome=i.descricao||"Item";
    const atual=topMap[nome]||{qtd:0,faturamento:0};
    atual.qtd+=Number(i.qtd)||0;
    atual.faturamento+=(Number(i.qtd)||0)*(Number(i.valor)||0);
    topMap[nome]=atual;
  }));
  const ranking=Object.entries(topMap).map(([nome,d])=>({nome,...d})).sort((a,b)=>b.qtd-a.qtd).slice(0,6);
  const maxQtd=Math.max(1,...ranking.map(x=>x.qtd));

  const estoqueAcessorios=estoque.filter(p=>p.categoria==="acessorio");
  const zerados=estoqueAcessorios.filter(p=>Number(p.quantidade)<=0);
  const criticos=estoqueAcessorios.filter(p=>Number(p.quantidade)>0&&Number(p.quantidade)<=Number(p.estoqueMinimo||0));
  const saudaveis=estoqueAcessorios.filter(p=>Number(p.quantidade)>Number(p.estoqueMinimo||0));
  const totalEstoqueStatus=Math.max(1,estoqueAcessorios.length);
  const saudePct=Math.round((saudaveis.length/totalEstoqueStatus)*100);
  const capitalEstoque=estoqueAcessorios.reduce((a,p)=>a+(Number(p.custo)||0)*(Number(p.quantidade)||0),0);

  const aguardando=osIndex.filter(os=>os.status==="aguardando_aprovacao");
  const emReparo=osIndex.filter(os=>os.status==="em_reparo");
  const prontas=osIndex.filter(os=>os.status==="pronto");
  const diagnostico=osIndex.filter(os=>os.status==="diagnostico");
  const recebidas=osIndex.filter(os=>os.status==="recebido");
  const abertas=osIndex.filter(os=>!["entregue","cancelado"].includes(os.status));

  const entradas=dados.movs.filter(x=>x.tipo==="entrada"&&x.status==="pago").reduce((a,x)=>a+Number(x.valor||0),0);
  const saidas=dados.movs.filter(x=>x.tipo==="saida"&&x.status==="pago").reduce((a,x)=>a+Number(x.valor||0),0);
  const resultado=entradas-saidas;

  const vendasAnterioresValidas=(dados.vendasAnteriores||[]).filter(v=>v.status!=="estornada");
  const faturamentoAnterior=totalGeral(vendasAnterioresValidas);
  const variacaoFaturamento=faturamentoAnterior>0?((faturamento-faturamentoAnterior)/faturamentoAnterior)*100:null;

  const vendidoPorId={};
  vendasValidas.forEach(v=>(v.itens||[]).forEach(i=>{
    if(!i.estoqueId)return;
    vendidoPorId[i.estoqueId]=(vendidoPorId[i.estoqueId]||0)+(Number(i.qtd)||0);
  }));

  const estoqueSemGiro=estoqueAcessorios
    .filter(p=>Number(p.quantidade)>0&&!vendidoPorId[p.id])
    .map(p=>({...p,capitalParado:(Number(p.custo)||0)*(Number(p.quantidade)||0)}))
    .sort((a,b)=>b.capitalParado-a.capitalParado);

  const capitalParado=estoqueSemGiro.reduce((a,p)=>a+p.capitalParado,0);

  const altoGiroBaixoEstoque=estoqueAcessorios
    .map(p=>({...p,vendido:Number(vendidoPorId[p.id]||0)}))
    .filter(p=>p.vendido>=3&&Number(p.quantidade)<=Math.max(2,Number(p.estoqueMinimo||0)))
    .sort((a,b)=>b.vendido-a.vendido);

  const agora=Date.now();
  const aprovacoesAntigas=aguardando.filter(os=>{
    const t=new Date(os.dataEntrada||0).getTime();
    return t && (agora-t)>(24*60*60*1000);
  });

  const insightsCandidatos=[];

  if(altoGiroBaixoEstoque[0]){
    const p=altoGiroBaixoEstoque[0];
    insightsCandidatos.push({
      prioridade:100, nivel:"critico", icon:"↗",
      titulo:`Repor ${p.nome}`,
      texto:`Vendeu ${p.vendido} un. no período e restam ${p.quantidade}.`,
      acao:"estoque", cta:"Abrir estoque"
    });
  }

  if(estoqueSemGiro[0]&&capitalParado>0){
    const p=estoqueSemGiro[0];
    insightsCandidatos.push({
      prioridade:82, nivel:"atencao", icon:"◌",
      titulo:"Capital parado em estoque",
      texto:`${fmt(capitalParado)} sem giro no período. Maior concentração: ${p.nome}.`,
      acao:"relatorio", cta:"Analisar giro"
    });
  }

  if(aprovacoesAntigas.length){
    insightsCandidatos.push({
      prioridade:95, nivel:"critico", icon:"◷",
      titulo:"Orçamentos aguardando há mais de 24h",
      texto:`${aprovacoesAntigas.length} OS podem precisar de follow-up com o cliente.`,
      acao:"os", cta:"Ver ordens"
    });
  }else if(aguardando.length){
    insightsCandidatos.push({
      prioridade:72, nivel:"atencao", icon:"◷",
      titulo:"Aprovações pendentes",
      texto:`${aguardando.length} OS aguardando resposta do cliente.`,
      acao:"os", cta:"Ver ordens"
    });
  }

  if(prontas.length){
    insightsCandidatos.push({
      prioridade:88, nivel:"oportunidade", icon:"✓",
      titulo:"Aparelhos prontos para retirada",
      texto:`${prontas.length} aparelho(s) já podem ser entregues.`,
      acao:"os", cta:"Ver prontas"
    });
  }

  if(zerados.length){
    insightsCandidatos.push({
      prioridade:90, nivel:"critico", icon:"!",
      titulo:"Produtos zerados",
      texto:`${zerados.length} item(ns) sem saldo disponível.`,
      acao:"estoque", cta:"Repor estoque"
    });
  }else if(criticos.length){
    insightsCandidatos.push({
      prioridade:78, nivel:"atencao", icon:"!",
      titulo:"Estoque próximo do mínimo",
      texto:`${criticos.length} item(ns) precisam de acompanhamento.`,
      acao:"estoque", cta:"Abrir estoque"
    });
  }

  if(variacaoFaturamento!==null&&Math.abs(variacaoFaturamento)>=15){
    const caiu=variacaoFaturamento<0;
    insightsCandidatos.push({
      prioridade:caiu?86:65,
      nivel:caiu?"atencao":"oportunidade",
      icon:caiu?"↓":"↑",
      titulo:caiu?"Faturamento caiu no comparativo":"Faturamento cresceu no comparativo",
      texto:`${Math.abs(variacaoFaturamento).toFixed(0)}% ${caiu?"abaixo":"acima"} dos ${periodo} dias anteriores.`,
      acao:"relatorio", cta:"Investigar vendas"
    });
  }

  if(ranking[0]){
    insightsCandidatos.push({
      prioridade:55, nivel:"oportunidade", icon:"★",
      titulo:`${ranking[0].nome} é o destaque`,
      texto:`Lidera com ${ranking[0].qtd} un. e ${fmt(ranking[0].faturamento)} em vendas.`,
      acao:"relatorio", cta:"Ver ranking"
    });
  }

  const insights=insightsCandidatos.sort((a,b)=>b.prioridade-a.prioridade);
  if(!insights.length) insights.push({
    prioridade:1,nivel:"oportunidade",icon:"✓",
    titulo:"Operação equilibrada",
    texto:"Nenhum ponto crítico detectado neste momento.",
    acao:null,cta:null
  });
  const insightsPrincipais=insights.slice(0,3);

  const recentes=osIndex.slice(0,4);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_88%_10%,rgba(139,92,246,.20),transparent_30%),radial-gradient(circle_at_12%_100%,rgba(34,211,238,.08),transparent_32%),linear-gradient(145deg,#111119,#0D0D13)] p-5 md:p-7 overflow-hidden relative">
        <div className="absolute right-[-40px] top-[-55px] w-48 h-48 rounded-full border border-purple-400/10 shadow-[0_0_80px_rgba(139,92,246,.15)]"/>
        <div className="relative z-[1] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-[9px] tracking-[.24em] uppercase text-purple-300 border border-purple-400/20 bg-purple-500/10 rounded-full px-3 py-1 mb-3"><Sparkles size={12}/> ENIGMA // VISUAL COMMAND CENTER</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">A operação em movimento.</h1>
            <p className="text-sm text-[#8E8E99] mt-2 max-w-2xl">Vendas, estoque e assistência traduzidos em sinais visuais para decidir mais rápido.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
              {[7,30,90].map(n=><button key={n} onClick={()=>setPeriodo(n)} className={"rounded-lg px-3 py-2 text-[10px] transition "+(periodo===n?"bg-purple-500/20 text-purple-200 border border-purple-500/25":"text-[#70707B] border border-transparent")}>{n} dias</button>)}
            </div>
            <Button onClick={onNovaOS}><span className="flex items-center gap-2"><Plus size={15}/> Nova OS</span></Button>
            <Button variant="ghost" onClick={()=>onNavigate("pdv")}><span className="flex items-center gap-2"><ShoppingBag size={15}/> Venda</span></Button>
            <button onClick={carregarDashboard} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-cyan-300"><RefreshCw size={15} className={loading?"animate-spin":""}/></button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Faturamento" value={fmt(faturamento)} helper={`${vendasValidas.length} venda(s) · ${variacaoFaturamento===null?"sem histórico":`${variacaoFaturamento>=0?"+":""}${variacaoFaturamento.toFixed(0)}% vs período anterior`}`} icon={TrendingUp} accent="green"/>
        <MetricCard label="Lucro bruto est." value={fmt(lucroEstimado)} helper={`${margem.toFixed(1)}% de margem`} icon={BarChart3} accent="purple"/>
        <MetricCard label="Ticket médio" value={fmt(ticketMedio)} helper={`${itensVendidos} item(ns) vendidos`} icon={ShoppingBag} accent="blue"/>
        <MetricCard label="OS em andamento" value={abertas.length} helper={`${prontas.length} pronta(s) para retirada`} icon={Wrench} accent="amber"/>
      </section>

      <section className="grid xl:grid-cols-[1.6fr_.8fr] gap-4">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.018),rgba(255,255,255,.005))] p-5 overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div><div className="text-[9px] tracking-[.22em] text-purple-300">EVOLUÇÃO DAS VENDAS</div><div className="text-xs text-[#666672] mt-1">Faturamento diário · últimos {periodo} dias</div></div>
            <div className="text-right"><div className="font-mono text-lg text-white">{fmt(faturamento)}</div><div className="text-[9px] text-[#5F5F69]">TOTAL DO PERÍODO</div></div>
          </div>
          <DashboardLineChart dados={dias}/>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.018),rgba(255,255,255,.005))] p-5">
          <div className="text-[9px] tracking-[.22em] text-cyan-300">FORMAS DE PAGAMENTO</div>
          <div className="text-xs text-[#666672] mt-1">Distribuição das vendas</div>
          <div className="flex items-center justify-center py-5">
            <div className="relative w-40 h-40 rounded-full" style={{background:totalPagamentos?`conic-gradient(${donutStops})`:"#1f1f28"}}>
              <div className="absolute inset-[18px] rounded-full bg-[#101016] border border-white/5 flex flex-col items-center justify-center">
                <div className="text-[8px] tracking-[.15em] text-[#656570]">TOTAL</div>
                <div className="font-mono text-base text-white mt-1">{fmt(totalPagamentos)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {formas.map(f=><div key={f.id} className="flex items-center justify-between gap-2 text-[10px]"><div className="flex items-center gap-2 min-w-0"><span className={"w-2 h-2 rounded-full shrink-0 "+f.classe}/><span className="text-[#8B8B96] truncate">{f.label}</span></div><span className="font-mono text-[#D5D5DB]">{totalPagamentos?Math.round(f.valor/totalPagamentos*100):0}%</span></div>)}
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.05fr_.95fr] gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.012] p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div><div className="text-[9px] tracking-[.22em] text-green-300">TOP PRODUTOS</div><div className="text-xs text-[#666672] mt-1">Ranking visual por quantidade</div></div>
            <button onClick={()=>onNavigate("relatorio")} className="text-[10px] text-purple-300">Analisar giro →</button>
          </div>
          {!ranking.length?<div className="h-48 flex items-center justify-center text-xs text-[#5F5F69]">Sem vendas no período.</div>:
          <div className="space-y-4">{ranking.map((r,idx)=><div key={r.nome}>
            <div className="flex justify-between gap-3 mb-1.5"><div className="text-xs text-[#CBCBD2] truncate"><span className="text-[#555560] mr-2">0{idx+1}</span>{r.nome}</div><div className="text-right shrink-0"><span className="font-mono text-xs text-green-300">{r.qtd} un</span><span className="text-[9px] text-[#555560] ml-2">{fmt(r.faturamento)}</span></div></div>
            <div className="h-2 rounded-full bg-white/[.045] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,.2)]" style={{width:`${Math.max(6,r.qtd/maxQtd*100)}%`}}/></div>
          </div>)}</div>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.012] p-5">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[9px] tracking-[.22em] text-purple-300">FLUXO DA ASSISTÊNCIA</div><div className="text-xs text-[#666672] mt-1">Onde estão as OS agora</div></div>
            <button onClick={()=>onNavigate("os")} className="text-[10px] text-purple-300">Abrir OS →</button>
          </div>
          <div className="mt-6 space-y-4">
            {[
              ["Recebidos",recebidas.length,"bg-blue-400"],
              ["Diagnóstico",diagnostico.length,"bg-cyan-400"],
              ["Aguardando",aguardando.length,"bg-amber-400"],
              ["Em reparo",emReparo.length,"bg-purple-400"],
              ["Prontos",prontas.length,"bg-green-400"]
            ].map(([label,qtd,cls])=>{
              const max=Math.max(1,abertas.length);
              return <div key={label} className="grid grid-cols-[92px_1fr_28px] gap-3 items-center">
                <div className="text-[10px] text-[#858590]">{label}</div>
                <div className="h-3 rounded-full bg-white/[.04] overflow-hidden"><div className={"h-full rounded-full "+cls} style={{width:`${qtd?Math.max(8,Number(qtd)/max*100):0}%`}}/></div>
                <div className="font-mono text-xs text-white text-right">{qtd}</div>
              </div>
            })}
          </div>
          <div className="mt-6 rounded-xl border border-white/8 bg-black/15 p-3 flex justify-between items-center">
            <div><div className="text-[8px] tracking-[.15em] text-[#5F5F69]">TOTAL EM ANDAMENTO</div><div className="text-sm text-white mt-1">{abertas.length} ordem(ns)</div></div>
            <Wrench size={24} className="text-purple-300/70"/>
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-[.8fr_1.2fr] gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.012] p-5">
          <div className="flex justify-between gap-3">
            <div><div className="text-[9px] tracking-[.22em] text-cyan-300">SAÚDE DO ESTOQUE</div><div className="text-xs text-[#666672] mt-1">Disponibilidade dos acessórios</div></div>
            <Package size={18} className="text-cyan-300"/>
          </div>
          <div className="flex items-end justify-between gap-4 mt-6">
            <div><div className="font-mono text-4xl text-white">{saudePct}%</div><div className="text-[10px] text-[#666672] mt-1">estoque saudável</div></div>
            <div className="text-right"><div className="text-[9px] text-[#666672]">CAPITAL EM ESTOQUE</div><div className="font-mono text-sm text-white mt-1">{fmt(capitalEstoque)}</div></div>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-white/[.04] flex mt-5">
            <div className="bg-green-400" style={{width:`${saudaveis.length/totalEstoqueStatus*100}%`}}/>
            <div className="bg-amber-400" style={{width:`${criticos.length/totalEstoqueStatus*100}%`}}/>
            <div className="bg-red-400" style={{width:`${zerados.length/totalEstoqueStatus*100}%`}}/>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div><div className="font-mono text-lg text-green-300">{saudaveis.length}</div><div className="text-[8px] text-[#5F5F69]">SAUDÁVEL</div></div>
            <div><div className="font-mono text-lg text-amber-300">{criticos.length}</div><div className="text-[8px] text-[#5F5F69]">BAIXO</div></div>
            <div><div className="font-mono text-lg text-red-300">{zerados.length}</div><div className="text-[8px] text-[#5F5F69]">ZERADO</div></div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/15 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.08),transparent_35%),rgba(255,255,255,.01)] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><div className="text-[9px] tracking-[.23em] text-purple-300">⚡ INSIGHTS ENIGMA</div><div className="text-xs text-[#666672] mt-1">Só o que merece sua atenção agora</div></div>
            <button onClick={()=>setMostrarInsights(true)} className="text-[10px] text-purple-300">Ver todos ({insights.length}) →</button>
          </div>
          <div className="space-y-2">
            {insightsPrincipais.map((i,idx)=>{
              const visual=i.nivel==="critico"
                ?"border-red-500/15 bg-red-500/[.025] text-red-300"
                :i.nivel==="atencao"
                ?"border-amber-500/15 bg-amber-500/[.025] text-amber-300"
                :"border-green-500/15 bg-green-500/[.025] text-green-300";
              return <button key={idx} disabled={!i.acao} onClick={()=>i.acao&&onNavigate(i.acao)} className={"w-full text-left rounded-xl border p-3 hover:border-purple-500/20 "+visual}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg border border-current/20 bg-black/10 flex items-center justify-center font-mono">{i.icon}</div>
                  <div className="min-w-0 flex-1"><div className="text-xs text-white">{i.titulo}</div><div className="text-[9px] leading-4 text-[#73737E] mt-1">{i.texto}</div>{i.cta&&<div className="text-[9px] mt-2 opacity-90">{i.cta} →</div>}</div>
                </div>
              </button>
            })}
          </div>
        </div>
      </section>

      {mostrarInsights&&<div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setMostrarInsights(false)}>
        <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#121218] p-5" onClick={e=>e.stopPropagation()}>
          <div className="flex justify-between items-start gap-3 mb-5">
            <div><div className="text-[9px] tracking-[.22em] text-purple-300">INSIGHTS ENIGMA // {periodo} DIAS</div><div className="text-xl text-white mt-1">Análise completa</div><div className="text-xs text-[#666672] mt-1">O Dashboard mostra só os 3 prioritários; aqui você vê o restante.</div></div>
            <button onClick={()=>setMostrarInsights(false)}><X size={18}/></button>
          </div>
          <div className="space-y-2">{insights.map((i,idx)=>{
            const visual=i.nivel==="critico"
              ?"border-red-500/15 bg-red-500/[.025]"
              :i.nivel==="atencao"
              ?"border-amber-500/15 bg-amber-500/[.025]"
              :"border-green-500/15 bg-green-500/[.025]";
            return <button key={idx} disabled={!i.acao} onClick={()=>{setMostrarInsights(false);i.acao&&onNavigate(i.acao)}} className={"w-full text-left rounded-xl border p-4 "+visual}>
              <div className="flex gap-3"><div className="font-mono text-lg text-purple-300">{i.icon}</div><div><div className="text-sm text-white">{i.titulo}</div><div className="text-[10px] text-[#74747F] leading-4 mt-1">{i.texto}</div>{i.cta&&<div className="text-[9px] text-purple-300 mt-2">{i.cta} →</div>}</div></div>
            </button>
          })}</div>
        </div>
      </div>}

      <section className="grid lg:grid-cols-[1.35fr_.65fr] gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.012] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex justify-between gap-3">
            <div><div className="text-sm text-white">Ordens recentes</div><div className="text-[10px] text-[#666672] mt-1">Últimos movimentos da assistência</div></div>
            <button onClick={()=>onNavigate("os")} className="text-[10px] text-purple-300">Ver todas →</button>
          </div>
          <div className="divide-y divide-white/[.05]">
            {!recentes.length?<div className="p-7 text-xs text-[#666672] text-center">Nenhuma OS cadastrada.</div>:recentes.map(os=><button key={os.id} onClick={()=>onNavigate("os")} className="w-full p-3.5 flex justify-between gap-3 items-center text-left hover:bg-white/[.02]"><div className="min-w-0"><div className="text-xs text-white truncate">#{os.numero} · {os.clienteNome||"Cliente"}</div><div className="text-[9px] text-[#656570] truncate mt-1">{os.aparelho||"Aparelho não informado"}</div></div><StatusBadge status={os.status}/></button>)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.012] p-5">
          <div className="text-[9px] tracking-[.2em] text-cyan-300">CAIXA / PERÍODO</div>
          <div className="flex items-center gap-2 mt-3"><span className={"w-2 h-2 rounded-full "+(caixaAtual?"bg-green-400":"bg-[#55555F]")}/><span className="text-xs text-white">{caixaAtual?"Caixa aberto":"Caixa fechado"}</span></div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-[10px]"><span className="text-[#666672]">Entradas</span><span className="font-mono text-green-300">{fmt(entradas)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-[#666672]">Saídas</span><span className="font-mono text-red-300">{fmt(saidas)}</span></div>
            <div className="flex justify-between text-xs border-t border-white/8 pt-2"><span>Resultado</span><span className={"font-mono "+(resultado>=0?"text-green-300":"text-red-300")}>{fmt(resultado)}</span></div>
          </div>
          <button onClick={()=>onNavigate("financeiro")} className="mt-4 text-[10px] text-purple-300">Abrir financeiro →</button>
        </div>
      </section>
    </div>
  );
}

function DashboardLineChart({dados=[]}){
  const w=760,h=260,padX=34,padY=28;
  const max=Math.max(1,...dados.map(d=>Number(d.valor)||0));
  const pts=dados.map((d,i)=>{
    const x=dados.length===1?w/2:padX+i*((w-padX*2)/(dados.length-1));
    const y=h-padY-(Number(d.valor||0)/max)*(h-padY*2);
    return {...d,x,y};
  });
  const linha=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area=pts.length?`${linha} L ${pts[pts.length-1].x} ${h-padY} L ${pts[0].x} ${h-padY} Z`:"";
  const labels=pts.filter((_,i)=>dados.length<=10||i===0||i===dados.length-1||i%Math.ceil(dados.length/6)===0);
  return <div className="w-full overflow-hidden">
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px] md:h-[260px]">
      <defs>
        <linearGradient id="enigmaArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity=".28"/><stop offset="100%" stopColor="#22d3ee" stopOpacity=".015"/></linearGradient>
        <linearGradient id="enigmaLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient>
      </defs>
      {[0,.25,.5,.75,1].map((n,i)=><line key={i} x1={padX} x2={w-padX} y1={padY+n*(h-padY*2)} y2={padY+n*(h-padY*2)} stroke="rgba(255,255,255,.055)" strokeWidth="1"/>)}
      {area&&<path d={area} fill="url(#enigmaArea)"/>}
      {linha&&<path d={linha} fill="none" stroke="url(#enigmaLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
      {pts.map((p,i)=><g key={p.chave} className="group">
        <circle cx={p.x} cy={p.y} r="10" fill="transparent"/>
        <circle cx={p.x} cy={p.y} r="4" fill="#111119" stroke={i===pts.length-1?"#22d3ee":"#a855f7"} strokeWidth="2"/>
        <title>{`${p.label}: ${fmt(p.valor)} · ${p.vendas} venda(s)`}</title>
      </g>)}
      {labels.map(p=><text key={`l-${p.chave}`} x={p.x} y={h-7} textAnchor="middle" fill="#62626d" fontSize="10">{p.label}</text>)}
    </svg>
  </div>;
}

function AtendimentoTab({ osIndex, clientes=[], onNovaOS, onAbrirOS, onAbrirCliente }) {
  const [busca, setBusca] = useState("");
  const q=busca.trim().toLowerCase();
  const norm=v=>String(v||"").replace(/\D/g,"");
  const ordens=osIndex.filter(os=>!q||`${os.clienteNome} ${os.clienteTelefone} ${os.aparelho} ${os.numero}`.toLowerCase().includes(q));
  const clientesFiltrados=q?clientes.filter(c=>`${c.nome||""} ${c.telefone||""} ${c.email||""} ${c.documento||""}`.toLowerCase().includes(q)).slice(0,6):[];
  const ativos=osIndex.filter(os=>!["entregue","cancelado"].includes(os.status));
  const aguardando=ativos.filter(os=>os.status==="aguardando_aprovacao");
  const reparo=ativos.filter(os=>os.status==="em_reparo");
  const prontas=ativos.filter(os=>os.status==="pronto");

  const ultimaOSDo=c=>{
    const tel=norm(c.telefone);
    return osIndex.find(os=>(tel&&norm(os.clienteTelefone)===tel)||(!tel&&String(os.clienteNome||"").toLowerCase()===String(c.nome||"").toLowerCase()));
  };

  return <div className="space-y-5">
    <section className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_85%_10%,rgba(139,92,246,.16),transparent_30%),linear-gradient(145deg,#111119,#0D0D13)] p-5 md:p-7">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div><div className="text-[9px] tracking-[.22em] text-purple-300">ENIGMA // OPERATION FLOW</div><h1 className="text-2xl md:text-3xl font-semibold text-white mt-2">Central de Atendimento</h1><p className="text-sm text-[#858590] mt-2">Comece pelo cliente e acompanhe o aparelho até a entrega, sem redigitar informações.</p></div>
        <Button onClick={onNovaOS}><span className="flex items-center gap-2"><Plus size={15}/> Novo atendimento / OS</span></Button>
      </div>
      <div className="relative mt-5"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"/><Input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Busque cliente, telefone, aparelho ou número da OS" className="pl-11 !h-12"/></div>
    </section>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <MetricCyber label="EM ANDAMENTO" value={String(ativos.length)} sub="fluxo operacional"/>
      <MetricCyber label="AGUARDANDO" value={String(aguardando.length)} sub="aprovação"/>
      <MetricCyber label="EM REPARO" value={String(reparo.length)} sub="na bancada"/>
      <MetricCyber label="PRONTAS" value={String(prontas.length)} sub="para retirada"/>
    </div>

    {q&&clientesFiltrados.length>0&&<Card>
      <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">CLIENTES ENCONTRADOS</div>
      <div className="grid md:grid-cols-2 gap-2">{clientesFiltrados.map(c=>{const ultima=ultimaOSDo(c);return <div key={c.id} className="rounded-xl border border-white/8 bg-white/[.015] p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300"><User size={15}/></div>
        <button onClick={()=>onAbrirCliente(c)} className="min-w-0 flex-1 text-left"><div className="text-xs text-white truncate">{c.nome}</div><div className="text-[10px] text-[#6F6F79]">{c.telefone||"Sem telefone"}{ultima?` · última OS #${ultima.numero}`:" · sem OS"}</div></button>
        {ultima&&<button onClick={()=>onAbrirOS(ultima.id)} className="text-[9px] text-cyan-300">Abrir OS →</button>}
      </div>})}</div>
    </Card>}

    <Card className="!p-0 overflow-hidden">
      <div className="p-4 border-b border-white/[.06] flex items-center justify-between"><div><div className="text-sm text-white">{q?"Resultados do atendimento":"Fluxo recente"}</div><div className="text-[10px] text-[#666672]">{q?"Cliente e histórico ficam conectados à OS.":"Ordens que ainda exigem ação da equipe."}</div></div><div className="text-[10px] text-purple-300">{ordens.filter(os=>!["entregue","cancelado"].includes(os.status)).length} ativa(s)</div></div>
      <div className="divide-y divide-white/[.06]">
        {ordens.filter(os=>q||!["entregue","cancelado"].includes(os.status)).slice(0,20).map(os=><button key={os.id} onClick={()=>onAbrirOS(os.id)} className="w-full p-4 grid grid-cols-[1fr_auto] gap-3 text-left hover:bg-white/[.025]">
          <div><div className="text-sm text-white">#{os.numero} · {os.clienteNome||"Cliente"}</div><div className="text-xs text-[#6F6F79] mt-1">{os.aparelho} · {os.clienteTelefone||"sem telefone"}</div></div><StatusBadge status={os.status}/>
        </button>)}
        {!ordens.filter(os=>q||!["entregue","cancelado"].includes(os.status)).length&&<div className="p-8 text-center text-xs text-[#666672]">Nenhum atendimento encontrado.</div>}
      </div>
    </Card>

    <div className="rounded-xl border border-white/8 bg-white/[.012] p-4">
      <div className="text-[9px] tracking-[.18em] text-[#777783]">FLUXO V4.3.2</div>
      <div className="flex flex-wrap gap-2 mt-3">{["Cliente","OS","Diagnóstico","Orçamento","Aprovação","Reparo","Pagamento","Entrega","Pós-venda"].map((x,i)=><span key={x} className="text-[9px] rounded-full border border-purple-500/15 bg-purple-500/[.035] px-3 py-1.5 text-[#A9A9B4]">{i+1}. {x}</span>)}</div>
    </div>
  </div>;
}

function ClientesTab({ clientes = [], osIndex = [], onAdd, onEdit, onAbrirOS }) {
  const [busca,setBusca]=useState("");
  const [mostrarForm,setMostrarForm]=useState(false);
  const [form,setForm]=useState({nome:"",telefone:"",email:"",documento:"",observacoes:""});
  const [selecionado,setSelecionado]=useState(null);
  const [compras,setCompras]=useState([]);
  const [carregando,setCarregando]=useState(false);

  const filtrados=clientes.filter(c=>`${c.nome||""} ${c.telefone||""} ${c.email||""} ${c.documento||""}`.toLowerCase().includes(busca.toLowerCase()));

  async function salvar(){
    const c=await onAdd(form);
    if(c){setForm({nome:"",telefone:"",email:"",documento:"",observacoes:""});setMostrarForm(false);}
  }

  async function abrirCliente(c){
    setSelecionado(c);setCarregando(true);
    try{
      const rows=await sb(`vendas?select=*&cliente_id=eq.${c.id}&order=timestamp.desc`);
      setCompras((rows||[]).map(rowToVenda));
    }catch(e){setCompras([]);}
    setCarregando(false);
  }

  const ordensDo=(c)=>osIndex.filter(os=>{
    if(os.clienteId&&c.id) return os.clienteId===c.id;
    const tel=String(c.telefone||"").replace(/\D/g,"");
    const osTel=String(os.clienteTelefone||"").replace(/\D/g,"");
    return (tel&&osTel&&tel===osTel) || (!tel && String(os.clienteNome||"").toLowerCase()===String(c.nome||"").toLowerCase());
  });

  const comprasValidas=compras.filter(v=>v.status!=="estornada");
  const ordensSelecionado=selecionado?ordensDo(selecionado):[];
  const totalCompras=comprasValidas.reduce((a,v)=>a+Number(v.total||0),0);
  const totalServicos=ordensSelecionado.filter(o=>o.status!=="cancelado").reduce((a,o)=>a+Number(o.valorFinal||0),0);
  const aparelhos=Object.values(ordensSelecionado.reduce((acc,o)=>{
    const chave=(o.aparelhoSerial||o.aparelho||"aparelho").trim().toLowerCase();
    if(!acc[chave]) acc[chave]={chave,nome:o.aparelho||"Aparelho",serial:o.aparelhoSerial||"",cor:o.aparelhoCor||"",tipo:o.aparelhoTipo||"",ordens:[],ultima:null};
    acc[chave].ordens.push(o);
    if(!acc[chave].ultima||new Date(o.dataEntrada)>new Date(acc[chave].ultima.dataEntrada)) acc[chave].ultima=o;
    return acc;
  },{}));
  const interacoes=[
    ...comprasValidas.map(v=>({tipo:"compra",data:v.timestamp,titulo:"Compra no PDV",valor:v.total,id:v.id})),
    ...ordensSelecionado.map(o=>({tipo:"os",data:o.dataEntrada,titulo:`OS #${o.numero} · ${o.aparelho}`,valor:o.valorFinal,id:o.id,status:o.status}))
  ].filter(x=>x.data).sort((a,b)=>new Date(b.data)-new Date(a.data));
  const ultimaInteracao=interacoes[0];

  return <div className="space-y-4">
    <section className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_85%_10%,rgba(139,92,246,.14),transparent_30%),linear-gradient(145deg,#111119,#0D0D13)] p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div><div className="text-[9px] tracking-[.22em] text-purple-300">ENIGMA // CUSTOMER 360</div><div className="text-xl font-semibold text-white mt-1">Clientes</div><div className="text-xs text-[#74747F] mt-1">Uma única identidade para compras, aparelhos e assistência.</div></div>
        <div className="flex items-center gap-3"><div className="text-2xl font-semibold">{clientes.length}</div><Button onClick={()=>setMostrarForm(!mostrarForm)}>+ Cliente</Button></div>
      </div>
      <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome, telefone, e-mail ou documento" className="pl-9"/></div>
    </section>

    {mostrarForm&&<Card>
      <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">NOVO CLIENTE</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Nome *</Label><Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/></div>
        <div><Label>Telefone</Label><Input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/></div>
        <div><Label>E-mail</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div><Label>CPF / Documento</Label><Input value={form.documento} onChange={e=>setForm({...form,documento:e.target.value})}/></div>
        <div className="sm:col-span-2"><Label>Observações</Label><Input value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})}/></div>
      </div>
      <div className="flex gap-2 mt-4"><Button variant="ghost" onClick={()=>setMostrarForm(false)}>Cancelar</Button><Button onClick={salvar}>Cadastrar cliente</Button></div>
    </Card>}

    <div className="grid md:grid-cols-2 gap-3">{filtrados.map(c=>{const oss=ordensDo(c);return <Card key={c.id} className="!rounded-2xl">
      <button onClick={()=>abrirCliente(c)} className="w-full flex items-start gap-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300"><User size={17}/></div>
        <div className="min-w-0 flex-1"><div className="text-sm font-medium text-white truncate">{c.nome}</div><div className="text-xs text-[#777782]">{c.telefone||"Telefone não informado"}</div><div className="flex gap-3 text-[10px] text-[#5F5F69] mt-2"><span>{oss.length} OS</span><span>{[...new Set(oss.map(o=>o.aparelho).filter(Boolean))].length} aparelho(s)</span></div></div><ChevronRight size={18} className="text-purple-300"/>
      </button>
    </Card>})}</div>

    {selecionado&&<div className="fixed inset-0 bg-black/80 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setSelecionado(null)}>
      <div className="bg-[#111117] border border-[#2A2A34] rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between gap-3 mb-5">
          <div><div className="text-[9px] tracking-[.22em] text-purple-300">CLIENTE 360°</div><div className="text-2xl text-white mt-1">{selecionado.nome}</div><div className="text-xs text-[#777782] mt-1">{selecionado.telefone||"Sem telefone"}{selecionado.email?` · ${selecionado.email}`:""}{selecionado.documento?` · ${selecionado.documento}`:""}</div></div>
          <button onClick={()=>setSelecionado(null)}><X size={18}/></button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-5">
          <MetricCyber label="RELACIONAMENTO" value={fmt(totalCompras+totalServicos)} sub="PDV + serviços"/>
          <MetricCyber label="COMPRAS" value={String(comprasValidas.length)} sub={fmt(totalCompras)}/>
          <MetricCyber label="ORDENS" value={String(ordensSelecionado.length)} sub={fmt(totalServicos)}/>
          <MetricCyber label="APARELHOS" value={String(aparelhos.length)} sub="histórico técnico"/>
          <MetricCyber label="ÚLTIMA INTERAÇÃO" value={ultimaInteracao?new Date(ultimaInteracao.data).toLocaleDateString("pt-BR"):"—"} sub={ultimaInteracao?.tipo==="os"?"assistência":ultimaInteracao?"PDV":"sem histórico"}/>
        </div>

        {aparelhos.length>0&&<div className="mb-5">
          <div className="flex items-end justify-between gap-3 mb-2"><div><div className="text-[9px] tracking-[.2em] text-cyan-300">APARELHOS DO CLIENTE</div><div className="text-[10px] text-[#60606B] mt-1">Histórico técnico agrupado por aparelho / IMEI.</div></div><div className="text-[9px] text-[#6B6B76]">{aparelhos.length} cadastrado(s)</div></div>
          <div className="grid sm:grid-cols-2 gap-2">{aparelhos.map(a=><div key={a.chave} className="rounded-xl border border-cyan-500/15 bg-cyan-500/[.025] p-3">
            <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-cyan-500/[.06] border border-cyan-500/15 flex items-center justify-center text-cyan-300"><Smartphone size={15}/></div><div className="min-w-0 flex-1"><div className="text-xs text-white font-medium">{a.nome}</div><div className="text-[9px] text-[#73737E] mt-1">{a.serial?`IMEI / Serial: ${a.serial}`:"IMEI / Serial não informado"}{a.cor?` · ${a.cor}`:""}</div></div><div className="font-mono text-[10px] text-cyan-300">{a.ordens.length} OS</div></div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-3"><div className="text-[9px] text-[#666672]">Última entrada: {a.ultima?.dataEntrada?new Date(a.ultima.dataEntrada).toLocaleDateString("pt-BR"):"—"}</div>{a.ultima&&<button onClick={()=>onAbrirOS(a.ultima.id)} className="text-[9px] text-purple-300">Ver histórico →</button>}</div>
          </div>)}</div>
        </div>}

        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] tracking-[.2em] text-[#8A8A96] mb-2">ORDENS DE SERVIÇO</div>
            {!ordensSelecionado.length?<div className="rounded-xl border border-white/8 p-5 text-xs text-[#666672]">Nenhuma OS vinculada.</div>:<div className="space-y-2">{ordensSelecionado.slice(0,8).map(o=><button key={o.id} onClick={()=>onAbrirOS(o.id)} className="w-full rounded-xl border border-white/8 p-3 flex justify-between gap-3 text-left hover:bg-white/[.025]"><div><div className="text-xs text-white">OS #{o.numero} · {o.aparelho}</div><div className="text-[10px] text-[#656570] mt-1">{o.dataEntrada?fmtDateTime(o.dataEntrada):""}</div></div><div className="text-right"><StatusBadge status={o.status}/>{o.status==="cancelado"?<div className="text-[9px] text-red-300 mt-1">não contabilizada</div>:Number(o.valorFinal)>0&&<div className="font-mono text-[10px] mt-1">{fmt(o.valorFinal)}</div>}</div></button>)}</div>}
          </div>
          <div>
            <div className="text-[9px] tracking-[.2em] text-[#8A8A96] mb-2">COMPRAS NO PDV</div>
            {carregando?<div className="text-xs text-[#666672] py-5">Carregando...</div>:!compras.length?<div className="rounded-xl border border-white/8 p-5 text-xs text-[#666672]">Nenhuma compra vinculada ainda.</div>:<div className="space-y-2">{compras.slice(0,8).map(v=><div key={v.id} className="rounded-xl border border-white/8 p-3 flex justify-between gap-3"><div><div className="text-xs">{fmtDateTime(v.timestamp)}</div><div className="text-[10px] text-[#656570] mt-1 line-clamp-1">{(v.itens||[]).map(i=>i.descricao).join(", ")}</div></div><div className="text-right"><div className="font-mono text-xs">{fmt(v.total)}</div><div className={v.status==="estornada"?"text-[9px] text-red-300":"text-[9px] text-green-300"}>{v.status==="estornada"?"ESTORNADA":"CONCLUÍDA"}</div></div></div>)}</div>}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/8">
          <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">LINHA DO TEMPO DO RELACIONAMENTO</div>
          {!interacoes.length?<div className="text-xs text-[#666672]">Ainda não há interações registradas.</div>:<div className="space-y-2">{interacoes.slice(0,10).map((x,i)=><div key={`${x.tipo}-${x.id}-${i}`} className="flex gap-3 items-center"><div className={"w-2 h-2 rounded-full "+(x.tipo==="os"?"bg-purple-400":"bg-cyan-400")}/><div className="min-w-0 flex-1"><div className="text-xs text-[#CFCFD6]">{x.titulo}</div><div className="text-[9px] text-[#5F5F69]">{fmtDateTime(x.data)}</div></div>{x.tipo==="os"&&x.status==="cancelado"?<div className="text-[9px] text-red-300">Cancelada · não contabilizada</div>:Number(x.valor)>0&&<div className="font-mono text-[10px]">{fmt(x.valor)}</div>}</div>)}</div>}
        </div>
      </div>
    </div>}
  </div>;
}

function ConfiguracoesTab() {
  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300"><Settings size={18}/></div><div><div className="font-medium text-white">Configurações da ENIGMA</div><div className="text-xs text-[#74747F]">Base preparada para identidade, usuários, permissões e integrações.</div></div></div><div className="grid sm:grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[.02] p-4"><Label>Empresa</Label><div className="text-sm text-white">ENIGMA</div><div className="text-xs text-[#666672] mt-1">Assistência técnica e acessórios</div></div><div className="rounded-xl border border-white/10 bg-white/[.02] p-4"><Label>Versão</Label><div className="text-sm text-white">ENIGMA OS V4.3.2</div><div className="text-xs text-[#666672] mt-1">Estrutura de gestão em evolução</div></div></div></Card>
      <Card className="!rounded-2xl border-amber-500/20 bg-amber-500/[.025]"><div className="flex gap-3"><AlertCircle size={18} className="text-amber-300 shrink-0"/><div><div className="text-sm text-white">Próxima etapa técnica</div><div className="text-xs leading-5 text-[#8C8C96] mt-1">Migrar autenticação, permissões, cadastro independente de clientes e configurações da empresa para tabelas próprias no Supabase. A V2 mantém compatibilidade com a base atual para não interromper a operação.</div></div></div></Card>
    </div>
  );
}

/* ================= PDV ================= */
function PDVTab({ caixaAtual, estoque, seminovos = [], clientes = [], onAddCliente, onVenda, onIrParaCaixa, onExcluirVenda, onEditarVenda }) {
  const [itens, setItens] = useState([]);
  const [modo, setModo] = useState("estoque"); // estoque | seminovo | manual
  const [busca, setBusca] = useState("");
  const [qtdSel, setQtdSel] = useState(1);
  const [descricao, setDescricao] = useState("");
  const [tipoManual, setTipoManual] = useState("servico");
  const [valorManual, setValorManual] = useState("");
  const [qtdManual, setQtdManual] = useState(1);
  const [forma, setForma] = useState("dinheiro");
  const [cupomAberto, setCupomAberto] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [historicoVendas,setHistoricoVendas]=useState([]);
  const [carregandoHistorico,setCarregandoHistorico]=useState(false);
  const [clienteSelecionado,setClienteSelecionado]=useState(null);
  const [buscaCliente,setBuscaCliente]=useState("");
  const [mostrarClientes,setMostrarClientes]=useState(false);
  const [novoCliente,setNovoCliente]=useState({nome:"",telefone:""});

  async function carregarHistoricoVendas(){
    setCarregandoHistorico(true);
    try{
      const rows=await sb("vendas?select=*&order=timestamp.desc&limit=100");
      setHistoricoVendas((rows||[]).map(rowToVenda).map(v=>{
        const c=v.clienteId?clientes.find(x=>x.id===v.clienteId):null;
        return c?{...v,clienteNome:c.nome,clienteTelefone:c.telefone||""}:v;
      }));
    }catch(e){console.warn("Falha ao carregar histórico de vendas:",e);}
    setCarregandoHistorico(false);
  }

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
  const seminovosDisponiveis = seminovos.filter((x) => {
    const preco = Number(x?.dados?.pdv?.precoVenda) || 0;
    const q = busca.toLowerCase();
    const match = !q || [x.marca,x.modelo,x.armazenamento,x.cor,x.imei,x.serial].some(v => String(v||"").toLowerCase().includes(q));
    return x.status === "disponivel" && preco > 0 && match;
  });


  function addDoEstoque(p) {
    setItens([...itens, { id: genId(), descricao: p.nome, tipo: "produto", valor: p.preco, qtd: qtdSel, estoqueId: p.id }]);
    setBusca(""); setQtdSel(1);
  }
  function addSeminovo(x) {
    if (itens.some((i) => i.seminovoId === x.id)) return;
    const preco = Number(x?.dados?.pdv?.precoVenda) || 0;
    if (!preco) return;
    setItens([...itens, {
      id: genId(),
      descricao: `${x.marca} ${x.modelo} ${x.armazenamento||""}`.trim(),
      tipo: "seminovo",
      valor: preco,
      qtd: 1,
      seminovoId: x.id,
      imei: x.imei || "",
      serial: x.serial || "",
    }]);
    setBusca("");
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
    const venda = await onVenda({ itens, formaPagamento: forma, clienteId: clienteSelecionado?.id || null });
    setFinalizando(false);
    setItens([]); setForma("dinheiro"); setClienteSelecionado(null); setBuscaCliente("");
    if (venda) setCupomAberto(venda);
  }

  const clientesEncontrados=clientes.filter(c=>{
    const q=buscaCliente.toLowerCase().trim();
    return q && `${c.nome||""} ${c.telefone||""}`.toLowerCase().includes(q);
  }).slice(0,8);

  async function cadastrarClienteRapido(){
    if(!novoCliente.nome.trim()) return;
    const c=await onAddCliente(novoCliente);
    if(c){setClienteSelecionado(c);setNovoCliente({nome:"",telefone:""});setMostrarClientes(false);setBuscaCliente("");}
  }

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><div className="text-[9px] tracking-[.2em] text-purple-300">CLIENTE DA VENDA</div><div className="text-[10px] text-[#666672] mt-1">Opcional</div></div>
          {clienteSelecionado&&<button onClick={()=>setClienteSelecionado(null)} className="text-[10px] text-red-300">Remover vínculo</button>}
        </div>
        {clienteSelecionado?<div className="rounded-xl border border-purple-500/20 bg-purple-500/[.04] p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center"><User size={16} className="text-purple-300"/></div><div><div className="text-sm text-white">{clienteSelecionado.nome}</div><div className="text-xs text-[#777782]">{clienteSelecionado.telefone||"Sem telefone"}</div></div></div>:<>
          <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={buscaCliente} onChange={e=>{setBuscaCliente(e.target.value);setMostrarClientes(true)}} placeholder="Consumidor não identificado — buscar nome ou telefone" className="pl-9"/></div>
          {mostrarClientes&&buscaCliente&&<div className="mt-2 rounded-xl border border-white/10 overflow-hidden">
            {clientesEncontrados.map(c=><button key={c.id} onClick={()=>{setClienteSelecionado(c);setMostrarClientes(false);setBuscaCliente("")}} className="w-full text-left px-3 py-2 border-b border-white/5 hover:bg-white/[.03]"><div className="text-xs text-white">{c.nome}</div><div className="text-[10px] text-[#666672]">{c.telefone||"Sem telefone"}</div></button>)}
            {!clientesEncontrados.length&&<div className="p-3"><div className="text-xs text-[#666672] mb-2">Cliente não encontrado.</div><button onClick={()=>{setNovoCliente({nome:buscaCliente,telefone:""});setMostrarClientes(false)}} className="text-xs text-purple-300">+ Cadastrar agora</button></div>}
          </div>}
          {novoCliente.nome!==""&&<div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2"><Input value={novoCliente.nome} onChange={e=>setNovoCliente({...novoCliente,nome:e.target.value})} placeholder="Nome"/><Input value={novoCliente.telefone} onChange={e=>setNovoCliente({...novoCliente,telefone:e.target.value})} placeholder="Telefone"/><Button onClick={cadastrarClienteRapido}>Salvar</Button></div>}
        </>}
      </Card>

      <Card>
        <div className="flex gap-2 mb-3">
          {[{ id: "estoque", label: "Produtos" }, { id: "seminovo", label: "Seminovos" }, { id: "manual", label: "Serviço / avulso" }, { id:"historico", label:"Histórico" }].map((m) => (
            <button key={m.id} onClick={() => {setModo(m.id);setBusca("");if(m.id==="historico")carregarHistoricoVendas();}} className={"flex-1 py-1.5 rounded-lg text-xs tracking-wide border " + (modo === m.id ? "border-purple-500 text-purple-300 bg-purple-500/10" : "border-[#2A2A34] text-[#8A8A96]")}>
              {m.label}
            </button>
          ))}
        </div>

        {modo === "estoque" && (
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
        )}
        {modo === "seminovo" && (
          <>
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]" />
              <Input placeholder="Buscar modelo, IMEI ou serial..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
            <div className="space-y-1">
              {seminovosDisponiveis.length === 0 && <div className="text-xs text-[#5A5A64] py-3 text-center">Nenhum seminovo disponível com preço de venda definido.</div>}
              {seminovosDisponiveis.map((x) => (
                <button key={x.id} onClick={() => addSeminovo(x)} className="w-full rounded-xl bg-[#0F0F14] border border-cyan-400/15 p-3 text-left hover:border-cyan-400/30">
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="text-sm text-[#E5E5EA]">{x.marca} {x.modelo}</div><div className="text-[10px] text-[#6E6E78] mt-1">{x.armazenamento||"—"} · IMEI {x.imei||"—"}</div></div>
                    <span className="font-mono text-sm text-cyan-300">{fmt(x?.dados?.pdv?.precoVenda)}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        {modo === "historico" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-[9px] tracking-[.2em] text-purple-300">HISTÓRICO DE VENDAS</div><div className="text-[10px] text-[#60606B]">Últimas 100 operações</div></div>
              <button onClick={carregarHistoricoVendas} className="text-[10px] text-cyan-300">Atualizar</button>
            </div>
            {carregandoHistorico?<div className="py-6 text-center text-xs text-[#666672]">Carregando...</div>:
            !historicoVendas.length?<div className="py-6 text-center text-xs text-[#666672]">Nenhuma venda encontrada.</div>:
            historicoVendas.map(v=><button key={v.id} onClick={()=>setCupomAberto(v)} className={"w-full rounded-xl border p-3 text-left "+(v.status==="estornada"?"border-red-500/20 bg-red-500/[.025]":"border-white/10 bg-white/[.015]")}>
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-xs text-[#D9D9DF]">{fmtDateTime(v.timestamp)}</div><div className="text-[10px] text-purple-300/80 mt-1">{v.clienteNome||"Consumidor não identificado"}</div><div className="text-[10px] text-[#676772] mt-1">{(v.itens||[]).map(i=>i.descricao).join(", ")||"Venda"}</div></div>
                <div className="text-right"><div className="font-mono text-sm">{fmt(v.total)}</div><div className={"text-[9px] mt-1 "+(v.status==="estornada"?"text-red-300":"text-green-300")}>{v.status==="estornada"?"ESTORNADA":"CONCLUÍDA"}</div></div>
              </div>
            </button>)}
          </div>
        )}
        {modo === "manual" && (
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
                  <div className="text-xs text-[#6E6E78]">{i.qtd}x {fmt(i.valor)}{i.estoqueId ? " · estoque" : i.seminovoId ? " · seminovo · unidade única" : ""}</div>
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


/* ================= FINANCEIRO ================= */
function FinanceiroTab({ caixaAtual, seminovos = [], onAbrir, onFechar }) {
  const [secao,setSecao]=useState("visao");
  const [movs,setMovs]=useState([]);
  const [cats,setCats]=useState([]);
  const [loadingFin,setLoadingFin]=useState(true);
  const [form,setForm]=useState({tipo:"saida",categoria_id:"",descricao:"",valor:"",forma_pagamento:"pix",status:"pago",data_competencia:new Date().toISOString().slice(0,10),observacao:""});
  const [mostrarForm,setMostrarForm]=useState(false);
  const [filtro,setFiltro]=useState("todos");

  const carregar=async()=>{
    setLoadingFin(true);
    try{
      const [m,c]=await Promise.all([
        sb("financeiro_movimentacoes?select=*&order=data_competencia.desc,created_at.desc"),
        sb("financeiro_categorias?select=*&ativa=eq.true&order=tipo.asc,nome.asc")
      ]);
      setMovs(m||[]);setCats(c||[]);
    }catch(e){console.warn("Financeiro ainda não disponível:",e);}
    setLoadingFin(false);
  };
  useEffect(()=>{carregar();},[]);

  const pagos=movs.filter(x=>x.status==="pago");
  const entradas=pagos.filter(x=>x.tipo==="entrada").reduce((a,x)=>a+Number(x.valor||0),0);
  const saidas=pagos.filter(x=>x.tipo==="saida").reduce((a,x)=>a+Number(x.valor||0),0);
  const resultado=entradas-saidas;
  const receber=movs.filter(x=>x.tipo==="entrada"&&x.status==="pendente").reduce((a,x)=>a+Number(x.valor||0),0);
  const pagar=movs.filter(x=>x.tipo==="saida"&&x.status==="pendente").reduce((a,x)=>a+Number(x.valor||0),0);

  const vendidos=seminovos.filter(x=>x.status==="vendido");
  const emEstoque=seminovos.filter(x=>x.status!=="vendido");
  const custoTotal=(x)=>(Number(x.custo_aquisicao)||0)+(Number(x.custo_reparos_previsto)||0);
  const capitalEstoque=emEstoque.reduce((a,x)=>a+custoTotal(x),0);
  const totalVendido=vendidos.reduce((a,x)=>a+(Number(x.preco_venda)||Number(x?.dados?.venda?.valorVenda)||0),0);
  const custoVendidos=vendidos.reduce((a,x)=>a+custoTotal(x),0);
  const lucroSeminovos=vendidos.reduce((a,x)=>a+(Number(x.lucro_bruto)||Number(x?.dados?.venda?.lucroBruto)||((Number(x.preco_venda)||Number(x?.dados?.venda?.valorVenda)||0)-custoTotal(x))),0);
  const margemSeminovos=totalVendido>0?(lucroSeminovos/totalVendido)*100:0;

  const salvarLancamento=async()=>{
    if(!form.descricao.trim()||!(Number(form.valor)>0)) return;
    try{
      const body={
        tipo:form.tipo,categoria_id:form.categoria_id||null,descricao:form.descricao.trim(),
        valor:Number(form.valor),forma_pagamento:form.forma_pagamento||null,
        data_competencia:form.data_competencia,status:form.status,
        data_pagamento:form.status==="pago"?new Date().toISOString():null,
        origem:"manual",observacao:form.observacao||null,dados:{},updated_at:new Date().toISOString()
      };
      await sb("financeiro_lancamentos",{method:"POST",body:JSON.stringify(body)});
      setForm({tipo:"saida",categoria_id:"",descricao:"",valor:"",forma_pagamento:"pix",status:"pago",data_competencia:new Date().toISOString().slice(0,10),observacao:""});
      setMostrarForm(false);await carregar();
    }catch(e){alert("Não foi possível salvar o lançamento.");}
  };

  const excluirLancamento=async(id)=>{
    if(!confirm("Excluir este lançamento financeiro?")) return;
    try{await sb(`financeiro_lancamentos?id=eq.${id}`,{method:"DELETE",prefer:"return=minimal"});await carregar();}catch(e){alert("Não foi possível excluir.");}
  };

  const lista=filtro==="todos"?movs:movs.filter(x=>x.tipo===filtro);

  return <div className="space-y-4">
    <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/[.015] p-1">
      {[["visao","Visão geral"],["caixa","Caixa"],["seminovos","Seminovos"],["lancamentos","Lançamentos"]].map(([id,label])=>
        <button key={id} onClick={()=>setSecao(id)} className={"rounded-lg py-2.5 text-[10px] md:text-xs border transition "+(secao===id?"border-purple-500/30 bg-purple-500/10 text-white":"border-transparent text-[#777783]")}>{label}</button>
      )}
    </div>

    {secao==="visao" && <div className="space-y-4">
      <div className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/[.06] via-transparent to-cyan-400/[.035] p-5">
        <div className="text-[9px] tracking-[.28em] text-purple-300">ENIGMA // FINANCIAL CORE</div>
        <div className="text-xl text-white mt-2">Visão Geral Financeira</div>
        <div className="text-xs text-[#74747F] mt-1">Movimentações pagas, pendências e resultado operacional registrado.</div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCyber label="ENTRADAS" value={fmt(entradas)} sub="recebido"/>
        <MetricCyber label="SAÍDAS" value={fmt(saidas)} sub="pago"/>
        <MetricCyber label="RESULTADO" value={fmt(resultado)} sub={resultado>=0?"positivo":"negativo"}/>
        <MetricCyber label="CAPITAL SEMINOVOS" value={fmt(capitalEstoque)} sub={`${emEstoque.length} em estoque`}/>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-green-500/15 bg-green-500/[.025] p-4">
          <div className="text-[9px] tracking-[.2em] text-green-300">A RECEBER</div><div className="text-2xl font-mono mt-2">{fmt(receber)}</div>
        </div>
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[.025] p-4">
          <div className="text-[9px] tracking-[.2em] text-amber-300">A PAGAR</div><div className="text-2xl font-mono mt-2">{fmt(pagar)}</div>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 p-4">
        <div className="flex justify-between items-center mb-3"><div><div className="text-[9px] tracking-[.2em] text-[#8A8A96]">ÚLTIMAS MOVIMENTAÇÕES</div><div className="text-xs text-[#5F5F69] mt-1">Financeiro consolidado</div></div><button onClick={carregar} className="text-[10px] text-cyan-300">Atualizar</button></div>
        {!movs.length?<div className="text-xs text-[#666672] py-6 text-center">Nenhum lançamento financeiro ainda.</div>:
        <div className="space-y-2">{movs.slice(0,6).map(x=><div key={x.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
          <div><div className="text-xs">{x.descricao}</div><div className="text-[9px] text-[#60606B]">{x.categoria||"Sem categoria"} · {x.data_competencia}</div></div>
          <div className={"font-mono text-xs "+(x.tipo==="entrada"?"text-green-300":"text-red-300")}>{x.tipo==="entrada"?"+ ":"- "}{fmt(x.valor)}</div>
        </div>)}</div>}
      </div>
    </div>}

    {secao==="caixa" && <CaixaTab caixaAtual={caixaAtual} onAbrir={onAbrir} onFechar={onFechar} />}

    {secao==="seminovos" && <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCyber label="CAPITAL EM ESTOQUE" value={fmt(capitalEstoque)} sub={`${emEstoque.length} aparelho(s)`}/>
        <MetricCyber label="TOTAL VENDIDO" value={fmt(totalVendido)} sub={`${vendidos.length} venda(s)`}/>
        <MetricCyber label="LUCRO REALIZADO" value={fmt(lucroSeminovos)} sub="aquisição + reparos"/>
        <MetricCyber label="MARGEM MÉDIA" value={`${margemSeminovos.toFixed(2)}%`} sub="sobre vendas"/>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[.015] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10"><div className="text-[9px] tracking-[.22em] text-cyan-300">FINANCEIRO // SEMINOVOS</div><div className="text-xs text-[#6F6F7A] mt-1">Resultado por unidade vendida</div></div>
        {!vendidos.length?<div className="py-12 text-center text-sm text-[#666672]">Nenhum seminovo vendido ainda.</div>:
        <div className="divide-y divide-white/8">{vendidos.map(x=>{const venda=Number(x.preco_venda)||Number(x?.dados?.venda?.valorVenda)||0;const custo=custoTotal(x);const l=Number(x.lucro_bruto)||Number(x?.dados?.venda?.lucroBruto)||(venda-custo);const m=venda>0?(l/venda)*100:0;return <div key={x.id} className="p-4 grid md:grid-cols-[1.4fr_repeat(4,.7fr)] gap-3 items-center"><div><div className="text-sm">{x.marca} {x.modelo} {x.armazenamento||""}</div><div className="text-[10px] text-[#676772] mt-1">IMEI {x.imei||"—"}</div></div><div><div className="text-[8px] text-[#60606B]">CUSTO</div><div className="font-mono text-xs">{fmt(custo)}</div></div><div><div className="text-[8px] text-[#60606B]">VENDA</div><div className="font-mono text-xs">{fmt(venda)}</div></div><div><div className="text-[8px] text-[#60606B]">LUCRO</div><div className="font-mono text-xs text-green-300">{fmt(l)}</div></div><div><div className="text-[8px] text-[#60606B]">MARGEM</div><div className="font-mono text-xs">{m.toFixed(2)}%</div></div></div>})}</div>}
      </div>
    </div>}

    {secao==="lancamentos" && <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">{[["todos","Todos"],["entrada","Entradas"],["saida","Saídas"]].map(([id,l])=><button key={id} onClick={()=>setFiltro(id)} className={"rounded-lg px-3 py-2 text-[10px] border "+(filtro===id?"border-purple-500/30 bg-purple-500/10 text-white":"border-white/10 text-[#777783]")}>{l}</button>)}</div>
        <Button onClick={()=>setMostrarForm(!mostrarForm)}>+ Novo lançamento</Button>
      </div>

      {mostrarForm&&<Card>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Tipo</Label><div className="grid grid-cols-2 gap-2">{["entrada","saida"].map(t=><button key={t} onClick={()=>setForm({...form,tipo:t,categoria_id:""})} className={"rounded-lg border py-2 text-xs "+(form.tipo===t?"border-purple-500 text-purple-300":"border-white/10 text-[#777783]")}>{t==="entrada"?"Entrada":"Saída"}</button>)}</div></div>
          <div><Label>Categoria</Label><select value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})} className="w-full rounded-lg bg-[#111118] border border-[#2A2A34] px-3 py-2 text-sm"><option value="">Sem categoria</option>{cats.filter(c=>c.tipo===form.tipo).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Input value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} placeholder="Ex: Conta de energia, compra de mercadoria..." /></div>
          <div><Label>Valor</Label><Input inputMode="decimal" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value.replace(",",".")})}/></div>
          <div><Label>Data</Label><Input type="date" value={form.data_competencia} onChange={e=>setForm({...form,data_competencia:e.target.value})}/></div>
          <div><Label>Status</Label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full rounded-lg bg-[#111118] border border-[#2A2A34] px-3 py-2 text-sm"><option value="pago">Pago</option><option value="pendente">Pendente</option></select></div>
          <div><Label>Forma</Label><select value={form.forma_pagamento} onChange={e=>setForm({...form,forma_pagamento:e.target.value})} className="w-full rounded-lg bg-[#111118] border border-[#2A2A34] px-3 py-2 text-sm">{FORMAS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
          <div className="md:col-span-2"><Label>Observação</Label><Input value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})}/></div>
        </div>
        <div className="flex gap-2 mt-4"><Button variant="secondary" onClick={()=>setMostrarForm(false)}>Cancelar</Button><Button onClick={salvarLancamento}>Salvar lançamento</Button></div>
      </Card>}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        {loadingFin?<div className="p-8 text-center text-xs text-[#666672]">Carregando financeiro...</div>:!lista.length?<div className="p-8 text-center text-xs text-[#666672]">Nenhum lançamento.</div>:
        <div className="divide-y divide-white/8">{lista.map(x=><div key={x.id} className="p-4 flex items-center justify-between gap-4"><div><div className="text-sm">{x.descricao}</div><div className="text-[9px] text-[#62626D] mt-1">{x.categoria||"Sem categoria"} · {x.data_competencia} · {x.status} · {x.origem}</div></div><div className="flex items-center gap-3"><div className={"font-mono text-sm "+(x.tipo==="entrada"?"text-green-300":"text-red-300")}>{x.tipo==="entrada"?"+ ":"- "}{fmt(x.valor)}</div>{x.origem==="manual"&&<button onClick={()=>excluirLancamento(x.id)} className="text-red-400/70 text-xs">Excluir</button>}</div></div>)}</div>}
      </div>
    </div>}
  </div>;
}

/* ================= CAIXA ================= */
function CaixaTab({ caixaAtual, onAbrir, onFechar }) {
  const [valorInicial, setValorInicial] = useState("");
  const [operador, setOperador] = useState("");
  const [observacao, setObservacao] = useState("");
  const [fechando, setFechando] = useState(false);
  const [valorContado, setValorContado] = useState("");
  const [obsFechamento, setObsFechamento] = useState("");
  const [historicoCaixa,setHistoricoCaixa]=useState([]);
  const [loadingHistorico,setLoadingHistorico]=useState(false);
  const [detalheFechamento,setDetalheFechamento]=useState(null);

  async function carregarHistoricoCaixa(){
    setLoadingHistorico(true);
    try{
      const rows=await sb("caixa_sessoes?select=*&status=eq.fechado&order=data_fechamento.desc&limit=20");
      setHistoricoCaixa(rows||[]);
    }catch(e){console.warn("Histórico de caixa indisponível:",e);}
    setLoadingHistorico(false);
  }

  useEffect(()=>{carregarHistoricoCaixa();},[caixaAtual?.id]);

  if (!caixaAtual) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-4 text-[#C9C9D2]"><Unlock size={16} className="text-purple-400" /><span className="text-sm tracking-wide">Abertura de caixa</span></div>
          <Label>Valor inicial (fundo / troco)</Label>
          <Input inputMode="decimal" placeholder="R$ 0,00" value={valorInicial} onChange={(e) => setValorInicial(e.target.value.replace(",", "."))} className="mb-3" />
          <div className="text-[10px] text-[#64646F] -mt-1 mb-3">O fundo inicial não entra como faturamento. Ele serve apenas para conferência do dinheiro físico.</div>
          <Label>Operador</Label>
          <Input value={operador} onChange={(e) => setOperador(e.target.value)} placeholder="Quem está abrindo o caixa" className="mb-3" />
          <Label>Observação (opcional)</Label>
          <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} className="mb-4" />
          <Button className="w-full" disabled={valorInicial === ""} onClick={() => onAbrir({ valorInicial, operador, observacao })}>Abrir caixa</Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div><div className="text-[9px] tracking-[.2em] text-purple-300">FECHAMENTOS RECENTES</div><div className="text-[10px] text-[#666672] mt-1">Últimos 20 caixas fechados</div></div>
            <button onClick={carregarHistoricoCaixa} className="text-[10px] text-cyan-300">Atualizar</button>
          </div>
          {loadingHistorico?<div className="py-5 text-center text-xs text-[#666672]">Carregando...</div>:
          !historicoCaixa.length?<div className="py-5 text-center text-xs text-[#666672]">Nenhum fechamento registrado ainda.</div>:
          <div className="space-y-2">{historicoCaixa.map(c=>{
            const dif=Number(c.diferenca||0);
            return <button key={c.id} onClick={()=>setDetalheFechamento(c)} className="w-full text-left rounded-xl border border-white/8 bg-white/[.015] p-3">
              <div className="flex justify-between gap-3">
                <div><div className="text-xs text-white">{fmtDateTime(c.data_fechamento||c.data_abertura)}</div><div className="text-[10px] text-[#666672] mt-1">{c.operador||"Operador não informado"}</div></div>
                <div className="text-right"><div className="font-mono text-xs">{fmt(c.total_vendas)}</div><div className={"text-[9px] mt-1 "+(dif===0?"text-green-300":dif>0?"text-cyan-300":"text-red-300")}>{dif===0?"CONFERE":dif>0?`SOBRA ${fmt(dif)}`:`FALTA ${fmt(Math.abs(dif))}`}</div></div>
              </div>
            </button>
          })}</div>}
        </Card>

        {detalheFechamento&&<FechamentoCaixaModal caixa={detalheFechamento} onFechar={()=>setDetalheFechamento(null)}/>}
      </div>
    );
  }

  const totais = totaisPorForma(caixaAtual.vendas);
  const totalVendas = totalGeral(caixaAtual.vendas);
  const vendasValidas=(caixaAtual.vendas||[]).filter(v=>v.status!=="estornada");
  const vendasEstornadas=(caixaAtual.vendas||[]).filter(v=>v.status==="estornada");
  const saldoEsperadoDinheiro = caixaAtual.valorInicial + totais.dinheiro;

  if (!fechando) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-3 text-[#C9C9D2]"><Wallet size={16} className="text-purple-400" /><span className="text-sm tracking-wide">Caixa aberto</span></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Aberto em</Label><div className="text-[#E5E5EA]">{fmtDateTime(caixaAtual.dataAbertura)}</div></div>
            <div><Label>Fundo inicial</Label><div className="font-mono text-[#E5E5EA]">{fmt(caixaAtual.valorInicial)}</div></div>
            {caixaAtual.operador && <div className="col-span-2"><Label>Operador</Label><div className="text-[#E5E5EA]">{caixaAtual.operador}</div></div>}
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <MetricCyber label="VENDAS VÁLIDAS" value={String(vendasValidas.length)} sub="operações"/>
          <MetricCyber label="ESTORNOS" value={String(vendasEstornadas.length)} sub="fora do total"/>
          <MetricCyber label="FATURAMENTO" value={fmt(totalVendas)} sub="sem fundo"/>
          <MetricCyber label="DINHEIRO FÍSICO" value={fmt(saldoEsperadoDinheiro)} sub="esperado"/>
        </div>

        <Card>
          <Label>Recebimentos por forma de pagamento</Label>
          <div className="space-y-2 mt-2">
            {FORMAS.map((f) => (
              <div key={f.id} className="flex justify-between text-sm"><span className="text-[#8A8A96]">{f.label}</span><span className="font-mono text-[#E5E5EA]">{fmt(totais[f.id])}</span></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#2A2A34]">
            <div><div className="text-[9px] tracking-[.16em] text-[#666672]">FUNDO / TROCO</div><div className="font-mono text-sm mt-1">{fmt(caixaAtual.valorInicial)}</div></div>
            <div className="text-right"><div className="text-[9px] tracking-[.16em] text-[#666672]">VENDAS EM DINHEIRO</div><div className="font-mono text-sm mt-1">{fmt(totais.dinheiro)}</div></div>
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-[#2A2A34]"><span className="text-sm text-[#C9C9D2]">Esperado na gaveta</span><span className="font-mono text-lg text-purple-300">{fmt(saldoEsperadoDinheiro)}</span></div>
          <div className="flex justify-between mt-1 text-xs"><span className="text-[#6E6E78]">Total vendido (todas as formas)</span><span className="font-mono text-white">{fmt(totalVendas)}</span></div>
        </Card>

        <Button variant="danger" className="w-full" onClick={() => {setFechando(true);setValorContado("");}}>
          <span className="flex items-center justify-center gap-2"><Lock size={15} /> Fechar caixa com conferência</span>
        </Button>
      </div>
    );
  }

  const contado = Number(valorContado) || 0;
  const diferenca = contado - saldoEsperadoDinheiro;
  const diferencaAbs=Math.abs(diferenca);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/[.04] via-transparent to-purple-500/[.04] p-5">
        <div className="text-[9px] tracking-[.25em] text-red-300">CONFERÊNCIA DE CAIXA</div>
        <div className="text-xl text-white mt-2">Fechamento inteligente</div>
        <div className="text-xs text-[#74747F] mt-1">Confira apenas o dinheiro físico. Pix e cartões são conciliados separadamente.</div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 p-3"><div className="text-[9px] tracking-[.14em] text-[#666672]">FUNDO INICIAL</div><div className="font-mono text-lg mt-1">{fmt(caixaAtual.valorInicial)}</div></div>
          <div className="rounded-xl border border-white/8 p-3"><div className="text-[9px] tracking-[.14em] text-[#666672]">DINHEIRO VENDAS</div><div className="font-mono text-lg mt-1">{fmt(totais.dinheiro)}</div></div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/[.035] p-4 mt-3 flex items-center justify-between gap-3"><div><div className="text-[9px] tracking-[.15em] text-purple-300">ESPERADO NA GAVETA</div><div className="text-[10px] text-[#666672] mt-1">fundo + vendas em dinheiro</div></div><div className="font-mono text-2xl text-white">{fmt(saldoEsperadoDinheiro)}</div></div>
      </Card>

      <Card>
        <Label>Valor contado fisicamente na gaveta</Label>
        <Input autoFocus inputMode="decimal" placeholder="Ex: 430,00" value={valorContado} onChange={(e) => setValorContado(e.target.value.replace(",", "."))} className="mb-3 text-lg font-mono" />
        {valorContado !== "" && (
          <div className={"p-4 rounded-xl border " + (diferenca === 0 ? "border-green-500/30 bg-green-500/[.06]" : diferenca > 0 ? "border-cyan-500/30 bg-cyan-500/[.06]" : "border-red-500/30 bg-red-500/[.06]")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">{diferenca===0?<CheckCircle2 size={18} className="text-green-300"/>:<AlertCircle size={18} className={diferenca>0?"text-cyan-300":"text-red-300"}/>}<div><div className="text-sm text-white">{diferenca===0?"Caixa confere":diferenca>0?"Sobra de caixa":"Falta de caixa"}</div><div className="text-[10px] text-[#71717C]">{diferenca===0?"Valor contado igual ao esperado.":diferenca>0?"Há mais dinheiro que o esperado.":"Há menos dinheiro que o esperado."}</div></div></div>
              <div className={"font-mono text-xl "+(diferenca===0?"text-green-300":diferenca>0?"text-cyan-300":"text-red-300")}>{diferenca===0?fmt(0):fmt(diferencaAbs)}</div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="text-[9px] tracking-[.2em] text-[#8A8A96] mb-3">RESUMO DO TURNO</div>
        <div className="space-y-2">
          {FORMAS.map(f=><div key={f.id} className="flex justify-between text-xs"><span className="text-[#777782]">{f.label}</span><span className="font-mono">{fmt(totais[f.id])}</span></div>)}
          <div className="flex justify-between text-sm pt-3 mt-3 border-t border-white/10"><span>Total vendido</span><span className="font-mono text-white">{fmt(totalVendas)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#777782]">Vendas válidas</span><span>{vendasValidas.length}</span></div>
          {vendasEstornadas.length>0&&<div className="flex justify-between text-xs"><span className="text-red-300">Vendas estornadas</span><span className="text-red-300">{vendasEstornadas.length}</span></div>}
        </div>
      </Card>

      <Card>
        <Label>Observação do fechamento</Label>
        <Input value={obsFechamento} onChange={(e) => setObsFechamento(e.target.value)} placeholder={diferenca!==0?"Recomendado informar o motivo da diferença":"Opcional"} className="mb-4" />
        {valorContado!==""&&diferenca!==0&&!obsFechamento.trim()&&<div className="text-[10px] text-amber-300 mb-3">Existe diferença de caixa. Registre uma observação para facilitar a auditoria.</div>}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setFechando(false)}>Voltar</Button>
          <Button variant="danger" className="flex-1" disabled={valorContado === "" || (diferenca!==0 && !obsFechamento.trim())} onClick={() => onFechar({ valorContado, observacao: obsFechamento })}>Confirmar fechamento</Button>
        </div>
      </Card>
    </div>
  );
}

function FechamentoCaixaModal({caixa,onFechar}){
  const t=caixa.total_por_forma||{};
  const dif=Number(caixa.diferenca||0);
  const [vendas,setVendas]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let ativo=true;
    (async()=>{
      try{
        const rows=await sb(`vendas?select=*&caixa_id=eq.${caixa.id}&order=timestamp.asc`);
        if(ativo) setVendas((rows||[]).map(rowToVenda));
      }catch(e){
        console.warn("Não foi possível carregar as vendas do fechamento:",e);
        if(ativo) setVendas([]);
      }
      if(ativo) setLoading(false);
    })();
    return()=>{ativo=false};
  },[caixa.id]);

  function imprimirRelatorio(){
    const validas=vendas.filter(v=>v.status!=="estornada");
    const estornadas=vendas.filter(v=>v.status==="estornada");
    const totaisFormas=caixa.total_por_forma||{};
    const linhasVendas=vendas.map((v,idx)=>{
      const itens=(v.itens||[]).map(i=>`
        <tr>
          <td>${escapeHtml(i.descricao||"Item")}</td>
          <td class="center">${Number(i.qtd||0)}</td>
          <td class="right">${fmtPrint(Number(i.valor||0))}</td>
          <td class="right">${fmtPrint((Number(i.valor||0))*(Number(i.qtd||0)))}</td>
        </tr>`).join("");
      return `
        <div class="sale ${v.status==="estornada"?"void":""}">
          <div class="sale-head">
            <div><strong>Venda ${String(idx+1).padStart(2,"0")}</strong> · ${formatDateTimePrint(v.timestamp)}</div>
            <div><strong>${v.status==="estornada"?"ESTORNADA":"CONCLUÍDA"}</strong></div>
          </div>
          <table>
            <thead><tr><th>Item</th><th class="center">Qtd.</th><th class="right">Unit.</th><th class="right">Total</th></tr></thead>
            <tbody>${itens || '<tr><td colspan="4">Sem itens registrados</td></tr>'}</tbody>
          </table>
          <div class="sale-foot">
            <span>Pagamento: ${escapeHtml((FORMAS.find(f=>f.id===v.formaPagamento)?.label)||v.formaPagamento||"-")}</span>
            <strong>${fmtPrint(v.total)}</strong>
          </div>
          ${v.status==="estornada" && v.motivoCancelamento ? `<div class="reason">Motivo do estorno: ${escapeHtml(v.motivoCancelamento)}</div>`:""}
        </div>`;
    }).join("");

    const html=`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>ENIGMA - Relatório de Fechamento</title>
<style>
  @page { size: A4; margin: 12mm; }
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11px}
  ${enigmaPrintCss()}
  .meta{text-align:right;line-height:1.5}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}
  .box{border:1px solid #bbb;border-radius:6px;padding:8px}
  .box .l{font-size:8px;color:#666;text-transform:uppercase;letter-spacing:1px}
  .box .v{font-size:14px;font-weight:700;margin-top:4px}
  .section{font-weight:700;font-size:12px;margin:16px 0 7px;border-bottom:1px solid #bbb;padding-bottom:4px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:5px 4px;border-bottom:1px solid #ddd;vertical-align:top}
  th{text-align:left;font-size:9px;text-transform:uppercase;color:#555}
  .right{text-align:right}.center{text-align:center}
  .payment-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #ccc}
  .sale{border:1px solid #aaa;border-radius:6px;padding:8px;margin:8px 0;break-inside:avoid}
  .sale.void{border-style:dashed;color:#666}
  .sale-head,.sale-foot{display:flex;justify-content:space-between;gap:12px}
  .sale-head{padding-bottom:5px;border-bottom:1px solid #ddd}
  .sale-foot{padding-top:6px;margin-top:2px}
  .reason{font-size:9px;margin-top:6px;color:#666}
  .obs{margin-top:10px;border:1px solid #bbb;padding:8px;border-radius:6px}
  .footer{margin-top:18px;padding-top:8px;border-top:1px solid #bbb;color:#666;font-size:8px;text-align:center}
</style>
</head>
<body>
${enigmaPrintHeader("Relatório de fechamento de caixa",`Caixa ${escapeHtml(String(caixa.id||"").slice(0,8).toUpperCase())}`)}
<div class="meta" style="margin-bottom:10px">
  <strong>Operador:</strong> ${escapeHtml(caixa.operador||"Não informado")} &nbsp; | &nbsp;
  <strong>Abertura:</strong> ${formatDateTimePrint(caixa.data_abertura)} &nbsp; | &nbsp;
  <strong>Fechamento:</strong> ${formatDateTimePrint(caixa.data_fechamento)}
</div>

<div class="grid">
  <div class="box"><div class="l">Fundo inicial</div><div class="v">${fmtPrint(caixa.valor_inicial)}</div></div>
  <div class="box"><div class="l">Total vendido</div><div class="v">${fmtPrint(caixa.total_vendas)}</div></div>
  <div class="box"><div class="l">Vendas válidas</div><div class="v">${validas.length}</div></div>
  <div class="box"><div class="l">Estornos</div><div class="v">${estornadas.length}</div></div>
</div>

<div class="section">Recebimentos por forma de pagamento</div>
${FORMAS.map(f=>`<div class="payment-row"><span>${escapeHtml(f.label)}</span><strong>${fmtPrint(totaisFormas[f.id]||0)}</strong></div>`).join("")}

<div class="grid">
  <div class="box"><div class="l">Esperado na gaveta</div><div class="v">${fmtPrint(caixa.saldo_esperado_dinheiro)}</div></div>
  <div class="box"><div class="l">Valor contado</div><div class="v">${fmtPrint(caixa.valor_contado)}</div></div>
  <div class="box" style="grid-column:span 2"><div class="l">Resultado da conferência</div><div class="v">${dif===0?"CAIXA CONFERE":dif>0?`SOBRA ${fmtPrint(dif)}`:`FALTA ${fmtPrint(Math.abs(dif))}`}</div></div>
</div>

<div class="section">Detalhamento das vendas</div>
${linhasVendas || "<div>Nenhuma venda registrada neste caixa.</div>"}

${caixa.observacao_fechamento?`<div class="obs"><strong>Observação do fechamento:</strong><br>${escapeHtml(caixa.observacao_fechamento)}</div>`:""}

${enigmaPrintFooter()}<div class="footer">Relatório gerado em ${new Date().toLocaleString("pt-BR")}</div>
<script>window.onload=()=>setTimeout(()=>window.print(),250)</script>
</body></html>`;

    const w=window.open("","_blank","width=900,height=700");
    if(!w){alert("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.");return;}
    w.document.open();w.document.write(html);w.document.close();
  }

  return <div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onFechar}>
    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#131318] p-5" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between gap-3 mb-4"><div><div className="text-[9px] tracking-[.2em] text-purple-300">FECHAMENTO DE CAIXA</div><div className="text-lg text-white mt-1">{fmtDateTime(caixa.data_fechamento||caixa.data_abertura)}</div><div className="text-xs text-[#666672] mt-1">{caixa.operador||"Operador não informado"}</div></div><button onClick={onFechar}><X size={18}/></button></div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl border border-white/8 p-3"><div className="text-[8px] tracking-[.14em] text-[#666672]">FUNDO INICIAL</div><div className="font-mono mt-1">{fmt(caixa.valor_inicial)}</div></div>
        <div className="rounded-xl border border-white/8 p-3"><div className="text-[8px] tracking-[.14em] text-[#666672]">TOTAL VENDIDO</div><div className="font-mono mt-1">{fmt(caixa.total_vendas)}</div></div>
        <div className="rounded-xl border border-white/8 p-3"><div className="text-[8px] tracking-[.14em] text-[#666672]">ESPERADO DINHEIRO</div><div className="font-mono mt-1">{fmt(caixa.saldo_esperado_dinheiro)}</div></div>
        <div className="rounded-xl border border-white/8 p-3"><div className="text-[8px] tracking-[.14em] text-[#666672]">CONTADO</div><div className="font-mono mt-1">{fmt(caixa.valor_contado)}</div></div>
      </div>
      <div className="space-y-2 border-y border-white/8 py-3 mb-4">{FORMAS.map(f=><div key={f.id} className="flex justify-between text-xs"><span className="text-[#777782]">{f.label}</span><span className="font-mono">{fmt(t[f.id]||0)}</span></div>)}</div>
      <div className={"rounded-xl border p-4 "+(dif===0?"border-green-500/25 bg-green-500/[.04]":dif>0?"border-cyan-500/25 bg-cyan-500/[.04]":"border-red-500/25 bg-red-500/[.04]")}>
        <div className="flex justify-between gap-3"><div><div className="text-[9px] tracking-[.15em] text-[#777782]">RESULTADO DA CONFERÊNCIA</div><div className="text-sm text-white mt-1">{dif===0?"Caixa conferido":dif>0?"Sobra":"Falta"}</div></div><div className={"font-mono text-xl "+(dif===0?"text-green-300":dif>0?"text-cyan-300":"text-red-300")}>{fmt(Math.abs(dif))}</div></div>
      </div>

      <div className="mt-4 rounded-xl border border-white/8 p-3">
        <div className="text-[8px] tracking-[.14em] text-[#666672]">VENDAS DO TURNO</div>
        <div className="text-xs text-[#C9C9D2] mt-1">{loading?"Carregando detalhamento...":`${vendas.filter(v=>v.status!=="estornada").length} válida(s) · ${vendas.filter(v=>v.status==="estornada").length} estornada(s)`}</div>
      </div>

      {caixa.observacao_fechamento&&<div className="mt-4 rounded-xl border border-white/8 p-3"><div className="text-[8px] tracking-[.14em] text-[#666672]">OBSERVAÇÃO</div><div className="text-xs text-[#C9C9D2] mt-1">{caixa.observacao_fechamento}</div></div>}

      <Button className="w-full mt-4" disabled={loading} onClick={imprimirRelatorio}>
        <span className="flex items-center justify-center gap-2"><Printer size={15}/> Imprimir relatório detalhado</span>
      </Button>
    </div>
  </div>;
}


const ENIGMA_PRINT = {
  nome:"ENIGMA",
  subtitulo:"Assistência técnica e acessórios",
  whatsapp:"(22) 99262-9718",
  endereco:"Rua Samuel Bessa, 20, Loja 1",
  instagram:"@siga.enigma",
  logo:"data:image/png;base64,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"
};
function enigmaPrintHeader(titulo, meta=""){
  return `<div class="enigma-head">
    <div class="enigma-brand">
      <img class="enigma-logo-img" src="${ENIGMA_PRINT.logo}" alt="ENIGMA"/>
    </div>
    <div class="enigma-doc"><strong>${escapeHtml(titulo)}</strong>${meta?`<div>${meta}</div>`:""}</div>
  </div>
  <div class="enigma-contact">${escapeHtml(ENIGMA_PRINT.endereco)} &nbsp;•&nbsp; WhatsApp ${escapeHtml(ENIGMA_PRINT.whatsapp)} &nbsp;•&nbsp; Instagram ${escapeHtml(ENIGMA_PRINT.instagram)}</div>`;
}
function enigmaPrintCss(){
  return `@font-face{font-family:'Bensa';src:local('Bensa');font-display:swap}
  .enigma-head{display:flex;justify-content:space-between;align-items:center;gap:18px;border-bottom:2px solid #111;padding-bottom:9px}
  .enigma-brand{display:flex;align-items:center;min-height:58px}.enigma-logo-img{display:block;width:118px;max-height:72px;object-fit:contain;object-position:left center;filter:invert(1)}
  .enigma-name,.enigma-doc strong,.title,h1{font-family:'Bensa',Arial,Helvetica,sans-serif}
  .enigma-doc{text-align:right;font-size:10px;line-height:1.45}.enigma-doc strong{font-size:12px;text-transform:uppercase;letter-spacing:.8px}
  .enigma-contact{text-align:center;font-size:8px;padding:6px 2px;border-bottom:1px solid #bbb;color:#444;margin-bottom:12px}
  .enigma-footer{margin-top:18px;padding-top:7px;border-top:1px solid #bbb;text-align:center;font-size:8px;color:#555}`;
}
function enigmaPrintFooter(){
  return `<div class="enigma-footer">${escapeHtml(ENIGMA_PRINT.nome)} · ${escapeHtml(ENIGMA_PRINT.endereco)} · ${escapeHtml(ENIGMA_PRINT.whatsapp)} · ${escapeHtml(ENIGMA_PRINT.instagram)}</div>`;
}
function openPrintHtml(html){
  const w=window.open("","_blank","width=900,height=750");
  if(!w){alert("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.");return;}
  w.document.open();w.document.write(html);w.document.close();
}

function fmtPrint(v){
  return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function formatDateTimePrint(iso){
  if(!iso) return "-";
  try{return new Date(iso).toLocaleString("pt-BR");}catch{return String(iso);}
}
function escapeHtml(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}

/* ================= RELATÓRIO ================= */
function RelatorioTab({ caixaAtual, estoque = [], onBuscarVendas, onBuscarVendasPeriodo, onExcluirVenda, onEditarVenda }) {
  const [guia,setGuia]=useState("produtos");
  const [modo, setModo] = useState("periodo");
  const [data, setData] = useState(todayISO());
  const [vendasDoDia, setVendasDoDia] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cupomAberto, setCupomAberto] = useState(null);

  const hoje=todayISO();
  const dt30=new Date(); dt30.setDate(dt30.getDate()-29);
  const iso30=dt30.toISOString().slice(0,10);
  const [dataInicio, setDataInicio] = useState(iso30);
  const [dataFim, setDataFim] = useState(hoje);
  const [vendasPeriodo, setVendasPeriodo] = useState([]);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(true);
  const [diaExpandido, setDiaExpandido] = useState(null);
  const [buscaProduto,setBuscaProduto]=useState("");
  const [filtroGiro,setFiltroGiro]=useState("todos");
  const [ordenacao,setOrdenacao]=useState("quantidade");
  const [osRelatorio,setOsRelatorio]=useState([]);
  const [loadingOSRelatorio,setLoadingOSRelatorio]=useState(false);
  const [buscaOSRelatorio,setBuscaOSRelatorio]=useState("");

  function aplicarPeriodoRapido(tipo){
    const fim=new Date();
    const inicio=new Date();
    if(tipo==="hoje") inicio.setDate(fim.getDate());
    if(tipo==="7") inicio.setDate(fim.getDate()-6);
    if(tipo==="30") inicio.setDate(fim.getDate()-29);
    if(tipo==="mes") inicio.setDate(1);
    setDataInicio(inicio.toISOString().slice(0,10));
    setDataFim(fim.toISOString().slice(0,10));
  }

  useEffect(() => {
    if (guia!=="vendas" || modo !== "dia") return;
    let ativo = true;
    setCarregando(true);
    onBuscarVendas(data)
      .then((vendas) => { if (ativo) setVendasDoDia(vendas); })
      .catch(() => { if (ativo) setVendasDoDia([]); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [data, modo, guia]);

  useEffect(() => {
    if (modo !== "periodo" && guia==="vendas") return;
    let ativo = true;
    setCarregandoPeriodo(true);
    onBuscarVendasPeriodo(dataInicio, dataFim)
      .then((vendas) => { if (ativo) setVendasPeriodo(vendas); })
      .catch(() => { if (ativo) setVendasPeriodo([]); })
      .finally(() => { if (ativo) setCarregandoPeriodo(false); });
    return () => { ativo = false; };
  }, [dataInicio, dataFim, modo, guia]);

  useEffect(()=>{
    if(guia!=="assistencia") return;
    let ativo=true;
    setLoadingOSRelatorio(true);
    (async()=>{
      try{
        const inicio=`${dataInicio}T00:00:00`;
        const fim=`${dataFim}T23:59:59.999`;
        const rows=await sb(`ordens_servico?select=id,numero,data_entrada,cliente,aparelho,problema_relatado,status,valor_final,valor_mao_de_obra,pecas_usadas,timeline,diagnostico_tecnico,orcamento&data_entrada=gte.${inicio}&data_entrada=lte.${fim}&order=data_entrada.desc`);
        if(ativo) setOsRelatorio(rows||[]);
      }catch(e){
        console.warn("Não foi possível carregar relatório da assistência:",e);
        if(ativo) setOsRelatorio([]);
      }
      if(ativo) setLoadingOSRelatorio(false);
    })();
    return()=>{ativo=false};
  },[guia,dataInicio,dataFim]);

  function atualizarListaLocal(vendaAtualizadaOuNull, idOriginal) {
    const id = vendaAtualizadaOuNull ? vendaAtualizadaOuNull.id : idOriginal;
    setVendasDoDia((prev) => (vendaAtualizadaOuNull ? prev.map((v) => (v.id === id ? vendaAtualizadaOuNull : v)) : prev.filter((v) => v.id !== id)));
    setVendasPeriodo((prev) => (vendaAtualizadaOuNull ? prev.map((v) => (v.id === id ? vendaAtualizadaOuNull : v)) : prev.filter((v) => v.id !== id)));
  }

  const validasPeriodo=vendasPeriodo.filter(v=>v.status!=="estornada");
  const vendasItens=new Map();

  validasPeriodo.forEach(v=>{
    (v.itens||[]).forEach(i=>{
      if(!i.estoqueId) return;
      const atual=vendasItens.get(i.estoqueId)||{quantidade:0,faturamento:0,ultimaVenda:null,vendas:0};
      atual.quantidade+=Number(i.qtd)||0;
      atual.faturamento+=(Number(i.qtd)||0)*(Number(i.valor)||0);
      atual.vendas+=1;
      const ts=new Date(v.timestamp);
      if(!atual.ultimaVenda || ts>atual.ultimaVenda) atual.ultimaVenda=ts;
      vendasItens.set(i.estoqueId,atual);
    });
  });

  const agora=new Date();
  const produtosAnalise=estoque.filter(p=>p.categoria==="acessorio").map(p=>{
    const vd=vendasItens.get(p.id)||{quantidade:0,faturamento:0,ultimaVenda:null,vendas:0};
    const diasSemVenda=vd.ultimaVenda?Math.max(0,Math.floor((agora-vd.ultimaVenda)/(1000*60*60*24))):null;
    let giro="sem_giro";
    if(vd.quantidade>=10) giro="alto";
    else if(vd.quantidade>=4) giro="saudavel";
    else if(vd.quantidade>0) giro="baixo";
    const capital=(Number(p.custo)||0)*(Number(p.quantidade)||0);
    const custoVendido=(Number(p.custo)||0)*(Number(vd.quantidade)||0);
    const lucroBruto=Number(vd.faturamento||0)-custoVendido;
    const margem=Number(vd.faturamento||0)>0?(lucroBruto/Number(vd.faturamento))*100:0;
    return {...p,vendidoQtd:vd.quantidade,faturamento:vd.faturamento,ultimaVenda:vd.ultimaVenda,vendas:vd.vendas,diasSemVenda,giro,capital,custoVendido,lucroBruto,margem};
  });

  const filtradosProdutos=produtosAnalise
    .filter(p=>{
      const q=buscaProduto.toLowerCase();
      const match=!q||[p.nome,p.sku,p.marca,p.compatibilidade].some(x=>String(x||"").toLowerCase().includes(q));
      return match && (filtroGiro==="todos"||p.giro===filtroGiro);
    })
    .sort((a,b)=>{
      if(ordenacao==="faturamento") return b.faturamento-a.faturamento;
      if(ordenacao==="estoque") return b.vendidoQtd-a.vendidoQtd;
      if(ordenacao==="capital") return b.capital-a.capital;
      return b.vendidoQtd-a.vendidoQtd;
    });

  const totalQtd=produtosAnalise.reduce((a,p)=>a+p.vendidoQtd,0);
  const faturamentoProdutos=produtosAnalise.reduce((a,p)=>a+p.faturamento,0);
  const semGiro=produtosAnalise.filter(p=>p.giro==="sem_giro");
  const capitalParado=semGiro.reduce((a,p)=>a+p.capital,0);
  const topProduto=[...produtosAnalise].sort((a,b)=>b.vendidoQtd-a.vendidoQtd)[0];

  const custoProdutosVendidos=produtosAnalise.reduce((a,p)=>a+p.custoVendido,0);
  const lucroProdutos=produtosAnalise.reduce((a,p)=>a+p.lucroBruto,0);
  const margemProdutos=faturamentoProdutos>0?(lucroProdutos/faturamentoProdutos)*100:0;
  const vendasValidasPeriodo=validasPeriodo.length;
  const ticketMedio=vendasValidasPeriodo>0?(totalGeral(validasPeriodo)/vendasValidasPeriodo):0;
  const topLucro=[...produtosAnalise].filter(p=>p.vendidoQtd>0).sort((a,b)=>b.lucroBruto-a.lucroBruto)[0];
  const menorMargem=[...produtosAnalise].filter(p=>p.vendidoQtd>0).sort((a,b)=>a.margem-b.margem)[0];
  const rankingLucro=[...produtosAnalise].filter(p=>p.vendidoQtd>0).sort((a,b)=>b.lucroBruto-a.lucroBruto);

  const osEntregues=osRelatorio.filter(o=>o.status==="entregue");
  const osCanceladas=osRelatorio.filter(o=>o.status==="cancelado");
  const osEmAndamento=osRelatorio.filter(o=>!["entregue","cancelado"].includes(o.status));
  const faturamentoOS=osEntregues.reduce((a,o)=>a+Number(o.valor_final||0),0);
  const ticketMedioOS=osEntregues.filter(o=>Number(o.valor_final||0)>0).length
    ? faturamentoOS/osEntregues.filter(o=>Number(o.valor_final||0)>0).length : 0;

  const temposConclusao=osEntregues.map(o=>{
    const entrada=new Date(o.data_entrada);
    const eventos=Array.isArray(o.timeline)?o.timeline:[];
    const fimEvt=[...eventos].reverse().find(e=>["entregue","pronto"].includes(e.status));
    if(!fimEvt?.timestamp||Number.isNaN(entrada.getTime())) return null;
    return (new Date(fimEvt.timestamp)-entrada)/(1000*60*60*24);
  }).filter(v=>v!==null&&v>=0);
  const tempoMedioOS=temposConclusao.length?temposConclusao.reduce((a,b)=>a+b,0)/temposConclusao.length:null;

  const mapaAparelhos={};
  osRelatorio.forEach(o=>{
    const nome=String(o.aparelho?.marcaModelo||"Não informado").trim()||"Não informado";
    mapaAparelhos[nome]=(mapaAparelhos[nome]||0)+1;
  });
  const rankingAparelhos=Object.entries(mapaAparelhos).sort((a,b)=>b[1]-a[1]);

  const mapaProblemas={};
  osRelatorio.forEach(o=>{
    const texto=String(o.problema_relatado||"").trim();
    if(!texto) return;
    const chave=texto.length>80?texto.slice(0,77)+"...":texto;
    mapaProblemas[chave]=(mapaProblemas[chave]||0)+1;
  });
  const rankingProblemas=Object.entries(mapaProblemas).sort((a,b)=>b[1]-a[1]).slice(0,10);

  const mapaPecas={};
  osRelatorio.forEach(o=>{
    (o.pecas_usadas||[]).forEach(p=>{
      const nome=String(p.nome||"Peça").trim();
      mapaPecas[nome]=(mapaPecas[nome]||0)+(Number(p.qtd)||0);
    });
  });
  const rankingPecas=Object.entries(mapaPecas).sort((a,b)=>b[1]-a[1]).slice(0,10);

  const osFiltradas=osRelatorio.filter(o=>{
    const q=buscaOSRelatorio.toLowerCase();
    return !q || [
      o.numero,o.cliente?.nome,o.cliente?.telefone,o.aparelho?.marcaModelo,
      o.problema_relatado,o.diagnostico_tecnico,statusInfo(o.status).label
    ].some(v=>String(v||"").toLowerCase().includes(q));
  });

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

  function giroInfo(g){
    if(g==="alto") return {label:"ALTO GIRO",cls:"text-green-300 border-green-500/25 bg-green-500/[.04]"};
    if(g==="saudavel") return {label:"GIRO SAUDÁVEL",cls:"text-cyan-300 border-cyan-500/25 bg-cyan-500/[.04]"};
    if(g==="baixo") return {label:"BAIXO GIRO",cls:"text-amber-300 border-amber-500/25 bg-amber-500/[.04]"};
    return {label:"SEM GIRO",cls:"text-red-300 border-red-500/25 bg-red-500/[.04]"};
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/[.015] p-1">
        <button onClick={()=>setGuia("produtos")} className={"rounded-lg py-2.5 text-[9px] md:text-xs border "+(guia==="produtos"?"border-purple-500/30 bg-purple-500/10 text-white":"border-transparent text-[#777783]")}>Produtos / Giro</button>
        <button onClick={()=>setGuia("rentabilidade")} className={"rounded-lg py-2.5 text-[9px] md:text-xs border "+(guia==="rentabilidade"?"border-green-500/30 bg-green-500/[.06] text-white":"border-transparent text-[#777783]")}>Rentabilidade</button>
        <button onClick={()=>setGuia("assistencia")} className={"rounded-lg py-2.5 text-[9px] md:text-xs border "+(guia==="assistencia"?"border-cyan-500/30 bg-cyan-500/[.06] text-white":"border-transparent text-[#777783]")}>Assistência</button>
        <button onClick={()=>setGuia("vendas")} className={"rounded-lg py-2.5 text-[9px] md:text-xs border "+(guia==="vendas"?"border-purple-500/30 bg-purple-500/10 text-white":"border-transparent text-[#777783]")}>Vendas</button>
      </div>

      {guia==="produtos"&&<>
        <div className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/[.06] via-transparent to-cyan-400/[.035] p-5">
          <div className="text-[9px] tracking-[.28em] text-purple-300">ENIGMA // PRODUCT INTELLIGENCE</div>
          <div className="text-xl text-white mt-2">Relatório de Produtos e Giro</div>
          <div className="text-xs text-[#74747F] mt-1">Veja o que gira, o que está parado e onde vale investir em reposição ou marketing.</div>
        </div>

        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            {[["hoje","Hoje"],["7","7 dias"],["30","30 dias"],["mes","Este mês"]].map(([id,label])=><button key={id} onClick={()=>aplicarPeriodoRapido(id)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-[#A0A0AA] hover:border-purple-500/30">{label}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>De</Label><Input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></div>
            <div><Label>Até</Label><Input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}/></div>
          </div>
          <div className="text-[9px] text-[#5F5F69] mt-2">Os indicadores abaixo consideram somente vendas concluídas no período. Estornos ficam fora do cálculo.</div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <MetricCyber label="UNIDADES VENDIDAS" value={String(totalQtd)} sub={`${produtosAnalise.filter(p=>p.vendidoQtd>0).length} produto(s)`}/>
          <MetricCyber label="FATURAMENTO PRODUTOS" value={fmt(faturamentoProdutos)} sub="itens de estoque"/>
          <MetricCyber label="SEM GIRO" value={String(semGiro.length)} sub="zero vendas no período"/>
          <MetricCyber label="CAPITAL PARADO" value={fmt(capitalParado)} sub="custo dos sem giro"/>
        </div>

        {topProduto&&topProduto.vendidoQtd>0&&<div className="rounded-xl border border-green-500/15 bg-green-500/[.025] p-4 flex justify-between gap-4 items-center">
          <div><div className="text-[9px] tracking-[.18em] text-green-300">CAMPEÃO DE GIRO</div><div className="text-sm text-white mt-1">{topProduto.nome}</div><div className="text-[10px] text-[#71717C] mt-1">{topProduto.vendidoQtd} unidade(s) vendida(s) · {fmt(topProduto.faturamento)}</div></div>
          <div className="text-2xl">🔥</div>
        </div>}

        <Card>
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={buscaProduto} onChange={e=>setBuscaProduto(e.target.value)} placeholder="Buscar produto, SKU, marca ou modelo" className="pl-9"/></div>
            <select value={filtroGiro} onChange={e=>setFiltroGiro(e.target.value)} className="rounded-lg bg-[#0F0F14] border border-[#2A2A34] px-3 py-2 text-xs">
              <option value="todos">Todos os giros</option><option value="alto">Alto giro</option><option value="saudavel">Giro saudável</option><option value="baixo">Baixo giro</option><option value="sem_giro">Sem giro</option>
            </select>
            <select value={ordenacao} onChange={e=>setOrdenacao(e.target.value)} className="rounded-lg bg-[#0F0F14] border border-[#2A2A34] px-3 py-2 text-xs">
              <option value="quantidade">Mais vendidos</option><option value="faturamento">Maior faturamento</option><option value="estoque">Maior estoque</option><option value="capital">Maior capital parado</option>
            </select>
          </div>
        </Card>

        {carregandoPeriodo?<Card className="text-center py-10"><div className="text-xs text-[#666672]">Calculando relatório...</div></Card>:
        filtradosProdutos.length===0?<Card className="text-center py-10"><Package className="mx-auto mb-3 text-[#555560]" size={24}/><div className="text-xs text-[#666672]">Nenhum produto encontrado.</div></Card>:
        <div className="space-y-2">{filtradosProdutos.map((p,idx)=>{const gi=giroInfo(p.giro);return <Card key={p.id} className="!p-0 overflow-hidden">
          <div className="p-4 grid md:grid-cols-[40px_1.5fr_repeat(5,.72fr)] gap-3 items-center">
            <div className="hidden md:flex w-8 h-8 rounded-lg border border-white/8 items-center justify-center font-mono text-xs text-[#777783]">#{idx+1}</div>
            <div>
              <div className="text-sm text-white">{p.nome}</div>
              <div className="text-[10px] text-[#64646F] mt-1">{p.sku?`SKU ${p.sku}`:"Sem SKU"}{p.compatibilidade?` · ${p.compatibilidade}`:""}</div>
              <span className={"inline-block mt-2 rounded-full border px-2 py-1 text-[8px] "+gi.cls}>{gi.label}</span>
            </div>
            <div><div className="text-[8px] text-[#5F5F69]">VENDIDO</div><div className="font-mono text-sm mt-1">{p.vendidoQtd} un</div></div>
            <div><div className="text-[8px] text-[#5F5F69]">FATURAMENTO</div><div className="font-mono text-sm mt-1">{fmt(p.faturamento)}</div></div>
            <div><div className="text-[8px] text-[#5F5F69]">ESTOQUE</div><div className="font-mono text-sm mt-1">{p.quantidade} un</div></div>
            <div><div className="text-[8px] text-[#5F5F69]">ÚLTIMA VENDA</div><div className="text-xs mt-1">{p.ultimaVenda?p.diasSemVenda===0?"Hoje":`${p.diasSemVenda} dia(s)`:"Nenhuma"}</div></div>
            <div><div className="text-[8px] text-[#5F5F69]">CAPITAL ESTOQUE</div><div className="font-mono text-sm mt-1">{fmt(p.capital)}</div></div>
          </div>
          {p.giro==="sem_giro"&&p.quantidade>0&&<div className="border-t border-red-500/10 bg-red-500/[.02] px-4 py-2 text-[10px] text-red-200">Sem vendas no período e com estoque disponível. Candidato a ação de marketing, exposição ou revisão de mix.</div>}
          {p.giro==="baixo"&&p.quantidade>0&&<div className="border-t border-amber-500/10 bg-amber-500/[.02] px-4 py-2 text-[10px] text-amber-200">Baixo giro no período. Vale acompanhar antes de repor em grande volume.</div>}
          {p.giro==="alto"&&p.quantidade<=p.estoqueMinimo&&<div className="border-t border-green-500/10 bg-green-500/[.02] px-4 py-2 text-[10px] text-green-200">Alto giro com estoque próximo do mínimo. Prioridade de reposição.</div>}
        </Card>})}</div>}
      </>}

      {guia==="rentabilidade"&&<>
        <div className="rounded-2xl border border-green-500/15 bg-gradient-to-br from-green-500/[.05] via-transparent to-purple-500/[.04] p-5">
          <div className="text-[9px] tracking-[.28em] text-green-300">ENIGMA // PROFITABILITY</div>
          <div className="text-xl text-white mt-2">Rentabilidade e Desempenho</div>
          <div className="text-xs text-[#74747F] mt-1">Cruza vendas com o custo cadastrado dos produtos para estimar lucro bruto e margem.</div>
        </div>

        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            {[["hoje","Hoje"],["7","7 dias"],["30","30 dias"],["mes","Este mês"]].map(([id,label])=><button key={id} onClick={()=>aplicarPeriodoRapido(id)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-[#A0A0AA] hover:border-green-500/30">{label}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>De</Label><Input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></div>
            <div><Label>Até</Label><Input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}/></div>
          </div>
          <div className="text-[9px] text-amber-300/80 mt-2">Lucro e margem são estimativas com base no custo atual cadastrado no estoque. Vendas estornadas não entram nos cálculos.</div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <MetricCyber label="FATURAMENTO PRODUTOS" value={fmt(faturamentoProdutos)} sub={`${totalQtd} unidade(s)`}/>
          <MetricCyber label="CUSTO ESTIMADO" value={fmt(custoProdutosVendidos)} sub="custo cadastrado"/>
          <MetricCyber label="LUCRO BRUTO EST." value={fmt(lucroProdutos)} sub="antes de despesas"/>
          <MetricCyber label="MARGEM BRUTA EST." value={`${margemProdutos.toFixed(2)}%`} sub="sobre produtos"/>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-purple-500/15 bg-purple-500/[.025] p-4">
            <div className="text-[9px] tracking-[.18em] text-purple-300">TICKET MÉDIO GERAL</div>
            <div className="font-mono text-2xl text-white mt-2">{fmt(ticketMedio)}</div>
            <div className="text-[10px] text-[#666672] mt-1">{vendasValidasPeriodo} venda(s) concluída(s)</div>
          </div>
          <div className="rounded-xl border border-green-500/15 bg-green-500/[.025] p-4">
            <div className="text-[9px] tracking-[.18em] text-green-300">MAIOR LUCRO BRUTO</div>
            <div className="text-sm text-white mt-2">{topLucro?.nome||"Sem vendas"}</div>
            <div className="font-mono text-lg text-green-300 mt-1">{fmt(topLucro?.lucroBruto||0)}</div>
          </div>
          <div className="rounded-xl border border-amber-500/15 bg-amber-500/[.025] p-4">
            <div className="text-[9px] tracking-[.18em] text-amber-300">MENOR MARGEM VENDIDA</div>
            <div className="text-sm text-white mt-2">{menorMargem?.nome||"Sem vendas"}</div>
            <div className="font-mono text-lg text-amber-300 mt-1">{menorMargem?`${menorMargem.margem.toFixed(2)}%`:"0,00%"}</div>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div><div className="text-[9px] tracking-[.2em] text-green-300">RANKING DE RENTABILIDADE</div><div className="text-[10px] text-[#666672] mt-1">Ordenado pelo lucro bruto estimado no período.</div></div>
            <div className="text-[10px] text-[#666672]">{rankingLucro.length} produto(s)</div>
          </div>
          {carregandoPeriodo?<div className="py-8 text-center text-xs text-[#666672]">Calculando rentabilidade...</div>:
          !rankingLucro.length?<div className="py-8 text-center text-xs text-[#666672]">Nenhum produto vendido no período.</div>:
          <div className="space-y-2">{rankingLucro.map((p,idx)=>{
            const lucroUnit=p.vendidoQtd>0?p.lucroBruto/p.vendidoQtd:0;
            return <div key={p.id} className="rounded-xl border border-white/8 bg-white/[.012] p-4">
              <div className="grid md:grid-cols-[40px_1.5fr_repeat(5,.75fr)] gap-3 items-center">
                <div className="hidden md:flex w-8 h-8 rounded-lg border border-white/8 items-center justify-center font-mono text-xs text-[#777783]">#{idx+1}</div>
                <div><div className="text-sm text-white">{p.nome}</div><div className="text-[10px] text-[#666672] mt-1">{p.vendidoQtd} un · custo atual {fmt(p.custo)} · venda atual {fmt(p.preco)}</div></div>
                <div><div className="text-[8px] text-[#5F5F69]">FATURAMENTO</div><div className="font-mono text-xs mt-1">{fmt(p.faturamento)}</div></div>
                <div><div className="text-[8px] text-[#5F5F69]">CUSTO EST.</div><div className="font-mono text-xs mt-1">{fmt(p.custoVendido)}</div></div>
                <div><div className="text-[8px] text-[#5F5F69]">LUCRO</div><div className={"font-mono text-xs mt-1 "+(p.lucroBruto>=0?"text-green-300":"text-red-300")}>{fmt(p.lucroBruto)}</div></div>
                <div><div className="text-[8px] text-[#5F5F69]">MARGEM</div><div className={"font-mono text-xs mt-1 "+(p.margem>=40?"text-green-300":p.margem>=20?"text-amber-300":"text-red-300")}>{p.margem.toFixed(2)}%</div></div>
                <div><div className="text-[8px] text-[#5F5F69]">LUCRO / UN</div><div className="font-mono text-xs mt-1">{fmt(lucroUnit)}</div></div>
              </div>
              {p.vendidoQtd>=4 && p.margem<20&&<div className="mt-3 border-t border-red-500/10 pt-2 text-[10px] text-red-200">Vende com frequência, mas a margem está baixa. Vale revisar preço, custo ou fornecedor.</div>}
              {p.margem>=50&&p.vendidoQtd>0&&<div className="mt-3 border-t border-green-500/10 pt-2 text-[10px] text-green-200">Boa margem no período. Produto interessante para manter visibilidade e disponibilidade.</div>}
            </div>
          })}</div>}
        </Card>

        <div className="rounded-xl border border-white/8 bg-white/[.015] p-4">
          <div className="text-[9px] tracking-[.18em] text-[#777783]">COMO LER ESTE RELATÓRIO</div>
          <div className="text-xs leading-5 text-[#777783] mt-2">Lucro bruto estimado = faturamento do produto − custo cadastrado × quantidade vendida. Ele não desconta aluguel, taxas, impostos, marketing ou outras despesas operacionais. Para lucro líquido, usamos o Financeiro Geral.</div>
        </div>
      </>}

      {guia==="assistencia"&&<>
        <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[.05] via-transparent to-purple-500/[.04] p-5">
          <div className="text-[9px] tracking-[.28em] text-cyan-300">ENIGMA // SERVICE INTELLIGENCE</div>
          <div className="text-xl text-white mt-2">Relatório da Assistência Técnica</div>
          <div className="text-xs text-[#74747F] mt-1">Volume de OS, desempenho operacional, aparelhos atendidos e recorrência de reparos.</div>
        </div>

        <Card>
          <div className="flex flex-wrap gap-2 mb-3">
            {[["hoje","Hoje"],["7","7 dias"],["30","30 dias"],["mes","Este mês"]].map(([id,label])=><button key={id} onClick={()=>aplicarPeriodoRapido(id)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-[#A0A0AA] hover:border-cyan-500/30">{label}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>De</Label><Input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></div>
            <div><Label>Até</Label><Input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}/></div>
          </div>
          <div className="text-[9px] text-[#5F5F69] mt-2">O período considera a data de entrada da OS. Valores de faturamento consideram somente ordens marcadas como Entregue.</div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <MetricCyber label="OS RECEBIDAS" value={String(osRelatorio.length)} sub="no período"/>
          <MetricCyber label="ENTREGUES" value={String(osEntregues.length)} sub={`${osEmAndamento.length} em andamento`}/>
          <MetricCyber label="FATURAMENTO ENTREGUE" value={fmt(faturamentoOS)} sub="valor final das OS"/>
          <MetricCyber label="TICKET MÉDIO" value={fmt(ticketMedioOS)} sub="OS entregues com valor"/>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[.025] p-4">
            <div className="text-[9px] tracking-[.18em] text-cyan-300">TEMPO MÉDIO ATÉ CONCLUSÃO</div>
            <div className="font-mono text-2xl text-white mt-2">{tempoMedioOS===null?"—":`${tempoMedioOS.toFixed(1)} dia(s)`}</div>
            <div className="text-[10px] text-[#666672] mt-1">Com base na linha do tempo das OS entregues</div>
          </div>
          <div className="rounded-xl border border-purple-500/15 bg-purple-500/[.025] p-4">
            <div className="text-[9px] tracking-[.18em] text-purple-300">EM ANDAMENTO</div>
            <div className="font-mono text-2xl text-white mt-2">{osEmAndamento.length}</div>
            <div className="text-[10px] text-[#666672] mt-1">Diagnóstico, aprovação, reparo ou retirada</div>
          </div>
          <div className="rounded-xl border border-red-500/15 bg-red-500/[.025] p-4">
            <div className="text-[9px] tracking-[.18em] text-red-300">CANCELADAS</div>
            <div className="font-mono text-2xl text-white mt-2">{osCanceladas.length}</div>
            <div className="text-[10px] text-[#666672] mt-1">No período selecionado</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-3">
          <Card>
            <div className="text-[9px] tracking-[.2em] text-cyan-300 mb-3">APARELHOS MAIS ATENDIDOS</div>
            {!rankingAparelhos.length?<div className="text-xs text-[#666672] py-5">Sem dados.</div>:<div className="space-y-2">{rankingAparelhos.slice(0,8).map(([nome,qtd],idx)=><div key={nome} className="flex justify-between gap-3 border-b border-white/5 pb-2"><div className="text-xs text-[#D9D9DF]"><span className="text-[#555560] mr-2">#{idx+1}</span>{nome}</div><div className="font-mono text-xs text-cyan-300">{qtd}</div></div>)}</div>}
          </Card>

          <Card>
            <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">PROBLEMAS RELATADOS</div>
            {!rankingProblemas.length?<div className="text-xs text-[#666672] py-5">Sem dados.</div>:<div className="space-y-2">{rankingProblemas.map(([nome,qtd],idx)=><div key={`${nome}-${idx}`} className="flex justify-between gap-3 border-b border-white/5 pb-2"><div className="text-xs text-[#D9D9DF] line-clamp-2">{nome}</div><div className="font-mono text-xs text-purple-300">{qtd}</div></div>)}</div>}
          </Card>

          <Card>
            <div className="text-[9px] tracking-[.2em] text-green-300 mb-3">PEÇAS MAIS UTILIZADAS</div>
            {!rankingPecas.length?<div className="text-xs text-[#666672] py-5">Nenhuma peça vinculada às OS.</div>:<div className="space-y-2">{rankingPecas.map(([nome,qtd],idx)=><div key={nome} className="flex justify-between gap-3 border-b border-white/5 pb-2"><div className="text-xs text-[#D9D9DF]"><span className="text-[#555560] mr-2">#{idx+1}</span>{nome}</div><div className="font-mono text-xs text-green-300">{qtd} un</div></div>)}</div>}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div><div className="text-[9px] tracking-[.2em] text-[#8A8A96]">ORDENS DO PERÍODO</div><div className="text-[10px] text-[#5F5F69] mt-1">Visão operacional completa</div></div>
            <div className="text-[10px] text-[#666672]">{osFiltradas.length} OS</div>
          </div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={buscaOSRelatorio} onChange={e=>setBuscaOSRelatorio(e.target.value)} placeholder="Buscar OS, cliente, aparelho, problema ou status" className="pl-9"/></div>
          {loadingOSRelatorio?<div className="py-8 text-center text-xs text-[#666672]">Calculando assistência...</div>:!osFiltradas.length?<div className="py-8 text-center text-xs text-[#666672]">Nenhuma OS no período.</div>:
          <div className="space-y-2">{osFiltradas.map(o=>{
            const st=statusInfo(o.status);
            const valor=Number(o.valor_final||0);
            return <div key={o.id} className="rounded-xl border border-white/8 bg-white/[.012] p-3 grid md:grid-cols-[.55fr_1.4fr_1.3fr_.9fr_.7fr] gap-3 items-center">
              <div><div className="text-[8px] text-[#5F5F69]">OS</div><div className="font-mono text-xs mt-1">#{o.numero||"—"}</div><div className="text-[9px] text-[#555560] mt-1">{fmtDate(o.data_entrada)}</div></div>
              <div><div className="text-xs text-white">{o.cliente?.nome||"Cliente"}</div><div className="text-[10px] text-[#666672] mt-1">{o.aparelho?.marcaModelo||"Aparelho não informado"}</div></div>
              <div><div className="text-[8px] text-[#5F5F69]">PROBLEMA</div><div className="text-[10px] text-[#A0A0AA] mt-1 line-clamp-2">{o.problema_relatado||"—"}</div></div>
              <div><span className="text-[9px] px-2 py-1 rounded-full border" style={{color:st.color,borderColor:st.color+"55",backgroundColor:st.color+"15"}}>{st.label}</span></div>
              <div className="md:text-right"><div className="text-[8px] text-[#5F5F69]">VALOR FINAL</div><div className="font-mono text-xs mt-1">{valor>0?fmt(valor):"—"}</div></div>
            </div>
          })}</div>}
        </Card>

        <div className="rounded-xl border border-white/8 bg-white/[.015] p-4">
          <div className="text-[9px] tracking-[.18em] text-[#777783]">LEITURA GERENCIAL</div>
          <div className="text-xs leading-5 text-[#777783] mt-2">Aparelhos e problemas recorrentes ajudam a decidir estoque de peças, conteúdo de marketing e especialização técnica. O tempo médio depende dos eventos registrados na linha do tempo de cada OS; quanto mais consistente o fluxo, mais preciso fica o indicador.</div>
        </div>
      </>}

      {guia==="vendas"&&<>
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
              <div className="grid grid-cols-2 gap-2 mt-4">{FORMAS.map(f=><div key={f.id} className="rounded-lg border border-[#2A2A34] bg-[#0F0F14] px-3 py-2"><div className="text-[10px] tracking-wide uppercase text-[#6E6E78]">{f.label}</div><div className="font-mono text-sm text-[#E5E5EA]">{fmt(totais[f.id])}</div></div>)}</div>
            </Card>
            <Card>
              <Label>Vendas <span className="normal-case text-[#5A5A64]">(toque pra ver o cupom)</span></Label>
              {vendasDoDia.length === 0 ? <div className="text-sm text-[#5A5A64] py-6 text-center">{carregando ? "Carregando..." : "Nenhuma venda nesta data"}</div> :
              <div className="divide-y divide-[#22222A]">{vendasDoDia.map(v=><button key={v.id} onClick={()=>setCupomAberto(v)} className="w-full text-left py-2.5"><div className="flex justify-between items-center"><span className="text-xs text-[#6E6E78]">{new Date(v.timestamp).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} · {FORMAS.find(f=>f.id===v.formaPagamento)?.label}</span><span className="font-mono text-sm text-[#E5E5EA]">{fmt(v.total)}</span></div><div className="text-xs text-[#8A8A96] mt-0.5">{v.itens.map(i=>i.descricao).join(", ")}</div></button>)}</div>}
            </Card>
          </>
        )}

        {modo === "periodo" && (
          <>
            <Card><div className="grid grid-cols-2 gap-2"><div><Label>De</Label><Input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)}/></div><div><Label>Até</Label><Input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)}/></div></div></Card>
            <Card>
              <div className="flex items-center justify-between mb-1"><span className="text-sm text-[#8A8A96]">Faturamento do período</span><span className="font-mono text-2xl text-white">{fmt(totalPeriodo)}</span></div>
              <div className="text-xs text-[#6E6E78]">{carregandoPeriodo ? "Carregando..." : `${vendasPeriodo.length} venda(s) em ${diasOrdenados.length} dia(s)`}</div>
              <div className="grid grid-cols-2 gap-2 mt-4">{FORMAS.map(f=><div key={f.id} className="rounded-lg border border-[#2A2A34] bg-[#0F0F14] px-3 py-2"><div className="text-[10px] tracking-wide uppercase text-[#6E6E78]">{f.label}</div><div className="font-mono text-sm text-[#E5E5EA]">{fmt(totaisPeriodo[f.id])}</div></div>)}</div>
            </Card>
            <Card>
              <Label>Por dia</Label>
              {diasOrdenados.length===0?<div className="text-sm text-[#5A5A64] py-6 text-center">{carregandoPeriodo?"Carregando...":"Nenhuma venda no período"}</div>:
              <div className="divide-y divide-[#22222A]">{diasOrdenados.map(d=>{const vd=porDia[d];const td=totalGeral(vd);const aberto=diaExpandido===d;return <div key={d}><button onClick={()=>setDiaExpandido(aberto?null:d)} className="w-full flex items-center justify-between py-2.5"><div className="text-left"><div className="text-sm text-[#E5E5EA]">{fmtDate(d)}</div><div className="text-xs text-[#6E6E78]">{vd.length} venda(s)</div></div><div className="flex items-center gap-2"><span className="font-mono text-sm text-[#E5E5EA]">{fmt(td)}</span>{aberto?<ChevronDown size={15}/>:<ChevronRight size={15}/>}</div></button>{aberto&&<div className="pb-2 pl-2 space-y-1">{vd.map(v=><button key={v.id} onClick={()=>setCupomAberto(v)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#0F0F14]"><div className="flex justify-between items-center"><span className="text-xs text-[#8A8A96]">{new Date(v.timestamp).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} · {FORMAS.find(f=>f.id===v.formaPagamento)?.label}</span><span className="font-mono text-xs text-[#C9C9D2]">{fmt(v.total)}</span></div></button>)}</div>}</div>})}</div>}
            </Card>
          </>
        )}
      </>}

      {cupomAberto && <CupomVenda venda={cupomAberto} onFechar={()=>setCupomAberto(null)} onExcluirVenda={onExcluirVenda} onEditarVenda={onEditarVenda} onAtualizado={(nova)=>atualizarListaLocal(nova,cupomAberto.id)}/>}
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
  const [motivoEstorno,setMotivoEstorno]=useState("");

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
  function imprimirCupomVenda(){
    const forma=FORMAS.find((f)=>f.id===venda.formaPagamento)?.label||venda.formaPagamento||"Não informada";
    const itens=(venda.itens||[]).map(i=>`<tr><td>${escapeHtml(String(i.qtd))}x</td><td>${escapeHtml(i.descricao||"Item")}</td><td style="text-align:right">${fmt((Number(i.valor)||0)*(Number(i.qtd)||0))}</td></tr>`).join("");
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Venda ENIGMA</title><style>
      @page{size:auto;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:10px;line-height:1.35;max-width:80mm;margin:auto}
      ${enigmaPrintCss()}
      .enigma-head{align-items:center}.enigma-logo-img{width:95px}.enigma-doc{font-size:8px}.enigma-doc strong{font-size:10px}.enigma-contact{font-size:7px}
      table{width:100%;border-collapse:collapse;margin:10px 0}td{padding:5px 2px;border-bottom:1px dashed #bbb;vertical-align:top}.total{display:flex;justify-content:space-between;font-size:15px;font-weight:800;border-top:2px solid #111;padding-top:7px;margin-top:7px}
      .info{font-size:9px;margin:6px 0}.thanks{text-align:center;margin-top:12px;font-size:9px}.status{text-align:center;font-weight:700;margin:6px 0}
    </style></head><body>
      ${enigmaPrintHeader("Comprovante de venda",`Venda ${escapeHtml(String(venda.id||"").slice(0,8).toUpperCase())}`)}
      <div class="status">${venda.status==="estornada"?"VENDA ESTORNADA":"VENDA CONCLUÍDA"}</div>
      <div class="info"><strong>Data:</strong> ${escapeHtml(fmtDateTime(venda.timestamp))}</div>
      <div class="info"><strong>Cliente:</strong> ${escapeHtml(venda.clienteNome||"Consumidor não identificado")}${venda.clienteTelefone?`<br/><strong>Contato:</strong> ${escapeHtml(venda.clienteTelefone)}`:""}</div>
      <table><tbody>${itens}</tbody></table>
      <div class="info"><strong>Pagamento:</strong> ${escapeHtml(forma)}</div>
      <div class="total"><span>TOTAL</span><span>${fmt(venda.total)}</span></div>
      ${venda.status==="estornada"?`<div class="info"><strong>Motivo do estorno:</strong> ${escapeHtml(venda.motivoCancelamento||"Estorno registrado")}</div>`:""}
      <div class="thanks">Obrigado pela preferência.</div>
      ${enigmaPrintFooter()}
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script>
    </body></html>`;
    openPrintHtml(html);
  }

  async function confirmarExclusao() {
    setSalvando(true);
    const ok = await onExcluirVenda(venda,motivoEstorno || "Estorno solicitado no PDV");
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
                {modo === "excluir-confirmar" && "Estornar venda"}
              </div>
            </div>
            <button onClick={onFechar} className="text-[#8A8A96]"><X size={18} /></button>
          </div>

          {modo === "ver" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-[#6E6E78]">{fmtDateTime(venda.timestamp)}</div>
                <span className={"rounded-full border px-2 py-1 text-[9px] "+(venda.status==="estornada"?"border-red-500/25 text-red-300":"border-green-500/25 text-green-300")}>{venda.status==="estornada"?"ESTORNADA":"CONCLUÍDA"}</span>
              </div>
              {venda.status==="estornada" && <div className="rounded-lg border border-red-500/15 bg-red-500/[.03] p-3 mb-3 text-xs text-red-200">Motivo: {venda.motivoCancelamento||"Estorno registrado"}{venda.canceladoEm?` · ${fmtDateTime(venda.canceladoEm)}`:""}</div>}
              <div className="rounded-lg border border-white/8 bg-white/[.02] p-3 mb-3">
                <div className="text-[8px] tracking-[.18em] text-[#666672]">CLIENTE</div>
                <div className="text-xs text-[#D9D9DF] mt-1">{venda.clienteNome||"Consumidor não identificado"}</div>
                {venda.clienteTelefone&&<div className="text-[10px] text-[#666672] mt-0.5">{venda.clienteTelefone}</div>}
              </div>
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
              <Button className="w-full mt-4" onClick={imprimirCupomVenda}>
                <span className="flex items-center justify-center gap-2"><Printer size={15} /> Imprimir cupom</span>
              </Button>
              {venda.status!=="estornada" && (onEditarVenda || onExcluirVenda) && (
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => pedirAcao("editar")}>Editar</Button>
                  <Button variant="danger" className="flex-1" onClick={() => pedirAcao("excluir")}>Estornar</Button>
                </div>
              )}
            </>
          )}

          {modo === "pin" && (
            <div>
              <div className="text-xs text-[#8A8A96] mb-3">Digite o código de acesso pra {acaoPendente === "editar" ? "editar" : "estornar"} essa venda.</div>
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
              <div className="text-xs text-[#8A8A96] mb-2">Informe o motivo do estorno. A venda continuará no histórico e estoque/financeiro serão revertidos.</div>
              <Input value={motivoEstorno} onChange={(e)=>setMotivoEstorno(e.target.value)} placeholder="Ex: cliente desistiu / venda lançada por engano" className="mb-3"/>
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

    </div>
  );
}

/* ================= ESTOQUE ================= */
function TabelaPeliculasTab({ estoque=[] }) {
  const [secao,setSecao]=useState("consulta");
  const [grupos,setGrupos]=useState([]);
  const [vinculos,setVinculos]=useState([]);
  const [vinculando,setVinculando]=useState(false);
  const [produtoVinculo,setProdutoVinculo]=useState("");
  const [loading,setLoading]=useState(true);
  const [busca,setBusca]=useState("");
  const [selecionado,setSelecionado]=useState(null);
  const [mostrarForm,setMostrarForm]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({nome:"",marca:"",modelosText:"",observacao:""});
  const [arquivoNome,setArquivoNome]=useState("");
  const [importRows,setImportRows]=useState([]);
  const [importPreview,setImportPreview]=useState(null);
  const [importando,setImportando]=useState(false);
  const fileRef=useRef(null);

  const normalizar=(v="")=>String(v).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g," ").trim();

  async function carregar(){
    setLoading(true);
    try{
      const [rows,links]=await Promise.all([
        sb("pelicula_grupos?select=*&ativo=eq.true&order=marca.asc,nome.asc"),
        sb("pelicula_estoque_links?select=*").catch(()=>[])
      ]);
      setGrupos((rows||[]).map(r=>({...r,modelos:Array.isArray(r.modelos)?r.modelos:[]})));
      setVinculos(links||[]);
    }catch(e){
      console.warn("Base de películas indisponível:",e);
      setGrupos([]);
    }
    setLoading(false);
  }
  useEffect(()=>{carregar();},[]);

  function resetForm(){
    setForm({nome:"",marca:"",modelosText:"",observacao:""});
    setEditando(null);
    setMostrarForm(false);
  }

  async function salvarGrupo(){
    const nome=form.nome.trim();
    const modelos=[...new Set(form.modelosText.split(/[\n,;|]+/).map(x=>x.trim()).filter(Boolean))];
    if(!nome||!modelos.length){
      alert("Informe o nome do grupo e pelo menos um modelo compatível.");
      return;
    }
    const body={
      nome,
      marca:form.marca.trim()||null,
      modelos,
      observacao:form.observacao.trim()||null,
      ativo:true,
      updated_at:new Date().toISOString()
    };
    try{
      if(editando){
        await sb(`pelicula_grupos?id=eq.${editando.id}`,{method:"PATCH",body:JSON.stringify(body)});
      }else{
        await sb("pelicula_grupos",{method:"POST",body:JSON.stringify(body)});
      }
      resetForm();
      await carregar();
    }catch(e){
      console.error(e);
      alert("Não foi possível salvar o grupo. Confira se o SQL da V3.6 já foi executado.");
    }
  }

  function editarGrupo(g){
    setEditando(g);
    setForm({
      nome:g.nome||"",
      marca:g.marca||"",
      modelosText:(g.modelos||[]).join("\n"),
      observacao:g.observacao||""
    });
    setMostrarForm(true);
    setSecao("base");
  }

  async function excluirGrupo(g){
    if(!confirm(`Desativar o grupo "${g.nome}"?`)) return;
    try{
      await sb(`pelicula_grupos?id=eq.${g.id}`,{
        method:"PATCH",
        body:JSON.stringify({ativo:false,updated_at:new Date().toISOString()})
      });
      if(selecionado?.id===g.id)setSelecionado(null);
      await carregar();
    }catch(e){alert("Não foi possível desativar o grupo.");}
  }

  const q=normalizar(busca);
  const encontrados=q.length<2?[]:grupos.filter(g=>{
    const t=normalizar(`${g.nome||""} ${g.marca||""} ${(g.modelos||[]).join(" ")}`);
    return t.includes(q) || q.split(" ").filter(Boolean).every(p=>t.includes(p));
  }).sort((a,b)=>{
    const ax=(a.modelos||[]).some(m=>normalizar(m)===q)?1:0;
    const bx=(b.modelos||[]).some(m=>normalizar(m)===q)?1:0;
    return bx-ax||String(a.nome).localeCompare(String(b.nome),"pt-BR");
  });

  function parecePelicula(p){
    const t=normalizar(`${p.nome||""} ${p.sku||""} ${p.compatibilidade||""}`);
    return t.includes("pelicula")||t.includes("vidro")||t.includes("3d")||t.includes("9d")||t.includes("ceramica")||t.includes("hidrogel");
  }
  const peliculasEstoque=estoque.filter(p=>p.categoria==="acessorio"&&parecePelicula(p));

  function estoqueDoGrupo(g){
    const idsManuais=new Set(vinculos.filter(v=>v.grupo_id===g.id).map(v=>String(v.estoque_id)));
    const termos=[g.nome,...(g.modelos||[])].map(normalizar).filter(Boolean);
    const tokensModelo=termos.flatMap(k=>k.split(" ").filter(x=>x.length>=2));
    return estoque.filter(p=>{
      if(idsManuais.has(String(p.id))) return true;
      if(p.categoria!=="acessorio"||!parecePelicula(p)) return false;
      const t=normalizar(`${p.nome||""} ${p.compatibilidade||""} ${p.sku||""} ${p.marca||""}`);
      if(termos.some(k=>k.length>=3 && t.includes(k))) return true;
      return tokensModelo.some(k=>/^(?:[a-z]{0,3}\d+[a-z0-9]*|iphone|galaxy|moto|redmi|poco)$/i.test(k) && t.split(" ").includes(k));
    }).sort((a,b)=>{
      const am=idsManuais.has(String(a.id))?1:0,bm=idsManuais.has(String(b.id))?1:0;
      return bm-am||(Number(b.quantidade)>0?1:0)-(Number(a.quantidade)>0?1:0)||Number(b.quantidade)-Number(a.quantidade);
    });
  }

  async function vincularProduto(){
    if(!selecionado||!produtoVinculo)return;
    if(vinculos.some(v=>v.grupo_id===selecionado.id&&String(v.estoque_id)===String(produtoVinculo))){
      setVinculando(false);setProdutoVinculo("");return;
    }
    try{
      await sb("pelicula_estoque_links",{method:"POST",body:JSON.stringify({grupo_id:selecionado.id,estoque_id:produtoVinculo})});
      await carregar();setVinculando(false);setProdutoVinculo("");
    }catch(e){console.error(e);alert("Não foi possível criar o vínculo. Execute o SQL da V4.3.2 no Supabase.");}
  }

  async function removerVinculo(produtoId){
    const link=vinculos.find(v=>v.grupo_id===selecionado?.id&&String(v.estoque_id)===String(produtoId));
    if(!link)return;
    try{await sb(`pelicula_estoque_links?id=eq.${link.id}`,{method:"DELETE"});await carregar();}
    catch(e){alert("Não foi possível remover o vínculo.");}
  }

  const estoqueSelecionado=selecionado?estoqueDoGrupo(selecionado):[];
  const estoqueDisponivel=estoqueSelecionado.filter(p=>Number(p.quantidade)>0);

  function limparImportacao(){
    setArquivoNome("");
    setImportRows([]);
    setImportPreview(null);
    if(fileRef.current)fileRef.current.value="";
  }

  function autoPick(headers,patterns){
    return headers.find(h=>patterns.some(p=>normalizar(h).includes(p)))||"";
  }

  async function lerArquivo(file){
    if(!file)return;
    setArquivoNome(file.name);
    try{
      let rows=[];
      if(file.name.toLowerCase().endsWith(".csv")){
        const text=await file.text();
        const lines=text.split(/\r?\n/).filter(Boolean);
        if(!lines.length) throw new Error("Arquivo vazio");
        const sep=(lines[0].split(";").length>lines[0].split(",").length)?";":",";
        const parseLine=(line)=>{
          const out=[];let cur="",quoted=false;
          for(let i=0;i<line.length;i++){
            const c=line[i];
            if(c==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}
            else if(c===sep&&!quoted){out.push(cur.trim());cur="";}
            else cur+=c;
          }
          out.push(cur.trim());return out;
        };
        const headers=parseLine(lines[0]);
        rows=lines.slice(1).map(l=>{
          const vals=parseLine(l);const o={};
          headers.forEach((h,i)=>o[h]=vals[i]??"");
          return o;
        });
      }else{
        const XLSX=await import("xlsx");
        const buf=await file.arrayBuffer();
        const wb=XLSX.read(buf,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        rows=XLSX.utils.sheet_to_json(ws,{defval:""});
      }
      if(!rows.length) throw new Error("Nenhuma linha encontrada");
      const headers=Object.keys(rows[0]||{});
      const mapping={
        grupo:autoPick(headers,["grupo","pelicula","referencia","familia"]),
        marca:autoPick(headers,["marca","fabricante"]),
        modelo:autoPick(headers,["modelo","aparelho","compatibilidade","compativel"]),
        observacao:autoPick(headers,["observacao","obs","nota"])
      };
      setImportRows(rows);
      gerarPreview(rows,mapping);
    }catch(e){
      console.error(e);
      limparImportacao();
      alert("Não consegui ler esse arquivo. Use XLSX, XLS ou CSV com cabeçalho.");
    }
  }

  function gerarPreview(rows,mapping){
    if(!mapping.grupo&&!mapping.modelo){
      setImportPreview({erro:"Não foi possível identificar as colunas de grupo/modelo automaticamente.",mapping,headers:Object.keys(rows[0]||{})});
      return;
    }
    const mapa=new Map();
    rows.forEach(r=>{
      const modelo=String(r[mapping.modelo]||"").trim();
      let nome=String(r[mapping.grupo]||"").trim();
      const marca=String(r[mapping.marca]||"").trim();
      const obs=String(r[mapping.observacao]||"").trim();
      if(!nome) nome=modelo;
      if(!nome||!modelo)return;
      const key=normalizar(`${marca}|${nome}`);
      if(!mapa.has(key))mapa.set(key,{nome,marca,observacao:obs,modelos:[]});
      const g=mapa.get(key);
      if(modelo&&!g.modelos.some(x=>normalizar(x)===normalizar(modelo)))g.modelos.push(modelo);
    });
    const novos=[...mapa.values()];
    let duplicados=0,novosGrupos=0,novosModelos=0;
    novos.forEach(g=>{
      const existente=grupos.find(x=>normalizar(`${x.marca||""}|${x.nome}`)===normalizar(`${g.marca||""}|${g.nome}`));
      if(existente){
        duplicados++;
        novosModelos+=g.modelos.filter(m=>!(existente.modelos||[]).some(x=>normalizar(x)===normalizar(m))).length;
      }else{
        novosGrupos++;
        novosModelos+=g.modelos.length;
      }
    });
    setImportPreview({mapping,headers:Object.keys(rows[0]||{}),grupos:novos,linhas:rows.length,novosGrupos,duplicados,novosModelos});
  }

  function mudarMapping(campo,valor){
    if(!importPreview)return;
    const mapping={...importPreview.mapping,[campo]:valor};
    gerarPreview(importRows,mapping);
  }

  async function confirmarImportacao(){
    if(!importPreview?.grupos?.length)return;
    setImportando(true);
    try{
      for(const g of importPreview.grupos){
        const existente=grupos.find(x=>normalizar(`${x.marca||""}|${x.nome}`)===normalizar(`${g.marca||""}|${g.nome}`));
        if(existente){
          const modelos=[...(existente.modelos||[])];
          g.modelos.forEach(m=>{if(!modelos.some(x=>normalizar(x)===normalizar(m)))modelos.push(m);});
          await sb(`pelicula_grupos?id=eq.${existente.id}`,{
            method:"PATCH",
            body:JSON.stringify({
              modelos,
              observacao:existente.observacao||g.observacao||null,
              updated_at:new Date().toISOString()
            })
          });
        }else{
          await sb("pelicula_grupos",{
            method:"POST",
            body:JSON.stringify({
              nome:g.nome,
              marca:g.marca||null,
              modelos:g.modelos,
              observacao:g.observacao||null,
              ativo:true
            })
          });
        }
      }
      await carregar();
      limparImportacao();
      alert("Importação concluída.");
    }catch(e){
      console.error(e);
      alert("A importação foi interrompida. Confira a tabela no Supabase e tente novamente.");
    }
    setImportando(false);
  }

  function exportarCSV(){
    const esc=(v)=>`"${String(v??"").replace(/"/g,'""')}"`;
    const linhas=["grupo;marca;modelo;observacao"];
    grupos.forEach(g=>(g.modelos||[]).forEach(m=>{
      linhas.push([g.nome,g.marca||"",m,g.observacao||""].map(esc).join(";"));
    }));
    const blob=new Blob(["\ufeff"+linhas.join("\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="enigma-tabela-peliculas.csv";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  return <div className="space-y-5">
    <section className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_85%_15%,rgba(139,92,246,.18),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(34,211,238,.07),transparent_32%),linear-gradient(145deg,#111119,#0D0D13)] p-5 md:p-7">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[9px] tracking-[.22em] text-purple-300 border border-purple-500/20 bg-purple-500/10 rounded-full px-3 py-1"><Layers size={12}/> ENIGMA // COMPATIBILITY BASE</div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white mt-3">Tabela de Películas</h1>
          <p className="text-sm text-[#858590] mt-2 max-w-2xl">Base própria da loja: pesquise um aparelho, veja o grupo compatível e confira imediatamente o que existe no estoque.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 min-w-[250px]">
          <div className="rounded-xl border border-purple-500/15 bg-purple-500/[.04] px-4 py-3"><div className="text-[8px] text-purple-300 tracking-[.16em]">GRUPOS</div><div className="font-mono text-2xl mt-1">{grupos.length}</div></div>
          <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[.04] px-4 py-3"><div className="text-[8px] text-cyan-300 tracking-[.16em]">MODELOS</div><div className="font-mono text-2xl mt-1">{grupos.reduce((a,g)=>a+(g.modelos||[]).length,0)}</div></div>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[.015] p-1">
      {[["consulta","Consulta"],["base","Base interna"],["importar","Importar"]].map(([id,label])=><button key={id} onClick={()=>setSecao(id)} className={"rounded-lg py-2.5 text-[10px] md:text-xs border "+(secao===id?"border-purple-500/30 bg-purple-500/10 text-white":"border-transparent text-[#777783]")}>{label}</button>)}
    </div>

    {secao==="consulta"&&<>
      <Card>
        <div className="text-[9px] tracking-[.22em] text-purple-300 mb-2">QUAL É O APARELHO?</div>
        <div className="relative"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"/><input autoFocus value={busca} onChange={e=>{setBusca(e.target.value);setSelecionado(null)}} placeholder="Ex: Galaxy A15, iPhone 13, Moto G54..." className="w-full h-14 rounded-2xl border border-purple-500/20 bg-black/25 pl-12 pr-4 text-base text-white outline-none focus:border-purple-400/50"/></div>
      </Card>

      {loading?<Card className="text-center py-10"><div className="text-xs text-[#666672]">Carregando base de compatibilidade...</div></Card>:
      q.length<2?<div className="rounded-2xl border border-white/8 bg-white/[.01] p-8 text-center"><Layers size={30} className="mx-auto text-purple-300/60"/><div className="text-sm text-[#A0A0AA] mt-3">Digite pelo menos 2 caracteres para consultar.</div></div>:
      !selecionado?<Card>
        <div className="text-[9px] tracking-[.2em] text-cyan-300 mb-3">GRUPOS ENCONTRADOS</div>
        {!encontrados.length?<div className="py-8 text-center"><div className="text-sm text-amber-200">Nenhuma compatibilidade cadastrada.</div><button onClick={()=>{setForm({nome:busca,marca:"",modelosText:busca,observacao:""});setMostrarForm(true);setSecao("base")}} className="mt-3 text-xs text-purple-300">+ Criar grupo para “{busca}”</button></div>:
        <div className="space-y-2">{encontrados.map(g=><button key={g.id} onClick={()=>setSelecionado(g)} className="w-full rounded-xl border border-white/8 p-4 text-left hover:border-purple-500/25 flex justify-between gap-3"><div><div className="text-sm text-white">{g.nome}</div><div className="text-[10px] text-[#666672] mt-1">{g.marca||"Marca não informada"} · {(g.modelos||[]).length} modelo(s)</div><div className="flex flex-wrap gap-1 mt-2">{(g.modelos||[]).slice(0,5).map(m=><span key={m} className="rounded-full border border-white/7 px-2 py-1 text-[8px] text-[#8A8A96]">{m}</span>)}{(g.modelos||[]).length>5&&<span className="text-[8px] text-[#555560] py-1">+{g.modelos.length-5}</span>}</div></div><ChevronRight size={18} className="text-purple-300"/></button>)}</div>}
      </Card>:
      <div className="space-y-4">
        <Card>
          <button onClick={()=>setSelecionado(null)} className="text-[10px] text-purple-300 mb-3">← Voltar aos resultados</button>
          <div className="flex justify-between gap-3">
            <div className="flex-1">
              <div className="text-[9px] tracking-[.2em] text-cyan-300">VOCÊ PESQUISOU</div>
              <div className="text-2xl text-white mt-1">{(selecionado.modelos||[]).find(m=>normalizar(m)===q)||busca.trim()}</div>
              <div className="mt-4 rounded-xl border border-purple-500/15 bg-purple-500/[.035] p-3">
                <div className="text-[8px] tracking-[.2em] text-purple-300">GRUPO COMPATÍVEL</div>
                <div className="text-sm text-white mt-1">{(selecionado.modelos||[]).join(" / ")}</div>
                <div className="text-[10px] text-[#666672] mt-1">Referência da base: {selecionado.nome} · {selecionado.marca||"Marca não informada"}</div>
              </div>
            </div>
            <button onClick={()=>editarGrupo(selecionado)} className="text-xs text-cyan-300 self-start">Editar</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">{(selecionado.modelos||[]).map(m=><span key={m} className={"rounded-full border px-3 py-1.5 text-[10px] "+(normalizar(m)===q?"border-cyan-500/40 bg-cyan-500/10 text-cyan-200":"border-white/8 text-[#A0A0AA]")}>{m}{normalizar(m)===q?" · pesquisado":""}</span>)}</div>
          {selecionado.observacao&&<div className="mt-4 text-xs text-[#777783]">{selecionado.observacao}</div>}
          <div className="mt-4 pt-4 border-t border-white/6">
            {!vinculando?<button onClick={()=>setVinculando(true)} className="inline-flex items-center gap-2 text-[10px] text-cyan-300"><LinkIcon size={13}/> Vincular produto do estoque manualmente</button>:
            <div className="flex flex-col md:flex-row gap-2">
              <select value={produtoVinculo} onChange={e=>setProdutoVinculo(e.target.value)} className="flex-1 h-10 rounded-xl border border-white/10 bg-[#101017] px-3 text-xs text-white">
                <option value="">Selecione um produto do estoque...</option>
                {estoque.filter(p=>p.categoria==="acessorio").sort((a,b)=>String(a.nome).localeCompare(String(b.nome),"pt-BR")).map(p=><option key={p.id} value={p.id}>{p.nome} — {p.quantidade} un</option>)}
              </select>
              <Button onClick={vincularProduto}>Vincular</Button><Button variant="ghost" onClick={()=>{setVinculando(false);setProdutoVinculo("")}}>Cancelar</Button>
            </div>}
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <MetricCyber label="PRODUTOS" value={String(estoqueSelecionado.length)} sub="películas relacionadas"/>
          <MetricCyber label="DISPONÍVEIS" value={String(estoqueDisponivel.length)} sub="com saldo"/>
          <MetricCyber label="UNIDADES" value={String(estoqueDisponivel.reduce((a,p)=>a+Number(p.quantidade||0),0))} sub="em estoque"/>
        </div>
        <Card>
          <div className="text-[9px] tracking-[.2em] text-green-300 mb-3">DISPONÍVEL NA ENIGMA</div>
          {!estoqueDisponivel.length?<div className="rounded-xl border border-amber-500/15 bg-amber-500/[.035] p-5 text-center text-sm text-amber-200">O grupo existe, mas nenhuma película compatível foi localizada com saldo no estoque.</div>:
          <div className="grid md:grid-cols-2 gap-3">{estoqueDisponivel.map(p=>{const manual=vinculos.some(v=>v.grupo_id===selecionado.id&&String(v.estoque_id)===String(p.id));return <div key={p.id} className="rounded-xl border border-green-500/15 bg-green-500/[.025] p-4"><div className="flex justify-between gap-3"><div><div className="text-sm">{p.nome}</div><div className="text-[9px] text-[#666672] mt-1">{p.compatibilidade||"Sem descrição de compatibilidade"}</div>{manual&&<div className="text-[8px] text-cyan-300 mt-1">VÍNCULO MANUAL CONFIRMADO</div>}</div><span className="text-[9px] text-green-300">{p.quantidade} un</span></div><div className="flex justify-between items-center mt-3 pt-3 border-t border-white/6"><span className="text-[9px] text-[#555560]">{p.sku||"Sem SKU"}</span><div className="flex items-center gap-3"><span className="font-mono text-xs">{fmt(p.preco)}</span>{manual&&<button onClick={()=>removerVinculo(p.id)} className="text-[8px] text-red-300">desvincular</button>}</div></div></div>})}</div>}
        </Card>
      </div>}
    </>}

    {secao==="base"&&<>
      <div className="flex flex-wrap justify-between gap-2">
        <div className="text-xs text-[#666672] self-center">Cadastre grupos de modelos que usam a mesma película.</div>
        <div className="flex gap-2"><Button variant="ghost" onClick={exportarCSV}>Exportar CSV</Button><Button onClick={()=>{resetForm();setMostrarForm(true)}}><span className="flex items-center gap-2"><Plus size={14}/> Novo grupo</span></Button></div>
      </div>

      {mostrarForm&&<Card>
        <div className="flex items-center justify-between mb-4"><div><div className="text-[9px] tracking-[.22em] text-purple-300">{editando?"EDITAR GRUPO":"NOVO GRUPO"}</div><div className="text-xs text-[#666672] mt-1">Uma película pode atender vários aparelhos.</div></div><button onClick={resetForm}><X size={17}/></button></div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Nome do grupo *</Label><Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Samsung A15 / A24"/></div>
          <div><Label>Marca</Label><Input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} placeholder="Samsung"/></div>
          <div className="md:col-span-2"><Label>Modelos compatíveis *</Label><Textarea rows={7} value={form.modelosText} onChange={e=>setForm({...form,modelosText:e.target.value})} placeholder={"Um por linha, por exemplo:\nGalaxy A15\nGalaxy A15 5G\nGalaxy A24"}/><div className="text-[9px] text-[#5F5F69] mt-1">Pode usar linha nova, vírgula ou ponto e vírgula.</div></div>
          <div className="md:col-span-2"><Label>Observação</Label><Input value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} placeholder="Ex: mesmo recorte e medida"/></div>
        </div>
        <div className="flex gap-2 mt-4"><Button variant="ghost" onClick={resetForm}>Cancelar</Button><Button onClick={salvarGrupo}>{editando?"Salvar alterações":"Criar grupo"}</Button></div>
      </Card>}

      {loading?<Card className="text-center py-10"><div className="text-xs text-[#666672]">Carregando...</div></Card>:
      !grupos.length?<Card className="text-center py-10"><div className="text-sm text-[#777783]">Sua base ainda está vazia.</div><div className="text-xs text-[#5F5F69] mt-2">Cadastre manualmente ou importe uma planilha na guia Importar.</div></Card>:
      <div className="space-y-2">{grupos.map(g=><Card key={g.id} className="!p-0 overflow-hidden"><div className="p-4 grid md:grid-cols-[1fr_1.6fr_auto] gap-4 items-center"><div><div className="text-sm text-white">{g.nome}</div><div className="text-[10px] text-[#666672] mt-1">{g.marca||"Sem marca"} · {(g.modelos||[]).length} modelo(s)</div></div><div className="flex flex-wrap gap-1.5">{(g.modelos||[]).slice(0,8).map(m=><span key={m} className="rounded-full border border-white/7 px-2 py-1 text-[8px] text-[#9999A3]">{m}</span>)}{(g.modelos||[]).length>8&&<span className="text-[8px] text-[#555560] py-1">+{g.modelos.length-8}</span>}</div><div className="flex gap-2"><button onClick={()=>editarGrupo(g)} className="text-[10px] text-cyan-300">Editar</button><button onClick={()=>excluirGrupo(g)} className="text-[10px] text-red-300">Desativar</button></div></div></Card>)}</div>}
    </>}

    {secao==="importar"&&<>
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><div className="text-[9px] tracking-[.22em] text-purple-300">IMPORTAÇÃO EM MASSA</div><div className="text-sm text-white mt-1">Excel ou CSV</div><div className="text-xs text-[#666672] mt-1">O arquivo é analisado primeiro. Nada é gravado antes da confirmação.</div></div>
          <div className="flex gap-2"><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e=>lerArquivo(e.target.files?.[0])} className="hidden"/><Button onClick={()=>fileRef.current?.click()}><span className="flex items-center gap-2"><Upload size={14}/> Escolher arquivo</span></Button></div>
        </div>
        {arquivoNome&&<div className="mt-4 rounded-xl border border-white/8 bg-black/15 p-3 flex justify-between gap-3"><div><div className="text-xs text-white">{arquivoNome}</div><div className="text-[9px] text-[#666672] mt-1">{importRows.length} linha(s) lida(s)</div></div><button onClick={limparImportacao} className="text-[10px] text-red-300">Remover</button></div>}
      </Card>

      <Card>
        <div className="text-[9px] tracking-[.2em] text-cyan-300 mb-3">FORMATO RECOMENDADO</div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-[#666672]"><th className="text-left p-2">grupo</th><th className="text-left p-2">marca</th><th className="text-left p-2">modelo</th><th className="text-left p-2">observacao</th></tr></thead><tbody><tr className="border-t border-white/7"><td className="p-2">Samsung A15/A24</td><td className="p-2">Samsung</td><td className="p-2">Galaxy A15</td><td className="p-2">Mesmo recorte</td></tr><tr className="border-t border-white/7"><td className="p-2">Samsung A15/A24</td><td className="p-2">Samsung</td><td className="p-2">Galaxy A24</td><td className="p-2">Mesmo recorte</td></tr></tbody></table></div>
        <div className="text-[9px] text-[#5F5F69] mt-2">O importador tenta reconhecer automaticamente nomes de colunas diferentes.</div>
      </Card>

      {importPreview&&<Card>
        <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">PRÉVIA DA IMPORTAÇÃO</div>
        {importPreview.headers&&<div className="grid md:grid-cols-4 gap-2 mb-4">
          {[["grupo","Coluna de grupo"],["marca","Coluna de marca"],["modelo","Coluna de modelo"],["observacao","Coluna de observação"]].map(([key,label])=><div key={key}><Label>{label}</Label><select value={importPreview.mapping?.[key]||""} onChange={e=>mudarMapping(key,e.target.value)} className="w-full rounded-lg bg-[#0F0F14] border border-[#2A2A34] px-2 py-2 text-xs"><option value="">Não usar</option>{importPreview.headers.map(h=><option key={h} value={h}>{h}</option>)}</select></div>)}
        </div>}
        {importPreview.erro?<div className="rounded-xl border border-red-500/20 bg-red-500/[.035] p-4 text-xs text-red-200">{importPreview.erro}</div>:<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            <MetricCyber label="LINHAS" value={String(importPreview.linhas||0)} sub="arquivo"/>
            <MetricCyber label="NOVOS GRUPOS" value={String(importPreview.novosGrupos||0)} sub="serão criados"/>
            <MetricCyber label="GRUPOS EXISTENTES" value={String(importPreview.duplicados||0)} sub="serão mesclados"/>
            <MetricCyber label="NOVOS MODELOS" value={String(importPreview.novosModelos||0)} sub="compatibilidades"/>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">{(importPreview.grupos||[]).slice(0,50).map((g,i)=><div key={i} className="rounded-lg border border-white/7 p-3 flex justify-between gap-3"><div><div className="text-xs text-white">{g.nome}</div><div className="text-[9px] text-[#666672] mt-1">{g.marca||"Sem marca"}</div></div><div className="text-right"><div className="font-mono text-xs text-cyan-300">{g.modelos.length}</div><div className="text-[8px] text-[#555560]">modelo(s)</div></div></div>)}</div>
          <div className="flex justify-end mt-4"><Button disabled={importando||!importPreview.grupos?.length} onClick={confirmarImportacao}>{importando?"Importando...":"Confirmar importação"}</Button></div>
        </>}
      </Card>}
    </>}
  </div>;
}

function ComprasTab({ estoque=[], onMovimentar }) {
  const [periodo,setPeriodo]=useState(30);
  const [vendas,setVendas]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busca,setBusca]=useState("");
  const [fornecedor,setFornecedor]=useState("todos");
  const [selecionados,setSelecionados]=useState({});
  const [quantidades,setQuantidades]=useState({});
  const [recebendo,setRecebendo]=useState(false);

  async function carregar(){
    setLoading(true);
    const fim=new Date(); fim.setHours(23,59,59,999);
    const ini=new Date(); ini.setDate(ini.getDate()-(periodo-1)); ini.setHours(0,0,0,0);
    try{
      const rows=await sb(`vendas?select=*&timestamp=gte.${ini.toISOString()}&timestamp=lte.${fim.toISOString()}&order=timestamp.desc`);
      setVendas((rows||[]).map(rowToVenda).filter(v=>v.status!=="estornada"));
    }catch(e){
      console.warn("Compras e reposição:",e);
      setVendas([]);
    }
    setLoading(false);
  }

  useEffect(()=>{carregar();},[periodo]);

  const vendido={};
  vendas.forEach(v=>(v.itens||[]).forEach(i=>{
    if(!i.estoqueId)return;
    vendido[i.estoqueId]=(vendido[i.estoqueId]||0)+(Number(i.qtd)||0);
  }));

  const analise=estoque.map(p=>{
    const vendasPeriodo=Number(vendido[p.id]||0);
    const mensal=vendasPeriodo*(30/periodo);
    const minimo=Number(p.estoqueMinimo||0);
    const atual=Number(p.quantidade||0);
    const alvo=Math.max(minimo*2,Math.ceil(mensal*1.25),minimo);
    const sugerido=Math.max(0,Math.ceil(alvo-atual));
    let prioridade="normal";
    if(atual<=0) prioridade="urgente";
    else if(atual<=minimo) prioridade="alta";
    else if(sugerido>0&&vendasPeriodo>0) prioridade="media";
    return {...p,vendasPeriodo,mensal,alvo,sugerido,prioridade,investimento:sugerido*Number(p.custo||0)};
  }).filter(p=>p.sugerido>0)
    .sort((a,b)=>{
      const peso={urgente:4,alta:3,media:2,normal:1};
      return peso[b.prioridade]-peso[a.prioridade]||b.vendasPeriodo-a.vendasPeriodo||b.sugerido-a.sugerido;
    });

  const fornecedores=[...new Set(estoque.map(p=>String(p.fornecedor||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const q=busca.toLowerCase();
  const lista=analise.filter(p=>{
    const matchBusca=!q||[p.nome,p.sku,p.marca,p.compatibilidade,p.fornecedor].some(v=>String(v||"").toLowerCase().includes(q));
    const matchForn=fornecedor==="todos"||(fornecedor==="sem"?!p.fornecedor:p.fornecedor===fornecedor);
    return matchBusca&&matchForn;
  });

  const qtdEscolhida=(p)=>Math.max(0,Number(quantidades[p.id]??p.sugerido)||0);
  const marcados=lista.filter(p=>selecionados[p.id]);
  const totalUn=marcados.reduce((a,p)=>a+qtdEscolhida(p),0);
  const totalCompra=marcados.reduce((a,p)=>a+qtdEscolhida(p)*Number(p.custo||0),0);

  function toggleTodos(){
    const todosMarcados=lista.length&&lista.every(p=>selecionados[p.id]);
    const prox={...selecionados};
    lista.forEach(p=>prox[p.id]=!todosMarcados);
    setSelecionados(prox);
  }

  function exportarCSV(){
    const itens=marcados.length?marcados:lista;
    if(!itens.length){alert("Não há itens para exportar.");return;}
    const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
    const linhas=["produto;sku;fornecedor;estoque_atual;estoque_minimo;vendido_periodo;quantidade_compra;custo_unitario;total_estimado"];
    itens.forEach(p=>{
      const qtd=marcados.length?qtdEscolhida(p):p.sugerido;
      linhas.push([
        p.nome,p.sku||"",p.fornecedor||"",p.quantidade,p.estoqueMinimo,p.vendasPeriodo,qtd,
        Number(p.custo||0).toFixed(2),(qtd*Number(p.custo||0)).toFixed(2)
      ].map(esc).join(";"));
    });
    const blob=new Blob(["\ufeff"+linhas.join("\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`enigma-lista-compras-${todayISO()}.csv`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function darEntrada(){
    if(!marcados.length){alert("Selecione pelo menos um produto.");return;}
    if(!confirm(`Registrar entrada de ${totalUn} unidade(s) no estoque?`))return;
    setRecebendo(true);
    let ok=0;
    for(const p of marcados){
      const qtd=qtdEscolhida(p);
      if(!qtd)continue;
      const feito=await onMovimentar(p.id,{
        tipo:"entrada",
        quantidade:qtd,
        origem:"compra_reposicao",
        observacao:`Reposição registrada pela lista de compras · fornecedor: ${p.fornecedor||"não informado"}`
      });
      if(feito)ok++;
    }
    setRecebendo(false);
    setSelecionados({});
    setQuantidades({});
    alert(`Entrada concluída para ${ok} produto(s).`);
  }

  const urgentes=analise.filter(p=>p.prioridade==="urgente").length;
  const baixos=analise.filter(p=>p.prioridade==="alta").length;
  const investimentoTotal=analise.reduce((a,p)=>a+p.investimento,0);

  return <div className="space-y-5">
    <section className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_85%_12%,rgba(139,92,246,.17),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(34,211,238,.06),transparent_32%),linear-gradient(145deg,#111119,#0D0D13)] p-5 md:p-7">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[9px] tracking-[.22em] text-purple-300 border border-purple-500/20 bg-purple-500/10 rounded-full px-3 py-1"><Package size={12}/> ENIGMA // SUPPLY CONTROL</div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white mt-3">Compras & Reposição</h1>
          <p className="text-sm text-[#858590] mt-2 max-w-2xl">Transforme giro e estoque mínimo em uma lista objetiva do que comprar, quanto comprar e quanto capital será necessário.</p>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
          {[7,30,90].map(n=><button key={n} onClick={()=>setPeriodo(n)} className={"rounded-lg px-3 py-2 text-[10px] "+(periodo===n?"bg-purple-500/20 text-purple-200 border border-purple-500/25":"text-[#70707B] border border-transparent")}>{n} dias</button>)}
        </div>
      </div>
    </section>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <MetricCyber label="PARA REPOR" value={String(analise.length)} sub="produtos sugeridos"/>
      <MetricCyber label="ZERADOS" value={String(urgentes)} sub="prioridade urgente"/>
      <MetricCyber label="ABAIXO DO MÍNIMO" value={String(baixos)} sub="prioridade alta"/>
      <MetricCyber label="INVESTIMENTO EST." value={fmt(investimentoTotal)} sub="sugestão completa"/>
    </div>

    <Card>
      <div className="grid md:grid-cols-[1fr_220px_auto] gap-2">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto, SKU, marca ou fornecedor" className="pl-9"/></div>
        <select value={fornecedor} onChange={e=>setFornecedor(e.target.value)} className="rounded-lg bg-[#0F0F14] border border-[#2A2A34] px-3 py-2 text-xs">
          <option value="todos">Todos os fornecedores</option>
          <option value="sem">Sem fornecedor</option>
          {fornecedores.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
        <Button variant="ghost" onClick={exportarCSV}>Exportar CSV</Button>
      </div>
    </Card>

    {loading?<Card className="text-center py-12"><div className="text-xs text-[#666672]">Analisando giro e estoque...</div></Card>:
    !lista.length?<Card className="text-center py-12"><CheckCircle2 size={28} className="mx-auto text-green-300"/><div className="text-sm text-white mt-3">Nenhuma reposição sugerida.</div><div className="text-xs text-[#666672] mt-1">O estoque atual cobre a demanda calculada para este período.</div></Card>:
    <>
      <div className="flex items-center justify-between gap-3">
        <button onClick={toggleTodos} className="text-xs text-purple-300">{lista.every(p=>selecionados[p.id])?"Desmarcar todos":"Selecionar todos"}</button>
        <div className="text-[10px] text-[#666672]">{lista.length} produto(s) exibido(s)</div>
      </div>

      <div className="space-y-2">{lista.map(p=>{
        const marcado=!!selecionados[p.id];
        const cor=p.prioridade==="urgente"?"text-red-300 border-red-500/20 bg-red-500/[.025]":p.prioridade==="alta"?"text-amber-300 border-amber-500/20 bg-amber-500/[.025]":"text-cyan-300 border-cyan-500/15 bg-cyan-500/[.02]";
        return <Card key={p.id} className={"!p-0 overflow-hidden "+(marcado?"ring-1 ring-purple-500/30":"")}>
          <div className="p-4 grid md:grid-cols-[34px_1.45fr_repeat(5,.72fr)] gap-3 items-center">
            <button onClick={()=>setSelecionados({...selecionados,[p.id]:!marcado})} className={"w-6 h-6 rounded-md border flex items-center justify-center "+(marcado?"border-purple-400 bg-purple-500/20 text-purple-200":"border-white/15 text-transparent")}>{marcado&&<Check size={14}/>}</button>
            <div>
              <div className="text-sm text-white">{p.nome}</div>
              <div className="text-[10px] text-[#666672] mt-1">{p.fornecedor||"Fornecedor não informado"}{p.sku?` · SKU ${p.sku}`:""}</div>
              <span className={"inline-block mt-2 rounded-full border px-2 py-1 text-[8px] "+cor}>{p.prioridade==="urgente"?"URGENTE":p.prioridade==="alta"?"ALTA PRIORIDADE":"REPOSIÇÃO"}</span>
            </div>
            <div><div className="text-[8px] text-[#555560]">ESTOQUE</div><div className="font-mono text-sm mt-1">{p.quantidade}</div></div>
            <div><div className="text-[8px] text-[#555560]">MÍNIMO</div><div className="font-mono text-sm mt-1">{p.estoqueMinimo}</div></div>
            <div><div className="text-[8px] text-[#555560]">VENDIDO</div><div className="font-mono text-sm mt-1">{p.vendasPeriodo} un</div><div className="text-[8px] text-[#555560]">{periodo} dias</div></div>
            <div><div className="text-[8px] text-[#555560]">COMPRAR</div><Input inputMode="numeric" value={quantidades[p.id]??p.sugerido} onChange={e=>setQuantidades({...quantidades,[p.id]:e.target.value.replace(/\D/g,"")})} className="mt-1 !h-8 !py-1 font-mono"/></div>
            <div><div className="text-[8px] text-[#555560]">CUSTO EST.</div><div className="font-mono text-xs mt-1">{fmt(qtdEscolhida(p)*Number(p.custo||0))}</div><div className="text-[8px] text-[#555560]">{fmt(p.custo)}/un</div></div>
          </div>
        </Card>
      })}</div>

      <div className="sticky bottom-20 md:bottom-4 z-10 rounded-2xl border border-purple-500/25 bg-[#121218]/95 backdrop-blur-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,.45)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-6">
            <div><div className="text-[8px] tracking-[.15em] text-[#666672]">SELECIONADOS</div><div className="font-mono text-lg text-white">{marcados.length}</div></div>
            <div><div className="text-[8px] tracking-[.15em] text-[#666672]">UNIDADES</div><div className="font-mono text-lg text-white">{totalUn}</div></div>
            <div><div className="text-[8px] tracking-[.15em] text-[#666672]">TOTAL ESTIMADO</div><div className="font-mono text-lg text-green-300">{fmt(totalCompra)}</div></div>
          </div>
          <div className="flex gap-2"><Button variant="ghost" onClick={exportarCSV}>Gerar lista</Button><Button disabled={!marcados.length||recebendo} onClick={darEntrada}>{recebendo?"Registrando...":"Mercadoria recebida"}</Button></div>
        </div>
        <div className="text-[9px] text-[#5F5F69] mt-2">“Mercadoria recebida” dá entrada real no estoque usando as quantidades selecionadas.</div>
      </div>
    </>}

    <div className="rounded-xl border border-white/8 bg-white/[.012] p-4">
      <div className="text-[9px] tracking-[.18em] text-[#777783]">COMO A SUGESTÃO É CALCULADA</div>
      <div className="text-xs leading-5 text-[#777783] mt-2">O sistema converte as vendas do período em demanda mensal, adiciona uma margem de segurança de 25% e respeita pelo menos duas vezes o estoque mínimo. A quantidade sugerida é a diferença entre esse alvo e o saldo atual. Você pode alterar manualmente antes de comprar.</div>
    </div>
  </div>;
}

function EstoqueTab({ estoque, seminovos = [], onAtualizarSeminovo, onMovimentar, onAdd, onEdit, onRemove }) {
  const [secao,setSecao]=useState("produtos");
  const [mostrarForm,setMostrarForm]=useState(false);
  const vazio={nome:"",categoria:"acessorio",preco:"",custo:"",quantidade:"",estoqueMinimo:"2",sku:"",codigoBarras:"",marca:"",compatibilidade:"",fornecedor:""};
  const [form,setForm]=useState(vazio);
  const [busca,setBusca]=useState("");

  async function salvar(){
    if(!form.nome.trim()||form.preco==="")return;
    await onAdd({...form,nome:form.nome.trim()});
    setForm(vazio);setMostrarForm(false);
  }

  const q=busca.toLowerCase();
  const lista=estoque.filter(p=>!q||[p.nome,p.sku,p.codigoBarras,p.marca,p.compatibilidade,p.fornecedor].some(v=>String(v||"").toLowerCase().includes(q)));
  const baixos=estoque.filter(p=>p.quantidade<=p.estoqueMinimo);
  const valorEstoque=estoque.reduce((a,p)=>a+(Number(p.custo)||0)*(Number(p.quantidade)||0),0);
  const semiLista=seminovos.filter(x=>!q||[x.marca,x.modelo,x.armazenamento,x.cor,x.imei,x.serial].some(v=>String(v||"").toLowerCase().includes(q)));

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[.015] p-1">
      <button onClick={()=>setSecao("produtos")} className={"rounded-lg py-2.5 text-xs border transition "+(secao==="produtos"?"border-purple-500/30 bg-purple-500/10 text-white":"border-transparent text-[#777783]")}>Produtos / Peças <span className="ml-1 text-[9px] font-mono">{estoque.length}</span></button>
      <button onClick={()=>setSecao("seminovos")} className={"rounded-lg py-2.5 text-xs border transition "+(secao==="seminovos"?"border-cyan-400/30 bg-cyan-400/[.06] text-white":"border-transparent text-[#777783]")}>Seminovos <span className="ml-1 text-[9px] font-mono">{seminovos.length}</span></button>
    </div>

    <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input placeholder={secao==="seminovos"?"Buscar modelo, IMEI ou serial":"Buscar nome, SKU, código de barras ou compatibilidade"} value={busca} onChange={e=>setBusca(e.target.value)} className="pl-9"/></div>

    {secao==="produtos"&&<>
      <div className="grid grid-cols-3 gap-2">
        <MetricCyber label="ITENS CADASTRADOS" value={String(estoque.length)} sub="produtos + peças"/>
        <MetricCyber label="ESTOQUE BAIXO" value={String(baixos.length)} sub="abaixo do mínimo"/>
        <MetricCyber label="CAPITAL EM ESTOQUE" value={fmt(valorEstoque)} sub="custo atual"/>
      </div>

      <div className="flex justify-end"><Button onClick={()=>setMostrarForm(!mostrarForm)} className="px-3"><Plus size={18}/></Button></div>

      {mostrarForm&&<Card>
        <div className="flex items-center justify-between mb-4"><div><div className="text-[9px] tracking-[.22em] text-purple-300">CADASTRO PROFISSIONAL</div><div className="text-xs text-[#696974] mt-1">Produto ou peça técnica</div></div><button onClick={()=>setMostrarForm(false)} className="text-[#666672]">×</button></div>
        <Label>Nome</Label><Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Capa Transparente iPhone 12" className="mb-3"/>
        <div className="grid grid-cols-2 gap-2 mb-3">{[{id:"acessorio",label:"Produto / Acessório"},{id:"peca",label:"Peça técnica"}].map(c=><button key={c.id} onClick={()=>setForm({...form,categoria:c.id})} className={"rounded-lg py-2 text-xs border "+(form.categoria===c.id?"border-purple-500 text-purple-300 bg-purple-500/10":"border-[#2A2A34] text-[#8A8A96]")}>{c.label}</button>)}</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>SKU / Código interno</Label><Input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Ex: CAP-IP12-TR"/></div>
          <div><Label>Código de barras</Label><Input value={form.codigoBarras} onChange={e=>setForm({...form,codigoBarras:e.target.value})} placeholder="Leitor ou digitação"/></div>
          <div><Label>Marca</Label><Input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} placeholder="Ex: H'maston"/></div>
          <div><Label>Compatibilidade / Modelo</Label><Input value={form.compatibilidade} onChange={e=>setForm({...form,compatibilidade:e.target.value})} placeholder="Ex: iPhone 12 / 12 Pro"/></div>
          <div><Label>Fornecedor</Label><Input value={form.fornecedor} onChange={e=>setForm({...form,fornecedor:e.target.value})} placeholder="Opcional"/></div>
          <div><Label>Estoque mínimo</Label><Input inputMode="numeric" value={form.estoqueMinimo} onChange={e=>setForm({...form,estoqueMinimo:e.target.value})}/></div>
          <div><Label>Preço de custo</Label><Input inputMode="decimal" value={form.custo} onChange={e=>setForm({...form,custo:e.target.value.replace(",",".")})}/></div>
          <div><Label>Preço de venda</Label><Input inputMode="decimal" value={form.preco} onChange={e=>setForm({...form,preco:e.target.value.replace(",",".")})}/></div>
          <div className="md:col-span-2"><Label>Quantidade inicial</Label><Input inputMode="numeric" value={form.quantidade} onChange={e=>setForm({...form,quantidade:e.target.value})}/><div className="text-[9px] text-[#5F5F69] mt-1">Após o cadastro, novas entradas serão registradas como movimentações, não como simples edição de saldo.</div></div>
        </div>
        <Button className="w-full mt-4" onClick={salvar}>Cadastrar produto</Button>
      </Card>}

      {lista.length===0?<Card className="text-center py-10"><Package className="mx-auto mb-3 text-[#5A5A64]" size={26}/><div className="text-sm text-[#8A8A96]">Nenhum produto cadastrado</div></Card>:
      <div className="space-y-2">{lista.map(p=><ProdutoCard key={p.id} p={p} onEdit={onEdit} onRemove={onRemove} onMovimentar={onMovimentar}/>)}</div>}
    </>}

    {secao==="seminovos"&&<>{semiLista.length===0?<Card className="text-center py-12"><Smartphone className="mx-auto mb-3 text-[#5A5A64]" size={28}/><div className="text-sm text-[#8A8A96]">Nenhum seminovo adquirido</div></Card>:<div className="grid md:grid-cols-2 gap-3">{semiLista.map(item=><SeminovoCard key={item.id} item={item} onAtualizar={onAtualizarSeminovo}/>)}</div>}</>}
  </div>;
}

function SeminovoCard({ item, onAtualizar }) {
  const [aberto,setAberto]=useState(false);
  const [precoVenda,setPrecoVenda]=useState(String(item?.dados?.pdv?.precoVenda || ""));
  const [salvandoPreco,setSalvandoPreco]=useState(false);
  const dados=item.dados||{};
  const falhas=dados.falhas||[];
  const testes=dados.testes||{};
  const inspecao=dados.inspecao||{};
  const aq=dados.aquisicao||{};
  const statusLabel=item.status==="disponivel"?"Disponível":item.status==="vendido"?"Vendido":"Em preparação";
  const statusCls=item.status==="disponivel"?"text-green-400 border-green-500/25 bg-green-500/[.04]":item.status==="vendido"?"text-[#777783] border-white/10 bg-white/[.02]":"text-amber-300 border-amber-400/25 bg-amber-400/[.035]";
  const custoTotal=(Number(item.custo_aquisicao)||0)+(Number(item.custo_reparos_previsto)||0);
  const scoreEstetico=Number(inspecao.esteticaGeral ?? inspecao.estetica ?? inspecao.notaEstetica ?? 0);
  const testeEntries=Object.entries(testes).filter(([k])=>!["score","funcional","testados","falhas"].includes(k));
  const okCount=testeEntries.filter(([,v])=>v==="ok").length;
  const falhaCount=testeEntries.filter(([,v])=>v==="falha").length;

  return <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-b from-cyan-400/[.035] to-transparent overflow-hidden">
    <button className="w-full text-left p-4" onClick={()=>setAberto(!aberto)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] tracking-[.22em] text-cyan-300">SEMINOVO // {String(item.id||"").slice(0,8).toUpperCase()}</div>
          <div className="text-base text-white mt-1">{item.marca} {item.modelo}</div>
          <div className="text-xs text-[#6F6F7A] mt-1">{item.armazenamento || "—"} · {item.cor || "—"}</div>
        </div>
        <span className={"rounded-full border px-2.5 py-1 text-[9px] "+statusCls}>{statusLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="rounded-lg border border-white/8 p-2"><div className="text-[8px] text-[#656570]">CUSTO AQUISIÇÃO</div><div className="font-mono text-sm mt-1">{fmt(item.custo_aquisicao)}</div></div>
        <div className="rounded-lg border border-white/8 p-2"><div className="text-[8px] text-[#656570]">CUSTO TOTAL</div><div className="font-mono text-sm mt-1">{fmt(custoTotal)}</div></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-[#64646F]">
        <span>{falhaCount ? `${falhaCount} falha(s)` : "Sem falhas funcionais"}</span>
        <span>{aberto?"Fechar ficha ↑":"Abrir ficha completa ↓"}</span>
      </div>
    </button>

    {aberto && <div className="border-t border-white/8 bg-black/20 p-4 space-y-5">
      <div className="grid md:grid-cols-4 gap-2">
        <MetricCyber label="AQUISIÇÃO" value={fmt(item.custo_aquisicao)} sub="valor pago"/>
        <MetricCyber label="REPAROS PREVISTOS" value={fmt(item.custo_reparos_previsto)} sub={falhas.length?`${falhas.length} falha(s)`:"sem reparos"}/>
        <MetricCyber label="CUSTO PROJETADO" value={fmt(custoTotal)} sub="aquisição + reparos"/>
        <MetricCyber label="BATERIA" value={item.bateria ? `${item.bateria}%` : "—"} sub="saúde registrada"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-[9px] tracking-[.22em] text-cyan-300 mb-3">IDENTIFICAÇÃO</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Marca / Modelo</span><span>{item.marca} {item.modelo}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Armazenamento</span><span>{item.armazenamento||"—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Cor</span><span>{item.cor||"—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">IMEI</span><span className="font-mono text-right break-all">{item.imei||"—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Serial</span><span className="font-mono text-right break-all">{item.serial||"—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Avaliação</span><span className="font-mono">{String(item.avaliacao_id||"").slice(0,8)}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-[9px] tracking-[.22em] text-purple-300 mb-3">DIAGNÓSTICO</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/8 p-2 text-center"><div className="text-[8px] text-[#656570]">ESTÉTICA</div><div className="font-mono text-sm mt-1">{scoreEstetico?`${scoreEstetico}%`:"—"}</div></div>
            <div className="rounded-lg border border-white/8 p-2 text-center"><div className="text-[8px] text-[#656570]">TESTES OK</div><div className="font-mono text-sm mt-1 text-green-300">{okCount}</div></div>
            <div className="rounded-lg border border-white/8 p-2 text-center"><div className="text-[8px] text-[#656570]">FALHAS</div><div className="font-mono text-sm mt-1 text-red-300">{falhaCount}</div></div>
          </div>
          <div className="text-[10px] text-[#666672] mt-3">Avarias registradas</div>
          <div className="text-xs text-[#A0A0AA] mt-1">{inspecao.avarias || inspecao.observacoes || "Nenhuma observação estética registrada."}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-[9px] tracking-[.22em] text-[#9A9AA5]">TESTE FUNCIONAL</div>
          <div className="text-[9px] font-mono text-[#5F5F69]">{testeEntries.length} ITENS</div>
        </div>
        {!testeEntries.length ? <div className="text-xs text-[#666672]">Nenhum teste funcional detalhado disponível.</div> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {testeEntries.map(([k,v])=><div key={k} className={"rounded-lg border px-3 py-2 flex items-center justify-between gap-2 "+(v==="falha"?"border-red-500/20 bg-red-500/[.03]":v==="ok"?"border-green-500/20 bg-green-500/[.03]":"border-white/8 bg-white/[.01]")}>
            <span className="text-[10px] text-[#A0A0AA]">{String(k).replaceAll("_"," ")}</span>
            <span className={"text-[9px] font-mono uppercase "+(v==="falha"?"text-red-300":v==="ok"?"text-green-300":"text-[#777783]")}>{String(v)}</span>
          </div>)}
        </div>}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[.025] p-4">
          <div className="text-[9px] tracking-[.22em] text-amber-300 mb-3">PREPARAÇÃO / REPAROS</div>
          {falhas.length ? <div className="space-y-2">{falhas.map((f,i)=><div key={i} className="rounded-lg border border-white/8 px-3 py-2 text-xs flex justify-between gap-2"><span>{String(f).replaceAll("_"," ")}</span><span className="text-amber-300">Pendente</span></div>)}</div> :
          <div className="text-xs text-green-300">Nenhuma falha funcional. Aparelho elegível para venda.</div>}
          <div className="mt-3 pt-3 border-t border-white/8 flex justify-between text-xs"><span className="text-[#6F6F7A]">Custo previsto</span><span className="font-mono">{fmt(item.custo_reparos_previsto)}</span></div>
        </div>

        <div className="rounded-xl border border-purple-500/15 bg-purple-500/[.025] p-4">
          <div className="text-[9px] tracking-[.22em] text-purple-300 mb-3">AQUISIÇÃO</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Valor pago</span><span className="font-mono">{fmt(item.custo_aquisicao)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Forma de pagamento</span><span>{aq.formaPagamento || aq.forma || "—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Registro</span><span className="font-mono">{aq.registroAquisicao || "—"}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#6F6F7A]">Data</span><span>{aq.compradoEm ? new Date(aq.compradoEm).toLocaleString("pt-BR") : "—"}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.025] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-[9px] tracking-[.22em] text-cyan-300">PRÓXIMA ETAPA</div>
          <div className="text-xs text-[#777783] mt-1">{item.status==="disponivel"?"Aparelho disponível. Defina o preço para liberá-lo no PDV.":"Finalize a preparação antes de disponibilizar para venda."}</div>
        </div>
        {item.status==="disponivel" ? <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input inputMode="decimal" placeholder="Preço de venda" value={precoVenda} onChange={(e)=>setPrecoVenda(e.target.value.replace(",","."))} className="sm:w-36"/>
          <button type="button" disabled={salvandoPreco || !(Number(precoVenda)>0)} onClick={async()=>{setSalvandoPreco(true);const dados={...(item.dados||{}),pdv:{...(item.dados?.pdv||{}),precoVenda:Number(precoVenda),enviadoEm:new Date().toISOString()}};const ok=await onAtualizar(item.id,{dados});setSalvandoPreco(false);if(ok)alert("Seminovo liberado no PDV.");}} className="rounded-lg border border-cyan-400/25 bg-cyan-400/[.05] px-4 py-2 text-[10px] text-cyan-300 disabled:opacity-40">
            {salvandoPreco?"SALVANDO...":item?.dados?.pdv?.precoVenda?"ATUALIZAR PREÇO NO PDV":"ENVIAR AO PDV"}
          </button>
        </div> : <div className="text-[10px] text-[#5A5A64]">{item.status==="vendido"?"Venda concluída — item bloqueado para nova venda.":"Finalize a preparação antes de enviar ao PDV."}</div>}
      </div>
    </div>}
  </div>;
}

function ProdutoCard({ p, onEdit, onRemove, onMovimentar }) {
  const [aberto,setAberto]=useState(false);
  const [movTipo,setMovTipo]=useState("entrada");
  const [movQtd,setMovQtd]=useState("1");
  const [movObs,setMovObs]=useState("");
  const [historico,setHistorico]=useState([]);
  const [loadingHist,setLoadingHist]=useState(false);
  const [editando,setEditando]=useState(false);
  const [ed,setEd]=useState({...p});

  async function carregarHistorico(){
    setLoadingHist(true);
    try{const rows=await sb(`estoque_historico?select=*&estoque_id=eq.${p.id}&order=created_at.desc&limit=12`);setHistorico(rows||[]);}catch(e){setHistorico([]);}
    setLoadingHist(false);
  }
  useEffect(()=>{if(aberto)carregarHistorico();},[aberto,p.quantidade]);

  async function mover(){
    const ok=await onMovimentar(p.id,{tipo:movTipo,quantidade:Number(movQtd),origem:"manual",observacao:movObs});
    if(ok){setMovQtd("1");setMovObs("");await carregarHistorico();}
  }
  async function salvarEd(){
    await onEdit(p.id,{nome:ed.nome,categoria:ed.categoria,sku:ed.sku,codigoBarras:ed.codigoBarras,marca:ed.marca,compatibilidade:ed.compatibilidade,fornecedor:ed.fornecedor,preco:Number(ed.preco),custo:Number(ed.custo),estoqueMinimo:Number(ed.estoqueMinimo)});
    setEditando(false);
  }

  return <Card>
    <button className="w-full flex items-start justify-between gap-3" onClick={()=>setAberto(!aberto)}>
      <div className="text-left">
        <div className="text-sm text-[#E5E5EA]">{p.nome}</div>
        <div className="text-[10px] text-[#6E6E78] mt-1">{p.sku?`SKU ${p.sku} · `:""}{p.compatibilidade|| (p.categoria==="acessorio"?"Acessório":"Peça técnica")}</div>
        <div className="text-xs text-[#8A8A96] mt-1">{fmt(p.preco)} <span className="text-[#555560]">· custo {fmt(p.custo)}</span></div>
      </div>
      <div className="flex items-center gap-3"><EstoqueBadge item={p}/>{aberto?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</div>
    </button>

    {aberto&&<div className="mt-4 pt-4 border-t border-[#2A2A34] space-y-4">
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/8 p-2"><div className="text-[8px] text-[#5F5F69]">SALDO</div><div className="font-mono text-lg mt-1">{p.quantidade}</div></div>
        <div className="rounded-lg border border-white/8 p-2"><div className="text-[8px] text-[#5F5F69]">VALOR EM ESTOQUE</div><div className="font-mono text-sm mt-1">{fmt(p.custo*p.quantidade)}</div></div>
        <div className="rounded-lg border border-white/8 p-2"><div className="text-[8px] text-[#5F5F69]">MARGEM UNITÁRIA</div><div className="font-mono text-sm mt-1">{p.preco>0?`${(((p.preco-p.custo)/p.preco)*100).toFixed(1)}%`:"—"}</div></div>
      </div>

      <div className="rounded-xl border border-purple-500/15 bg-purple-500/[.025] p-3">
        <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">MOVIMENTAR ESTOQUE</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <select value={movTipo} onChange={e=>setMovTipo(e.target.value)} className="rounded-lg bg-[#111118] border border-[#2A2A34] px-3 py-2 text-xs">
            <option value="entrada">Entrada de mercadoria</option><option value="ajuste_positivo">Ajuste positivo</option><option value="ajuste_negativo">Ajuste negativo</option><option value="perda">Perda / avaria</option><option value="devolucao">Devolução</option>
          </select>
          <Input inputMode="numeric" value={movQtd} onChange={e=>setMovQtd(e.target.value)} placeholder="Quantidade"/>
          <Input value={movObs} onChange={e=>setMovObs(e.target.value)} placeholder="Observação"/>
        </div>
        <Button className="w-full mt-2" disabled={!(Number(movQtd)>0)} onClick={mover}>Registrar movimentação</Button>
      </div>

      <div className="flex items-center justify-between"><div className="text-[9px] tracking-[.2em] text-[#8A8A96]">DADOS DO PRODUTO</div><button onClick={()=>{setEd({...p});setEditando(!editando)}} className="text-[10px] text-cyan-300">{editando?"Cancelar":"Editar cadastro"}</button></div>
      {editando?<div className="grid sm:grid-cols-2 gap-2">
        <Input value={ed.nome||""} onChange={e=>setEd({...ed,nome:e.target.value})} placeholder="Nome"/>
        <Input value={ed.sku||""} onChange={e=>setEd({...ed,sku:e.target.value})} placeholder="SKU"/>
        <Input value={ed.codigoBarras||""} onChange={e=>setEd({...ed,codigoBarras:e.target.value})} placeholder="Código de barras"/>
        <Input value={ed.marca||""} onChange={e=>setEd({...ed,marca:e.target.value})} placeholder="Marca"/>
        <Input value={ed.compatibilidade||""} onChange={e=>setEd({...ed,compatibilidade:e.target.value})} placeholder="Compatibilidade"/>
        <Input value={ed.fornecedor||""} onChange={e=>setEd({...ed,fornecedor:e.target.value})} placeholder="Fornecedor"/>
        <Input inputMode="decimal" value={ed.custo??""} onChange={e=>setEd({...ed,custo:e.target.value})} placeholder="Custo"/>
        <Input inputMode="decimal" value={ed.preco??""} onChange={e=>setEd({...ed,preco:e.target.value})} placeholder="Preço"/>
        <Input inputMode="numeric" value={ed.estoqueMinimo??""} onChange={e=>setEd({...ed,estoqueMinimo:e.target.value})} placeholder="Estoque mínimo"/>
        <Button onClick={salvarEd}>Salvar alterações</Button>
      </div>:<div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-[#7A7A85]">
        <div>SKU: <span className="text-[#C9C9D2]">{p.sku||"—"}</span></div><div>Cód. barras: <span className="text-[#C9C9D2]">{p.codigoBarras||"—"}</span></div>
        <div>Marca: <span className="text-[#C9C9D2]">{p.marca||"—"}</span></div><div>Compatibilidade: <span className="text-[#C9C9D2]">{p.compatibilidade||"—"}</span></div>
        <div>Fornecedor: <span className="text-[#C9C9D2]">{p.fornecedor||"—"}</span></div><div>Estoque mínimo: <span className="text-[#C9C9D2]">{p.estoqueMinimo}</span></div>
      </div>}

      <div>
        <div className="flex items-center justify-between mb-2"><div className="text-[9px] tracking-[.2em] text-[#8A8A96]">HISTÓRICO RECENTE</div><button onClick={carregarHistorico} className="text-[9px] text-cyan-300">Atualizar</button></div>
        {loadingHist?<div className="text-xs text-[#5F5F69]">Carregando...</div>:!historico.length?<div className="text-xs text-[#5F5F69]">Nenhuma movimentação registrada ainda.</div>:<div className="space-y-1">{historico.map(h=><div key={h.id} className="rounded-lg border border-white/6 px-3 py-2 flex justify-between gap-3 text-[10px]"><div><span className="uppercase text-[#A0A0AA]">{String(h.tipo).replaceAll("_"," ")}</span><div className="text-[#555560]">{new Date(h.created_at).toLocaleString("pt-BR")}{h.observacao?` · ${h.observacao}`:""}</div></div><div className="font-mono text-right"><div>{["entrada","ajuste_positivo","devolucao"].includes(h.tipo)?"+":"-"}{h.quantidade}</div><div className="text-[#555560]">{h.quantidade_anterior} → {h.quantidade_posterior}</div></div></div>)}</div>}
      </div>

      <Button variant="danger" className="w-full" onClick={()=>onRemove(p.id)}><span className="flex items-center justify-center gap-2"><Trash2 size={14}/> Remover produto</span></Button>
    </div>}
  </Card>;
}

/* ================= OS: LISTA ================= */

const AVAL_STEPS = [
  { id: "identificar", label: "IDENTIFICAR" },
  { id: "inspecionar", label: "INSPECIONAR" },
  { id: "testar", label: "TESTAR" },
  { id: "precificar", label: "PRECIFICAR" },
  { id: "oferta", label: "OFERTA" },
  { id: "aquisicao", label: "AQUISIÇÃO" },
];
const TESTES_USADO = [
  "Tela / Display", "Touch", "Face ID / Touch ID", "Câmera frontal", "Câmeras traseiras",
  "Microfone", "Alto-falantes", "Conector de carga", "Wi-Fi", "Bluetooth", "Botões",
  "Bateria", "Sensores", "Chip / Rede", "IMEI / Serial",
];
function clamp(n, min, max) { return Math.max(min, Math.min(max, Number(n) || 0)); }

function calcEnigmaScore(draft) {
  if (!draft) return null;
  const scanner = draft?.inspecao?.scanner || {};
  const estVals = Object.values(scanner).map(x => Number(x?.score)).filter(Number.isFinite);
  const vals = Object.values(draft?.testes || {});
  const tested = vals.filter(v => v !== "nao_testado").length;
  const oks = vals.filter(v => v === "ok").length;
  const bateriaRaw = draft?.aparelho?.bateria;
  const bateriaInformada = bateriaRaw !== "" && bateriaRaw !== null && bateriaRaw !== undefined;
  const parts = [];
  if (estVals.length) parts.push({v: estVals.reduce((a,b)=>a+b,0)/estVals.length, w:.35});
  if (tested) parts.push({v:(oks/tested)*100, w:.45});
  if (bateriaInformada) parts.push({v:clamp(bateriaRaw,0,100), w:.20});
  if (!parts.length) return null;
  const totalW = parts.reduce((a,b)=>a+b.w,0);
  const base = parts.reduce((a,b)=>a+b.v*b.w,0)/totalW;
  const falhas = vals.filter(v=>v==="falha").length;
  return Math.round(clamp(base - Math.min(30,falhas*4),0,100));
}
function ofertaClassificacao(valor, compraMax) {
  const v = Number(valor) || 0;
  const m = Number(compraMax) || 0;
  if (!v || !m) return { label: "AGUARDANDO OFERTA", cls: "text-[#777783]", bg: "border-white/10 bg-white/[.02]" };
  const r = v / m;
  if (r <= 0.85) return { label: "EXCELENTE COMPRA", cls: "text-green-400", bg: "border-green-500/25 bg-green-500/[.055]" };
  if (r <= 1) return { label: "COMPRA SEGURA", cls: "text-cyan-300", bg: "border-cyan-400/25 bg-cyan-400/[.045]" };
  if (r <= 1.10) return { label: "MARGEM REDUZIDA", cls: "text-amber-300", bg: "border-amber-400/25 bg-amber-400/[.045]" };
  return { label: "NÃO RECOMENDADO", cls: "text-red-400", bg: "border-red-500/25 bg-red-500/[.05]" };
}
function imprimirTermoAquisicao(draft, calc) {
  const v = draft?.vendedor || {};
  const a = draft?.aparelho || {};
  const aq = draft?.aquisicao || {};
  const ins = draft?.inspecao || {};
  const numero = draft?.id ? String(draft.id).slice(0,8).toUpperCase() : ("TEMP-"+Date.now().toString().slice(-8));
  const valor = Number(aq.valorFechado || draft?.oferta?.valorFinal || draft?.oferta?.valorOfertado || 0);
  const moeda = (n) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Termo de Aquisição ${numero}</title>
  <style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;line-height:1.45;font-size:13px}
  h1{font-size:20px;margin:0 0 4px} h2{font-size:14px;margin:22px 0 8px;border-bottom:1px solid #bbb;padding-bottom:4px}
  .muted{color:#666}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}.box{border:1px solid #bbb;border-radius:8px;padding:12px;margin-top:10px}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px}.line{border-top:1px solid #111;padding-top:6px;text-align:center}
  ${enigmaPrintCss()}
  @media print{body{margin:16mm}}
  </style></head><body>
  ${enigmaPrintHeader("Termo de aquisição de aparelho usado",`Registro ${numero}`)}
  <div class="muted">Emitido em ${new Date().toLocaleString("pt-BR")}</div>

  <h2>1. Identificação do vendedor</h2>
  <div class="grid">
    <div><b>Nome:</b> ${v.nome || "________________________________"}</div>
    <div><b>CPF:</b> ${v.cpf || "________________"}</div>
    <div><b>Telefone:</b> ${v.telefone || "________________"}</div>
    <div><b>Endereço:</b> ${v.endereco || "________________________________"}</div>
  </div>

  <h2>2. Identificação do aparelho</h2>
  <div class="grid">
    <div><b>Marca/Modelo:</b> ${(a.marca||"")} ${(a.modelo||"")}</div>
    <div><b>Cor/Armazenamento:</b> ${(a.cor||"")} ${(a.armazenamento||"")}</div>
    <div><b>IMEI:</b> ${a.imei || "________________"}</div>
    <div><b>Nº de série:</b> ${a.serial || "________________"}</div>
    <div><b>Saúde da bateria:</b> ${a.bateria ? a.bateria+"%" : "—"}</div>
    <div><b>Conta vinculada removida:</b> ${a.contaRemovida ? "Sim" : "Não informado"}</div>
  </div>

  <h2>3. Estado e avaliação</h2>
  <div class="box">
    <b>Estado estético:</b> ${ins.estetica ?? "—"}%<br/>
    <b>Avarias observadas:</b> ${ins.avarias || "Nenhuma informada."}<br/>
    <b>Observações:</b> ${ins.observacoes || "Sem observações adicionais."}<br/>
    <b>ENIGMA SCORE:</b> ${calc.score == null ? "Não calculado" : calc.score+"/100"}<br/>
    <b>Referência média de mercado:</b> ${calc.mercadoMedioFmt}<br/>
    <b>Limite recomendado de compra:</b> ${calc.compraMaxFmt}
  </div>

  <h2>4. Condições da aquisição</h2>
  <div class="grid">
    <div><b>Valor pago:</b> ${moeda(valor)}</div>
    <div><b>Forma de pagamento:</b> ${aq.formaPagamento || "________________"}</div>
  </div>

  <h2>5. Declarações do vendedor</h2>
  <div class="box">
  O vendedor declara, sob sua responsabilidade, ser o legítimo proprietário do aparelho acima identificado, possuir poderes para aliená-lo e que o bem possui procedência lícita, não sendo produto de furto, roubo, apropriação indevida ou qualquer outra origem ilícita. Declara ainda que as informações fornecidas são verdadeiras e completas e que informou, de boa-fé, os defeitos, bloqueios, restrições, reparos anteriores e demais condições relevantes de que tenha conhecimento. O vendedor autoriza a ENIGMA a registrar os dados desta aquisição para fins de comprovação de procedência, controle interno e eventual atendimento de obrigação legal.
  </div>

  <h2>6. Ciência sobre a inspeção</h2>
  <div class="box">
  O aparelho foi recebido e avaliado no estado descrito neste termo e nos registros vinculados à avaliação. A aquisição ocorre pelo valor e condições acima, após inspeção visual e funcional compatível com o procedimento interno da ENIGMA.
  </div>

  <div class="sign">
    <div class="line">VENDEDOR<br/>${v.nome || "Nome e assinatura"}</div>
    <div class="line">ENIGMA<br/>Responsável pelo recebimento</div>
  </div>

  <p style="margin-top:45px;font-size:10px;color:#666">Modelo operacional gerado pelo ENIGMA OS. Recomenda-se validação jurídica profissional antes da adoção definitiva em operação comercial.</p>
  ${enigmaPrintFooter()}
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Permita pop-ups para imprimir o termo."); return; }
  w.document.open(); w.document.write(html); w.document.close();
}


const SCANNER_PARTES = [
  { id:"tela", label:"Tela", icon:"▣", peso:.28 },
  { id:"carcaca", label:"Carcaça / Laterais", icon:"◫", peso:.24 },
  { id:"traseira", label:"Traseira", icon:"◇", peso:.18 },
  { id:"lentes", label:"Lentes / Câmeras", icon:"◎", peso:.18 },
  { id:"botoes", label:"Botões / Conectores", icon:"⌁", peso:.12 },
];
const ESTADOS_ESTETICA = [
  { id:"excelente", label:"Excelente", score:98, desc:"Praticamente sem marcas de uso.", impacto:0 },
  { id:"muito_bom", label:"Muito bom", score:88, desc:"Marcas leves, sem comprometer apresentação.", impacto:2 },
  { id:"bom", label:"Bom", score:76, desc:"Sinais normais de uso visíveis.", impacto:5 },
  { id:"regular", label:"Regular", score:60, desc:"Riscos ou marcas relevantes.", impacto:10 },
  { id:"ruim", label:"Ruim", score:40, desc:"Desgaste forte ou dano estético.", impacto:18 },
  { id:"muito_danificado", label:"Muito danificado", score:20, desc:"Danos severos, exige intervenção.", impacto:28 },
];
function calcEsteticaScanner(scanner) {
  const items = SCANNER_PARTES.map(p => ({...p, dado:scanner?.[p.id]})).filter(x => Number.isFinite(Number(x.dado?.score)));
  if (!items.length) return null;
  const w = items.reduce((a,b)=>a+b.peso,0);
  return Math.round(items.reduce((a,b)=>a+Number(b.dado.score)*b.peso,0)/w);
}
function calcImpactoScanner(scanner, mercadoMedio) {
  if (!mercadoMedio) return 0;
  return SCANNER_PARTES.reduce((total,p)=>{
    const d=scanner?.[p.id];
    const estado=ESTADOS_ESTETICA.find(e=>e.id===d?.estado);
    return total + (estado ? mercadoMedio*(estado.impacto/100)*p.peso : 0);
  },0);
}


const FALHA_PECAS = {
  "Tela / Display": ["tela","display"],
  "Touch": ["touch","tela"],
  "Face ID / Touch ID": ["face id","touch id","biometria"],
  "Câmera frontal": ["camera frontal","câmera frontal"],
  "Câmeras traseiras": ["camera traseira","câmera traseira","camera principal","câmera principal"],
  "Microfone": ["microfone"],
  "Alto-falantes": ["alto falante","alto-falante","speaker"],
  "Conector de carga": ["conector","dock","carga"],
  "Wi-Fi": ["wifi","wi-fi","antena wifi","antena wi-fi"],
  "Bluetooth": ["bluetooth","antena bluetooth"],
  "Botões": ["botao","botão","flex botao","flex botão"],
  "Bateria": ["bateria"],
  "Sensores": ["sensor"],
  "Chip / Rede": ["antena","rede","chip"],
  "IMEI / Serial": ["placa","imei","serial"],
};
function normTxt(v) {
  return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function pecasCompativeisParaFalha(falha, aparelho, estoque) {
  const modelo = normTxt(aparelho?.modelo);
  const termos = (FALHA_PECAS[falha] || [falha]).map(normTxt);
  return (estoque || []).filter(p => {
    if (p.categoria !== "peca") return false;
    const nome = normTxt(p.nome);
    const bateFalha = termos.some(t => nome.includes(t));
    const bateModelo = !modelo || nome.includes(modelo);
    return bateFalha && bateModelo;
  }).sort((a,b)=>(Number(a.custo)||0)-(Number(b.custo)||0));
}
function somaCustosFalhas(falhas, aparelho, estoque, precificacao) {
  const selecionadas = precificacao?.pecasSelecionadas || {};
  const manuais = precificacao?.reparosManuais || {};
  return falhas.reduce((acc,falha)=>{
    const matches = pecasCompativeisParaFalha(falha, aparelho, estoque);
    const sel = selecionadas[falha];
    if (sel === "manual" || (!sel && !matches.length)) return acc + (Number(manuais[falha])||0);
    const item = matches.find(x=>String(x.id)===String(sel)) || matches[0];
    return acc + (Number(item?.custo)||0);
  },0);
}


function eventoNegociacao(tipo, valor, detalhe="") {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, tipo, valor:Number(valor)||0, detalhe:String(detalhe||""), em:new Date().toISOString() };
}
function labelEventoNegociacao(ev) {
  const map={oferta_enigma:"ENIGMA",contraproposta:"VENDEDOR",aceite:"ACEITO",recusa:"RECUSADO",reabertura:"REABERTO"};
  return map[ev?.tipo] || String(ev?.tipo||"EVENTO").toUpperCase();
}

function AvaliacaoUsadosTab({ avaliacoes, estoque, onSalvar, onRegistrarCompra }) {
  const [view, setView] = useState("lista");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketRef, setMarketRef] = useState(null);
  const [marketMsg, setMarketMsg] = useState("");


  useEffect(() => {
    if (!draft || view !== "form") return;
    const marca = (draft.aparelho?.marca || "").trim();
    const modelo = (draft.aparelho?.modelo || "").trim();
    const armazenamento = (draft.aparelho?.armazenamento || "").trim();
    if (!marca || !modelo) { setMarketRef(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setMarketLoading(true); setMarketMsg("");
      try {
        const qMarca = encodeURIComponent(`*${marca}*`);
        const qModelo = encodeURIComponent(`*${modelo}*`);
        let url = `referencias_mercado?select=*&marca=ilike.${qMarca}&modelo=ilike.${qModelo}&order=updated_at.desc&limit=5`;
        const rows = await sb(url);
        if (cancelled) return;
        const match = (rows || []).find(r => !armazenamento || normTxt(r.armazenamento) === normTxt(armazenamento)) || (rows || [])[0];
        setMarketRef(match || null);
        if (match) {
          setDraft(d => {
            if (!d) return d;
            const atual = d.precificacao || {};
            if (atual.referenciaId === match.id && atual.mercadoMin && atual.mercadoMax) return d;
            return {...d, precificacao:{...atual, mercadoMin:Number(match.mercado_min)||"", mercadoMax:Number(match.mercado_max)||"", referenciaId:match.id, referenciaFonte:match.fonte||"Base ENIGMA"}};
          });
          setMarketMsg("Referência encontrada automaticamente na base ENIGMA.");
        } else {
          setMarketMsg("Sem referência salva para este modelo. Informe a faixa uma vez e salve para as próximas avaliações.");
        }
      } catch (e) {
        setMarketRef(null);
        setMarketMsg("Base de mercado indisponível. Você ainda pode informar a faixa manualmente.");
      } finally { if (!cancelled) setMarketLoading(false); }
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [view, draft?.aparelho?.marca, draft?.aparelho?.modelo, draft?.aparelho?.armazenamento]);

  async function salvarReferenciaMercado() {
    const marca=(draft?.aparelho?.marca||"").trim(), modelo=(draft?.aparelho?.modelo||"").trim(), armazenamento=(draft?.aparelho?.armazenamento||"").trim();
    const min=Number(draft?.precificacao?.mercadoMin)||0, max=Number(draft?.precificacao?.mercadoMax)||0;
    if (!marca || !modelo || !min || !max) { alert("Informe marca, modelo e faixa de mercado."); return; }
    setMarketLoading(true);
    try {
      const body={marca,modelo,armazenamento,mercado_min:min,mercado_max:max,fonte:"Base ENIGMA",updated_at:new Date().toISOString()};
      let saved;
      if (marketRef?.id) {
        const rows=await sb(`referencias_mercado?id=eq.${marketRef.id}`,{method:"PATCH",body:JSON.stringify(body)});
        saved=rows?.[0]||{...marketRef,...body};
      } else {
        const rows=await sb("referencias_mercado",{method:"POST",body:JSON.stringify(body)});
        saved=rows?.[0];
      }
      setMarketRef(saved||body);
      setDraft(d=>({...d,precificacao:{...(d.precificacao||{}),referenciaId:saved?.id||d.precificacao?.referenciaId,referenciaFonte:"Base ENIGMA"}}));
      setMarketMsg("Referência salva. Na próxima avaliação deste modelo, a faixa será preenchida automaticamente.");
    } catch(e) {
      console.error(e); alert("Não foi possível salvar a referência de mercado.");
    } finally { setMarketLoading(false); }
  }

  function nova() {
    setDraft({
      etapa: "identificar", status: "avaliacao",
      vendedor: { nome: "", cpf: "", telefone: "", endereco: "" },
      aparelho: { marca: "Apple", modelo: "", cor: "", armazenamento: "", imei: "", serial: "", bateria: "", contaRemovida: false, notaFiscal: false },
      inspecao: { estetica: null, observacoes: "", avarias: "", scanner: {} },
      testes: Object.fromEntries(TESTES_USADO.map((x) => [x, "nao_testado"])),
      precificacao: { mercadoMin: "", mercadoMax: "", custoOperacional: "", margemDesejada: 25, risco: 5, pecasSelecionadas: {}, reparosManuais: {}, referenciaId: null, referenciaFonte: "" },
      oferta: { valorOfertado: "", observacoes: "", historico: [], statusNegociacao: "aberta", contraproposta: "", valorFinal: "", reaberturas: 0 },
      aquisicao: { valorFechado: "", formaPagamento: "pix", termoAceito: false, observacoes: "" },
    });
    setView("form");
  }
  function abrir(a) {
    setDraft({
      ...a,
      vendedor: a.vendedor || {}, aparelho: a.aparelho || {}, inspecao: a.inspecao || {},
      testes: a.testes || {}, precificacao: a.precificacao || {}, oferta: a.oferta || {}, aquisicao: a.aquisicao || {},
    });
    setView("form");
  }
  const p = draft?.precificacao || {};
  const mercadoMedio = ((Number(p.mercadoMin)||0) + (Number(p.mercadoMax)||0)) / 2;
  const falhasLista = Object.entries(draft?.testes || {}).filter(([,v])=>v==="falha").map(([k])=>k);
  const reparos = somaCustosFalhas(falhasLista, draft?.aparelho, estoque, p);
  const custosPendentes = falhasLista.filter(f=>{
    const matches=pecasCompativeisParaFalha(f,draft?.aparelho,estoque);
    const sel=p?.pecasSelecionadas?.[f];
    if (sel==="manual") return !(Number(p?.reparosManuais?.[f])>0);
    if (matches.length) return false;
    return !(Number(p?.reparosManuais?.[f])>0);
  });
  const operacional = Number(p.custoOperacional)||0;
  const margem = clamp(p.margemDesejada, 0, 90) / 100;
  const risco = clamp(p.risco, 0, 50) / 100;
  const impactoEsteticoBase = calcImpactoScanner(draft?.inspecao?.scanner || {}, mercadoMedio);
  const compraMax = Math.max(0, mercadoMedio * (1 - margem - risco) - reparos - operacional - impactoEsteticoBase);
  const scanner = draft?.inspecao?.scanner || {};
  const esteticaCalc = calcEsteticaScanner(scanner);
  const estetica = esteticaCalc ?? null;
  const testeVals = Object.values(draft?.testes || {});
  const okCount = testeVals.filter(v => v === "ok").length;
  const falhaCount = testeVals.filter(v => v === "falha").length;
  const testados = testeVals.filter(v => v !== "nao_testado").length;
  const funcional = testados ? Math.round(okCount / testados * 100) : 0;
  const riscoLabel = falhaCount >= 3 || Number(p.risco) >= 15 ? "ALTO" : falhaCount || Number(p.risco) >= 8 ? "MÉDIO" : "BAIXO";
  const enigmaScore = calcEnigmaScore(draft);
  const impactoEstetico = impactoEsteticoBase;
  const valorNegociacaoAtual = Number(draft?.oferta?.valorFinal || draft?.oferta?.contraproposta || draft?.oferta?.valorOfertado)||0;
  const ofertaInfo = ofertaClassificacao(valorNegociacaoAtual, compraMax);
  const margemProjetada = Math.max(0, mercadoMedio - valorNegociacaoAtual - reparos - operacional);


  async function persist(nextDraft = draft) {
    setSaving(true);
    try {
      const saved = await onSalvar(nextDraft);
      if (saved) setDraft(saved);
    } finally { setSaving(false); }
  }
  async function goStep(id) {
    const next = { ...draft, etapa: id };
    setDraft(next);
    await persist(next);
  }
  function upd(group, key, value) {
    setDraft(d => ({ ...d, [group]: { ...(d[group] || {}), [key]: value } }));
  }

  if (view === "lista") return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-[#0B0B11] p-6 md:p-8 shadow-[0_0_60px_rgba(124,58,237,.08)]">
        <div className="absolute inset-0 opacity-[.06]" style={{backgroundImage:"linear-gradient(rgba(139,92,246,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.7) 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="text-[10px] tracking-[.32em] text-purple-300 uppercase mb-2">ENIGMA // DEVICE ACQUISITION</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Avaliação de aparelhos usados</h1>
            <p className="text-sm text-[#858590] mt-2 max-w-2xl">Inspeção técnica, análise financeira, oferta e aquisição em um único fluxo.</p>
          </div>
          <Button onClick={nova} className="flex items-center justify-center gap-2"><Plus size={16}/> Nova avaliação</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <MetricCyber label="EM ANÁLISE" value={avaliacoes.filter(a=>a.status==="avaliacao").length} sub="avaliações abertas"/>
        <MetricCyber label="COMPRADOS" value={avaliacoes.filter(a=>a.status==="comprado").length} sub="aquisições concluídas"/>
        <MetricCyber label="BASE" value={avaliacoes.length} sub="aparelhos avaliados"/>
      </div>
      <Card className="!rounded-2xl">
        <div className="flex items-center justify-between mb-4"><div><div className="font-medium">Avaliações recentes</div><div className="text-xs text-[#73737F]">Histórico de análise e compra</div></div></div>
        {!avaliacoes.length ? <div className="py-14 text-center text-[#666672]"><Smartphone className="mx-auto mb-3 opacity-50"/><div>Nenhuma avaliação registrada.</div></div> :
          <div className="space-y-2">{avaliacoes.map(a=><button key={a.id} onClick={()=>abrir(a)} className="w-full text-left rounded-xl border border-white/10 bg-white/[.02] hover:border-purple-500/30 p-4 flex items-center justify-between gap-3">
            <div><div className="text-sm text-white">{a.aparelho?.marca} {a.aparelho?.modelo || "Aparelho"}</div><div className="text-xs text-[#74747F] mt-1">{a.vendedor?.nome || "Vendedor não informado"} · {a.aparelho?.armazenamento || "—"}</div></div>
            <div className="text-right"><div className="text-[10px] tracking-widest text-purple-300 uppercase">{a.status==="comprado"?"COMPRADO":a.etapa||"AVALIAÇÃO"}</div><ChevronRight size={16} className="ml-auto mt-1 text-[#666672]"/></div>
          </button>)}</div>}
      </Card>
    </div>
  );

  const stepIndex = Math.max(0, AVAL_STEPS.findIndex(x=>x.id===draft.etapa));
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={()=>setView("lista")} className="text-sm text-[#9999A5] hover:text-white flex items-center gap-2"><ChevronLeft size={16}/> Avaliações</button>
        <div className="flex gap-2"><Button variant="ghost" onClick={()=>persist()} disabled={saving}>{saving?"Salvando...":"Salvar"}</Button></div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-[#090A0F] p-5 md:p-7">
        <div className="absolute inset-0 opacity-[.055]" style={{backgroundImage:"linear-gradient(rgba(34,197,94,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.8) 1px,transparent 1px)",backgroundSize:"24px 24px"}}/>
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div><div className="text-[10px] tracking-[.3em] uppercase text-purple-300">ENIGMA // SCAN SESSION</div><div className="text-xl font-semibold mt-1">{draft.aparelho?.marca || "Aparelho"} {draft.aparelho?.modelo || "não identificado"}</div><div className="text-xs text-[#777783] mt-1 font-mono">IMEI {draft.aparelho?.imei || "AGUARDANDO IDENTIFICAÇÃO"}</div></div>
            <div className="flex gap-2">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/[.05] px-4 py-3 min-w-[120px]"><div className="text-[9px] tracking-[.22em] text-purple-300">ENIGMA SCORE</div><div className="text-2xl font-mono mt-1 text-white">{enigmaScore == null ? "—" : enigmaScore}<span className="text-xs text-[#6D6D78]">{enigmaScore == null ? "" : "/100"}</span></div><div className="text-[9px] text-[#666672] mt-1">{enigmaScore == null ? "AGUARDANDO AVALIAÇÃO" : "ANÁLISE EM PROGRESSO"}</div></div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/[.05] px-4 py-3"><div className="text-[9px] tracking-[.22em] text-green-400">RISK ENGINE</div><div className={"text-lg font-mono mt-1 "+(riscoLabel==="ALTO"?"text-red-400":riscoLabel==="MÉDIO"?"text-amber-300":"text-green-400")}>{riscoLabel}</div></div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1 md:gap-2">{AVAL_STEPS.map((st,i)=><button key={st.id} onClick={()=>i<=stepIndex?setDraft(d=>({...d,etapa:st.id})):null} className={"min-w-0 rounded-lg border px-1 md:px-3 py-2 text-[8px] md:text-[10px] tracking-wider transition "+(i===stepIndex?"border-purple-400/50 bg-purple-500/10 text-white":i<stepIndex?"border-green-500/20 bg-green-500/[.04] text-green-400":"border-white/8 text-[#50505A]")}>{st.label}</button>)}</div>
        </div>
      </div>

      {draft.etapa==="identificar" && <Card className="!rounded-2xl">
        <SectionCyber code="01" title="Identificação" sub="Quem está vendendo e qual aparelho está sendo avaliado"/>
        <div className="grid md:grid-cols-2 gap-6 mt-5">
          <div className="space-y-3"><div className="text-xs tracking-widest text-purple-300">VENDEDOR</div>
            <Field label="Nome completo"><Input value={draft.vendedor.nome||""} onChange={e=>upd("vendedor","nome",e.target.value)}/></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="CPF"><Input value={draft.vendedor.cpf||""} onChange={e=>upd("vendedor","cpf",e.target.value)}/></Field><Field label="Telefone"><Input value={draft.vendedor.telefone||""} onChange={e=>upd("vendedor","telefone",e.target.value)}/></Field></div>
            <Field label="Endereço"><Input value={draft.vendedor.endereco||""} onChange={e=>upd("vendedor","endereco",e.target.value)}/></Field>
          </div>
          <div className="space-y-3"><div className="text-xs tracking-widest text-purple-300">DISPOSITIVO</div>
            <div className="grid grid-cols-2 gap-3"><Field label="Marca"><Input value={draft.aparelho.marca||""} onChange={e=>upd("aparelho","marca",e.target.value)}/></Field><Field label="Modelo"><Input value={draft.aparelho.modelo||""} onChange={e=>upd("aparelho","modelo",e.target.value)}/></Field></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Armazenamento"><Input placeholder="128 GB" value={draft.aparelho.armazenamento||""} onChange={e=>upd("aparelho","armazenamento",e.target.value)}/></Field><Field label="Cor"><Input value={draft.aparelho.cor||""} onChange={e=>upd("aparelho","cor",e.target.value)}/></Field></div>
            <Field label="IMEI"><Input value={draft.aparelho.imei||""} onChange={e=>upd("aparelho","imei",e.target.value)}/></Field>
            <Field label="Serial"><Input value={draft.aparelho.serial||""} onChange={e=>upd("aparelho","serial",e.target.value)}/></Field>
          </div>
        </div>
        <FlowNext onClick={()=>goStep("inspecionar")} label="Salvar identificação e iniciar inspeção"/>
      </Card>}

      {draft.etapa==="inspecionar" && <Card className="!rounded-2xl">
        <SectionCyber code="02" title="Scanner estético ENIGMA" sub="Avalie cada região do aparelho. A nota geral é calculada automaticamente."/>
        <div className="grid lg:grid-cols-[280px_1fr] gap-5 mt-5">
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/[.07] to-transparent p-5 flex flex-col items-center justify-center min-h-[330px]">
            <div className="text-[9px] tracking-[.28em] text-purple-300 mb-4">PHYSICAL SCAN</div>
            <div className="w-36 h-36 rounded-full border-[7px] border-purple-500/20 flex items-center justify-center shadow-[inset_0_0_34px_rgba(139,92,246,.13),0_0_34px_rgba(139,92,246,.09)]">
              <div className="text-center"><div className="text-3xl font-mono">{estetica == null ? "—" : `${estetica}%`}</div><div className="text-[8px] tracking-[.2em] text-purple-300 mt-1">{estetica == null ? "NÃO AVALIADO" : "ESTÉTICA GERAL"}</div></div>
            </div>
            <div className="w-full mt-5 space-y-2">
              {SCANNER_PARTES.map(part=>{const d=scanner[part.id]; return <div key={part.id} className="flex items-center justify-between text-[11px]"><span className="text-[#777783]">{part.label}</span><span className={d?"text-white font-mono":"text-[#484852]"}>{d ? `${d.score}%` : "—"}</span></div>})}
            </div>
          </div>
          <div className="space-y-3">
            {SCANNER_PARTES.map(part=>{
              const atual=scanner[part.id];
              return <div key={part.id} className="rounded-xl border border-white/10 bg-white/[.018] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div><div className="text-sm text-white"><span className="text-purple-300 mr-2 font-mono">{part.icon}</span>{part.label}</div><div className="text-[10px] text-[#666672] mt-1">{atual ? ESTADOS_ESTETICA.find(e=>e.id===atual.estado)?.desc : "Selecione o estado observado."}</div></div>
                  <div className="text-lg font-mono text-white">{atual ? `${atual.score}%` : "—"}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-1.5">
                  {ESTADOS_ESTETICA.map(est=><button key={est.id} type="button" onClick={()=>{const novo={...scanner,[part.id]:{estado:est.id,score:est.score}};setDraft(d=>({...d,inspecao:{...(d.inspecao||{}),scanner:novo,estetica:calcEsteticaScanner(novo)}}));}} className={"rounded-lg border px-2 py-2 text-[9px] leading-tight transition "+(atual?.estado===est.id?"border-purple-400/50 bg-purple-500/12 text-white shadow-[0_0_14px_rgba(139,92,246,.08)]":"border-white/8 text-[#73737F] hover:border-purple-500/25 hover:text-white")}>{est.label}</button>)}
                </div>
              </div>
            })}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-5">
          <MetricCyber label="ÁREAS AVALIADAS" value={`${Object.keys(scanner).filter(k=>scanner[k]?.score!=null).length}/${SCANNER_PARTES.length}`} sub="scanner físico"/>
          <MetricCyber label="ESTÉTICA GERAL" value={estetica == null ? "—" : `${estetica}%`} sub={estetica == null ? "aguardando" : "calculada automaticamente"}/>
          <MetricCyber label="IMPACTO ESTÉTICO" value={mercadoMedio ? `− ${fmt(impactoEstetico)}` : "Calculado na precificação"} sub="estimativa sobre referência"/>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <div className="space-y-3">
            <Field label="Saúde da bateria (%)"><Input type="number" placeholder="Ex.: 87" value={draft.aparelho.bateria||""} onChange={e=>upd("aparelho","bateria",e.target.value)}/></Field>
            <Field label="Procedência"><div className="flex gap-2"><ToggleMini active={draft.aparelho.contaRemovida} onClick={()=>upd("aparelho","contaRemovida",!draft.aparelho.contaRemovida)} text="Conta removida"/><ToggleMini active={draft.aparelho.notaFiscal} onClick={()=>upd("aparelho","notaFiscal",!draft.aparelho.notaFiscal)} text="Nota fiscal"/></div></Field>
          </div>
          <div className="space-y-3"><Field label="Avarias específicas"><Textarea rows={2} placeholder="Trincas, amassados, riscos profundos..." value={draft.inspecao.avarias||""} onChange={e=>upd("inspecao","avarias",e.target.value)}/></Field><Field label="Observações"><Textarea rows={2} value={draft.inspecao.observacoes||""} onChange={e=>upd("inspecao","observacoes",e.target.value)}/></Field></div>
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-purple-500/20 bg-purple-500/[.025] p-4 text-xs text-[#81818D]"><Camera size={16} className="inline mr-2 text-purple-300"/>A vistoria fotográfica dedicada continua preparada para a próxima conexão com o Storage.</div>
        <FlowNext onClick={()=>goStep("testar")} label="Concluir scanner e iniciar testes"/>
      </Card>}

      {draft.etapa==="testar" && <Card className="!rounded-2xl">
        <SectionCyber code="03" title="Diagnóstico de compra" sub="Teste funcional guiado do aparelho"/>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-5">{TESTES_USADO.map(t=><div key={t} className="rounded-xl border border-white/10 bg-white/[.02] p-3"><div className="text-sm mb-3">{t}</div><div className="grid grid-cols-3 gap-1">{[["nao_testado","—"],["ok","OK"],["falha","FALHA"]].map(([v,l])=><button key={v} onClick={()=>upd("testes",t,v)} className={"rounded-md py-1.5 text-[10px] border "+(draft.testes[t]===v?(v==="ok"?"border-green-500/40 bg-green-500/10 text-green-400":v==="falha"?"border-red-500/40 bg-red-500/10 text-red-400":"border-purple-500/40 bg-purple-500/10 text-purple-300"):"border-white/8 text-[#666672]")}>{l}</button>)}</div></div>)}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5"><MetricCyber label="TESTADOS" value={`${testados}/${TESTES_USADO.length}`} sub="itens"/><MetricCyber label="FUNCIONAL" value={`${funcional}%`} sub="índice atual"/><MetricCyber label="FALHAS" value={falhaCount} sub="atenção"/><div className="rounded-xl border border-purple-500/25 bg-purple-500/[.055] p-4"><div className="text-[9px] tracking-[.22em] text-purple-300">ENIGMA SCORE</div><div className="text-3xl font-mono text-white mt-2">{enigmaScore == null ? "—" : enigmaScore}</div><div className="h-1.5 rounded bg-white/5 mt-3 overflow-hidden"><div className="h-full bg-purple-500 transition-all" style={{width:`${enigmaScore || 0}%`}}/></div></div></div>
        <FlowNext onClick={()=>goStep("precificar")} label="Concluir testes e precificar"/>
      </Card>}

      {draft.etapa==="precificar" && <div className="space-y-4">
        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="!rounded-2xl lg:col-span-3">
            <SectionCyber code="04" title="ENIGMA Price Engine" sub="Mercado + falhas + peças + custos + margem"/>

            <div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[.025] p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] tracking-[.24em] text-cyan-300">REFERÊNCIA DE MERCADO</div>
                  <div className="text-sm text-white mt-1">{draft.aparelho?.marca} {draft.aparelho?.modelo} {draft.aparelho?.armazenamento}</div>
                  <div className="text-[10px] text-[#70707B] mt-1">{marketLoading ? "Consultando base ENIGMA..." : marketMsg || "Aguardando identificação do modelo."}</div>
                </div>
                {marketRef?.updated_at && <div className="text-[9px] text-[#5F5F69] font-mono">REF {new Date(marketRef.updated_at).toLocaleDateString("pt-BR")}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Field label="Mercado mínimo"><Input type="number" value={p.mercadoMin||""} onChange={e=>upd("precificacao","mercadoMin",e.target.value)}/></Field>
                <Field label="Mercado máximo"><Input type="number" value={p.mercadoMax||""} onChange={e=>upd("precificacao","mercadoMax",e.target.value)}/></Field>
              </div>
              <div className="mt-3 flex justify-end"><button type="button" onClick={salvarReferenciaMercado} disabled={marketLoading || !Number(p.mercadoMin) || !Number(p.mercadoMax)} className="text-[10px] px-3 py-2 rounded-lg border border-cyan-400/20 text-cyan-300 hover:bg-cyan-400/[.05] disabled:opacity-40">{marketRef ? "Atualizar referência deste modelo" : "Salvar referência deste modelo"}</button></div>
            </div>

            <div className="mt-5">
              <div className="flex items-end justify-between gap-3 mb-3">
                <div><div className="text-[9px] tracking-[.24em] text-purple-300">RECONDICIONAMENTO</div><div className="text-xs text-[#73737F] mt-1">Toda função marcada como FALHA precisa ter custo antes da oferta.</div></div>
                <div className="font-mono text-sm text-white">{fmt(reparos)}</div>
              </div>
              {!falhasLista.length ? <div className="rounded-xl border border-green-500/20 bg-green-500/[.035] p-4 text-sm text-green-300"><CheckCircle2 size={15} className="inline mr-2"/>Nenhuma falha funcional marcada.</div> :
              <div className="space-y-2">{falhasLista.map(falha=>{
                const matches=pecasCompativeisParaFalha(falha,draft.aparelho,estoque);
                const currentSel=p?.pecasSelecionadas?.[falha];
                const effectiveSel=currentSel || (matches[0]?.id ? String(matches[0].id) : "manual");
                const selected=matches.find(x=>String(x.id)===String(effectiveSel));
                const pendente=effectiveSel==="manual" && !(Number(p?.reparosManuais?.[falha])>0);
                return <div key={falha} className={"rounded-xl border p-3 "+(pendente?"border-amber-400/25 bg-amber-400/[.035]":"border-white/10 bg-white/[.018]")}>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="md:w-44 shrink-0"><div className="text-sm text-white">{falha}</div><div className={"text-[9px] mt-1 "+(pendente?"text-amber-300":"text-green-400")}>{pendente?"CUSTO PENDENTE":"CUSTO MAPEADO"}</div></div>
                    <div className="flex-1">
                      {matches.length ? <select value={effectiveSel} onChange={e=>setDraft(d=>({...d,precificacao:{...(d.precificacao||{}),pecasSelecionadas:{...(d.precificacao?.pecasSelecionadas||{}),[falha]:e.target.value}}}))} className="w-full bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 py-2 text-xs">
                        {matches.map(item=><option key={item.id} value={String(item.id)}>{item.nome} · custo {fmt(item.custo)} · estoque {item.quantidade}</option>)}
                        <option value="manual">Informar custo manual</option>
                      </select> : <div className="text-[10px] text-[#73737F]">Nenhuma peça compatível encontrada pelo nome no estoque.</div>}
                    </div>
                    {(effectiveSel==="manual" || !matches.length) ? <div className="md:w-40"><Input type="number" placeholder="Custo estimado" value={p?.reparosManuais?.[falha]||""} onChange={e=>setDraft(d=>({...d,precificacao:{...(d.precificacao||{}),pecasSelecionadas:{...(d.precificacao?.pecasSelecionadas||{}),[falha]:"manual"},reparosManuais:{...(d.precificacao?.reparosManuais||{}),[falha]:e.target.value}}}))}/></div> : <div className="md:w-28 text-right font-mono text-sm text-white">{fmt(selected?.custo || matches[0]?.custo)}</div>}
                  </div>
                </div>
              })}</div>}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <Field label="Custo operacional"><Input type="number" value={p.custoOperacional||""} onChange={e=>upd("precificacao","custoOperacional",e.target.value)}/></Field>
              <Field label="Margem desejada (%)"><Input type="number" value={p.margemDesejada??25} onChange={e=>upd("precificacao","margemDesejada",e.target.value)}/></Field>
              <Field label="Reserva de risco (%)"><Input type="number" value={p.risco??5} onChange={e=>upd("precificacao","risco",e.target.value)}/></Field>
              <div className="rounded-xl border border-white/10 bg-white/[.018] p-3"><div className="text-[9px] tracking-[.2em] text-[#70707B]">CUSTOS PENDENTES</div><div className={"text-xl font-mono mt-2 "+(custosPendentes.length?"text-amber-300":"text-green-400")}>{custosPendentes.length}</div><div className="text-[9px] text-[#5F5F69] mt-1">{custosPendentes.length ? "complete antes da oferta" : "motor completo"}</div></div>
            </div>
          </Card>

          <div className="lg:col-span-2 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-purple-500/[.08] to-green-500/[.025] p-5 flex flex-col justify-between">
            <div>
              <div className="text-[9px] tracking-[.3em] text-purple-300">ENIGMA BUY ENGINE</div>
              <div className="text-xs text-[#686874] mt-1">Análise financeira em tempo real</div>
            </div>
            <div className="my-5 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-[#747480]">Mercado médio</span><span className="font-mono">{fmt(mercadoMedio)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#747480]">Peças / reparos</span><span className="font-mono text-amber-300">− {fmt(reparos)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#747480]">Impacto estético</span><span className="font-mono text-amber-300">− {fmt(impactoEstetico)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#747480]">Custo operacional</span><span className="font-mono text-amber-300">− {fmt(operacional)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#747480]">Margem + risco</span><span className="font-mono text-purple-300">− {Math.round((margem+risco)*100)}%</span></div>
              <div className="pt-4 mt-3 border-t border-white/10">
                <div className="text-[10px] tracking-[.22em] text-green-400">{custosPendentes.length ? "PREÇO FINAL PENDENTE" : "COMPRA SEGURA ATÉ"}</div>
                <div className={"text-4xl font-mono mt-2 "+(custosPendentes.length?"text-amber-300":"text-white drop-shadow-[0_0_14px_rgba(34,197,94,.25)]")}>{custosPendentes.length ? "—" : fmt(compraMax)}</div>
                <div className="text-xs text-[#747480] mt-2">{custosPendentes.length ? `${custosPendentes.length} falha(s) sem custo definido` : "resultado do motor ENIGMA"}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-lg border border-white/8 p-2 text-center"><div className="text-[8px] text-[#666672]">OFERTA INICIAL</div><div className="text-xs font-mono mt-1">{custosPendentes.length?"—":fmt(compraMax*.88)}</div></div>
              <div className="rounded-lg border border-cyan-400/15 p-2 text-center"><div className="text-[8px] text-cyan-300">COMPRA IDEAL</div><div className="text-xs font-mono mt-1">{custosPendentes.length?"—":fmt(compraMax*.95)}</div></div>
              <div className="rounded-lg border border-purple-400/15 p-2 text-center"><div className="text-[8px] text-purple-300">TETO</div><div className="text-xs font-mono mt-1">{custosPendentes.length?"—":fmt(compraMax)}</div></div>
            </div>
            <Button onClick={()=>goStep("oferta")} disabled={!mercadoMedio || custosPendentes.length>0}>Gerar oferta <ArrowRight size={15} className="inline ml-2"/></Button>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[.015] p-3 text-[10px] text-[#686874]">
          <span className="text-cyan-300">Mercado automático:</span> esta versão preenche automaticamente a partir da base de referências da ENIGMA. Se um modelo ainda não existir, informe a faixa uma vez e salve; avaliações futuras do mesmo modelo serão preenchidas sozinhas. A consulta direta a marketplaces em tempo real exige uma fonte/API estável e será conectada separadamente.
        </div>
      </div>}

      {draft.etapa==="oferta" && <Card className="!rounded-2xl">
        <SectionCyber code="05" title="Negociação" sub="Histórico interno • proposta • contraproposta • aceite"/>
        {draft.oferta?.statusNegociacao==="fechada" && <div className="mt-5 rounded-xl border border-green-500/25 bg-green-500/[.045] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div><div className="text-[9px] tracking-[.24em] text-green-400">NEGOCIAÇÃO ENCERRADA</div><div className="text-lg font-mono text-white mt-1">{fmt(draft.oferta.valorFinal)}</div><div className="text-[10px] text-[#70707B] mt-1">Valor final enviado para Aquisição. O histórico permanece somente interno.</div></div>
          <button type="button" onClick={()=>{if(!confirm("Reabrir esta negociação? A ocorrência ficará registrada no histórico interno."))return; const ev=eventoNegociacao("reabertura",draft.oferta.valorFinal,"Negociação reaberta"); setDraft(d=>({...d,oferta:{...(d.oferta||{}),statusNegociacao:"aberta",valorFinal:"",contraproposta:"",reaberturas:(Number(d.oferta?.reaberturas)||0)+1,historico:[...(d.oferta?.historico||[]),ev]}}));}} className="text-[10px] px-3 py-2 rounded-lg border border-white/10 text-[#8A8A95] hover:text-white">Reabrir negociação</button>
        </div>}

        <div className="grid md:grid-cols-4 gap-4 mt-5">
          <MetricCyber label="MERCADO MÉDIO" value={fmt(mercadoMedio)} sub="referência"/>
          <MetricCyber label="OFERTA INICIAL" value={fmt(compraMax*.88)} sub="motor ENIGMA"/>
          <MetricCyber label="COMPRA IDEAL" value={fmt(compraMax*.95)} sub="faixa saudável"/>
          <MetricCyber label="TETO ABSOLUTO" value={fmt(compraMax)} sub="limite recomendado"/>
        </div>

        {draft.oferta?.statusNegociacao!=="fechada" && <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-5">
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/[.035] p-4">
              <div className="text-[9px] tracking-[.22em] text-purple-300 mb-3">NOVA OFERTA ENIGMA</div>
              <div className="flex flex-col sm:flex-row gap-2"><Input type="number" placeholder="Valor da oferta" value={draft.oferta.valorOfertado||""} onChange={e=>upd("oferta","valorOfertado",e.target.value)}/><Button onClick={()=>{const v=Number(draft.oferta.valorOfertado)||0;if(!v)return alert("Informe o valor da oferta.");const ev=eventoNegociacao("oferta_enigma",v);setDraft(d=>({...d,oferta:{...(d.oferta||{}),contraproposta:"",historico:[...(d.oferta?.historico||[]),ev]}}));}}>Registrar oferta</Button></div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[.018] p-4">
              <div className="text-[9px] tracking-[.22em] text-[#8A8A95] mb-3">RESPOSTA DO VENDEDOR</div>
              <div className="grid sm:grid-cols-3 gap-2">
                <button type="button" onClick={()=>{const ultimo=[...(draft.oferta?.historico||[])].reverse().find(x=>x.tipo==="oferta_enigma");const v=Number(ultimo?.valor||draft.oferta.valorOfertado)||0;if(!v)return alert("Registre uma oferta primeiro.");if(v>compraMax && compraMax>0 && !confirm(`ATENÇÃO: ${fmt(v)} está acima do teto ENIGMA de ${fmt(compraMax)}. Deseja registrar a exceção e continuar?`))return;const ev=eventoNegociacao("aceite",v,v>compraMax?"Aquisição aceita acima do teto recomendado":"");setDraft(d=>({...d,oferta:{...(d.oferta||{}),valorFinal:v,statusNegociacao:"fechada",acimaDoTeto:v>compraMax,historico:[...(d.oferta?.historico||[]),ev]},aquisicao:{...(d.aquisicao||{}),valorFechado:v}}));}} className="rounded-lg border border-green-500/25 bg-green-500/[.04] p-3 text-xs text-green-300 hover:bg-green-500/[.08]">ACEITOU</button>
                <button type="button" onClick={()=>setDraft(d=>({...d,oferta:{...(d.oferta||{}),aguardandoContraproposta:true}}))} className="rounded-lg border border-amber-400/25 bg-amber-400/[.035] p-3 text-xs text-amber-300 hover:bg-amber-400/[.07]">CONTRAPROPOSTA</button>
                <button type="button" onClick={()=>{const ev=eventoNegociacao("recusa",0);setDraft(d=>({...d,oferta:{...(d.oferta||{}),historico:[...(d.oferta?.historico||[]),ev]}}));}} className="rounded-lg border border-red-500/20 bg-red-500/[.03] p-3 text-xs text-red-300 hover:bg-red-500/[.07]">RECUSOU</button>
              </div>
              {draft.oferta?.aguardandoContraproposta && <div className="flex flex-col sm:flex-row gap-2 mt-3"><Input type="number" placeholder="Valor pedido pelo vendedor" value={draft.oferta.contraproposta||""} onChange={e=>upd("oferta","contraproposta",e.target.value)}/><Button variant="ghost" onClick={()=>{const v=Number(draft.oferta.contraproposta)||0;if(!v)return alert("Informe a contraproposta.");const ev=eventoNegociacao("contraproposta",v);setDraft(d=>({...d,oferta:{...(d.oferta||{}),aguardandoContraproposta:false,historico:[...(d.oferta?.historico||[]),ev]}}));}}>Registrar contraproposta</Button></div>}
            </div>
          </div>

          <div className={"rounded-xl border p-4 "+ofertaInfo.bg}>
            <div className="text-[9px] tracking-[.22em] text-[#747480]">DECISÃO ENIGMA</div>
            <div className={"text-base font-mono mt-2 "+ofertaInfo.cls}>{ofertaInfo.label}</div>
            <div className="text-[10px] text-[#666672] mt-2">Valor em análise: {fmt(valorNegociacaoAtual)}</div>
            <div className="text-[10px] text-[#666672] mt-1">Margem projetada: {fmt(margemProjetada)}</div>
            {valorNegociacaoAtual>compraMax && compraMax>0 && <div className="mt-3 rounded-lg border border-red-500/25 bg-red-500/[.04] p-3 text-[10px] text-red-300">⚠ Valor acima do teto recomendado. Se houver aceite, o sistema exigirá confirmação explícita.</div>}
          </div>
        </div>}

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3"><div><div className="text-[9px] tracking-[.24em] text-cyan-300">TIMELINE INTERNA</div><div className="text-[10px] text-[#60606B] mt-1">Não aparece no Termo de Aquisição.</div></div><div className="text-[9px] font-mono text-[#555560]">{(Array.isArray(draft.oferta?.historico)?draft.oferta.historico:[]).length} EVENTOS</div></div>
          {!(Array.isArray(draft.oferta?.historico)?draft.oferta.historico:[]).length ? <div className="text-xs text-[#5F5F69] mt-4">Nenhuma movimentação registrada.</div> :
          <div className="mt-4 flex flex-wrap items-center gap-2">{(draft.oferta.historico||[]).map((ev,i)=><span key={ev.id||i} className="contents"><div className={"rounded-lg border px-3 py-2 "+(ev.tipo==="aceite"?"border-green-500/25 bg-green-500/[.04]":ev.tipo==="contraproposta"?"border-amber-400/20 bg-amber-400/[.03]":ev.tipo==="recusa"?"border-red-500/20 bg-red-500/[.03]":"border-purple-500/20 bg-purple-500/[.03]")}><div className="text-[8px] tracking-[.18em] text-[#70707B]">{labelEventoNegociacao(ev)}</div><div className="text-xs font-mono text-white mt-1">{ev.valor ? fmt(ev.valor) : "—"}</div><div className="text-[8px] text-[#50505A] mt-1">{ev.em ? new Date(ev.em).toLocaleString("pt-BR") : ""}</div></div>{i<(draft.oferta.historico||[]).length-1 && <span className="text-[#44444E] text-xs px-1">→</span>}</span>)}</div>}
        </div>

        {draft.oferta?.statusNegociacao==="fechada" && <div className="mt-5">
          <Button onClick={()=>goStep("aquisicao")}>Fechar negociação e preparar aquisição <ArrowRight size={15} className="inline ml-2"/></Button>
        </div>}
        {draft.oferta?.statusNegociacao!=="fechada" && <div className="mt-5 text-[10px] text-[#666672]">A etapa de Aquisição será liberada quando o vendedor aceitar uma oferta.</div>}
      </Card>}

      {draft.etapa==="aquisicao" && <Card className="!rounded-2xl"><SectionCyber code="06" title="Aquisição" sub="Fechamento, termo e entrada futura no estoque de seminovos"/>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          <div className="space-y-3"><Field label="Valor fechado"><Input type="number" value={draft.aquisicao.valorFechado||draft.oferta.valorOfertado||""} onChange={e=>upd("aquisicao","valorFechado",e.target.value)}/></Field><Field label="Forma de pagamento"><select value={draft.aquisicao.formaPagamento||"pix"} onChange={e=>upd("aquisicao","formaPagamento",e.target.value)} className="w-full bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 py-2.5"><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option></select></Field></div>
          <div className="rounded-xl border border-white/10 bg-white/[.02] p-4"><div className="text-xs tracking-widest text-purple-300 mb-3">TERMO DE AQUISIÇÃO</div><p className="text-xs leading-5 text-[#858590]">O vendedor declara ser legítimo proprietário do aparelho identificado nesta avaliação e declara, sob sua responsabilidade, a procedência lícita do bem e a veracidade das informações fornecidas.</p><button onClick={()=>upd("aquisicao","termoAceito",!draft.aquisicao.termoAceito)} className={"mt-4 w-full rounded-lg border p-3 text-left text-sm "+(draft.aquisicao.termoAceito?"border-green-500/30 bg-green-500/[.06] text-green-300":"border-white/10 text-[#8A8A96]")}><CheckCircle2 size={16} className="inline mr-2"/>Declaração conferida para assinatura</button><div className="text-[10px] text-amber-300/70 mt-3">Antes do uso comercial, valide o texto jurídico definitivo com profissional habilitado.</div></div>
        </div>
        <div className="mt-5 rounded-xl border border-purple-500/15 bg-purple-500/[.025] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div className="text-[9px] tracking-[.25em] text-purple-300">DOCUMENTAÇÃO DE AQUISIÇÃO</div><div className="text-xs text-[#777783] mt-1">Gere o termo preenchido para assinatura física do vendedor e da ENIGMA.</div></div><Button variant="ghost" onClick={()=>imprimirTermoAquisicao(draft,{score:enigmaScore,mercadoMedioFmt:fmt(mercadoMedio),compraMaxFmt:fmt(compraMax)})}><Printer size={15} className="inline mr-2"/>Gerar / Imprimir termo</Button></div>
        <div className="mt-5 flex flex-col sm:flex-row gap-3"><Button variant="ghost" onClick={()=>persist()}>Salvar como avaliação</Button><Button disabled={!draft.aquisicao.termoAceito || !Number(draft.aquisicao.valorFechado||draft.oferta.valorFinal||draft.oferta.valorOfertado)} onClick={async()=>{try{setSaving(true);const next={...draft,status:"comprado",aquisicao:{...draft.aquisicao,valorFechado:draft.aquisicao.valorFechado||draft.oferta.valorFinal||draft.oferta.valorOfertado,compradoEm:new Date().toISOString(),registroAquisicao:draft.aquisicao.registroAquisicao||("AQ-"+Date.now())}};const res=await onRegistrarCompra(next);setDraft(res?.avaliacao||next);alert(`Aquisição registrada e aparelho adicionado aos Seminovos como "${res?.seminovo?.status==="disponivel"?"Disponível":"Em preparação"}".`);}catch(e){alert("Não foi possível concluir a aquisição/estoque. Confira o Supabase e tente novamente.");}finally{setSaving(false);}}}>{saving?"Registrando...":"Registrar compra"}</Button></div>
      </Card>}
    </div>
  );
}
function Field({label,children}) { return <div><Label>{label}</Label>{children}</div>; }
function SectionCyber({code,title,sub}) { return <div className="flex items-start gap-3"><div className="font-mono text-xs text-purple-300 border border-purple-500/25 rounded-md px-2 py-1">{code}</div><div><div className="font-medium text-white">{title}</div><div className="text-xs text-[#747480] mt-0.5">{sub}</div></div></div>; }
function FlowNext({onClick,label}) { return <div className="mt-6 pt-4 border-t border-white/8 flex justify-end"><Button onClick={onClick}>{label} <ArrowRight size={15} className="inline ml-2"/></Button></div>; }
function ToggleMini({active,onClick,text}) { return <button type="button" onClick={onClick} className={"flex-1 rounded-lg border px-2 py-2 text-[10px] "+(active?"border-green-500/30 bg-green-500/[.06] text-green-300":"border-white/10 text-[#777783]")}>{active?<Check size={12} className="inline mr-1"/>:null}{text}</button>; }
function MetricCyber({label,value,sub}) { return <div className="rounded-xl border border-white/10 bg-[#111117] p-4"><div className="text-[9px] tracking-[.22em] text-[#73737F]">{label}</div><div className="text-xl font-mono text-white mt-2">{value}</div><div className="text-[10px] text-[#5F5F69] mt-1">{sub}</div></div>; }
function ScoreDial({label,value}) { return <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[.035] p-5 flex flex-col items-center justify-center min-h-48"><div className="w-28 h-28 rounded-full border-[7px] border-purple-500/20 flex items-center justify-center shadow-[inset_0_0_28px_rgba(139,92,246,.12),0_0_28px_rgba(139,92,246,.08)]"><div className="text-center"><div className="text-2xl font-mono">{value}%</div><div className="text-[8px] tracking-[.2em] text-purple-300 mt-1">{label}</div></div></div></div>; }


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
function NovaOS({ clientes=[], onAddCliente, onCriar, onCancelar }) {
  const [clienteId,setClienteId]=useState(null);
  const [buscaCliente,setBuscaCliente]=useState("");
  const [mostrarNovo,setMostrarNovo]=useState(false);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [aparelhoTipo, setAparelhoTipo] = useState("smartphone");
  const [aparelhoMarcaModelo, setAparelhoMarcaModelo] = useState("");
  const [aparelhoSerial, setAparelhoSerial] = useState("");
  const [aparelhoCor, setAparelhoCor] = useState("");
  const [problemaRelatado, setProblemaRelatado] = useState("");
  const [acessoriosRecebidos, setAcessoriosRecebidos] = useState("");
  const [previsaoEntrega, setPrevisaoEntrega] = useState("");
  const [salvandoCliente,setSalvandoCliente]=useState(false);

  const norm=v=>String(v||"").replace(/\D/g,"");
  const q=buscaCliente.trim().toLowerCase();
  const clientesEncontrados=q.length<2?[]:clientes.filter(c=>
    `${c.nome||""} ${c.telefone||""} ${c.email||""} ${c.documento||""}`.toLowerCase().includes(q)
  ).slice(0,8);

  function selecionarCliente(c){
    setClienteId(c.id);
    setClienteNome(c.nome||"");
    setClienteTelefone(c.telefone||"");
    setClienteCpf(c.documento||"");
    setClienteEndereco(c.endereco||"");
    setBuscaCliente("");
    setMostrarNovo(false);
  }

  function limparCliente(){
    setClienteId(null);setClienteNome("");setClienteTelefone("");setClienteCpf("");setClienteEndereco("");
  }

  async function cadastrarESelecionar(){
    if(!clienteNome.trim())return;
    setSalvandoCliente(true);
    const tel=norm(clienteTelefone);
    const duplicado=tel?clientes.find(c=>norm(c.telefone)===tel):null;
    if(duplicado){
      selecionarCliente(duplicado);
      alert(`Telefone já cadastrado. Cliente ${duplicado.nome} selecionado automaticamente.`);
      setSalvandoCliente(false);
      return;
    }
    const criado=await onAddCliente({
      nome:clienteNome,telefone:clienteTelefone,documento:clienteCpf,
      observacoes:clienteEndereco?`Endereço: ${clienteEndereco}`:""
    });
    if(criado) selecionarCliente(criado);
    setSalvandoCliente(false);
  }

  const podeCriar = !!clienteId && aparelhoMarcaModelo.trim() && problemaRelatado.trim();

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[.08] to-transparent p-4">
        <div className="text-[10px] tracking-[0.2em] uppercase text-purple-300 mb-1">Fluxo conectado V4.3.2</div>
        <div className="text-lg font-medium text-white">Nova ordem de serviço</div>
        <div className="text-xs text-[#777782] mt-1">Comece pelo cliente. A OS ficará ligada ao mesmo cadastro usado no PDV e no histórico.</div>
      </div>

      <Card className="!rounded-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-[#C9C9D2]"><User size={16} className="text-purple-400"/><span className="text-sm tracking-wide">1. Cliente</span></div>
          {clienteId&&<span className="text-[9px] rounded-full border border-green-500/20 bg-green-500/[.05] px-2.5 py-1 text-green-300">CLIENTE VINCULADO</span>}
        </div>

        {!clienteId&&<>
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300"/><Input autoFocus value={buscaCliente} onChange={e=>setBuscaCliente(e.target.value)} placeholder="Buscar por nome, telefone, CPF ou e-mail" className="pl-9"/></div>
          {clientesEncontrados.length>0&&<div className="mt-2 rounded-xl border border-white/8 overflow-hidden">
            {clientesEncontrados.map(c=><button key={c.id} onClick={()=>selecionarCliente(c)} className="w-full text-left p-3 border-b last:border-0 border-white/5 hover:bg-purple-500/[.05] flex justify-between gap-3">
              <div><div className="text-xs text-white">{c.nome}</div><div className="text-[10px] text-[#6F6F79]">{c.telefone||"Sem telefone"}{c.documento?` · ${c.documento}`:""}</div></div><ChevronRight size={15} className="text-purple-300"/>
            </button>)}
          </div>}
          <div className="flex justify-between items-center mt-3">
            <div className="text-[9px] text-[#5F5F69]">{q.length>=2&&!clientesEncontrados.length?"Nenhum cliente encontrado.":"Selecione um cadastro existente para evitar duplicidade."}</div>
            <button onClick={()=>{limparCliente();setMostrarNovo(!mostrarNovo)}} className="text-xs text-purple-300">+ Cadastrar cliente</button>
          </div>
        </>}

        {clienteId&&<div className="rounded-xl border border-green-500/15 bg-green-500/[.025] p-4 flex justify-between gap-3">
          <div><div className="text-sm text-white">{clienteNome}</div><div className="text-xs text-[#777782] mt-1">{clienteTelefone||"Sem telefone"}{clienteCpf?` · ${clienteCpf}`:""}</div></div>
          <button onClick={limparCliente} className="text-[10px] text-cyan-300">Trocar cliente</button>
        </div>}

        {!clienteId&&mostrarNovo&&<div className="mt-4 pt-4 border-t border-white/8">
          <div className="text-[9px] tracking-[.2em] text-cyan-300 mb-3">CADASTRO RÁPIDO</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={clienteNome} onChange={e=>setClienteNome(e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input value={clienteTelefone} onChange={e=>setClienteTelefone(e.target.value)} placeholder="(00) 00000-0000"/></div>
            <div><Label>CPF</Label><Input value={clienteCpf} onChange={e=>setClienteCpf(e.target.value)}/></div>
            <div><Label>Endereço</Label><Input value={clienteEndereco} onChange={e=>setClienteEndereco(e.target.value)}/></div>
          </div>
          {clienteTelefone&&clientes.some(c=>norm(c.telefone)===norm(clienteTelefone))&&<div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[.04] p-2 text-[10px] text-amber-200">Este telefone já existe na base. Ao salvar, o sistema selecionará o cliente existente em vez de duplicá-lo.</div>}
          <Button className="mt-3" disabled={!clienteNome.trim()||salvandoCliente} onClick={cadastrarESelecionar}>{salvandoCliente?"Salvando...":"Salvar e vincular cliente"}</Button>
        </div>}
      </Card>

      <div className={"grid lg:grid-cols-2 gap-4 transition "+(!clienteId?"opacity-40 pointer-events-none":"")}>
        <Card className="!rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-[#C9C9D2]"><Smartphone size={16} className="text-purple-400"/><span className="text-sm tracking-wide">2. Aparelho</span></div>
          <div className="flex gap-2 mb-3">
            {[{id:"smartphone",label:"Celular"},{id:"tablet",label:"Tablet"},{id:"notebook",label:"Notebook"},{id:"outro",label:"Outro"}].map(t=><button key={t.id} onClick={()=>setAparelhoTipo(t.id)} className={"flex-1 py-2 rounded-lg text-[11px] uppercase tracking-wide border "+(aparelhoTipo===t.id?"border-purple-500 text-purple-300 bg-purple-500/10":"border-[#2A2A34] text-[#8A8A96]")}>{t.label}</button>)}
          </div>
          <Label>Marca / modelo *</Label><Input value={aparelhoMarcaModelo} onChange={e=>setAparelhoMarcaModelo(e.target.value)} placeholder="Ex: iPhone 13 Pro" className="mb-3"/>
          <Label>Número de série / IMEI</Label><Input value={aparelhoSerial} onChange={e=>setAparelhoSerial(e.target.value)} placeholder="Opcional" className="mb-3"/>
          <Label>Cor</Label><Input value={aparelhoCor} onChange={e=>setAparelhoCor(e.target.value)} placeholder="Ex: Preto, Roxo, Titânio natural" className="mb-3"/>
          <Label>Acessórios recebidos</Label><Input value={acessoriosRecebidos} onChange={e=>setAcessoriosRecebidos(e.target.value)} placeholder="Ex: aparelho + carregador + capa"/>
        </Card>
        <Card className="!rounded-2xl">
          <div className="text-[9px] tracking-[.2em] text-purple-300 mb-3">3. MOTIVO DO ATENDIMENTO</div>
          <Label>Problema relatado *</Label><Textarea rows={5} value={problemaRelatado} onChange={e=>setProblemaRelatado(e.target.value)} placeholder="Descreva com as palavras do cliente."/>
          <div className="mt-3"><Label>Previsão inicial</Label><Input type="date" value={previsaoEntrega} onChange={e=>setPrevisaoEntrega(e.target.value)}/></div>
        </Card>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" className="min-w-28" onClick={onCancelar}>Cancelar</Button>
        <Button className="min-w-40" disabled={!podeCriar} onClick={()=>onCriar({
          clienteId,clienteNome,clienteTelefone,clienteCpf,clienteEndereco,
          aparelhoTipo,aparelhoMarcaModelo,aparelhoSerial,aparelhoCor,problemaRelatado,acessoriosRecebidos,previsaoEntrega
        })}><span className="flex items-center justify-center gap-2"><Plus size={15}/> Abrir OS vinculada</span></Button>
      </div>
    </div>
  );
}

/* ================= OS: DETALHE ================= */
function DetalheOS({ detail, estoque, onSalvar, onAddPeca, onRemovePeca }) {
  const [sub, setSub] = useState("entrada");
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const [novoItemCondicao, setNovoItemCondicao] = useState("");
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [fotoEtapa, setFotoEtapa] = useState("entrada");
  const [fotoTipo, setFotoTipo] = useState("frente");
  const [fotoObs, setFotoObs] = useState("");
  const [buscaPeca, setBuscaPeca] = useState("");
  const [qtdPeca, setQtdPeca] = useState(1);
  const [mostrarAvulsa, setMostrarAvulsa] = useState(false);
  const [pecaAvulsa, setPecaAvulsa] = useState({ nome: "", qtd: 1, custo: "", preco: "" });
  const [notifMeio, setNotifMeio] = useState("whatsapp");
  const [assinaturaPedido, setAssinaturaPedido] = useState(null);
  const [assinaturaPedidoTipo, setAssinaturaPedidoTipo] = useState(null);
  const [orcamentoPedido, setOrcamentoPedido] = useState(null);

  useEffect(() => {
    if (!detail) return;
    const mapa = { recebido: "entrada", diagnostico: "checklist", aguardando_aprovacao: "orcamento", em_reparo: "pecas", pronto: "entrega", entregue: "entrega", cancelado: "linha" };
    setSub(mapa[detail.status] || "entrada");
  }, [detail?.id]);

  if (!detail) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>;
  }

  const etapaAtual = Math.max(0, FLUXO_PRINCIPAL.indexOf(detail.status));
  const statusMinimo = (id) => Math.max(0, FLUXO_PRINCIPAL.indexOf(id));
  const pode = (id) => etapaAtual >= statusMinimo(id);
  const totalPecas = (detail.pecasUsadas || []).reduce((s, p) => s + (Number(p.preco) || 0) * (Number(p.qtd) || 0), 0);
  const desconto = Number(detail.orcamento?.desconto) || 0;
  const valorEstimado = Math.max(0, (Number(detail.valorMaoDeObra) || 0) + totalPecas - desconto);
  const aprovacao = detail.orcamento?.status || "rascunho";
  const pecasResultados = estoque.filter((p) => p.categoria === "peca" && p.nome.toLowerCase().includes(buscaPeca.toLowerCase()));
  const testesFinais = detail.entrega?.testesFinais || [
    { id: "liga", item: "Liga / desliga", status: false },
    { id: "carga", item: "Carregamento", status: false },
    { id: "tela", item: "Tela / touch", status: false },
    { id: "audio", item: "Áudio / microfone", status: false },
    { id: "rede", item: "Wi‑Fi / Bluetooth / rede", status: false },
    { id: "camera", item: "Câmeras", status: false },
  ];
  const testesOk = testesFinais.every((t) => t.status === true);

  function registrarEvento(status, obs, extra = {}) {
    const agora = new Date().toISOString();
    const timeline = [...(detail.timeline || []), { id: genId(), status, timestamp: agora, obs }];
    onSalvar({ ...detail, ...extra, status, timeline });
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

  function concluirEntrada() {
    if (!detail.cliente?.nome?.trim() || !detail.aparelho?.marcaModelo?.trim() || !detail.problemaRelatado?.trim()) {
      alert("Preencha cliente, aparelho e problema relatado antes de iniciar o diagnóstico.");
      return;
    }
    registrarEvento("diagnostico", "Entrada concluída. Diagnóstico iniciado.");
    setSub("checklist");
  }

  function prepararOrcamento() {
    if (!detail.diagnosticoTecnico?.trim()) {
      alert("Descreva o diagnóstico técnico antes de montar o orçamento.");
      return;
    }
    const agora = new Date().toISOString();
    onSalvar({
      ...detail,
      timeline: [...(detail.timeline || []), { id: genId(), status: detail.status, timestamp: agora, obs: "Diagnóstico concluído. Orçamento em elaboração." }]
    });
    setSub("orcamento");
  }

  function enviarOrcamento() {
    if (valorEstimado <= 0) {
      alert("Informe mão de obra e/ou peças para gerar o orçamento.");
      return;
    }
    const agora = new Date().toISOString();
    const orcamento = { ...(detail.orcamento || {}), status: "pendente", enviadoEm: agora, valorProposto: valorEstimado };
    onSalvar({
      ...detail,
      orcamento,
      status: "aguardando_aprovacao",
      timeline: [...(detail.timeline || []), { id: genId(), status: "aguardando_aprovacao", timestamp: agora, obs: `Orçamento de ${fmt(valorEstimado)} enviado ao cliente.` }]
    });
  }

  async function criarLinkOrcamento() {
    try {
      const snapshot = {
        numero: detail.numero, cliente: detail.cliente?.nome || "", aparelho: `${detail.aparelho?.marca || ""} ${detail.aparelho?.modelo || ""}`.trim(),
        diagnostico: detail.diagnosticoTecnico || "", observacao: detail.orcamento?.observacao || "",
        maoObra: Number(detail.valorMaoDeObra) || 0, pecas: totalPecas, desconto, total: valorEstimado,
        prazo: detail.previsaoEntrega || null
      };
      const result = await rpc("enigma_criar_aprovacao_orcamento", { p_os_id: String(detail.id), p_snapshot: snapshot });
      const pedido = Array.isArray(result) ? result[0] : result;
      setOrcamentoPedido(pedido);
    } catch (e) { console.error("Erro ao gerar link do orçamento:", e); alert(`Não foi possível gerar o link do orçamento. ${e?.message || "Erro desconhecido."}`); }
  }
  function linkOrcamento(pedido = orcamentoPedido) {
    if (!pedido?.token) return "";
    return `${window.location.origin}${window.location.pathname}?orcamento=${encodeURIComponent(pedido.token)}`;
  }
  async function copiarLinkOrcamento() {
    const link = linkOrcamento(); if (!link) return;
    await navigator.clipboard.writeText(link); alert("Link do orçamento copiado.");
  }
  function enviarOrcamentoWhatsApp() {
    const link = linkOrcamento(); if (!link) return;
    const tel = String(detail.cliente?.telefone || "").replace(/\D/g, "");
    const msg = `Olá, ${detail.cliente?.nome || ""}! Aqui é da ENIGMA. O orçamento da OS #${detail.numero}, no valor de ${fmt(valorEstimado)}, está disponível para sua aprovação: ${link}`;
    window.open(`https://wa.me/${tel ? (tel.startsWith("55") ? tel : "55" + tel) : ""}?text=${encodeURIComponent(msg)}`, "_blank");
  }
  async function verificarOrcamento() {
    if (!orcamentoPedido?.token) return;
    try {
      const result = await rpc("enigma_status_aprovacao_orcamento", { p_token: orcamentoPedido.token });
      const p = Array.isArray(result) ? result[0] : result; setOrcamentoPedido(p);
      if (p?.status === "aprovado" || p?.status === "recusado") {
        const agora = p.decidido_em || new Date().toISOString();
        const novoStatus = p.status === "aprovado" ? "em_reparo" : "cancelado";
        const orcamento = { ...(detail.orcamento || {}), status: p.status, atualizadoEm: agora, metodo: "link_cliente", nomeAceite: p.nome_aceite };
        await onSalvar({ ...detail, orcamento, status: novoStatus, timeline: [...(detail.timeline || []), { id: genId(), status: novoStatus, timestamp: agora, obs: `Orçamento ${p.status} digitalmente por ${p.nome_aceite || "cliente"}.` }] });
        if (p.status === "aprovado") setSub("pecas");
      }
    } catch(e) { alert("Não foi possível verificar a decisão agora."); }
  }

  function registrarAprovacao(status) {
    if (detail.status !== "aguardando_aprovacao") {
      alert("Primeiro envie o orçamento ao cliente.");
      return;
    }
    const agora = new Date().toISOString();
    const orcamento = { ...(detail.orcamento || {}), status, atualizadoEm: agora };
    const novoStatus = status === "aprovado" ? "em_reparo" : "cancelado";
    const evento = status === "aprovado" ? "Orçamento aprovado pelo cliente. Reparo liberado." : "Orçamento recusado pelo cliente.";
    onSalvar({ ...detail, orcamento, status: novoStatus, timeline: [...(detail.timeline || []), { id: genId(), status: novoStatus, timestamp: agora, obs: evento }] });
    if (status === "aprovado") setSub("pecas");
  }

  function adicionarPecaAvulsa() {
    if (!pecaAvulsa.nome.trim() || Number(pecaAvulsa.preco) <= 0) {
      alert("Informe a descrição e o valor cobrado da peça avulsa.");
      return;
    }
    const peca = {
      id: genId(), origem: "avulsa", estoqueId: null, nome: pecaAvulsa.nome.trim(),
      qtd: Math.max(1, Number(pecaAvulsa.qtd) || 1),
      custo: Number(String(pecaAvulsa.custo).replace(",", ".")) || 0,
      preco: Number(String(pecaAvulsa.preco).replace(",", ".")) || 0,
    };
    onSalvar({ ...detail, pecasUsadas: [...(detail.pecasUsadas || []), peca] });
    setPecaAvulsa({ nome: "", qtd: 1, custo: "", preco: "" });
    setMostrarAvulsa(false);
  }

  async function uploadFotoStorage(file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const key = `os-${detail.numero}/${Date.now()}-${genId()}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/os-fotos/${key}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type || "image/jpeg",
        "x-upsert": "false",
      },
      body: file,
    });
    if (!res.ok) throw new Error(await res.text());
    return `${SUPABASE_URL}/storage/v1/object/public/os-fotos/${key}`;
  }

  async function handleFotos(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const novas = [];
      for (const file of files) {
        let dataUrl;
        try { dataUrl = await uploadFotoStorage(file); }
        catch { dataUrl = await resizeImage(file); }
        novas.push({
          id: genId(), dataUrl, etapa: fotoEtapa, tipo: fotoTipo,
          legenda: fotoObs.trim(), timestamp: new Date().toISOString()
        });
      }
      await onSalvar({ ...detail, fotos: [...(detail.fotos || []), ...novas] });
      setFotoObs("");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function removeFoto(id) { onSalvar({ ...detail, fotos: (detail.fotos || []).filter((f) => f.id !== id) }); }

  function atualizarTeste(id) {
    const novos = testesFinais.map((t) => t.id === id ? { ...t, status: !t.status } : t);
    onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), testesFinais: novos } });
  }

  function finalizarReparo() {
    if (!testesOk) {
      alert("Conclua todos os testes finais antes de liberar o aparelho.");
      return;
    }
    const agora = new Date().toISOString();
    onSalvar({
      ...detail,
      status: "pronto",
      entrega: { ...(detail.entrega || {}), testesFinais, prontoEm: agora },
      timeline: [...(detail.timeline || []), { id: genId(), status: "pronto", timestamp: agora, obs: "Reparo finalizado e aparelho liberado para retirada." }]
    });
  }

  function finalizarEntrega() {
    const pagamentoOk = detail.entrega?.pagamentoStatus === "pago" || Number(detail.valorFinal || valorEstimado) === 0;
    if (detail.status !== "pronto") {
      alert("Finalize o reparo e marque o aparelho como pronto antes da entrega.");
      return;
    }
    if (!pagamentoOk) {
      alert("Registre o pagamento antes de finalizar a entrega.");
      return;
    }
    if (!detail.entrega?.assinaturaEntrega) {
      alert("Colete a assinatura ou registre o aceite de retirada antes de finalizar a entrega.");
      return;
    }
    const agora = new Date().toISOString();
    onSalvar({
      ...detail,
      status: "entregue",
      entrega: { ...(detail.entrega || {}), entregueEm: agora },
      timeline: [...(detail.timeline || []), { id: genId(), status: "entregue", timestamp: agora, obs: "Aparelho entregue ao cliente." }]
    });
  }

  function registrarNotificacao() {
    const notificacoes = [...(detail.notificacoes || []), { id: genId(), timestamp: new Date().toISOString(), meio: notifMeio }];
    onSalvar({ ...detail, notificacoes });
  }

  function abrirWhatsApp() {
    const numero = String(detail.cliente.telefone || "").replace(/\D/g, "");
    if (!numero) return;
    const br = numero.startsWith("55") ? numero : `55${numero}`;
    const msg = `Olá, ${detail.cliente.nome}! Aqui é da ENIGMA. Sobre a OS #${detail.numero} do seu ${detail.aparelho.marcaModelo}: `;
    window.open(`https://wa.me/${br}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  async function criarPedidoAssinatura(tipo) {
    try {
      setAssinaturaPedidoTipo(tipo);
      const snapshot = {
        tipo,
        numero: detail.numero,
        cliente: detail.cliente?.nome || "Cliente",
        aparelho: detail.aparelho?.marcaModelo || "Aparelho",
        termo: tipo === "entrada" ? (detail.termos || TERMO_PADRAO) : `Confirmo a retirada do aparelho referente à OS #${detail.numero}, ciência dos serviços realizados e da garantia informada pela ENIGMA.`,
        garantiaDias: detail.entrega?.garantiaDias ?? 90,
        total: Number(detail.valorFinal || valorEstimado) || 0,
      };
      const result = await rpc("enigma_criar_assinatura", { p_os_id: String(detail.id), p_tipo: tipo, p_snapshot: snapshot });
      const pedido = Array.isArray(result) ? result[0] : result;
      setAssinaturaPedido(pedido);
    } catch (e) {
      console.error(e);
      alert("Não foi possível gerar o link de assinatura. Confira se o SQL da V2.3 foi executado.");
    }
  }

  async function verificarPedidoAssinatura() {
    if (!assinaturaPedido?.token) return;
    try {
      const result = await rpc("enigma_status_assinatura", { p_token: assinaturaPedido.token });
      const pedido = Array.isArray(result) ? result[0] : result;
      setAssinaturaPedido(pedido);
      if (pedido?.status === "concluido" && pedido?.assinatura_data_url) {
        const assinatura = {
          dataUrl: pedido.assinatura_data_url,
          timestamp: pedido.concluido_em || new Date().toISOString(),
          nome: pedido.nome_aceite || detail.cliente?.nome || "Cliente",
          metodo: "link",
        };
        if (assinaturaPedidoTipo === "entrada") {
          await onSalvar({ ...detail, assinaturaCliente: assinatura });
        } else {
          await onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), assinaturaEntrega: assinatura } });
        }
        setAssinaturaPedido(null);
        setAssinaturaPedidoTipo(null);
      }
    } catch (e) {
      console.error(e);
      alert("Não foi possível verificar a assinatura agora.");
    }
  }

  function linkAssinatura(pedido = assinaturaPedido) {
    if (!pedido?.token) return "";
    return `${window.location.origin}${window.location.pathname}?assinar=${encodeURIComponent(pedido.token)}`;
  }

  async function copiarLinkAssinatura() {
    const link = linkAssinatura();
    if (!link) return;
    try { await navigator.clipboard.writeText(link); alert("Link copiado."); }
    catch { window.prompt("Copie o link:", link); }
  }

  function enviarAssinaturaWhatsApp() {
    const link = linkAssinatura();
    const numero = String(detail.cliente?.telefone || "").replace(/\D/g, "");
    const br = numero ? (numero.startsWith("55") ? numero : `55${numero}`) : "";
    const etapa = assinaturaPedidoTipo === "entrada" ? "termo de entrada" : "termo de retirada";
    const msg = `Olá, ${detail.cliente?.nome || ""}! Aqui é da ENIGMA. Para assinar o ${etapa} da OS #${detail.numero}, acesse: ${link}`;
    window.open(`https://wa.me/${br}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  function registrarAceitePresencial(tipo) {
    const nome = window.prompt("Nome de quem está dando o aceite:", detail.cliente?.nome || "");
    if (!nome?.trim()) return;
    const agora = new Date().toISOString();
    const aceite = { tipo: "aceite_presencial", nome: nome.trim(), timestamp: agora, metodo: "presencial" };
    if (tipo === "entrada") {
      onSalvar({ ...detail, assinaturaCliente: aceite, timeline: [...(detail.timeline || []), { id: genId(), status: detail.status, timestamp: agora, obs: `Aceite presencial do termo de entrada registrado por ${nome.trim()}.` }] });
    } else {
      onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), assinaturaEntrega: aceite }, timeline: [...(detail.timeline || []), { id: genId(), status: detail.status, timestamp: agora, obs: `Aceite presencial de retirada registrado por ${nome.trim()}.` }] });
    }
  }

  function imprimirComprovanteEntrada(){
    const c=detail.cliente||{}, a=detail.aparelho||{};
    const aceite=detail.assinaturaCliente;
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comprovante de Entrada OS ${escapeHtml(detail.numero)}</title><style>
      @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11px;line-height:1.4}
      ${enigmaPrintCss()}
      .title{font-size:15px;font-weight:800;margin:12px 0 3px}.muted{color:#666;font-size:9px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 16px}.box{border:1px solid #bbb;border-radius:7px;padding:10px;margin-top:10px}.label{font-size:8px;color:#666;text-transform:uppercase;letter-spacing:.8px}.value{font-size:11px;margin-top:2px}.full{grid-column:1/-1}.sign{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:48px}.line{border-top:1px solid #111;padding-top:5px;text-align:center;font-size:9px}.notice{font-size:9px;color:#555;margin-top:14px}
    </style></head><body>
      ${enigmaPrintHeader("Comprovante de entrada / recebimento",`OS #${escapeHtml(detail.numero)}`)}
      <div class="title">Comprovante de recebimento do aparelho</div>
      <div class="muted">Entrada registrada em ${formatDateTimePrint(detail.dataEntrada)} · Guarde este comprovante para acompanhamento e retirada.</div>

      <div class="box"><div class="grid">
        <div><div class="label">Cliente</div><div class="value"><strong>${escapeHtml(c.nome||"Não informado")}</strong></div></div>
        <div><div class="label">Telefone / WhatsApp</div><div class="value">${escapeHtml(c.telefone||"Não informado")}</div></div>
        <div><div class="label">CPF / Documento</div><div class="value">${escapeHtml(c.cpf||c.documento||"Não informado")}</div></div>
        <div><div class="label">Endereço</div><div class="value">${escapeHtml(c.endereco||"Não informado")}</div></div>
      </div></div>

      <div class="box"><div class="grid">
        <div><div class="label">Aparelho</div><div class="value"><strong>${escapeHtml(a.marcaModelo||"Não informado")}</strong></div></div>
        <div><div class="label">IMEI / Serial</div><div class="value">${escapeHtml(a.serial||"Não informado")}</div></div>
        <div><div class="label">Cor</div><div class="value">${escapeHtml(a.cor||"Não informada")}</div></div>
        <div><div class="label">Acessórios recebidos</div><div class="value">${escapeHtml(a.acessoriosRecebidos||detail.acessoriosRecebidos||"Nenhum informado")}</div></div>
        <div class="full"><div class="label">Defeito / problema relatado pelo cliente</div><div class="value">${escapeHtml(detail.problemaRelatado||"Não informado")}</div></div>
        <div class="full"><div class="label">Estado / observações de entrada</div><div class="value">${escapeHtml(detail.observacoesEntrada||detail.observacoes||"Sem observações adicionais registradas.")}</div></div>
        <div><div class="label">Previsão inicial</div><div class="value">${detail.previsaoEntrega?new Date(detail.previsaoEntrega+"T12:00:00").toLocaleDateString("pt-BR"):"A confirmar após diagnóstico"}</div></div>
        <div><div class="label">Status</div><div class="value">${escapeHtml(STATUS[detail.status]?.label||detail.status||"Recebido")}</div></div>
      </div></div>

      <div class="notice">O aparelho foi recebido para avaliação/serviço conforme as informações acima. Diagnóstico, orçamento, prazo definitivo e condições de reparo poderão ser informados após análise técnica. Este comprovante identifica a entrada do equipamento na ENIGMA.</div>
      <div class="sign"><div class="line">CLIENTE<br/>${escapeHtml(aceite?.nome||c.nome||"Assinatura")}</div><div class="line">ENIGMA<br/>Responsável pelo recebimento</div></div>
      ${enigmaPrintFooter()}
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script>
    </body></html>`;
    openPrintHtml(html);
  }

  const tabs = [
    { id: "entrada", label: "Entrada", min: "recebido" },
    { id: "checklist", label: "Diagnóstico", min: "diagnostico" },
    { id: "orcamento", label: "Orçamento / Aprovação", min: "diagnostico" },
    { id: "pecas", label: "Peças", min: "diagnostico" },
    { id: "fotos", label: "Fotos", min: "recebido" },
    { id: "entrega", label: "Entrega / Garantia", min: "em_reparo" },
    { id: "termo", label: "Termos / Assinaturas", min: "recebido" },
    { id: "linha", label: "Histórico", min: "recebido" },
  ];

  const fotosDaEtapa = (etapa) => (detail.fotos || []).filter((f) => (f.etapa || "geral") === etapa);

  return (
    <div className="space-y-4">
      <Card className="!rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-white">OS #{detail.numero} · {detail.cliente.nome}</div>
            <div className="text-xs text-[#8A8A96] mt-1">{detail.aparelho.marcaModelo}{detail.aparelho.serial ? ` · ${detail.aparelho.serial}` : ""}</div>
            <div className="text-xs text-[#777782] mt-1">{detail.problemaRelatado}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={detail.status} />
            <div className="flex gap-2">
              {detail.cliente.telefone && <button onClick={abrirWhatsApp} className="flex items-center gap-1 text-[11px] text-green-300 border border-green-500/20 bg-green-500/[.06] rounded-full px-2.5 py-1"><Phone size={12}/> WhatsApp</button>}
              <button onClick={imprimirComprovanteEntrada} className="flex items-center gap-1 text-[11px] text-purple-200 border border-purple-500/25 bg-purple-500/[.07] rounded-full px-2.5 py-1"><Printer size={12}/> Comprovante de entrada</button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-purple-500/15 bg-purple-500/[.025] p-3">
          <div className="flex items-center justify-between gap-3 mb-3"><div className="text-[9px] tracking-[.2em] text-purple-300">JORNADA DO ATENDIMENTO</div><div className="text-[9px] text-[#666672]">OS #{detail.numero}</div></div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
            {[
              ["recebido","Entrada"],["diagnostico","Diagnóstico"],["aguardando_aprovacao","Aprovação"],["em_reparo","Reparo"],
              ["pronto","Pronto"],["pronto","Pagamento"],["entregue","Entrega"],["entregue","Pós-venda"]
            ].map(([id,label],idx)=>{
              const alvo=Math.max(0,FLUXO_PRINCIPAL.indexOf(id));
              const concluida=etapaAtual>alvo||(detail.status==="entregue"&&id==="entregue");
              const atual=etapaAtual===alvo&&detail.status!=="entregue";
              return <button key={idx} onClick={()=>{if(id==="recebido")setSub("entrada");else if(id==="diagnostico")setSub("checklist");else if(id==="aguardando_aprovacao")setSub("orcamento");else if(id==="em_reparo")setSub("reparo");else setSub("entrega")}} className={"rounded-lg border px-2 py-2 text-center "+(atual?"border-purple-400/40 bg-purple-500/15 text-purple-200":concluida?"border-green-500/20 bg-green-500/[.05] text-green-300":"border-white/8 bg-white/[.01] text-[#5F5F69]")}>
                <div className="font-mono text-[9px]">{concluida?"✓":String(idx+1).padStart(2,"0")}</div><div className="text-[8px] mt-1 truncate">{label}</div>
              </button>
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-1.5">
          {FLUXO_PRINCIPAL.map((id, idx) => (
            <div key={id} className="min-w-0">
              <div className={"h-1.5 rounded-full transition-all " + (idx <= etapaAtual ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" : "bg-[#25252D]")} />
              <div className={"hidden md:block text-[10px] mt-1.5 truncate " + (idx === etapaAtual ? "text-white" : idx < etapaAtual ? "text-purple-300" : "text-[#555560]")}>{statusInfo(id).label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-[#686873]">O andamento é controlado pelas ações de cada etapa. Etapas futuras ficam bloqueadas até o fluxo avançar.</div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const liberada = pode(t.min);
          return (
            <button
              key={t.id}
              disabled={!liberada}
              onClick={() => liberada && setSub(t.id)}
              className={"shrink-0 px-3 py-1.5 rounded-full text-xs tracking-wide border transition " +
                (sub === t.id ? "border-purple-500 text-purple-300 bg-purple-500/10" :
                 liberada ? "border-[#2A2A34] text-[#8A8A96] hover:text-white" :
                 "border-[#202027] text-[#44444D] cursor-not-allowed")}
            >
              {!liberada && <Lock size={10} className="inline mr-1"/>}{t.label}
            </button>
          );
        })}
      </div>

      {sub === "entrada" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><div className="text-sm font-medium text-white">Recebimento do aparelho</div><div className="text-xs text-[#73737E] mt-1">Confira os dados e registre a condição física antes de iniciar o diagnóstico.</div></div>
              {detail.status === "recebido" && <span className="text-[10px] text-blue-300 border border-blue-500/20 bg-blue-500/10 rounded-full px-2 py-1">ETAPA ATUAL</span>}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input placeholder="Nome" value={detail.cliente.nome || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, nome: e.target.value } })}/>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Telefone" value={detail.cliente.telefone || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, telefone: e.target.value } })}/>
                  <Input placeholder="CPF" value={detail.cliente.cpf || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, cpf: e.target.value } })}/>
                </div>
                <Input placeholder="Endereço" value={detail.cliente.endereco || ""} onChange={(e) => onSalvar({ ...detail, cliente: { ...detail.cliente, endereco: e.target.value } })}/>
              </div>
              <div className="space-y-2">
                <Label>Aparelho</Label>
                <Input placeholder="Marca / modelo" value={detail.aparelho.marcaModelo || ""} onChange={(e) => onSalvar({ ...detail, aparelho: { ...detail.aparelho, marcaModelo: e.target.value } })}/>
                <Input placeholder="Serial / IMEI" value={detail.aparelho.serial || ""} onChange={(e) => onSalvar({ ...detail, aparelho: { ...detail.aparelho, serial: e.target.value } })}/>
                <Input placeholder="Acessórios recebidos" value={detail.acessoriosRecebidos || ""} onChange={(e) => onSalvar({ ...detail, acessoriosRecebidos: e.target.value })}/>
                <Input type="date" value={detail.previsaoEntrega || ""} onChange={(e) => onSalvar({ ...detail, previsaoEntrega: e.target.value })}/>
              </div>
            </div>
            <div className="mt-3"><Label>Problema relatado</Label><Textarea rows={3} value={detail.problemaRelatado || ""} onChange={(e) => onSalvar({ ...detail, problemaRelatado: e.target.value })}/></div>
          </Card>

          <Card>
            <Label>Condição física na entrada</Label>
            <div className="text-[11px] text-[#6E6E78] mb-2">Toque no item: não verificado → sem avaria → com avaria.</div>
            <div className="grid md:grid-cols-2 gap-x-5">
              {(detail.condicaoAparelho || []).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#22222A]">
                  <button onClick={() => toggleCondicao(c.id)} className="flex items-center gap-2.5 flex-1 text-left">
                    {c.status === "ok" && <CheckCircle2 size={16} className="text-green-500"/>}
                    {c.status === "defeito" && <XCircle size={16} className="text-red-500"/>}
                    {c.status === "nao_testado" && <Circle size={16} className="text-[#4A4A54]"/>}
                    <span className={"text-sm " + (c.status === "defeito" ? "text-red-300" : "text-[#E5E5EA]")}>{c.item}</span>
                  </button>
                  <button onClick={() => removeCondicaoItem(c.id)} className="text-[#555560] hover:text-red-400"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input placeholder="Adicionar item de vistoria" value={novoItemCondicao} onChange={(e) => setNovoItemCondicao(e.target.value)}/>
              <Button onClick={addCondicaoItem} className="px-3"><Plus size={15}/></Button>
            </div>
            <div className="mt-3"><Label>Observações de avaria</Label><Textarea rows={2} value={detail.observacoesCondicao || ""} onChange={(e) => onSalvar({ ...detail, observacoesCondicao: e.target.value })} placeholder="Ex: trinca no canto superior direito, amassado na lateral..."/></div>
            {detail.status === "recebido" && <Button className="w-full mt-4" onClick={concluirEntrada}><span className="flex items-center justify-center gap-2">Concluir entrada e iniciar diagnóstico <ArrowRight size={15}/></span></Button>}
          </Card>
        </div>
      )}

      {sub === "checklist" && (
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div><div className="text-sm font-medium text-white">Diagnóstico técnico</div><div className="text-xs text-[#73737E] mt-1">Registre somente o que foi efetivamente testado.</div></div>
            {detail.status === "diagnostico" && <span className="text-[10px] text-blue-300 border border-blue-500/20 bg-blue-500/10 rounded-full px-2 py-1">EM DIAGNÓSTICO</span>}
          </div>
          <div className="grid md:grid-cols-2 gap-x-5">
            {detail.checklist.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#22222A]">
                <button onClick={() => toggleChecklist(c.id)} className="flex items-center gap-2.5 flex-1 text-left">
                  {c.status === "ok" && <CheckCircle2 size={16} className="text-green-500"/>}
                  {c.status === "defeito" && <XCircle size={16} className="text-red-500"/>}
                  {c.status === "nao_testado" && <Circle size={16} className="text-[#4A4A54]"/>}
                  <span className={"text-sm " + (c.status === "defeito" ? "text-red-300" : "text-[#E5E5EA]")}>{c.item}</span>
                </button>
                <button onClick={() => removeChecklistItem(c.id)} className="text-[#555560] hover:text-red-400"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input placeholder="Adicionar item ao checklist" value={novoItem} onChange={(e) => setNovoItem(e.target.value)}/>
            <Button onClick={addChecklistItem} className="px-3"><Plus size={15}/></Button>
          </div>
          <div className="mt-4 pt-4 border-t border-[#2A2A34]">
            <Label>Laudo / diagnóstico</Label>
            <Textarea rows={4} value={detail.diagnosticoTecnico || ""} onChange={(e) => onSalvar({ ...detail, diagnosticoTecnico: e.target.value })} placeholder="Defeito encontrado, testes realizados e solução recomendada."/>
          </div>
          {detail.status === "diagnostico" && <Button className="w-full mt-4" onClick={prepararOrcamento}><span className="flex items-center justify-center gap-2">Concluir diagnóstico e montar orçamento <ArrowRight size={15}/></span></Button>}
        </Card>
      )}

      {sub === "orcamento" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><div className="text-sm font-medium text-white">Orçamento</div><div className="text-xs text-[#73737E] mt-1">Peças entram automaticamente a partir da aba Peças.</div></div>
              <span className={"text-[10px] uppercase tracking-[.14em] px-2.5 py-1.5 rounded-full border " + (aprovacao === "aprovado" ? "text-green-300 border-green-500/30 bg-green-500/10" : aprovacao === "recusado" ? "text-red-300 border-red-500/30 bg-red-500/10" : "text-amber-300 border-amber-500/30 bg-amber-500/10")}>{aprovacao === "aprovado" ? "Aprovado" : aprovacao === "recusado" ? "Recusado" : detail.status === "aguardando_aprovacao" ? "Aguardando cliente" : "Rascunho"}</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div><Label>Mão de obra</Label><Input inputMode="decimal" value={detail.valorMaoDeObra ?? ""} onChange={(e) => onSalvar({ ...detail, valorMaoDeObra: e.target.value.replace(",", ".") })} placeholder="R$ 0,00"/></div>
              <div><Label>Peças</Label><div className="h-[42px] rounded-lg border border-[#2A2A34] bg-[#0F0F14] px-3 flex items-center justify-between"><span className="font-mono text-[#E5E5EA]">{fmt(totalPecas)}</span><button onClick={() => setSub("pecas")} className="text-[11px] text-purple-300">editar</button></div></div>
              <div><Label>Desconto</Label><Input inputMode="decimal" value={detail.orcamento?.desconto ?? ""} onChange={(e) => onSalvar({ ...detail, orcamento: { ...(detail.orcamento || {}), desconto: e.target.value.replace(",", ".") } })} placeholder="R$ 0,00"/></div>
            </div>
            <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/[.06] p-4 flex items-center justify-between">
              <div><div className="text-[10px] uppercase tracking-[.18em] text-purple-300">Total proposto</div><div className="text-xs text-[#777782] mt-1">Mão de obra + peças − desconto</div></div>
              <div className="font-mono text-2xl text-white">{fmt(valorEstimado)}</div>
            </div>
            <div className="mt-4"><Label>Observação do orçamento</Label><Textarea rows={3} value={detail.orcamento?.observacao || ""} onChange={(e) => onSalvar({ ...detail, orcamento: { ...(detail.orcamento || {}), observacao: e.target.value } })} placeholder="Prazo, condição da peça, observações..."/></div>
            {detail.status === "diagnostico" && <Button className="w-full mt-4" onClick={enviarOrcamento}><span className="flex items-center justify-center gap-2">Enviar orçamento e aguardar aprovação <ArrowRight size={15}/></span></Button>}
          </Card>

          <Card>
            <Label>Decisão do cliente</Label>
            <div className="text-xs text-[#73737E] mb-3">{detail.status === "aguardando_aprovacao" ? "Orçamento enviado. Registre a decisão quando o cliente responder." : aprovacao === "aprovado" ? "Orçamento aprovado e reparo liberado." : "Envie o orçamento antes de registrar a decisão."}</div>
            <div className="grid sm:grid-cols-2 gap-2">
              <Button disabled={detail.status !== "aguardando_aprovacao"} onClick={() => registrarAprovacao("aprovado")}><span className="flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Aprovar orçamento</span></Button>
              <Button variant="danger" disabled={detail.status !== "aguardando_aprovacao"} onClick={() => registrarAprovacao("recusado")}><span className="flex items-center justify-center gap-2"><XCircle size={16}/> Registrar recusa</span></Button>
            </div>
            {detail.orcamento?.atualizadoEm && <div className="text-[11px] text-[#666672] mt-3">Última decisão: {fmtDateTime(detail.orcamento.atualizadoEm)}.</div>}
            {detail.status === "aguardando_aprovacao" && <div className="mt-4 pt-4 border-t border-[#25252E]">
              <div className="text-xs uppercase tracking-[.14em] text-purple-300 mb-2">Aceite digital do cliente</div>
              <div className="text-xs text-[#777782] mb-3">Gere um link seguro para o cliente conferir o orçamento e aprovar ou recusar pelo celular.</div>
              {!orcamentoPedido?.token ? <Button className="w-full" onClick={criarLinkOrcamento}><LinkIcon size={15} className="inline mr-2"/>Gerar link de aprovação</Button> : <div className="rounded-xl border border-purple-500/25 bg-[#0C0C12] p-3">
                <div className="grid sm:grid-cols-[130px_1fr] gap-3 items-center"><div className="bg-white rounded-lg p-2 w-fit mx-auto"><QRCodeSVG value={linkOrcamento()} size={112}/></div><div>
                  <div className="text-[11px] text-[#888894] break-all">{linkOrcamento()}</div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2"><Button variant="ghost" onClick={copiarLinkOrcamento}><Copy size={14} className="inline mr-1"/>Copiar</Button><Button variant="ghost" onClick={enviarOrcamentoWhatsApp}><Send size={14} className="inline mr-1"/>WhatsApp</Button></div>
                  <Button className="w-full mt-2" onClick={verificarOrcamento}><RefreshCw size={14} className="inline mr-1"/>Verificar decisão</Button>
                </div></div>
              </div>}
            </div>}

          </Card>
        </div>
      )}

      {sub === "pecas" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div><div className="text-sm font-medium text-white">Peças do reparo</div><div className="text-xs text-[#73737E] mt-1">Use estoque quando existir ou lance uma peça avulsa/sob encomenda.</div></div>
              <Button variant="ghost" onClick={() => setMostrarAvulsa(!mostrarAvulsa)}><span className="flex items-center gap-2"><Plus size={14}/> Peça avulsa</span></Button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A64]"/><Input className="pl-9" placeholder="Buscar peça no estoque" value={buscaPeca} onChange={(e) => setBuscaPeca(e.target.value)}/></div>
              <Stepper value={qtdPeca} onChange={setQtdPeca}/>
            </div>
            {buscaPeca && <div className="space-y-1 max-h-44 overflow-y-auto mb-3">
              {pecasResultados.length === 0 && <div className="text-xs text-[#5A5A64] py-3">Nenhuma peça cadastrada com esse nome.</div>}
              {pecasResultados.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0F0F14] border border-[#2A2A34]">
                  <div><div className="text-sm text-white">{p.nome}</div><div className="text-xs text-[#6E6E78]">{fmt(p.preco)} · estoque {p.quantidade}</div></div>
                  <Button disabled={p.quantidade < qtdPeca} className="px-3" onClick={() => { onAddPeca(p, qtdPeca); setBuscaPeca(""); setQtdPeca(1); }}><Plus size={14}/></Button>
                </div>
              ))}
            </div>}

            {mostrarAvulsa && <div className="rounded-xl border border-purple-500/20 bg-purple-500/[.04] p-4 mb-4">
              <Label>Nova peça avulsa</Label>
              <div className="grid md:grid-cols-4 gap-2 mt-2">
                <Input className="md:col-span-2" placeholder="Descrição da peça" value={pecaAvulsa.nome} onChange={(e) => setPecaAvulsa({ ...pecaAvulsa, nome: e.target.value })}/>
                <Input type="number" min="1" placeholder="Qtd." value={pecaAvulsa.qtd} onChange={(e) => setPecaAvulsa({ ...pecaAvulsa, qtd: e.target.value })}/>
                <Input inputMode="decimal" placeholder="Valor cobrado" value={pecaAvulsa.preco} onChange={(e) => setPecaAvulsa({ ...pecaAvulsa, preco: e.target.value })}/>
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-2 mt-2">
                <Input inputMode="decimal" placeholder="Custo da peça (opcional)" value={pecaAvulsa.custo} onChange={(e) => setPecaAvulsa({ ...pecaAvulsa, custo: e.target.value })}/>
                <Button onClick={adicionarPecaAvulsa}>Adicionar ao orçamento</Button>
              </div>
              <div className="text-[11px] text-[#666672] mt-2">Peça avulsa entra no orçamento, mas não altera o estoque.</div>
            </div>}

            {(detail.pecasUsadas || []).length === 0 ? <div className="text-sm text-[#5A5A64] text-center py-5">Nenhuma peça adicionada</div> :
              <div className="divide-y divide-[#22222A]">
                {detail.pecasUsadas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div><div className="text-sm text-white">{p.nome}</div><div className="text-xs text-[#6E6E78]">{p.qtd}x {fmt(p.preco)} · {p.estoqueId ? "estoque" : "avulsa"}</div></div>
                    <div className="flex items-center gap-3"><span className="font-mono text-sm">{fmt(p.preco * p.qtd)}</span><button onClick={() => onRemovePeca(p)} className="text-[#666672] hover:text-red-400"><Trash2 size={15}/></button></div>
                  </div>
                ))}
              </div>}
            {(detail.pecasUsadas || []).length > 0 && <div className="flex justify-between border-t border-[#2A2A34] pt-3 mt-3"><span className="text-sm text-[#8A8A96]">Total em peças</span><span className="font-mono text-white">{fmt(totalPecas)}</span></div>}
          </Card>
        </div>
      )}

      {sub === "fotos" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><div className="text-sm font-medium text-white">Vistoria fotográfica</div><div className="text-xs text-[#73737E] mt-1">Cada foto fica identificada por momento, ângulo e horário.</div></div>
              <Camera size={18} className="text-purple-300"/>
            </div>

            <div className="grid sm:grid-cols-3 gap-2">
              <div><Label>Momento</Label><select value={fotoEtapa} onChange={(e) => setFotoEtapa(e.target.value)} className="w-full h-[42px] bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 text-sm outline-none"><option value="entrada">Entrada</option><option value="reparo">Durante o reparo</option><option value="saida">Saída</option></select></div>
              <div><Label>Tipo / ângulo</Label><select value={fotoTipo} onChange={(e) => setFotoTipo(e.target.value)} className="w-full h-[42px] bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 text-sm outline-none"><option value="frente">Frente</option><option value="verso">Verso</option><option value="lateral_esquerda">Lateral esquerda</option><option value="lateral_direita">Lateral direita</option><option value="avaria">Avaria / detalhe</option><option value="adicional">Foto adicional</option></select></div>
              <div><Label>Observação</Label><Input placeholder="Ex: trinca no canto..." value={fotoObs} onChange={(e) => setFotoObs(e.target.value)}/></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFotos}/>
            <Button variant="ghost" className="w-full mt-3" onClick={() => fileRef.current?.click()} disabled={uploading}><span className="flex items-center justify-center gap-2"><Camera size={16}/> {uploading ? "Enviando..." : "Adicionar foto nesta etapa"}</span></Button>
            <div className="text-[11px] text-[#60606A] mt-2">A V2.2 tenta salvar no Supabase Storage; se o bucket ainda não estiver disponível, mantém compatibilidade com o formato antigo.</div>
          </Card>

          {["entrada","reparo","saida"].map((etapa) => {
            const fs = fotosDaEtapa(etapa);
            const titulo = etapa === "entrada" ? "Entrada" : etapa === "reparo" ? "Durante o reparo" : "Saída";
            return <Card key={etapa}>
              <div className="flex items-center justify-between mb-3"><Label>{titulo}</Label><span className="text-[11px] text-[#666672]">{fs.length} foto(s)</span></div>
              {fs.length === 0 ? <div className="text-sm text-[#555560] text-center py-5">Nenhuma foto nesta etapa</div> :
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {fs.map((f) => <div key={f.id} className="rounded-lg border border-[#2A2A34] bg-[#0F0F14] overflow-hidden">
                    <div className="relative"><img src={f.dataUrl} onClick={() => setFotoAmpliada(f)} className="w-full aspect-square object-cover cursor-pointer"/><button onClick={() => removeFoto(f.id)} className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white"><X size={12}/></button></div>
                    <div className="p-2"><div className="text-[10px] uppercase tracking-wide text-purple-300">{(f.tipo || "foto").replaceAll("_"," ")}</div>{f.legenda && <div className="text-xs text-[#B7B7C0] mt-1">{f.legenda}</div>}<div className="text-[10px] text-[#555560] mt-1">{f.timestamp ? fmtDateTime(f.timestamp) : ""}</div></div>
                  </div>)}
                </div>}
            </Card>;
          })}
        </div>
      )}

      {sub === "entrega" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4"><div><div className="text-sm font-medium text-white">Finalização do reparo</div><div className="text-xs text-[#73737E] mt-1">Faça os testes finais antes de liberar para retirada.</div></div><StatusBadge status={detail.status}/></div>
            <div className="grid md:grid-cols-2 gap-2">
              {testesFinais.map((t) => <button key={t.id} onClick={() => atualizarTeste(t.id)} className={"flex items-center gap-2 p-3 rounded-lg border text-left text-sm " + (t.status ? "border-green-500/30 bg-green-500/[.06] text-green-200" : "border-[#2A2A34] bg-[#0F0F14] text-[#B8B8C1]")}><CheckCircle2 size={16} className={t.status ? "text-green-400" : "text-[#44444D]"}/>{t.item}</button>)}
            </div>
            {detail.status === "em_reparo" && <Button className="w-full mt-4" disabled={!testesOk} onClick={finalizarReparo}><span className="flex items-center justify-center gap-2">Finalizar reparo e liberar para retirada <ArrowRight size={15}/></span></Button>}
            {!testesOk && detail.status === "em_reparo" && <div className="text-[11px] text-amber-300/80 text-center mt-2">Conclua todos os testes para liberar o aparelho.</div>}
          </Card>

          <Card>
            <div className="text-sm font-medium text-white mb-4">Entrega e garantia</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><Label>Garantia (dias)</Label><Input type="number" min="0" value={detail.entrega?.garantiaDias ?? 90} onChange={(e) => onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), garantiaDias: Number(e.target.value) } })}/></div>
              <div><Label>Valor final</Label><Input inputMode="decimal" value={detail.valorFinal ?? ""} placeholder={fmt(valorEstimado)} onChange={(e) => onSalvar({ ...detail, valorFinal: e.target.value.replace(",", ".") })}/></div>
              <div><Label>Pagamento</Label><select value={detail.entrega?.pagamentoStatus || "pendente"} onChange={(e) => onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), pagamentoStatus: e.target.value } })} className="w-full h-[42px] bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 text-sm"><option value="pendente">Pendente</option><option value="pago">Pago</option></select></div>
              <div><Label>Forma</Label><select value={detail.entrega?.formaPagamento || "pix"} onChange={(e) => onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), formaPagamento: e.target.value } })} className="w-full h-[42px] bg-[#0F0F14] border border-[#2A2A34] rounded-lg px-3 text-sm"><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="debito">Débito</option><option value="credito">Crédito</option><option value="outro">Outro</option></select></div>
            </div>
            <div className="mt-3"><Label>Observações de saída / garantia</Label><Textarea rows={3} value={detail.entrega?.observacoes || ""} onChange={(e) => onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), observacoes: e.target.value } })} placeholder="Orientações, itens cobertos pela garantia, condição final..."/></div>
            <div className="mt-4 p-3 rounded-xl border border-[#2A2A34] bg-[#0F0F14]"><div className="text-xs text-[#8A8A96]">Acessórios recebidos</div><div className="text-sm text-white mt-1">{detail.acessoriosRecebidos || "Nenhum acessório registrado"}</div></div>
          </Card>

          <Card>
            <Label>Assinatura de retirada</Label>
            <div className="text-[11px] text-[#6E6E78] mb-2">Confirma a retirada do aparelho e ciência da garantia.</div>
            <SignatureOptions
              tipo="retirada"
              assinatura={detail.entrega?.assinaturaEntrega || null}
              onSalvarDireto={(dataUrl) => onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), assinaturaEntrega: { dataUrl, timestamp: new Date().toISOString(), metodo: "dispositivo" } } })}
              onLimpar={() => onSalvar({ ...detail, entrega: { ...(detail.entrega || {}), assinaturaEntrega: null } })}
              onGerarLink={() => criarPedidoAssinatura("retirada")}
              onAceite={() => registrarAceitePresencial("retirada")}
              pedido={assinaturaPedidoTipo === "retirada" ? assinaturaPedido : null}
              link={assinaturaPedidoTipo === "retirada" ? linkAssinatura() : ""}
              onCopiar={copiarLinkAssinatura}
              onWhatsApp={enviarAssinaturaWhatsApp}
              onVerificar={verificarPedidoAssinatura}
            />
            {detail.status === "pronto" && <Button className="w-full mt-4" onClick={finalizarEntrega}><span className="flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Finalizar entrega e encerrar OS</span></Button>}
            {detail.entrega?.entregueEm && <div className="text-[11px] text-green-300 text-center mt-3">Entregue em {fmtDateTime(detail.entrega.entregueEm)}</div>}
          </Card>
        </div>
      )}

      {sub === "termo" && (
        <div className="space-y-4">
          <Card>
            <Label>Termo de entrada / condições do serviço</Label>
            <Textarea rows={7} value={detail.termos ?? TERMO_PADRAO} onChange={(e) => onSalvar({ ...detail, termos: e.target.value })} className="text-xs leading-relaxed"/>
          </Card>
          <Card>
            <Label>Assinatura de entrada</Label>
            <div className="text-[11px] text-[#6E6E78] mb-2">Confirma ciência da condição do aparelho, acessórios e condições de serviço.</div>
            <SignatureOptions
              tipo="entrada"
              assinatura={detail.assinaturaCliente}
              onSalvarDireto={(dataUrl) => onSalvar({ ...detail, assinaturaCliente: { dataUrl, timestamp: new Date().toISOString(), metodo: "dispositivo" } })}
              onLimpar={() => onSalvar({ ...detail, assinaturaCliente: null })}
              onGerarLink={() => criarPedidoAssinatura("entrada")}
              onAceite={() => registrarAceitePresencial("entrada")}
              pedido={assinaturaPedidoTipo === "entrada" ? assinaturaPedido : null}
              link={assinaturaPedidoTipo === "entrada" ? linkAssinatura() : ""}
              onCopiar={copiarLinkAssinatura}
              onWhatsApp={enviarAssinaturaWhatsApp}
              onVerificar={verificarPedidoAssinatura}
            />
          </Card>
          <Card>
            <Label>Registro da autorização</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><div className="text-xs text-[#777782]">Situação</div><div className="text-sm text-white mt-1 capitalize">{aprovacao === "rascunho" ? "Ainda não enviada" : aprovacao}</div></div>
              <div><div className="text-xs text-[#777782]">Horário</div><div className="text-sm text-white mt-1">{detail.orcamento?.atualizadoEm ? fmtDateTime(detail.orcamento.atualizadoEm) : "—"}</div></div>
            </div>
          </Card>
        </div>
      )}

      {sub === "linha" && (
        <div className="space-y-4">
          <Card>
            <Label>Histórico automático</Label>
            <div className="mt-3">
              {[...(detail.timeline || [])].reverse().map((t, idx) => (
                <div key={t.id} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ backgroundColor: statusInfo(t.status).color }}/>{idx < (detail.timeline || []).length - 1 && <span className="w-px flex-1 bg-[#2A2A34]"/>}</div>
                  <div className="pb-4"><div className="text-sm text-white">{statusInfo(t.status).label}</div><div className="text-[11px] text-[#666672] mt-0.5">{fmtDateTime(t.timestamp)}</div>{t.obs && <div className="text-xs text-[#9A9AA4] mt-1">{t.obs}</div>}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Notificações ao cliente</Label>
            <div className="flex gap-2 mt-2">
              {[{id:"whatsapp",label:"WhatsApp"},{id:"ligacao",label:"Ligação"},{id:"presencial",label:"Presencial"}].map((m)=><button key={m.id} onClick={()=>setNotifMeio(m.id)} className={"flex-1 py-2 rounded-lg text-xs border "+(notifMeio===m.id?"border-purple-500 text-purple-300 bg-purple-500/10":"border-[#2A2A34] text-[#8A8A96]")}>{m.label}</button>)}
            </div>
            <Button variant="ghost" className="w-full mt-2" onClick={registrarNotificacao}><BellRing size={14} className="inline mr-2"/>Registrar aviso</Button>
            <div className="divide-y divide-[#22222A] mt-3">{[...(detail.notificacoes || [])].reverse().map((n)=><div key={n.id} className="flex justify-between py-2 text-sm"><span className="capitalize">{n.meio}</span><span className="text-xs text-[#666672]">{fmtDateTime(n.timestamp)}</span></div>)}</div>
          </Card>
        </div>
      )}

      {fotoAmpliada && <div className="fixed inset-0 bg-black/90 z-20 flex items-center justify-center p-4" onClick={() => setFotoAmpliada(null)}><img src={fotoAmpliada.dataUrl} className="max-w-full max-h-[85vh] rounded-lg"/></div>}

      <style>{`
        .print-area { display: none; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { display: block; position: absolute; inset: 0; width: 100%; padding: 24px; color: #000; background: #fff; font-size: 12px; }
          .print-area h1 { font-size: 18px; margin-bottom: 4px; }
          .print-area h2 { font-size: 13px; margin: 14px 0 6px; border-bottom: 1px solid #999; padding-bottom: 3px; }
        }
      `}</style>
      <div className="print-area">
        <h1>ENIGMA — Ordem de Serviço #{detail.numero}</h1>
        <div>Entrada: {fmtDateTime(detail.dataEntrada)} · Status: {statusInfo(detail.status).label}</div>
        <h2>Cliente</h2><div>{detail.cliente.nome} · {detail.cliente.telefone || "—"} · CPF {detail.cliente.cpf || "—"}</div>
        <h2>Aparelho</h2><div>{detail.aparelho.marcaModelo} {detail.aparelho.serial ? `· ${detail.aparelho.serial}` : ""}</div><div>Relato: {detail.problemaRelatado}</div>
        <h2>Diagnóstico</h2><div>{detail.diagnosticoTecnico || "—"}</div>
        <h2>Orçamento</h2><div>Mão de obra: {fmt(detail.valorMaoDeObra)} · Peças: {fmt(totalPecas)} · Desconto: {fmt(desconto)} · Total: {fmt(detail.valorFinal || valorEstimado)}</div>
        <h2>Peças</h2>{(detail.pecasUsadas || []).map((pc)=><div key={pc.id}>{pc.qtd}x {pc.nome} — {fmt(pc.preco * pc.qtd)}</div>)}
        <h2>Garantia</h2><div>{detail.entrega?.garantiaDias ?? 90} dias</div><div>{detail.entrega?.observacoes || ""}</div>
        <h2>Termos</h2><div style={{ whiteSpace: "pre-wrap" }}>{detail.termos || TERMO_PADRAO}</div>
      </div>
    </div>
  );
}

function SignatureOptions({ tipo, assinatura, onSalvarDireto, onLimpar, onGerarLink, onAceite, pedido, link, onCopiar, onWhatsApp, onVerificar }) {
  const [modoDireto, setModoDireto] = useState(false);
  const titulo = tipo === "entrada" ? "Assinatura do termo de entrada" : "Assinatura de retirada";

  if (assinatura) {
    return (
      <div>
        <SignaturePad assinatura={assinatura} onSalvar={onSalvarDireto} onLimpar={onLimpar} />
        {assinatura.metodo && <div className="text-[10px] tracking-wide uppercase text-[#62626D] mt-2">Método: {assinatura.metodo === "link" ? "celular / link" : assinatura.metodo === "presencial" ? "aceite presencial" : assinatura.metodo}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <button type="button" onClick={onGerarLink} className="text-left rounded-xl border border-purple-500/30 bg-purple-500/[.07] p-3 hover:bg-purple-500/[.12] transition">
          <div className="flex items-center gap-2 text-purple-300 text-sm font-medium"><QrCode size={16}/> Celular / QR Code</div>
          <div className="text-[11px] text-[#777782] mt-1">Melhor opção no computador. O cliente assina com o dedo.</div>
        </button>
        <button type="button" onClick={() => setModoDireto(!modoDireto)} className="text-left rounded-xl border border-[#2A2A34] bg-[#0F0F14] p-3 hover:border-[#3A3A46] transition">
          <div className="flex items-center gap-2 text-[#D2D2DA] text-sm font-medium"><PenTool size={16}/> Neste dispositivo</div>
          <div className="text-[11px] text-[#777782] mt-1">Mouse, touch ou futuro tablet no balcão.</div>
        </button>
        <button type="button" onClick={onAceite} className="text-left rounded-xl border border-[#2A2A34] bg-[#0F0F14] p-3 hover:border-[#3A3A46] transition">
          <div className="flex items-center gap-2 text-[#D2D2DA] text-sm font-medium"><UserCheck size={16}/> Aceite presencial</div>
          <div className="text-[11px] text-[#777782] mt-1">Registra nome, data e hora sem desenho da assinatura.</div>
        </button>
      </div>

      {pedido?.token && (
        <div className="rounded-2xl border border-purple-500/25 bg-[#0C0C12] p-4">
          <div className="grid sm:grid-cols-[170px_1fr] gap-4 items-center">
            <div className="bg-white rounded-xl p-3 w-fit mx-auto">
              <QRCodeSVG value={link} size={146} level="M" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{titulo} pelo celular</div>
              <div className="text-xs text-[#777782] mt-1">O link é temporário. Após o cliente concluir, clique em “Verificar assinatura”.</div>
              <div className="mt-3 p-2.5 rounded-lg bg-[#131318] border border-[#2A2A34] text-[11px] text-[#9A9AA4] break-all">{link}</div>
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                <Button variant="ghost" onClick={onCopiar}><Copy size={14} className="inline mr-2"/>Copiar link</Button>
                <Button variant="ghost" onClick={onWhatsApp}><Send size={14} className="inline mr-2"/>Enviar no WhatsApp</Button>
              </div>
              <Button className="w-full mt-2" onClick={onVerificar}><RefreshCw size={14} className="inline mr-2"/>Verificar assinatura</Button>
              {pedido.expira_em && <div className="text-[10px] text-[#60606B] mt-2">Expira em {fmtDateTime(pedido.expira_em)}</div>}
            </div>
          </div>
        </div>
      )}

      {modoDireto && (
        <div className="rounded-xl border border-[#2A2A34] p-3">
          <div className="text-xs text-[#777782] mb-2">Assine diretamente abaixo.</div>
          <SignaturePad assinatura={null} onSalvar={onSalvarDireto} onLimpar={() => {}} />
        </div>
      )}
    </div>
  );
}

function OrcamentoPublico({ token }) {
  const [pedido,setPedido]=useState(null), [loading,setLoading]=useState(true), [erro,setErro]=useState("");
  const [nome,setNome]=useState(""), [ciente,setCiente]=useState(false), [enviando,setEnviando]=useState(false);
  useEffect(()=>{(async()=>{try{const r=await rpc("enigma_obter_aprovacao_orcamento",{p_token:token}); const p=Array.isArray(r)?r[0]:r; if(!p) throw 0; setPedido(p); setNome(p.snapshot?.cliente||"");}catch(e){setErro("Este link é inválido, expirou ou não está mais disponível.");} setLoading(false);})()},[token]);
  async function decidir(decisao){ if(!nome.trim()||!ciente)return; setEnviando(true); try{await rpc("enigma_decidir_aprovacao_orcamento",{p_token:token,p_nome:nome.trim(),p_decisao:decisao}); setPedido({...pedido,status:decisao});}catch(e){alert("Não foi possível registrar sua decisão.");} setEnviando(false); }
  if(loading)return <div className="min-h-screen bg-[#09090D] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/></div>;
  if(erro)return <div className="min-h-screen bg-[#09090D] text-white p-5 flex items-center justify-center"><Card className="max-w-md">{erro}</Card></div>;
  if(pedido?.status==="aprovado"||pedido?.status==="recusado")return <div className="min-h-screen bg-[#09090D] text-white p-5 flex items-center justify-center"><div className="max-w-md text-center"><CheckCircle2 size={42} className="mx-auto text-green-400"/><div className="text-xl font-semibold mt-3">Decisão registrada</div><div className="text-sm text-[#888894] mt-2">Orçamento {pedido.status}. Você já pode fechar esta página.</div></div></div>;
  const s=pedido.snapshot||{};
  return <div className="min-h-screen bg-[#09090D] text-[#F2F2F5] p-4"><div className="max-w-xl mx-auto space-y-4"><div className="text-center py-4"><div className="text-2xl font-black tracking-[.18em]">ENIGMA</div><div className="text-[10px] uppercase tracking-[.22em] text-purple-300">Aprovação de orçamento</div></div>
    <Card><div className="text-xs text-purple-300">OS #{s.numero}</div><div className="text-lg font-semibold mt-1">{s.aparelho}</div><div className="text-xs text-[#888894]">Cliente: {s.cliente}</div></Card>
    <Card><Label>Diagnóstico</Label><div className="text-sm text-[#C9C9D2] whitespace-pre-wrap">{s.diagnostico||"Diagnóstico informado pela assistência."}</div>{s.observacao&&<><Label className="mt-4">Observações</Label><div className="text-sm text-[#C9C9D2]">{s.observacao}</div></>}</Card>
    <Card><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Mão de obra</span><span>{fmt(s.maoObra||0)}</span></div><div className="flex justify-between"><span>Peças</span><span>{fmt(s.pecas||0)}</span></div>{Number(s.desconto)>0&&<div className="flex justify-between"><span>Desconto</span><span>- {fmt(s.desconto)}</span></div>}<div className="flex justify-between pt-3 border-t border-[#292932] text-lg font-semibold"><span>Total</span><span>{fmt(s.total||0)}</span></div></div></Card>
    <Card><Label>Nome completo</Label><Input value={nome} onChange={e=>setNome(e.target.value)} /><label className="flex gap-3 mt-4 text-sm text-[#C9C9D2]"><input type="checkbox" checked={ciente} onChange={e=>setCiente(e.target.checked)} className="mt-1"/><span>Li e estou de acordo com o orçamento apresentado e estou ciente de que minha decisão será registrada com data e hora.</span></label><div className="grid grid-cols-2 gap-2 mt-4"><Button disabled={!ciente||!nome.trim()||enviando} onClick={()=>decidir("aprovado")}><CheckCircle2 size={15} className="inline mr-1"/>Aprovar</Button><Button variant="danger" disabled={!ciente||!nome.trim()||enviando} onClick={()=>decidir("recusado")}><XCircle size={15} className="inline mr-1"/>Recusar</Button></div></Card>
  </div></div>;
}

function AssinaturaPublica({ token }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [assinatura, setAssinatura] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await rpc("enigma_obter_assinatura", { p_token: token });
        const p = Array.isArray(result) ? result[0] : result;
        if (!p) throw new Error("Link inválido ou expirado.");
        setPedido(p);
        setNome(p.snapshot?.cliente || "");
      } catch (e) { setErro("Este link de assinatura é inválido, expirou ou já não está disponível."); }
      setLoading(false);
    })();
  }, [token]);

  async function concluir() {
    if (!nome.trim()) return alert("Informe seu nome.");
    if (!assinatura?.dataUrl) return alert("Faça sua assinatura antes de confirmar.");
    setEnviando(true);
    try {
      await rpc("enigma_concluir_assinatura", { p_token: token, p_nome: nome.trim(), p_assinatura: assinatura.dataUrl });
      setPedido({ ...pedido, status: "concluido" });
    } catch (e) { alert("Não foi possível concluir a assinatura. Tente novamente."); }
    setEnviando(false);
  }

  if (loading) return <div className="min-h-screen bg-[#09090D] text-white flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/></div>;
  if (erro) return <div className="min-h-screen bg-[#09090D] text-white p-5 flex items-center justify-center"><div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-[#131318] p-5"><div className="text-lg font-semibold">ENIGMA</div><div className="text-sm text-red-300 mt-4">{erro}</div></div></div>;
  if (pedido?.status === "concluido") return <div className="min-h-screen bg-[#09090D] text-white p-5 flex items-center justify-center"><div className="max-w-md w-full rounded-2xl border border-green-500/20 bg-[#131318] p-6 text-center"><CheckCircle2 size={40} className="text-green-400 mx-auto"/><div className="text-xl font-semibold mt-3">Assinatura concluída</div><div className="text-sm text-[#8A8A96] mt-2">Obrigado. Você já pode fechar esta página.</div></div></div>;

  const snap = pedido?.snapshot || {};
  return (
    <div className="min-h-screen bg-[#09090D] text-[#F2F2F5] p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="text-center py-3"><div className="text-2xl font-black tracking-[0.18em]">ENIGMA</div><div className="text-[10px] tracking-[0.24em] text-purple-300 uppercase mt-1">Assinatura digital</div></div>
        <Card className="!rounded-2xl">
          <div className="text-xs text-purple-300 uppercase tracking-[0.16em]">OS #{snap.numero}</div>
          <div className="text-lg font-semibold mt-1">{snap.aparelho}</div>
          <div className="text-xs text-[#777782] mt-1">Cliente: {snap.cliente}</div>
          {snap.total > 0 && <div className="mt-3 text-sm">Total registrado: <span className="font-semibold text-white">{fmt(snap.total)}</span></div>}
        </Card>
        <Card className="!rounded-2xl">
          <Label>Termo</Label>
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#C9C9D2] pr-1">{snap.termo}</div>
        </Card>
        <Card className="!rounded-2xl">
          <Label>Nome completo</Label>
          <Input value={nome} onChange={(e)=>setNome(e.target.value)} placeholder="Seu nome" className="mb-3" />
          <Label>Assinatura</Label>
          <SignaturePad assinatura={assinatura} onSalvar={(dataUrl)=>setAssinatura({ dataUrl, timestamp: new Date().toISOString() })} onLimpar={()=>setAssinatura(null)} />
          <div className="text-[11px] text-[#6E6E78] mt-3">Ao confirmar, você declara ter lido e aceito o termo exibido acima.</div>
          <Button className="w-full mt-3" disabled={enviando || !assinatura?.dataUrl || !nome.trim()} onClick={concluir}>{enviando ? "Enviando..." : "Confirmar e assinar"}</Button>
        </Card>
        <div className="text-center text-[10px] text-[#4F4F59] pb-6">ENIGMA · Link temporário de assinatura</div>
      </div>
    </div>
  );
}

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
    if (!assinatura.dataUrl) {
      return (
        <div className="rounded-xl border border-green-500/20 bg-green-500/[.06] p-4">
          <div className="flex items-center gap-2 text-green-300 text-sm"><UserCheck size={16}/> Aceite registrado</div>
          <div className="text-xs text-[#A0A0AA] mt-2">{assinatura.nome || "Cliente"} · {assinatura.timestamp ? fmtDateTime(assinatura.timestamp) : ""}</div>
          <Button variant="ghost" className="w-full mt-3" onClick={onLimpar}>Remover aceite</Button>
        </div>
      );
    }
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
