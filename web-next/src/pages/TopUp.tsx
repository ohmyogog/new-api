import { useState } from 'react';
import {
  CreditCard, Wallet, Gift, ChevronLeft, ChevronRight, Check, Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ── Mock data ──
const mockBalance = 128.5;
const amounts = [10, 20, 50, 100, 200, 500];
const mockHistory = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  time: Date.now() / 1000 - i * 86400 * 3,
  amount: amounts[i % amounts.length],
  method: i % 3 === 0 ? '在线支付' : '兑换码',
  status: i % 5 === 0 ? 'pending' : 'success',
}));

function fmtTime(t: number) { return new Date(t * 1000).toLocaleString('zh-CN'); }

export default function TopUpPage() {
  const [code, setCode] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [redeemed, setRedeemed] = useState(false);

  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(mockHistory.length / perPage));
  const pageHistory = mockHistory.slice((page - 1) * perPage, page * perPage);

  const handleRedeem = () => { setRedeemed(true); setTimeout(() => setRedeemed(false), 2000); setCode(''); };

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
          <p className="text-4xl font-bold">${mockBalance.toFixed(2)}</p>
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
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="输入兑换码" />
            <Button onClick={handleRedeem} disabled={!code.trim()} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-12">
              {redeemed ? <><Check className="size-4 mr-1.5" />兑换成功</> : '兑换'}
            </Button>
          </div>
        </div>

        {/* Amount Selection */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center"><Sparkles className="size-5 text-blue-500" /></div>
            <h2 className="text-lg font-bold">在线充值</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {amounts.map(a => (
              <button key={a} onClick={() => setSelectedAmount(a)}
                className={`py-4 rounded-2xl text-sm font-bold border-2 transition-all ${selectedAmount === a ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 hover:border-slate-200 text-foreground'}`}>
                ${a}
              </button>
            ))}
          </div>
          <Button disabled={!selectedAmount} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-12">
            {selectedAmount ? `支付 $${selectedAmount}` : '选择金额'}
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <div className="px-8 py-5 border-b border-slate-100"><h2 className="text-lg font-bold">充值记录</h2></div>
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['时间','金额','方式','状态'].map(h => (
              <th key={h} className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {pageHistory.map(h => (
              <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 text-sm text-muted-foreground">{fmtTime(h.time)}</td>
                <td className="px-8 py-5 text-sm font-bold text-emerald-600">+${h.amount.toFixed(2)}</td>
                <td className="px-8 py-5 text-sm text-muted-foreground">{h.method}</td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${h.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <span className={`size-1.5 rounded-full ${h.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {h.status === 'success' ? '成功' : '处理中'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {mockHistory.length} 条</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}
