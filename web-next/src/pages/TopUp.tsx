import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Wallet, Gift, ChevronLeft, ChevronRight,
  Users, Copy, ArrowRightLeft, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

function fmtTime(t: number) {
  if (!t) return '-';
  return new Date(t * 1000).toLocaleString('zh-CN');
}

interface TopupRecord {
  id: number;
  amount: number;
  money: number;
  trade_no: string;
  status: string;
  created_time: number;
  create_time: number;
  payment_method?: string;
}

interface TopupInfo {
  epay_enabled?: boolean;
  stripe_enabled?: boolean;
  creem_enabled?: boolean;
  redemption_enabled?: boolean;
  topup_amount_min?: number;
  topup_ratio?: number;
  enable_online_topup?: boolean;
  enable_stripe_topup?: boolean;
  enable_creem_topup?: boolean;
  min_topup?: number;
  amount_options?: number[];
  pay_methods?: Array<{ name: string; type: string }>;
}

interface AffInfo {
  aff_code: string;
  aff_quota: number;
  aff_count: number;
  aff_history_quota: number;
}

export default function TopUpPage() {
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [topupInfo, setTopupInfo] = useState<TopupInfo | null>(null);
  const [history, setHistory] = useState<TopupRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [affInfo, setAffInfo] = useState<AffInfo | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [loading, setLoading] = useState(true);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(historyTotal / perPage));

  const fetchBalance = useCallback(async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data.success) {
        const quota = res.data.data?.quota ?? 0;
        setBalance(quota / 500000);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchTopupInfo = useCallback(async () => {
    try {
      const res = await API.get('/api/user/topup/info');
      if (res.data.success) setTopupInfo(res.data.data);
    } catch { /* ignore */ }
  }, []);

  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const isAdmin = (getUser()?.role ?? 0) >= 10;
      const base = isAdmin ? '/api/user/topup' : '/api/user/topup/self';
      const res = await API.get(`${base}?p=${page}&page_size=${perPage}`);
      if (res.data.success) {
        const data = res.data.data;
        if (Array.isArray(data)) {
          setHistory(data);
          setHistoryTotal(data.length >= perPage ? page * perPage + 1 : (page - 1) * perPage + data.length);
        } else {
          setHistory(data?.items ?? data ?? []);
          setHistoryTotal(data?.total ?? 0);
        }
      }
    } catch { /* ignore */ }
    setHistoryLoading(false);
  }, []);

  const fetchAff = useCallback(async () => {
    try {
      const res = await API.get('/api/user/aff');
      if (res.data.success) {
        const d = res.data.data;
        if (typeof d === 'string') {
          setAffInfo({ aff_code: d, aff_quota: 0, aff_count: 0, aff_history_quota: 0 });
        } else {
          setAffInfo(d);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchBalance(), fetchTopupInfo(), fetchAff()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHistory(historyPage); }, [historyPage]);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setRedeeming(true);
    try {
      const res = await API.post('/api/user/topup', { key: code.trim() });
      if (res.data.success) {
        toast.success('兑换成功！');
        setCode('');
        fetchBalance();
        fetchHistory(1);
        setHistoryPage(1);
      } else {
        toast.error(res.data.message || '兑换失败');
      }
    } catch {
      toast.error('请求失败');
    }
    setRedeeming(false);
  };

  const handleTransferAff = async () => {
    setTransferring(true);
    try {
      const res = await API.post('/api/user/aff_transfer', { quota: affInfo?.aff_quota ?? 0 });
      if (res.data.success) {
        toast.success(res.data.message || '划转成功');
        fetchBalance();
        fetchAff();
      } else {
        toast.error(res.data.message || '划转失败');
      }
    } catch {
      toast.error('请求失败');
    }
    setTransferring(false);
  };

  const copyAffLink = () => {
    const affCode = affInfo?.aff_code ?? '';
    const link = `${window.location.origin}/register?aff=${affCode}`;
    navigator.clipboard.writeText(link).then(() => toast.success('邀请链接已复制'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard className="size-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">充值</h1><p className="text-sm text-muted-foreground">充值余额或兑换充值码</p></div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2"><Wallet className="size-5 opacity-80" /><span className="text-sm font-medium opacity-80">当前余额</span></div>
          <p className="text-4xl font-bold">${balance !== null ? balance.toFixed(2) : '...'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Redeem Code */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center"><Gift className="size-5 text-amber-500" /></div>
            <h2 className="text-lg font-bold">兑换码充值</h2>
          </div>
          <div className="space-y-4">
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="输入兑换码" onKeyDown={e => e.key === 'Enter' && handleRedeem()} />
            <Button onClick={handleRedeem} disabled={!code.trim() || redeeming} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-12">
              {redeeming ? <><Loader2 className="size-4 mr-1.5 animate-spin" />兑换中...</> : '兑换'}
            </Button>
          </div>
        </div>

        {/* Affiliate Card */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="size-5 text-blue-500" /></div>
            <h2 className="text-lg font-bold">邀请奖励</h2>
          </div>
          {affInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 mb-1">待划转额度</p>
                  <p className="text-lg font-bold">${((affInfo.aff_quota ?? 0) / 500000).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 mb-1">邀请人数</p>
                  <p className="text-lg font-bold">{affInfo.aff_count ?? 0}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={copyAffLink} variant="outline" className="flex-1 border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-2xl font-bold">
                  <Copy className="size-4 mr-1.5" />复制邀请链接
                </Button>
                <Button onClick={handleTransferAff} disabled={transferring || (affInfo.aff_quota ?? 0) <= 0} className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
                  {transferring ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <ArrowRightLeft className="size-4 mr-1.5" />}
                  划转余额
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">加载中...</p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <div className="px-8 py-5 border-b border-slate-100"><h2 className="text-lg font-bold">充值记录</h2></div>
        {historyLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="size-5 animate-spin text-primary" /></div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">暂无充值记录</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              {['订单号', '充值额度', '支付金额', '支付方式', '状态', '时间'].map(h => (
                <th key={h} className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {history.map(h => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-mono text-muted-foreground">{h.trade_no || '-'}</td>
                  <td className="px-8 py-5 text-sm font-bold text-emerald-600">{h.amount}</td>
                  <td className="px-8 py-5 text-sm text-muted-foreground">¥{(h.money ?? 0).toFixed(2)}</td>
                  <td className="px-8 py-5 text-sm text-muted-foreground">{h.payment_method || '-'}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${h.status === 'success' ? 'bg-emerald-50 text-emerald-600' : h.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                      <span className={`size-1.5 rounded-full ${h.status === 'success' ? 'bg-emerald-500' : h.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      {h.status === 'success' ? '成功' : h.status === 'pending' ? '待支付' : h.status === 'expired' ? '已过期' : h.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-muted-foreground">{fmtTime(h.created_time || h.create_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {historyTotal > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">共 {historyTotal} 条</p>
          <div className="flex items-center gap-2">
            <button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            <span className="text-sm font-medium px-2">{historyPage} / {totalPages}</span>
            <button disabled={historyPage >= totalPages} onClick={() => setHistoryPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
