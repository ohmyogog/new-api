import { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Zap,
  Coins,
  Gauge,
  Timer,
  RefreshCw,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Megaphone,
  HelpCircle,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

// ── Chart colors (warm palette matching UIKIT) ──────────
const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-6': '#5cc8f0',
  'claude-opus-4-6': '#f5a0c0',
  'claude-haiku-4-5': '#1a6fb5',
  'claude-sonnet-4-5': '#b0d8f0',
  'claude-opus-4-5': '#e8a040',
  'gpt-4o': '#f0c850',
  'gpt-4o-mini': '#a8d870',
  'gemini-2.0-flash': '#d090e0',
  'deepseek-r1': '#70c0a0',
  'qwen-max': '#f08060',
};

// ── Mock chart data (stacked bar, hourly) ────────────────
function generateChartData() {
  const models = Object.keys(MODEL_COLORS);
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    const label = `${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:00`;
    const entry: Record<string, unknown> = { time: label };
    const peak = i > 14 && i < 20 ? 1 : i > 8 && i < 15 ? 2.5 : 0.4;
    models.forEach((m) => {
      entry[m] = Math.max(0, Math.round((Math.random() * 30 * peak + Math.random() * 5) * 10) / 10);
    });
    data.push(entry);
  }
  return data;
}

const chartData = generateChartData();
const totalCost = chartData.reduce((sum, row) => {
  let s = 0;
  Object.keys(MODEL_COLORS).forEach((m) => { s += (row[m] as number) || 0; });
  return sum + s;
}, 0);

// ── Mock data ──────────────────────────────────────────────
const mockUser = { username: 'Dev', role: 100 };
const isAdmin = mockUser.role >= 100;

const statsCards = [
  { key: 'balance', icon: Wallet, title: '余额', value: '¥128.50', trend: '+12.5%', up: true, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'used', icon: TrendingUp, title: '已用额度', value: '¥1,024.00', trend: '+8.3%', up: true, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'calls', icon: Zap, title: '调用次数', value: '12,847', trend: '-2.1%', up: false, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'tokens', icon: Coins, title: 'Token 消耗', value: '3.2M', trend: '+15.7%', up: true, color: 'text-purple-500', bg: 'bg-purple-50' },
  ...(isAdmin ? [
    { key: 'rpm', icon: Gauge, title: 'RPM', value: '342', trend: '+5.2%', up: true, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'tpm', icon: Timer, title: 'TPM', value: '48.5K', trend: '+3.8%', up: true, color: 'text-rose-500', bg: 'bg-rose-50' },
  ] : []),
];

const announcements = [
  { id: 1, title: '系统升级通知', content: '平台将于本周六凌晨 2:00-4:00 进行系统升级维护，届时服务可能短暂中断。', time: '2 小时前' },
  { id: 2, title: '新模型上线', content: 'Claude 4 Opus 已上线，支持 100 万 token 上下文窗口，欢迎体验。', time: '1 天前' },
  { id: 3, title: '计费规则调整', content: '自下月起，GPT-4o 模型价格下调 30%，详情请查看定价页面。', time: '3 天前' },
];

const faqItems = [
  { q: '如何获取 API Key？', a: '在控制台左侧菜单点击「令牌」，然后点击「添加令牌」即可创建新的 API Key。' },
  { q: '支持哪些模型？', a: '支持 OpenAI、Claude、Gemini、通义千问等 40+ 主流 AI 模型，具体列表请查看模型页面。' },
  { q: '如何充值？', a: '点击左侧菜单「充值」，支持在线支付和兑换码两种方式。' },
  { q: '调用出错怎么办？', a: '请先检查 API Key 是否有效、余额是否充足。如仍有问题，可查看日志页面获取详细错误信息。' },
];

// ── Greeting helper ────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

// ── Component ──────────────────────────────────────────────
export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const apiBase = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${apiBase}/v1`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}，{mockUser.username} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">这是你的 API 使用概览</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center size-10 rounded-xl bg-white border border-slate-100 soft-shadow text-muted-foreground hover:text-foreground transition-colors">
            <Search className="size-4" />
          </button>
          <button className="inline-flex items-center justify-center size-10 rounded-xl bg-white border border-slate-100 soft-shadow text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {statsCards.map((card) => (
          <div key={card.key} className="bg-white rounded-3xl border border-slate-100 soft-shadow p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`size-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-bold ${card.up ? 'text-emerald-500' : 'text-red-400'}`}>
                {card.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {card.trend}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.title}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">模型消耗分布</h2>
              <p className="text-sm text-muted-foreground">总计: ${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '1rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)', fontSize: 12 }} cursor={{ fill: 'rgba(238,90,62,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="square" iconSize={10} />
            {Object.entries(MODEL_COLORS).map(([model, color]) => (
              <Bar key={model} dataKey={model} stackId="a" fill={color} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom grid: API Info + Announcements */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* API Info */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ExternalLink className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">API 接入</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base URL</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 font-mono text-sm text-foreground border border-slate-100">
                  {apiBase}/v1
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              兼容 OpenAI API 格式，将你的 API 请求地址替换为上方地址即可使用。
            </p>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="size-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">系统公告</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {announcements.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="size-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">常见问题</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {faqItems.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-sm font-semibold text-foreground">{item.q}</span>
                {expandedFaq === i
                  ? <ChevronDown className="size-4 text-muted-foreground" />
                  : <ChevronRight className="size-4 text-muted-foreground" />}
              </button>
              {expandedFaq === i && (
                <p className="pb-4 text-sm text-muted-foreground -mt-1">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
