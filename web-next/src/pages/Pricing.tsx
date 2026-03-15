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
  const [showFilters, setShowFilters] = useState(true);
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
    const c = vc(m.vendor);
    const modelRatio = (m.inputPrice / 20).toFixed(3);
    const completionRatio = (m.outputPrice / m.inputPrice || 5).toFixed(0);
    const groupRatio = ((m.inputPrice + m.outputPrice) / 15).toFixed(2);
    return (
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-6 flex flex-col">
        {/* Section 1: Icon + Vendor badge */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
            <span className={`text-lg font-bold ${c.text}`}>{m.vendor[0]}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.bg} ${c.text} border-current/20`}>
            {m.vendor}
          </span>
        </div>

        {/* Section 2: Name + Description */}
        <h3 className="font-bold text-primary text-lg leading-tight mb-2">{m.name}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2 min-h-[2.5rem]">{m.description}</p>

        {/* Section 3: Pricing */}
        <div className="flex items-end gap-6 mb-5">
          <div>
            <span className="text-xs text-slate-400 block mb-1">输入</span>
            <span className="text-lg font-bold text-slate-800 font-mono">${m.inputPrice.toFixed(4)}/M</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">输出</span>
            <span className="text-lg font-bold text-slate-800 font-mono">${m.outputPrice.toFixed(4)}/M</span>
          </div>
        </div>

        {/* Section 4: Quota badge */}
        <div className="mb-5">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${m.quotaType === 'pay-per-use' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
            {m.quotaType === 'pay-per-use' ? '按量计费' : '按次计费'}
          </span>
        </div>

        {/* Section 5: Ratio info */}
        <div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
            <span>倍率信息</span>
            <svg className="size-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path d="M12 16v-4M12 8h.01" strokeWidth={2} strokeLinecap="round" /></svg>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-500">模型: <b className="text-slate-900">{modelRatio}</b></span>
            <span className="text-slate-500">补全: <b className="text-slate-900">{completionRatio}</b></span>
            <span className="text-slate-500">分组: <b className="text-slate-900">{groupRatio}</b></span>
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-[#fcf9f5]">
      {/* Top nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#ee5a3e] transition-colors">
              <ArrowLeft className="w-4 h-4" />返回
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <span className="font-bold text-slate-800">模型广场</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ee5a3e]" />
            <span className="text-xs text-slate-400">{models.length} 个模型</span>
          </div>
        </div>
      </nav>

      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">模型广场</h1>
          <p className="text-slate-500 mt-2">浏览所有可用模型的定价和功能信息</p>
        </div>

        {/* Search + controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="搜索模型名称..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 rounded-2xl h-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
              className={`rounded-2xl gap-1.5 ${activeFilterCount > 0 ? 'border-[#ee5a3e]/30 text-[#ee5a3e]' : ''}`}>
              <Filter className="w-3.5 h-3.5" />筛选
              {activeFilterCount > 0 && <Badge className="ml-1 h-4 w-4 p-0 text-[10px] justify-center">{activeFilterCount}</Badge>}
            </Button>
            <div className="flex bg-slate-50 rounded-2xl border border-slate-200 p-0.5">
              {([['grid', LayoutGrid], ['table', TableIcon], ['list', List]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setView(mode as ViewMode)}
                  className={`p-1.5 rounded-xl transition-all ${view === mode ? 'bg-white soft-shadow text-[#ee5a3e]' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-3xl border border-slate-100 soft-shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">筛选条件</h2>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <FilterSidebar />
          </div>
        )}

        {/* Results count */}
        <p className="text-xs text-slate-400 mb-4">共 {filtered.length} 个模型</p>

        {/* Views */}
        {view === 'grid' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filtered.map(m => <ModelCard key={m.id} m={m} />)}
          </div>
        )}
        {view === 'table' && <TableView />}
        {view === 'list' && <ListView />}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">没有找到匹配的模型</p>
            <button onClick={clearFilters} className="text-sm text-[#ee5a3e] hover:underline mt-2">清除筛选</button>
          </div>
        )}
      </div>
    </div>
  );
}
