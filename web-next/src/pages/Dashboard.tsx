import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, Zap, RefreshCw,
  ChevronDown, ChevronRight, BarChart3, Megaphone,
  HelpCircle, Gauge, Copy,
  Coins, Shield, Link,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { API } from '@/api/client';
import { useStatus } from '@/contexts/StatusContext';
import toast from 'react-hot-toast';

// ── Warm color palette (matches reference peach/coral design) ──
const PALETTE = [
  '#e78a87', '#e595aa', '#d99745', '#d9be45', '#b8655e',
  '#ff6b4a', '#f0c850', '#e8a040', '#d090e0', '#70c0a0',
  '#f08060', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
];

function modelColor(_model: string, index: number): string {
  return PALETTE[index % PALETTE.length];
}

// ── Quota formatting ─────────────────────────────────
function renderQuota(quota: number, digits = 2): string {
  const quotaPerUnit = parseFloat(localStorage.getItem('quota_per_unit') || '500000');
  const displayType = localStorage.getItem('quota_display_type') || 'USD';
  if (displayType === 'TOKENS') return quota.toLocaleString();
  const resultUSD = quota / quotaPerUnit;
  let symbol = '$';
  let value = resultUSD;
  if (displayType === 'CNY') {
    try {
      const s = JSON.parse(localStorage.getItem('status') || '{}');
      value = resultUSD * (s?.usd_exchange_rate || 7);
    } catch { /* fallback */ }
    symbol = '¥';
  } else if (displayType === 'CUSTOM') {
    try {
      const s = JSON.parse(localStorage.getItem('status') || '{}');
      symbol = s?.custom_currency_symbol || '¤';
      value = resultUSD * (s?.custom_currency_exchange_rate || 1);
    } catch { /* fallback */ }
  }
  return symbol + value.toFixed(digits);
}

// ── Helpers ──────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function relativeTime(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  } catch { return timeStr; }
}

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ── Types ────────────────────────────────────────────
interface UserData {
  username: string;
  display_name?: string;
  role: number;
  quota: number;
  used_quota: number;
  request_count: number;
}

interface ChartRawItem {
  created_at: number;
  model_name: string;
  quota: number;
  count: number;
  token_used?: number;
  token_name?: string;
}

interface FAQItem { id?: number; question: string; answer: string; }

interface Announcement {
  id?: number;
  content: string;
  publishDate?: string;
  type?: 'default' | 'ongoing' | 'success' | 'warning' | 'error';
  extra?: string;
}

interface ApiInfoEntry {
  id: string;
  route: string;
  url: string;
  description: string;
  color: string;
}

interface UptimeMonitor {
  name: string;
  status: number;
  uptime: number;
}

interface UptimeGroup {
  categoryName: string;
  monitors: UptimeMonitor[];
}

// ── Mini Sparkline (SVG path, no recharts dependency) ──
function Sparkline({ data, color = '#94a3b8' }: { data: number[]; color?: string }) {
  if (!data.length) return <div className="w-24 h-10" />;
  const max = Math.max(...data, 1);
  const w = 96, h = 36, pad = 2;
  const pts = data.map((v, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2),
    y: pad + (1 - v / max) * (h - pad * 2),
  }));
  const d = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  return (
    <svg width={w} height={h} className="flex-shrink-0" viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Custom Tooltip: sorted by value descending ──
function SortedTooltip({ active, payload, label, colorMap }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
  colorMap: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].filter(p => p.value > 0).sort((a, b) => b.value - a.value);
  if (!sorted.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs max-h-64 overflow-y-auto" style={{ minWidth: 160 }}>
      <p className="font-semibold text-slate-600 mb-2">{label}</p>
      {sorted.map(item => (
        <div key={item.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 truncate">
            <span className="size-2 rounded-sm flex-shrink-0" style={{ backgroundColor: colorMap[item.name] || item.color }} />
            <span className="truncate max-w-[140px]">{item.name}</span>
          </span>
          <span className="font-mono text-slate-500 flex-shrink-0">{typeof item.value === 'number' ? item.value.toFixed(4) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── API info badge fallback colors (matches reference: orange, yellow, red) ──
const API_BADGE_COLORS = ['#ff6b4a', '#d9be45', '#e78a87', '#b8655e', '#d99745'];
const STATUS_DOT: Record<string, string> = {
  default: 'bg-slate-400',
  ongoing: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

// ── Uptime status helpers ────────────────────────────
function uptimeStatusColor(s: number) {
  if (s === 1 || s === 2) return 'bg-emerald-500';
  if (s === 8) return 'bg-amber-500';
  if (s === 9) return 'bg-red-500';
  return 'bg-slate-400';
}

// ── Component ────────────────────────────────────────
export default function Dashboard() {
  const [chartTab, setChartTab] = useState<'quota-dist' | 'quota-trend' | 'count-dist' | 'count-rank'>('quota-dist');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { status } = useStatus();

  // ── Data state ──
  const [user, setUser] = useState<UserData | null>(null);
  const [chartRaw, setChartRaw] = useState<ChartRawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uptimeGroups, setUptimeGroups] = useState<UptimeGroup[]>([]);
  const [uptimeTab, setUptimeTab] = useState(0);

  const displayName = user?.display_name || user?.username || '...';

  // ── Fetch data ──
  const fetchData = useCallback(() => {
    setLoading(true);
    const end = Math.floor(Date.now() / 1000);
    const start = end - 86400;
    const localUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
    const admin = (localUser?.role ?? 0) >= 10;
    const dataUrl = admin
      ? `/api/data/?start_timestamp=${start}&end_timestamp=${end}&default_time=hour`
      : `/api/data/self?start_timestamp=${start}&end_timestamp=${end}&default_time=hour`;

    Promise.allSettled([
      API.get('/api/user/self'),
      API.get(dataUrl),
    ]).then(([userRes, chartRes]) => {
      if (userRes.status === 'fulfilled' && userRes.value.data?.success)
        setUser(userRes.value.data.data);
      if (chartRes.status === 'fulfilled' && chartRes.value.data?.success)
        setChartRaw(chartRes.value.data.data || []);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch uptime if enabled
  useEffect(() => {
    if (!status?.uptime_kuma_enabled) return;
    API.get('/api/uptime/status').then(res => {
      if (res.data?.success) setUptimeGroups(res.data.data || []);
    }).catch(() => {});
  }, [status?.uptime_kuma_enabled]);

  // ── Derived: chart buckets ──
  const { chartData, countChartData, modelNames, activeQuotaModels, activeCountModels, totalCost, totalCount, consumeTokens, timeBuckets, bucketQuotas, bucketCounts, bucketTokens, modelRanking } = useMemo(() => {
    if (!chartRaw.length) return {
      chartData: [] as Record<string, unknown>[],
      countChartData: [] as Record<string, unknown>[],
      modelNames: [] as string[],
      activeQuotaModels: [] as string[],
      activeCountModels: [] as string[],
      totalCost: 0, totalCount: 0, consumeTokens: 0,
      timeBuckets: [] as string[],
      bucketQuotas: [] as number[], bucketCounts: [] as number[], bucketTokens: [] as number[],
      modelRanking: [] as { model: string; count: number }[],
    };

    const quotaBuckets = new Map<string, Record<string, number>>();
    const countBuckets = new Map<string, Record<string, number>>();
    const models = new Set<string>();
    let tCost = 0, tCount = 0, tTokens = 0;
    const modelCountTotals = new Map<string, number>();

    for (const item of chartRaw) {
      const d = new Date(item.created_at * 1000);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      models.add(item.model_name);
      // quota buckets
      if (!quotaBuckets.has(label)) quotaBuckets.set(label, {});
      const qb = quotaBuckets.get(label)!;
      qb[item.model_name] = (qb[item.model_name] || 0) + item.quota;
      // count buckets
      if (!countBuckets.has(label)) countBuckets.set(label, {});
      const cb = countBuckets.get(label)!;
      cb[item.model_name] = (cb[item.model_name] || 0) + item.count;
      tCost += item.quota;
      tCount += item.count;
      tTokens += (item.token_used || 0);
      modelCountTotals.set(item.model_name, (modelCountTotals.get(item.model_name) || 0) + item.count);
    }

    const sortedNames = Array.from(models);
    const quotaPerUnit = parseFloat(localStorage.getItem('quota_per_unit') || '500000');
    const sortedBucketKeys = Array.from(new Set([...quotaBuckets.keys(), ...countBuckets.keys()])).sort();

    // Per-model totals for filtering zero-value models
    const modelQuotaTotals = new Map<string, number>();
    for (const item of chartRaw) {
      modelQuotaTotals.set(item.model_name, (modelQuotaTotals.get(item.model_name) || 0) + item.quota);
    }

    // Sort by total quota/count desc, take top 10, aggregate rest as "其他"
    const TOP_N = 10;
    const OTHER_KEY = '其他';

    const quotaSorted = [...sortedNames]
      .filter(m => parseFloat(((modelQuotaTotals.get(m) || 0) / quotaPerUnit).toFixed(4)) > 0)
      .sort((a, b) => (modelQuotaTotals.get(b) || 0) - (modelQuotaTotals.get(a) || 0));
    const topQuotaModels = quotaSorted.slice(0, TOP_N);
    const otherQuotaModels = quotaSorted.slice(TOP_N);
    const activeQuotaModels = otherQuotaModels.length > 0 ? [...topQuotaModels, OTHER_KEY] : topQuotaModels;

    const countSorted = [...sortedNames]
      .filter(m => (modelCountTotals.get(m) || 0) > 0)
      .sort((a, b) => (modelCountTotals.get(b) || 0) - (modelCountTotals.get(a) || 0));
    const topCountModels = countSorted.slice(0, TOP_N);
    const otherCountModels = countSorted.slice(TOP_N);
    const activeCountModels = otherCountModels.length > 0 ? [...topCountModels, OTHER_KEY] : topCountModels;

    const qData = sortedBucketKeys.map(time => {
      const vals = quotaBuckets.get(time) || {};
      const entry: Record<string, unknown> = { time };
      for (const m of topQuotaModels) entry[m] = vals[m] ? parseFloat((vals[m] / quotaPerUnit).toFixed(4)) : 0;
      if (otherQuotaModels.length > 0) {
        entry[OTHER_KEY] = otherQuotaModels.reduce((sum, m) => sum + (vals[m] ? parseFloat((vals[m] / quotaPerUnit).toFixed(4)) : 0), 0);
      }
      return entry;
    });

    const cData = sortedBucketKeys.map(time => {
      const vals = countBuckets.get(time) || {};
      const entry: Record<string, unknown> = { time };
      for (const m of topCountModels) entry[m] = vals[m] || 0;
      if (otherCountModels.length > 0) {
        entry[OTHER_KEY] = otherCountModels.reduce((sum, m) => sum + (vals[m] || 0), 0);
      }
      return entry;
    });

    // Per-bucket aggregates for sparklines
    const bQuotas = sortedBucketKeys.map(t => { const v = quotaBuckets.get(t) || {}; return Object.values(v).reduce((a, b) => a + b, 0); });
    const bCounts = sortedBucketKeys.map(t => { const v = countBuckets.get(t) || {}; return Object.values(v).reduce((a, b) => a + b, 0); });
    const bTokens = sortedBucketKeys.map((_t, i) => bCounts[i]); // approximate

    const ranking = Array.from(modelCountTotals.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    return {
      chartData: qData, countChartData: cData, modelNames: sortedNames,
      activeQuotaModels, activeCountModels,
      totalCost: tCost, totalCount: tCount, consumeTokens: tTokens,
      timeBuckets: sortedBucketKeys,
      bucketQuotas: bQuotas, bucketCounts: bCounts, bucketTokens: bTokens,
      modelRanking: ranking,
    };
  }, [chartRaw]);

  const modelColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    modelNames.forEach((m, i) => { map[m] = modelColor(m, i); });
    map['其他'] = '#94a3b8'; // slate gray for "Others"
    return map;
  }, [modelNames]);

  // ── Derived: time-based metrics ──
  const timeDiffMinutes = useMemo(() => {
    if (timeBuckets.length < 2) return 1;
    return Math.max(timeBuckets.length * 60, 1); // each bucket = 1 hour = 60 min
  }, [timeBuckets]);

  const avgRPM = totalCount / timeDiffMinutes;
  const avgTPM = consumeTokens / timeDiffMinutes;

  // ── Derived: sparkline data for quotas ──
  const quotaSparkline = bucketQuotas;
  const countSparkline = bucketCounts;
  const tokenSparkline = bucketTokens;
  const rpmSparkline = bucketCounts.map(c => c / 60);
  const tpmSparkline = bucketTokens.map(t => t / 60);

  // ── Status-derived data ──
  const announcements: Announcement[] = useMemo(() => {
    if (status?.announcements_enabled && Array.isArray(status.announcements)) return status.announcements as Announcement[];
    return [];
  }, [status]);

  const faqItems: FAQItem[] = useMemo(() => {
    if (status?.faq_enabled && Array.isArray(status.faq)) return status.faq as FAQItem[];
    return [];
  }, [status]);

  const apiInfoEntries: ApiInfoEntry[] = useMemo(() => {
    if (status?.api_info_enabled && Array.isArray(status.api_info)) return status.api_info as ApiInfoEntry[];
    return [];
  }, [status]);

  const showApiInfo = apiInfoEntries.length > 0;
  const showUptime = !!status?.uptime_kuma_enabled && uptimeGroups.length > 0;
  const showFaq = faqItems.length > 0;
  const showAnnouncements = announcements.length > 0;

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('已复制到剪贴板');
  };

  // ── Render ──
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Inter']">
            {getGreeting()}，{displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">这是你的 API 使用概览</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="inline-flex items-center justify-center size-10 rounded-xl bg-white border border-slate-100 soft-shadow text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Stats Cards: 4 groups (reference warm style) ── */}
      {user && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: 账户数据 */}
          <div className="bg-white rounded-2xl p-5 soft-shadow flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded bg-primary/10 flex items-center justify-center"><Wallet className="size-3 text-primary" /></div>
              <span className="font-semibold text-sm text-primary">账户数据</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1">当前余额</p>
                <p className="text-2xl font-bold mb-2">{renderQuota(user.quota)} <a href="/console/topup" className="text-xs bg-primary text-white px-2 py-0.5 rounded-full ml-2 align-middle font-normal hover:bg-primary/90 transition-colors">充值</a></p>
                <p className="text-xs text-muted-foreground mb-1">历史消耗</p>
                <p className="text-xl font-bold">{renderQuota(user.used_quota)}</p>
              </div>
              <Sparkline data={quotaSparkline} color="#ee5a3e" />
            </div>
          </div>

          {/* Card 2: 使用统计 */}
          <div className="bg-white rounded-2xl p-5 soft-shadow flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded bg-red-50 flex items-center justify-center"><Zap className="size-3 text-[#e78a87]" /></div>
              <span className="font-semibold text-sm text-[#e78a87]">使用统计</span>
            </div>
            <div className="flex justify-between items-end h-full">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">请求次数</p>
                  <p className="text-2xl font-bold mb-2">{formatNumber(user.request_count)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">统计次数</p>
                  <p className="text-xl font-bold">{formatNumber(totalCount)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Sparkline data={countSparkline} color="#e78a87" />
                <Sparkline data={countSparkline} color="#e78a87" />
              </div>
            </div>
          </div>

          {/* Card 3: 资源消耗 */}
          <div className="bg-white rounded-2xl p-5 soft-shadow flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded bg-yellow-50 flex items-center justify-center"><Coins className="size-3 text-[#d9be45]" /></div>
              <span className="font-semibold text-sm text-[#d9be45]">资源消耗</span>
            </div>
            <div className="flex justify-between items-end h-full">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">统计额度</p>
                  <p className="text-2xl font-bold mb-2">{renderQuota(totalCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">统计Tokens</p>
                  <p className="text-xl font-bold">{formatNumber(consumeTokens)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Sparkline data={quotaSparkline} color="#d9be45" />
                <Sparkline data={tokenSparkline} color="#d9be45" />
              </div>
            </div>
          </div>

          {/* Card 4: 性能指标 */}
          <div className="bg-white rounded-2xl p-5 soft-shadow flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded bg-red-50 flex items-center justify-center"><Gauge className="size-3 text-[#b8655e]" /></div>
              <span className="font-semibold text-sm text-[#b8655e]">性能指标</span>
            </div>
            <div className="flex justify-between items-end h-full">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">平均 RPM</p>
                  <p className="text-2xl font-bold mb-2">{avgRPM.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">平均 TPM</p>
                  <p className="text-xl font-bold">{formatNumber(Math.round(avgTPM))}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Sparkline data={rpmSparkline} color="#b8655e" />
                <Sparkline data={tpmSparkline} color="#b8655e" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts + API Info row ── */}
      <div className={`grid gap-6 ${showApiInfo ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {/* Charts Panel */}
        <div className={`bg-white rounded-2xl soft-shadow p-6 ${showApiInfo ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="size-3 text-[#b8655e]" />
              </div>
              <span className="font-semibold text-foreground">模型数据分析</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {(['quota-dist', 'quota-trend', 'count-dist', 'count-rank'] as const).map((tab) => {
                const labels = { 'quota-dist': '消费分布', 'quota-trend': '消耗统计', 'count-dist': '调用数量分析', 'count-rank': '错误次数统计' };
                return (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`pb-1 transition-colors ${chartTab === tab ? 'font-medium text-foreground border-b-2 border-primary' : 'hover:text-foreground'}`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-sm font-semibold text-foreground mb-1">模型消费分布</p>
          <p className="text-xs text-muted-foreground mb-4">总计: {renderQuota(totalCost)}</p>

          {/* Chart content */}
          {chartTab === 'quota-dist' && (
              chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<SortedTooltip colorMap={modelColorMap} />} cursor={{ fill: 'rgba(238,90,62,0.04)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="square" iconSize={10} />
                    {activeQuotaModels.map(m => <Bar key={m} dataKey={m} stackId="a" fill={modelColorMap[m]} />)}
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">{loading ? '加载中...' : '暂无数据'}</div>
          )}

          {chartTab === 'quota-trend' && (
              chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<SortedTooltip colorMap={modelColorMap} />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="line" iconSize={10} />
                    {activeQuotaModels.map(m => <Line key={m} type="monotone" dataKey={m} stroke={modelColorMap[m]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">{loading ? '加载中...' : '暂无数据'}</div>
          )}

          {chartTab === 'count-dist' && (
              countChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={countChartData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<SortedTooltip colorMap={modelColorMap} />} cursor={{ fill: 'rgba(238,90,62,0.04)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="square" iconSize={10} />
                    {activeCountModels.map(m => <Bar key={m} dataKey={m} stackId="a" fill={modelColorMap[m]} />)}
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">{loading ? '加载中...' : '暂无数据'}</div>
          )}

          {chartTab === 'count-rank' && (
              modelRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={modelRanking.filter(e => e.count > 0).slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="model" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<SortedTooltip colorMap={modelColorMap} />} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {modelRanking.map((entry, i) => <Cell key={entry.model} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">{loading ? '加载中...' : '暂无数据'}</div>
          )}
        </div>

        {/* API Info Panel */}
        {showApiInfo && (
          <div className="bg-white rounded-2xl soft-shadow p-6 lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="size-6 rounded bg-[#f9f4f0] flex items-center justify-center">
                <Link className="size-3 text-primary" />
              </div>
              <span className="font-semibold text-foreground">API 接入</span>
            </div>
            <div className="space-y-3 flex-1">
              {apiInfoEntries.map((entry, idx) => (
                <div key={entry.id} className="bg-[#fdfaf6] p-3 rounded-xl border border-[#f9f4f0] relative group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ backgroundColor: API_BADGE_COLORS[idx % API_BADGE_COLORS.length] }}>
                        {entry.route.slice(0, 2)}
                      </span>
                      <span className="font-medium text-sm">{entry.route}</span>
                    </div>
                    <button onClick={() => handleCopyUrl(entry.url)} className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-0.5">
                      复制 <Copy className="size-3" />
                    </button>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground truncate">{entry.url}</div>
                  {entry.description && <div className="text-[10px] text-muted-foreground mt-1">({entry.description})</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom grid: Announcements + FAQ + Uptime ── */}
      {(showAnnouncements || showFaq || showUptime) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Announcements */}
          {showAnnouncements && (
            <div className="bg-white rounded-2xl soft-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                    <Megaphone className="size-3 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">系统公告</span>
                </div>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  {([['default','默认'],['ongoing','运行中'],['success','成功'],['error','失败']] as const).map(([key, label]) => (
                    <span key={key} className="flex items-center gap-1">
                      <span className={`size-1.5 rounded-full ${STATUS_DOT[key]}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-4">
                {announcements.map((item, i) => {
                  const pubDate = item.publishDate ? new Date(item.publishDate) : null;
                  const absTime = pubDate && !isNaN(pubDate.getTime())
                    ? `${pubDate.getFullYear()}-${String(pubDate.getMonth()+1).padStart(2,'0')}-${String(pubDate.getDate()).padStart(2,'0')} ${String(pubDate.getHours()).padStart(2,'0')}:${String(pubDate.getMinutes()).padStart(2,'0')}`
                    : '';
                  const rel = item.publishDate ? relativeTime(item.publishDate) : '';
                  const dotColor = STATUS_DOT[item.type || 'default'];
                  const isFirst = i === 0;
                  return (
                    <div key={item.id ?? i} className={`relative pl-4 border-l-2 ${isFirst ? 'border-primary' : 'border-slate-200'}`}>
                      <div className={`absolute -left-[5px] top-1.5 size-2 rounded-full ${isFirst ? 'bg-primary' : dotColor}`} />
                      <p className="text-sm font-medium">{item.content}</p>
                      {item.extra && <p className="text-xs text-muted-foreground mt-0.5">{item.extra}</p>}
                      {(rel || absTime) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{rel}{rel && absTime ? ' ' : ''}{absTime}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ */}
          {showFaq && (
            <div className="bg-white rounded-2xl soft-shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="size-3 text-primary" />
                </div>
                <span className="font-semibold text-foreground">常见问题</span>
              </div>
              <div className="divide-y divide-slate-100 text-sm">
                {faqItems.map((item, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full py-2.5 flex justify-between items-center group hover:text-primary transition-colors text-left"
                    >
                      <span>{item.question}</span>
                      {expandedFaq === i
                        ? <ChevronDown className="size-3 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        : <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary flex-shrink-0" />}
                    </button>
                    {expandedFaq === i && (
                      <p className="pb-3 text-sm text-muted-foreground -mt-1">{item.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uptime / Service Availability */}
          {showUptime && (
            <div className="bg-white rounded-2xl soft-shadow p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                    <Shield className="size-3 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">服务可用性</span>
                </div>
                <button
                  onClick={() => {
                    API.get('/api/uptime/status').then(res => {
                      if (res.data?.success) setUptimeGroups(res.data.data || []);
                    }).catch(() => {});
                  }}
                  className="size-6 rounded-full bg-slate-50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className="size-2.5" />
                </button>
              </div>

              {/* Group tabs if multiple */}
              {uptimeGroups.length > 1 && (
                <div className="flex gap-1 mb-4 overflow-x-auto">
                  {uptimeGroups.map((g, i) => (
                    <button
                      key={g.categoryName}
                      onClick={() => setUptimeTab(i)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${uptimeTab === i ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:text-foreground'}`}
                    >
                      {g.categoryName}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-4 flex-1">
                {(uptimeGroups[uptimeTab]?.monitors || []).map(mon => (
                  <div key={mon.name}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${uptimeStatusColor(mon.status)}`} />
                        {mon.name}
                      </span>
                      <span className="text-muted-foreground">{(mon.uptime * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${mon.uptime * 100 >= 99 ? 'bg-emerald-500' : mon.uptime * 100 >= 95 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(mon.uptime * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-3 text-[10px] text-muted-foreground mt-4">
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-slate-400" /> 停机</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" /> 正常</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" /> 降级</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-red-500" /> 维护中</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}