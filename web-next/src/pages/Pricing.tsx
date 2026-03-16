import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, LayoutGrid, TableIcon, List, Filter, X,
  ArrowLeft, MessageSquare, Image, Headphones, Shield, Zap,
  Sparkles, ChevronRight, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

// ── Types ──
interface ApiModel {
  model_name: string;
  model_ratio: number;
  model_completion_ratio: number;
  model_type?: number;
  quota_type: number;
  vendor_id?: number;
  vendor_name?: string;
  vendor_icon?: string;
  group_ratio?: Record<string, number>;
  enable_groups?: string[];
  tags?: string;
  description?: string;
  supported_endpoint_types?: string[];
}

interface Vendor {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

type ViewMode = 'grid' | 'table' | 'list';
type ModelType = 'chat' | 'embedding' | 'image' | 'audio' | 'moderation';

// ── Vendor colors ──
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

const typeIcons: Record<string, typeof MessageSquare> = {
  chat: MessageSquare, embedding: Zap, image: Image, audio: Headphones, moderation: Shield,
};
const typeLabels: Record<string, string> = {
  chat: 'Chat', embedding: 'Embedding', image: 'Image', audio: 'Audio', moderation: 'Moderation',
};

function getModelType(m: ApiModel): string {
  // model_type: 0=unknown, 1=chat, 2=embedding, 3=image, 4=audio, 5=moderation
  const map: Record<number, string> = { 1: 'chat', 2: 'embedding', 3: 'image', 4: 'audio', 5: 'moderation' };
  return map[m.model_type ?? 0] ?? 'chat';
}

// Price per 1M tokens in USD based on ratio (ratio 1 = $0.002/1K = $2/1M)
const ratioToPrice = (ratio: number) => ratio * 2;

function VendorIcon({ vendor }: { vendor: string }) {
  const c = vc(vendor);
  return (
    <div className={`w-8 h-8 rounded-full ${c.dot} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {vendor?.[0] ?? '?'}
    </div>
  );
}

const fmtPrice = (p: number) => p === 0 ? 'N/A' : `$${p.toFixed(4)}`;

export default function PricingPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedQuota, setSelectedQuota] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const [models, setModels] = useState<ApiModel[]>([]);
  const [vendorsMap, setVendorsMap] = useState<Record<number, Vendor>>({});
  const [loading, setLoading] = useState(true);

  const toggle = <T,>(arr: T[], val: T) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const loadPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/pricing');
      const { success, message, data, vendors, group_ratio } = res.data;
      if (success) {
        const vMap: Record<number, Vendor> = {};
        if (Array.isArray(vendors)) vendors.forEach((v: Vendor) => { vMap[v.id] = v; });
        setVendorsMap(vMap);

        const enriched = (data || []).map((m: ApiModel) => {
          if (m.vendor_id && vMap[m.vendor_id]) {
            m.vendor_name = vMap[m.vendor_id].name;
            m.vendor_icon = vMap[m.vendor_id].icon;
          }
          m.group_ratio = group_ratio;
          return m;
        });
        enriched.sort((a: ApiModel, b: ApiModel) => a.model_name.localeCompare(b.model_name));
        setModels(enriched);
      } else {
        toast.error(message || '加载失败');
      }
    } catch {
      toast.error('加载定价数据失败');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPricing(); }, []);

  const allVendors = useMemo(() => [...new Set(models.map(m => m.vendor_name).filter(Boolean))] as string[], [models]);
  const allTypes = useMemo(() => [...new Set(models.map(m => getModelType(m)))], [models]);

  const filtered = useMemo(() => models.filter(m => {
    if (search && !m.model_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedVendors.length && !selectedVendors.includes(m.vendor_name ?? '')) return false;
    if (selectedTypes.length && !selectedTypes.includes(getModelType(m))) return false;
    if (selectedQuota === 'pay-per-use' && m.quota_type !== 0) return false;
    if (selectedQuota === 'per-request' && m.quota_type !== 1) return false;
    return true;
  }), [search, selectedVendors, selectedTypes, selectedQuota, models]);

  const activeFilterCount = selectedVendors.length + selectedTypes.length + (selectedQuota ? 1 : 0);
  const clearFilters = () => { setSelectedVendors([]); setSelectedTypes([]); setSelectedQuota(''); };

  const FilterSidebar = () => (
    <div className="space-y-6">
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
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">类型</h3>
        <div className="flex flex-wrap gap-2">
          {allTypes.map(t => {
            const Icon = typeIcons[t] ?? Zap; const active = selectedTypes.includes(t);
            return <button key={t} onClick={() => setSelectedTypes(toggle(selectedTypes, t))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${active ? 'bg-[#ee5a3e]/10 text-[#ee5a3e] ring-1 ring-[#ee5a3e]/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              <Icon className="w-3 h-3" />{typeLabels[t] ?? t}</button>;
          })}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">计费方式</h3>
        <div className="flex flex-wrap gap-2">
          {[{v:'pay-per-use',l:'按量计费'},{v:'per-request',l:'按次计费'}].map(({v,l}) => (
            <button key={v} onClick={() => setSelectedQuota(selectedQuota === v ? '' : v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedQuota === v ? 'bg-[#ee5a3e]/10 text-[#ee5a3e] ring-1 ring-[#ee5a3e]/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{l}</button>
          ))}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="text-xs text-[#ee5a3e] hover:underline">清除所有筛选</button>
      )}
    </div>
  );

  const ModelCard = ({ m }: { m: ApiModel }) => {
    const vendor = m.vendor_name ?? '未知';
    const c = vc(vendor);
    const inputPrice = ratioToPrice(m.model_ratio);
    const completionRatio = m.model_completion_ratio || 1;
    const outputPrice = inputPrice * completionRatio;
    return (
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-6 flex flex-col">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
            <span className={`text-lg font-bold ${c.text}`}>{vendor[0]}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.bg} ${c.text} border-current/20`}>{vendor}</span>
        </div>
        <h3 className="font-bold text-primary text-lg leading-tight mb-2">{m.model_name}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 line-clamp-2 min-h-[2.5rem]">{m.description || getModelType(m)}</p>
        <div className="flex items-end gap-6 mb-5">
          <div><span className="text-xs text-slate-400 block mb-1">输入</span><span className="text-lg font-bold text-slate-800 font-mono">${inputPrice.toFixed(4)}/M</span></div>
          <div><span className="text-xs text-slate-400 block mb-1">输出</span><span className="text-lg font-bold text-slate-800 font-mono">${outputPrice.toFixed(4)}/M</span></div>
        </div>
        <div className="mb-5">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${m.quota_type === 0 ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
            {m.quota_type === 0 ? '按量计费' : '按次计费'}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-500">模型倍率: <b className="text-slate-900">{m.model_ratio.toFixed(3)}</b></span>
            <span className="text-slate-500">补全倍率: <b className="text-slate-900">{completionRatio.toFixed(1)}</b></span>
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
            <TableHead className="text-right">模型倍率</TableHead>
            <TableHead className="text-right pr-5">补全倍率</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-50">
          {filtered.map(m => {
            const vendor = m.vendor_name ?? '未知';
            const c = vc(vendor);
            const mType = getModelType(m);
            const Icon = typeIcons[mType] ?? Zap;
            const inputPrice = ratioToPrice(m.model_ratio);
            const completionRatio = m.model_completion_ratio || 1;
            const outputPrice = inputPrice * completionRatio;
            return (
              <TableRow key={m.model_name} className="hover:bg-slate-50/30 border-b border-slate-50">
                <TableCell className="pl-5 font-medium text-slate-800">{m.model_name}</TableCell>
                <TableCell><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{vendor}</span></TableCell>
                <TableCell><span className="flex items-center gap-1 text-slate-500 text-xs"><Icon className="w-3 h-3" />{typeLabels[mType] ?? mType}</span></TableCell>
                <TableCell className="text-right text-sm text-slate-700">{fmtPrice(inputPrice)}</TableCell>
                <TableCell className="text-right text-sm text-slate-700">{fmtPrice(outputPrice)}</TableCell>
                <TableCell><span className="text-xs text-slate-500">{m.quota_type === 0 ? '按量' : '按次'}</span></TableCell>
                <TableCell className="text-right text-sm text-slate-500">{m.model_ratio.toFixed(3)}</TableCell>
                <TableCell className="text-right pr-5 text-sm text-slate-500">{completionRatio.toFixed(1)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-3xl border border-slate-100 soft-shadow divide-y divide-slate-50 overflow-hidden">
      {filtered.map(m => {
        const vendor = m.vendor_name ?? '未知';
        const c = vc(vendor);
        const inputPrice = ratioToPrice(m.model_ratio);
        const completionRatio = m.model_completion_ratio || 1;
        const outputPrice = inputPrice * completionRatio;
        return (
          <div key={m.model_name} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/30 transition-colors">
            <VendorIcon vendor={vendor} />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-slate-800">{m.model_name}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{vendor}</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
              <span>输入 <b className="text-slate-700">{fmtPrice(inputPrice)}</b></span>
              <span>输出 <b className="text-slate-700">{fmtPrice(outputPrice)}</b></span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcf9f5]">
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
            <span className="text-xs text-slate-400">{filtered.length} 个模型</span>
          </div>
        </div>
      </nav>

      <div className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">模型广场</h1>
          <p className="text-slate-500 mt-2">浏览所有可用模型的定价和功能信息</p>
        </div>

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

        {showFilters && (
          <div className="mb-6 bg-white rounded-3xl border border-slate-100 soft-shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">筛选条件</h2>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <FilterSidebar />
          </div>
        )}

        <p className="text-xs text-slate-400 mb-4">共 {filtered.length} 个模型</p>

        {loading ? (
          <div className="flex items-center justify-center py-32"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {view === 'grid' && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {filtered.map(m => <ModelCard key={m.model_name} m={m} />)}
              </div>
            )}
            {view === 'table' && <TableView />}
            {view === 'list' && <ListView />}
          </>
        )}

        {!loading && filtered.length === 0 && (
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
