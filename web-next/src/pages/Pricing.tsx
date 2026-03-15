import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, LayoutGrid, TableIcon, List, Filter, X, ChevronDown,
  ArrowLeft, Eye, MessageSquare, Image, Headphones, Shield, Zap,
  Sparkles, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';

// ── Types ──────────────────────────────────────────────────────────
interface Model {
  id: string; name: string; vendor: string; type: ModelType;
  inputPrice: number; outputPrice: number; quotaType: 'pay-per-use' | 'per-request';
  tags: string[]; contextWindow: number; description: string;
}
type ModelType = 'chat' | 'embedding' | 'image' | 'audio' | 'moderation';
type ViewMode = 'grid' | 'table' | 'list';

// ── Vendor colors ──────────────────────────────────────────────────
const vendorColors: Record<string, { bg: string; text: string; dot: string }> = {
  OpenAI:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Anthropic: { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  Google:    { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  Meta:      { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  DeepSeek:  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500' },
  Mistral:   { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  Qwen:      { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500' },
};
const vc = (v: string) => vendorColors[v] ?? { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };

const typeIcons: Record<ModelType, typeof MessageSquare> = {
  chat: MessageSquare, embedding: Zap, image: Image, audio: Headphones, moderation: Shield,
};
const typeLabels: Record<ModelType, string> = {
  chat: 'Chat', embedding: 'Embedding', image: 'Image', audio: 'Audio', moderation: 'Moderation',
};

// ── Mock data ──────────────────────────────────────────────────────
const models: Model[] = [
  { id:'gpt-4o', name:'gpt-4o', vendor:'OpenAI', type:'chat', inputPrice:2.5, outputPrice:10, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:128000, description:'Most capable GPT-4 model with vision, faster and cheaper than GPT-4 Turbo.' },
  { id:'gpt-4o-mini', name:'gpt-4o-mini', vendor:'OpenAI', type:'chat', inputPrice:0.15, outputPrice:0.6, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:128000, description:'Small, fast, affordable model for lightweight tasks.' },
  { id:'gpt-4-turbo', name:'gpt-4-turbo', vendor:'OpenAI', type:'chat', inputPrice:10, outputPrice:30, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:128000, description:'GPT-4 Turbo with vision, JSON mode, and reproducible outputs.' },
  { id:'o1', name:'o1', vendor:'OpenAI', type:'chat', inputPrice:15, outputPrice:60, quotaType:'pay-per-use', tags:['streaming'], contextWindow:200000, description:'Reasoning model for complex multi-step tasks.' },
  { id:'o1-mini', name:'o1-mini', vendor:'OpenAI', type:'chat', inputPrice:3, outputPrice:12, quotaType:'pay-per-use', tags:['streaming'], contextWindow:128000, description:'Smaller, faster reasoning model.' },
  { id:'dall-e-3', name:'dall-e-3', vendor:'OpenAI', type:'image', inputPrice:40, outputPrice:0, quotaType:'per-request', tags:[], contextWindow:0, description:'State-of-the-art image generation model.' },
  { id:'whisper-1', name:'whisper-1', vendor:'OpenAI', type:'audio', inputPrice:6, outputPrice:0, quotaType:'per-request', tags:['streaming'], contextWindow:0, description:'Speech-to-text transcription model.' },
  { id:'tts-1', name:'tts-1', vendor:'OpenAI', type:'audio', inputPrice:15, outputPrice:0, quotaType:'per-request', tags:['streaming'], contextWindow:0, description:'Text-to-speech synthesis model.' },
  { id:'claude-sonnet-4-6', name:'claude-sonnet-4-6', vendor:'Anthropic', type:'chat', inputPrice:3, outputPrice:15, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:200000, description:'Best balance of speed and intelligence for enterprise workloads.' },
  { id:'claude-opus-4-6', name:'claude-opus-4-6', vendor:'Anthropic', type:'chat', inputPrice:15, outputPrice:75, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:200000, description:'Most powerful Claude model for highly complex tasks.' },
  { id:'claude-haiku-4-5', name:'claude-haiku-4-5', vendor:'Anthropic', type:'chat', inputPrice:0.8, outputPrice:4, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:200000, description:'Fastest and most compact Claude model.' },
  { id:'gemini-2.0-flash', name:'gemini-2.0-flash', vendor:'Google', type:'chat', inputPrice:0.1, outputPrice:0.4, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:1000000, description:'Fast, efficient Gemini model with 1M context window.' },
  { id:'gemini-1.5-pro', name:'gemini-1.5-pro', vendor:'Google', type:'chat', inputPrice:3.5, outputPrice:10.5, quotaType:'pay-per-use', tags:['vision','function-calling','streaming'], contextWindow:2000000, description:'Advanced Gemini model with 2M context window.' },
  { id:'llama-3.1-405b', name:'llama-3.1-405b', vendor:'Meta', type:'chat', inputPrice:5, outputPrice:15, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:128000, description:'Largest open-source Llama model with 405B parameters.' },
  { id:'llama-3.1-70b', name:'llama-3.1-70b', vendor:'Meta', type:'chat', inputPrice:0.9, outputPrice:0.9, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:128000, description:'High-performance open-source model.' },
  { id:'deepseek-r1', name:'deepseek-r1', vendor:'DeepSeek', type:'chat', inputPrice:0.55, outputPrice:2.19, quotaType:'pay-per-use', tags:['streaming'], contextWindow:64000, description:'Advanced reasoning model from DeepSeek.' },
  { id:'deepseek-v3', name:'deepseek-v3', vendor:'DeepSeek', type:'chat', inputPrice:0.27, outputPrice:1.1, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:64000, description:'Latest DeepSeek chat model with strong coding ability.' },
  { id:'mistral-large', name:'mistral-large', vendor:'Mistral', type:'chat', inputPrice:3, outputPrice:9, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:128000, description:'Flagship Mistral model for complex tasks.' },
  { id:'mistral-small', name:'mistral-small', vendor:'Mistral', type:'chat', inputPrice:0.2, outputPrice:0.6, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:32000, description:'Efficient model for simple tasks.' },
  { id:'qwen-max', name:'qwen-max', vendor:'Qwen', type:'chat', inputPrice:2, outputPrice:6, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:32000, description:'Most capable Qwen model.' },
  { id:'qwen-plus', name:'qwen-plus', vendor:'Qwen', type:'chat', inputPrice:0.5, outputPrice:1.5, quotaType:'pay-per-use', tags:['function-calling','streaming'], contextWindow:128000, description:'Balanced Qwen model for general use.' },
];

const allVendors = [...new Set(models.map(m => m.vendor))];
const allTypes: ModelType[] = ['chat','embedding','image','audio','moderation'];
const allTags = [...new Set(models.flatMap(m => m.tags))].filter(Boolean);

// ── Helpers ────────────────────────────────────────────────────────
const fmtPrice = (p: number) => p === 0 ? 'N/A' : `$${p}`;
const fmtCtx = (n: number) => n === 0 ? '-' : n >= 1000000 ? `${n / 1000000}M` : `${n / 1000}K`;

function VendorIcon({ vendor }: { vendor: string }) {
  const c = vc(vendor);
  return (
    <div className={`w-8 h-8 rounded-full ${c.dot} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {vendor[0]}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────
export default function PricingPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ModelType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedQuota, setSelectedQuota] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggle = <T,>(arr: T[], val: T) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const filtered = useMemo(() => models.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedVendors.length && !selectedVendors.includes(m.vendor)) return false;
    if (selectedTypes.length && !selectedTypes.includes(m.type)) return false;
    if (selectedTags.length && !selectedTags.some(t => m.tags.includes(t))) return false;
    if (selectedQuota && m.quotaType !== selectedQuota) return false;
    return true;
  }), [search, selectedVendors, selectedTypes, selectedTags, selectedQuota]);

  const activeFilterCount = selectedVendors.length + selectedTypes.length + selectedTags.length + (selectedQuota ? 1 : 0);

  const clearFilters = () => { setSelectedVendors([]); setSelectedTypes([]); setSelectedTags([]); setSelectedQuota(''); };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Vendors */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">厂商</h3>
        <div className="flex flex-wrap gap-2">
          {allVendors.map(v => {
            const c = vc(v); const active = selectedVendors.includes(v);
            return <button key={v} onClick={() => setSelectedVendors(toggle(selectedVendors, v))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? `${c.bg} ${c.text} ring-1 ring-current` : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{v}</button>;
          })}
        </div>
      </div>
      {/* Types */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">类型</h3>
        <div className="flex flex-wrap gap-2">
          {allTypes.map(t => {
            const Icon = typeIcons[t]; const active = selectedTypes.includes(t);
            return <button key={t} onClick={() => setSelectedTypes(toggle(selectedTypes, t))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${active ? 'bg-[#ee5a3e]/10 text-[#ee5a3e] ring-1 ring-[#ee5a3e]/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              <Icon className="w-3 h-3" />{typeLabels[t]}</button>;
          })}
        </div>
      </div>
      {/* Quota */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">计费方式</h3>
        <div className="flex flex-wrap gap-2">
          {[{v:'pay-per-use',l:'按量计费'},{v:'per-request',l:'按次计费'}].map(({v,l}) => (
            <button key={v} onClick={() => setSelectedQuota(selectedQuota === v ? '' : v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedQuota === v ? 'bg-[#ee5a3e]/10 text-[#ee5a3e] ring-1 ring-[#ee5a3e]/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{l}</button>
          ))}
        </div>
      </div>
      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">特性</h3>
        <div className="flex flex-wrap gap-2">
          {allTags.map(t => {
            const active = selectedTags.includes(t);
            return <button key={t} onClick={() => setSelectedTags(toggle(selectedTags, t))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-[#ee5a3e]/10 text-[#ee5a3e] ring-1 ring-[#ee5a3e]/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{t}</button>;
          })}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="text-xs text-[#ee5a3e] hover:underline">清除所有筛选</button>
      )}
    </div>
  );

  const ModelCard = ({ m }: { m: Model }) => {
    const c = vc(m.vendor); const Icon = typeIcons[m.type]; const expanded = expandedModel === m.id;
    return (
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-5 flex flex-col gap-3 hover:border-slate-200 transition-all">
        <div className="flex items-start gap-3">
          <VendorIcon vendor={m.vendor} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{m.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{m.vendor}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 flex items-center gap-1"><Icon className="w-2.5 h-2.5" />{typeLabels[m.type]}</span>
            </div>
          </div>
        </div>
        {m.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {m.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-50 text-slate-400">{t}</span>)}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <div className="text-xs text-slate-500">
            {m.quotaType === 'pay-per-use' ? (
              <><span className="text-slate-800 font-semibold">{fmtPrice(m.inputPrice)}</span> / <span className="text-slate-800 font-semibold">{fmtPrice(m.outputPrice)}</span> <span className="text-slate-400">per 1M</span></>
            ) : <span className="text-slate-800 font-semibold">按次计费</span>}
          </div>
          <button onClick={() => setExpandedModel(expanded ? null : m.id)} className="text-xs text-[#ee5a3e] hover:underline flex items-center gap-0.5">
            {expanded ? '收起' : '详情'}<ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {expanded && (
          <div className="pt-3 border-t border-slate-50 space-y-2 text-xs text-slate-500">
            <p>{m.description}</p>
            <div className="flex gap-4">
              {m.contextWindow > 0 && <span>上下文: <b className="text-slate-700">{fmtCtx(m.contextWindow)}</b></span>}
              <span>输入: <b className="text-slate-700">{fmtPrice(m.inputPrice)}</b></span>
              <span>输出: <b className="text-slate-700">{fmtPrice(m.outputPrice)}</b></span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TableView = () => (
    <div className="bg-white rounded-3xl border border-slate-100 soft-shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 border-b border-slate-50">
            <TableHead className="pl-5">模型</TableHead>
            <TableHead>厂商</TableHead>
            <TableHead>类型</TableHead>
            <TableHead className="text-right">输入价格</TableHead>
            <TableHead className="text-right">输出价格</TableHead>
            <TableHead>计费</TableHead>
            <TableHead>特性</TableHead>
            <TableHead className="text-right pr-5">上下文</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-50">
          {filtered.map(m => { const c = vc(m.vendor); const Icon = typeIcons[m.type]; return (
            <TableRow key={m.id} className="hover:bg-slate-50/30 border-b border-slate-50 cursor-pointer" onClick={() => setExpandedModel(expandedModel === m.id ? null : m.id)}>
              <TableCell className="pl-5 font-medium text-slate-800">{m.name}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{m.vendor}</span></TableCell>
              <TableCell><span className="flex items-center gap-1 text-slate-500 text-xs"><Icon className="w-3 h-3" />{typeLabels[m.type]}</span></TableCell>
              <TableCell className="text-right text-sm text-slate-700">{fmtPrice(m.inputPrice)}</TableCell>
              <TableCell className="text-right text-sm text-slate-700">{fmtPrice(m.outputPrice)}</TableCell>
              <TableCell><span className="text-xs text-slate-500">{m.quotaType === 'pay-per-use' ? '按量' : '按次'}</span></TableCell>
              <TableCell><div className="flex gap-1">{m.tags.slice(0,2).map(t => <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-50 text-slate-400">{t}</span>)}</div></TableCell>
              <TableCell className="text-right pr-5 text-sm text-slate-500">{fmtCtx(m.contextWindow)}</TableCell>
            </TableRow>
          );})}
        </TableBody>
      </Table>
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-3xl border border-slate-100 soft-shadow divide-y divide-slate-50 overflow-hidden">
      {filtered.map(m => { const c = vc(m.vendor); return (
        <div key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/30 transition-colors cursor-pointer" onClick={() => setExpandedModel(expandedModel === m.id ? null : m.id)}>
          <VendorIcon vendor={m.vendor} />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm text-slate-800">{m.name}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{m.vendor}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            <span>输入 <b className="text-slate-700">{fmtPrice(m.inputPrice)}</b></span>
            <span>输出 <b className="text-slate-700">{fmtPrice(m.outputPrice)}</b></span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      );})}
    </div>
  );

  /* PLACEHOLDER_MAIN_RETURN */
  /* PLACEHOLDER_RETURN */
}
