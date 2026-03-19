import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Filter,
  Headphones,
  Image,
  LayoutGrid,
  Layers3,
  List,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  TableIcon,
  Tags,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { API } from '@/api/client';
import { TopPrimaryNav } from '@/components/layout/TopPrimaryNav';
import { useStatus } from '@/contexts/StatusContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Numberish = number | string | null | undefined;
type ViewMode = 'grid' | 'table' | 'list';
type Currency = 'USD' | 'CNY' | 'CUSTOM';
type SiteDisplayType = Currency | 'TOKENS';
type CapabilityKey =
  | 'chat'
  | 'embedding'
  | 'image'
  | 'audio'
  | 'moderation'
  | 'video'
  | 'rerank';
type TokenUnit = 'M' | 'K';
type QuotaFilter = 'all' | 0 | 1;
type FilterKey =
  | 'vendor'
  | 'capability'
  | 'group'
  | 'quota'
  | 'tag'
  | 'endpoint'
  | 'search';

interface ApiModel {
  model_name: string;
  model_ratio: Numberish;
  model_completion_ratio?: Numberish;
  completion_ratio?: Numberish;
  cache_ratio?: Numberish;
  create_cache_ratio?: Numberish;
  image_ratio?: Numberish;
  audio_ratio?: Numberish;
  audio_completion_ratio?: Numberish;
  model_price?: Numberish;
  model_type?: Numberish;
  quota_type: Numberish;
  vendor_id?: number;
  vendor_name?: string;
  vendor_icon?: string;
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

interface DisplayMetric {
  key: string;
  label: string;
  value: string;
  note?: string;
}

interface ComputedPricing {
  quotaInfo: {
    label: string;
    shortLabel: string;
    className: string;
  };
  primaryMetrics: [DisplayMetric, DisplayMetric];
  infoRows: DisplayMetric[];
  ratioRows: DisplayMetric[];
  auxiliaryMetrics: DisplayMetric[];
  usedGroup: string | null;
  usedGroupRatio: number;
}

interface PricingRenderContext {
  selectedGroup: string;
  groupRatios: Record<string, number>;
  endpointLabelMap: Record<string, string>;
  tokenUnit: TokenUnit;
  currency: Currency;
  siteDisplayType: SiteDisplayType;
  showWithRecharge: boolean;
  showRatio: boolean;
  priceRate: number;
  usdExchangeRate: number;
  customExchangeRate: number;
  customCurrencySymbol: string;
}

const vendorStyles: Record<
  string,
  { panel: string; icon: string; badge: string; chip: string }
> = {
  OpenAI: {
    panel: 'bg-[#e7f6ef]',
    icon: 'text-[#1f8a57]',
    badge: 'border-[#bce6cf] bg-[#eefaf4] text-[#1f8a57]',
    chip: 'bg-[#eefaf4] text-[#1f8a57]',
  },
  Anthropic: {
    panel: 'bg-[#fff0e7]',
    icon: 'text-[#dd6b3d]',
    badge: 'border-[#ffd6c2] bg-[#fff5ef] text-[#dd6b3d]',
    chip: 'bg-[#fff5ef] text-[#dd6b3d]',
  },
  Google: {
    panel: 'bg-[#eef4ff]',
    icon: 'text-[#4668d6]',
    badge: 'border-[#cfdcff] bg-[#f5f8ff] text-[#4668d6]',
    chip: 'bg-[#f5f8ff] text-[#4668d6]',
  },
  Meta: {
    panel: 'bg-[#f2f0ff]',
    icon: 'text-[#6f57d9]',
    badge: 'border-[#d9d2ff] bg-[#f7f5ff] text-[#6f57d9]',
    chip: 'bg-[#f7f5ff] text-[#6f57d9]',
  },
  DeepSeek: {
    panel: 'bg-[#ebfbfb]',
    icon: 'text-[#0f8c8c]',
    badge: 'border-[#bceeee] bg-[#f2fdfd] text-[#0f8c8c]',
    chip: 'bg-[#f2fdfd] text-[#0f8c8c]',
  },
  华为: {
    panel: 'bg-[#fff0ef]',
    icon: 'text-[#d54b42]',
    badge: 'border-[#ffd2cf] bg-[#fff7f6] text-[#d54b42]',
    chip: 'bg-[#fff7f6] text-[#d54b42]',
  },
  北京智源: {
    panel: 'bg-[#eef4ff]',
    icon: 'text-[#4668d6]',
    badge: 'border-[#cfdcff] bg-[#f5f8ff] text-[#4668d6]',
    chip: 'bg-[#f5f8ff] text-[#4668d6]',
  },
  Qwen: {
    panel: 'bg-[#fff1ec]',
    icon: 'text-[#dd6a48]',
    badge: 'border-[#ffd9cd] bg-[#fff7f4] text-[#dd6a48]',
    chip: 'bg-[#fff7f4] text-[#dd6a48]',
  },
};

const fallbackVendorStyle = {
  panel: 'bg-[#f2ece9]',
  icon: 'text-[#735f59]',
  badge: 'border-[#e8dad3] bg-[#faf6f3] text-[#735f59]',
  chip: 'bg-[#faf6f3] text-[#735f59]',
};

const vendorIconOverrides: Record<string, string> = {
  anthropic: '/vendor-icons/anthropic.png',
  deepseek: '/vendor-icons/deepseek.ico',
  google: '/vendor-icons/google.ico',
  meta: '/vendor-icons/meta.ico',
  moonshot: '/vendor-icons/moonshot.png',
  openai: '/vendor-icons/openai.png',
  bytedance: '/vendor-icons/bytedance.ico',
  zhipu: '/vendor-icons/zhipu.png',
  tencent: '/vendor-icons/tencent.ico',
  alibaba: '/vendor-icons/alibaba.ico',
  huawei: '/vendor-icons/huawei.ico',
  baai: '/vendor-icons/baai.png',
  '01ai': '/vendor-icons/01ai.png',
};

const vendorAliases: Record<string, string> = {
  anthropic: 'anthropic',
  claude: 'anthropic',
  deepseek: 'deepseek',
  google: 'google',
  gemini: 'google',
  meta: 'meta',
  moonshot: 'moonshot',
  kimi: 'moonshot',
  openai: 'openai',
  bytedance: 'bytedance',
  字节跳动: 'bytedance',
  zhipu: 'zhipu',
  zhipuai: 'zhipu',
  智谱: 'zhipu',
  tencent: 'tencent',
  腾讯: 'tencent',
  alibaba: 'alibaba',
  阿里巴巴: 'alibaba',
  qwen: 'alibaba',
  通义千问: 'alibaba',
  huawei: 'huawei',
  华为: 'huawei',
  baai: 'baai',
  北京智源: 'baai',
  智源: 'baai',
  '01ai': '01ai',
  '01.ai': '01ai',
  yi: '01ai',
  零一万物: '01ai',
};

const capabilityMeta: Record<CapabilityKey, { label: string; icon: LucideIcon }> = {
  chat: { label: '对话', icon: MessageSquare },
  embedding: { label: 'Embedding', icon: Zap },
  image: { label: '图像', icon: Image },
  audio: { label: '音频', icon: Headphones },
  moderation: { label: '审核', icon: Shield },
  video: { label: '视频', icon: Sparkles },
  rerank: { label: 'Rerank', icon: Filter },
};

const endpointMeta: Record<string, { label: string; capability: CapabilityKey }> = {
  openai: { label: 'OpenAI', capability: 'chat' },
  'openai-response': { label: 'Responses', capability: 'chat' },
  'openai-response-compact': { label: 'Responses Compact', capability: 'chat' },
  anthropic: { label: 'Anthropic', capability: 'chat' },
  gemini: { label: 'Gemini', capability: 'chat' },
  embeddings: { label: 'Embeddings', capability: 'embedding' },
  'image-generation': { label: '图像生成', capability: 'image' },
  'openai-video': { label: '视频生成', capability: 'video' },
  'jina-rerank': { label: 'Rerank', capability: 'rerank' },
};

const quotaMeta: Record<
  number,
  { label: string; shortLabel: string; className: string }
> = {
  0: {
    label: '按量计费',
    shortLabel: '按量',
    className: 'border-[#ffd8c9] bg-[#fff2eb] text-[#de6a45]',
  },
  1: {
    label: '按次计费',
    shortLabel: '按次',
    className: 'border-[#c9daf8] bg-[#edf4ff] text-[#4568ca]',
  },
};

const viewModes: Array<{ key: ViewMode; label: string; icon: LucideIcon }> = [
  { key: 'grid', label: '卡片视图', icon: LayoutGrid },
  { key: 'table', label: '表格视图', icon: TableIcon },
  { key: 'list', label: '列表视图', icon: List },
];

const sidebarCardClass =
  'rounded-[28px] border border-[#ead8cc] bg-[#fffdfb] p-5 shadow-[0_14px_32px_rgba(145,95,74,0.06)]';
const surfaceCardClass =
  'rounded-[28px] border border-[#ead8cc] bg-[#fffdfb] shadow-[0_14px_32px_rgba(145,95,74,0.06)]';
const mutedPanelClass =
  'rounded-2xl border border-[#efe0d6] bg-[#fff8f4] p-3';

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getQuotaType(model: ApiModel) {
  return Math.trunc(toFiniteNumber(model.quota_type, -1));
}

function getQuotaInfo(quotaType: number) {
  return quotaMeta[quotaType] ?? {
    label: '未知计费',
    shortLabel: '未知',
    className: 'border-[#e8dad3] bg-[#faf6f3] text-[#735f59]',
  };
}

function getVendorStyle(vendor: string) {
  return vendorStyles[vendor] ?? fallbackVendorStyle;
}

function normalizeVendorKey(vendor?: string) {
  return (vendor ?? '').trim().toLowerCase().replace(/[\s._-]+/g, '');
}

function getCanonicalVendorKey(vendor?: string) {
  const normalized = normalizeVendorKey(vendor);
  return vendorAliases[normalized] ?? normalized;
}

function resolveVendorIcon(vendor: string, vendorIcon?: string) {
  if (looksLikeImageSource(vendorIcon)) {
    return vendorIcon;
  }

  return vendorIconOverrides[getCanonicalVendorKey(vendor)];
}

function inferVendorFromModelName(modelName?: string) {
  const normalized = (modelName ?? '').trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith('baai/')) {
    return '北京智源';
  }

  if (normalized.startsWith('ascend-tribe/')) {
    return '华为';
  }

  return undefined;
}

function isUnknownVendorName(vendorName?: string) {
  const normalized = (vendorName ?? '').trim();
  return !normalized || normalized === '未知供应商';
}

function getVendorName(model: ApiModel) {
  const name = model.vendor_name?.trim();
  return name && name.length > 0 ? name : '未知供应商';
}

function getCompletionRatio(model: ApiModel) {
  return toFiniteNumber(
    model.model_completion_ratio ?? model.completion_ratio,
    1,
  );
}

function getCapabilityLabel(capability: CapabilityKey) {
  return capabilityMeta[capability]?.label ?? capability;
}

function getCapabilityIcon(capability: CapabilityKey) {
  return capabilityMeta[capability]?.icon ?? Sparkles;
}

function getCapabilities(model: ApiModel): CapabilityKey[] {
  const endpointCapabilities = (model.supported_endpoint_types ?? [])
    .map((type) => endpointMeta[type]?.capability)
    .filter((capability): capability is CapabilityKey => Boolean(capability));

  return Array.from(new Set(endpointCapabilities));
}

function getDisplayCapabilities(model: ApiModel) {
  return getCapabilities(model).filter((capability) => capability !== 'chat');
}

function getEndpointLabel(
  endpointType: string,
  endpointLabelMap: Record<string, string>,
) {
  return endpointLabelMap[endpointType] ?? endpointMeta[endpointType]?.label ?? endpointType;
}

function getEndpointLabels(
  model: ApiModel,
  endpointLabelMap: Record<string, string>,
) {
  return Array.from(
    new Set(
      (model.supported_endpoint_types ?? []).map((type) =>
        getEndpointLabel(type, endpointLabelMap),
      ),
    ),
  );
}

function getTagList(tags?: string) {
  return (tags ?? '')
    .split(/[,;|]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeTagValue(tag: string) {
  return tag.trim().toLowerCase();
}

function formatRatio(value: number) {
  return `${value.toFixed(3)}x`;
}

function looksLikeImageSource(src?: string) {
  if (!src) return false;
  return (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:image') ||
    src.startsWith('/')
  );
}

function formatMetric(metric: DisplayMetric) {
  return metric.note ? `${metric.value} ${metric.note}` : metric.value;
}

function resolveDisplayType(value: unknown): SiteDisplayType {
  if (value === 'USD' || value === 'CNY' || value === 'CUSTOM' || value === 'TOKENS') {
    return value;
  }
  return 'USD';
}

function getDefaultCurrency(displayType: SiteDisplayType): Currency {
  if (displayType === 'CNY' || displayType === 'CUSTOM') {
    return displayType;
  }
  return 'USD';
}

function formatMoneyValue(priceUSD: number, context: PricingRenderContext) {
  const safeUsdExchangeRate = context.usdExchangeRate || 1;
  let adjustedUSD = priceUSD;
  if (context.showWithRecharge) {
    adjustedUSD = (priceUSD * context.priceRate) / safeUsdExchangeRate;
  }

  if (context.currency === 'CNY') {
    return `¥${(adjustedUSD * safeUsdExchangeRate).toFixed(4)}`;
  }

  if (context.currency === 'CUSTOM') {
    return `${context.customCurrencySymbol}${(
      adjustedUSD * context.customExchangeRate
    ).toFixed(4)}`;
  }

  return `$${adjustedUSD.toFixed(4)}`;
}

function createMetric(
  key: string,
  label: string,
  value: string,
  note?: string,
): DisplayMetric {
  return { key, label, value, note };
}

function resolveAppliedGroup(
  model: ApiModel,
  selectedGroup: string,
  groupRatios: Record<string, number>,
) {
  let usedGroup = selectedGroup !== 'all' ? selectedGroup : null;
  let usedGroupRatio =
    selectedGroup !== 'all' ? groupRatios[selectedGroup] ?? 1 : undefined;

  if (selectedGroup === 'all' || usedGroupRatio === undefined) {
    let minRatio = Number.POSITIVE_INFINITY;
    for (const group of model.enable_groups ?? []) {
      const ratio = groupRatios[group];
      if (ratio !== undefined && ratio < minRatio) {
        minRatio = ratio;
        usedGroup = group;
        usedGroupRatio = ratio;
      }
    }
  }

  return {
    usedGroup,
    usedGroupRatio: usedGroupRatio ?? 1,
  };
}

function buildPricingData(
  model: ApiModel,
  context: PricingRenderContext,
): ComputedPricing {
  const quotaInfo = getQuotaInfo(getQuotaType(model));
  const { usedGroup, usedGroupRatio } = resolveAppliedGroup(
    model,
    context.selectedGroup,
    context.groupRatios,
  );
  const isTokenRatioDisplay = context.siteDisplayType === 'TOKENS';

  if (getQuotaType(model) === 1) {
    const requestPriceValue = Number(model.model_price);
    const requestPrice =
      Number.isFinite(requestPriceValue)
        ? formatMoneyValue(requestPriceValue * usedGroupRatio, context)
        : '--';

    return {
      quotaInfo,
      primaryMetrics: [
        createMetric('request-price', '模型价格', requestPrice, '/ 次'),
        createMetric('used-group', '生效分组', usedGroup ?? '默认倍率'),
      ],
      infoRows: [
        createMetric('quota', '计费方式', quotaInfo.label),
        createMetric('group-ratio', '分组倍率', formatRatio(usedGroupRatio)),
      ],
      ratioRows: [createMetric('group-ratio', '分组倍率', formatRatio(usedGroupRatio))],
      auxiliaryMetrics: [],
      usedGroup,
      usedGroupRatio,
    };
  }

  const modelRatio = toFiniteNumber(model.model_ratio, 0);
  const completionRatio = getCompletionRatio(model);
  const cacheRatio = toFiniteNumber(model.cache_ratio, NaN);
  const createCacheRatio = toFiniteNumber(model.create_cache_ratio, NaN);
  const imageRatio = toFiniteNumber(model.image_ratio, NaN);
  const audioRatio = toFiniteNumber(model.audio_ratio, NaN);
  const audioCompletionRatio = toFiniteNumber(model.audio_completion_ratio, NaN);
  const unitDivisor = context.tokenUnit === 'K' ? 1000 : 1;
  const unitNote = `/ 1${context.tokenUnit} tokens`;
  const inputPriceUSD = modelRatio * 2 * usedGroupRatio;
  const outputPriceUSD = inputPriceUSD * completionRatio;

  const auxiliaryRatios = [
    Number.isFinite(cacheRatio)
      ? createMetric('cache-ratio', '缓存读取倍率', formatRatio(cacheRatio))
      : null,
    Number.isFinite(createCacheRatio)
      ? createMetric('create-cache-ratio', '缓存创建倍率', formatRatio(createCacheRatio))
      : null,
    Number.isFinite(imageRatio)
      ? createMetric('image-ratio', '图片输入倍率', formatRatio(imageRatio))
      : null,
    Number.isFinite(audioRatio)
      ? createMetric('audio-input-ratio', '音频输入倍率', formatRatio(audioRatio))
      : null,
    Number.isFinite(audioRatio) && Number.isFinite(audioCompletionRatio)
      ? createMetric(
          'audio-output-ratio',
          '音频补全倍率',
          formatRatio(audioRatio * audioCompletionRatio),
        )
      : null,
  ].filter((metric): metric is DisplayMetric => Boolean(metric));

  const auxiliaryPrices = [
    Number.isFinite(cacheRatio)
      ? createMetric(
          'cache-price',
          '缓存读取价格',
          formatMoneyValue((inputPriceUSD * cacheRatio) / unitDivisor, context),
          unitNote,
        )
      : null,
    Number.isFinite(createCacheRatio)
      ? createMetric(
          'create-cache-price',
          '缓存创建价格',
          formatMoneyValue(
            (inputPriceUSD * createCacheRatio) / unitDivisor,
            context,
          ),
          unitNote,
        )
      : null,
    Number.isFinite(imageRatio)
      ? createMetric(
          'image-price',
          '图片输入价格',
          formatMoneyValue((inputPriceUSD * imageRatio) / unitDivisor, context),
          unitNote,
        )
      : null,
    Number.isFinite(audioRatio)
      ? createMetric(
          'audio-input-price',
          '音频输入价格',
          formatMoneyValue((inputPriceUSD * audioRatio) / unitDivisor, context),
          unitNote,
        )
      : null,
    Number.isFinite(audioRatio) && Number.isFinite(audioCompletionRatio)
      ? createMetric(
          'audio-output-price',
          '音频补全价格',
          formatMoneyValue(
            (inputPriceUSD * audioRatio * audioCompletionRatio) / unitDivisor,
            context,
          ),
          unitNote,
        )
      : null,
  ].filter((metric): metric is DisplayMetric => Boolean(metric));

  return {
    quotaInfo,
    primaryMetrics: isTokenRatioDisplay
      ? [
          createMetric('input-ratio', '输入倍率', formatRatio(modelRatio)),
          createMetric('output-ratio', '补全倍率', formatRatio(completionRatio)),
        ]
      : [
          createMetric(
            'input-price',
            '输入价格',
            formatMoneyValue(inputPriceUSD / unitDivisor, context),
            unitNote,
          ),
          createMetric(
            'output-price',
            '输出价格',
            formatMoneyValue(outputPriceUSD / unitDivisor, context),
            unitNote,
          ),
        ],
    infoRows: [
      createMetric('quota', '计费方式', quotaInfo.label),
      createMetric('group', '生效分组', usedGroup ?? '最优分组'),
      createMetric('unit', '计价单位', `1${context.tokenUnit} tokens`),
    ],
    ratioRows: [
      createMetric('model-ratio', '模型倍率', formatRatio(modelRatio)),
      createMetric('completion-ratio', '补全倍率', formatRatio(completionRatio)),
      createMetric('group-ratio', '分组倍率', formatRatio(usedGroupRatio)),
    ],
    auxiliaryMetrics: isTokenRatioDisplay ? auxiliaryRatios : auxiliaryPrices,
    usedGroup,
    usedGroupRatio,
  };
}

function getFallbackDescription(model: ApiModel) {
  const endpointCount = model.supported_endpoint_types?.length ?? 0;
  if (endpointCount > 0) {
    return `已配置 ${endpointCount} 个端点类型`;
  }
  return '暂无描述';
}

function toggleInList<T>(current: readonly T[], value: T) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function ModelIconTile({
  vendor,
  vendorIcon,
  fallbackIcon: FallbackIcon,
}: {
  vendor: string;
  vendorIcon?: string;
  fallbackIcon: LucideIcon;
}) {
  const style = getVendorStyle(vendor);

  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/60',
        style.panel,
      )}
    >
      {looksLikeImageSource(vendorIcon) ? (
        <img
          src={vendorIcon}
          alt={vendor}
          className="size-7 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <FallbackIcon className={cn('size-5', style.icon)} />
      )}
    </div>
  );
}

function VendorAvatar({
  vendor,
  vendorIcon,
  className,
}: {
  vendor: string;
  vendorIcon?: string;
  className?: string;
}) {
  const style = getVendorStyle(vendor);

  if (looksLikeImageSource(vendorIcon)) {
    return (
      <span
        className={cn(
          'inline-flex size-4 shrink-0 overflow-hidden rounded-full bg-white',
          className,
        )}
      >
        <img
          src={vendorIcon}
          alt={vendor}
          className="size-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        style.chip,
        className,
      )}
    >
      {vendor.slice(0, 1) || '?'}
    </span>
  );
}

function VendorBadge({
  vendor,
  vendorIcon,
}: {
  vendor: string;
  vendorIcon?: string;
}) {
  const style = getVendorStyle(vendor);

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-7 gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold',
        style.badge,
      )}
    >
      <VendorAvatar vendor={vendor} vendorIcon={vendorIcon} />
      {vendor}
    </Badge>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number | string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition-all',
        active
          ? 'border-primary/15 bg-[#fff1e7] text-[#b85a34] shadow-[0_10px_24px_rgba(242,107,72,0.08)]'
          : 'border-primary/10 bg-white text-[#6f5f5a] hover:border-primary/20 hover:bg-[#fffaf7]',
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            active ? 'bg-primary text-white' : 'bg-[#fff7f2] text-[#9a7b70]',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SidebarSection({
  icon: Icon,
  title,
  children,
  withBorder = true,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  withBorder?: boolean;
}) {
  return (
    <section
      className={cn('space-y-3', withBorder && 'border-t border-[#f1e4dd] pt-4')}
    >
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <Icon className="size-4 text-[#cc7b5c]" />
        <h2 className="text-sm font-semibold text-[#473733]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/12 px-3 py-2.5 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
  );
}

function PricePanel({ metric }: { metric: DisplayMetric }) {
  return (
    <div className={mutedPanelClass}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b7f74]">
        {metric.label}
      </span>
      <div className="space-y-0.5">
        <p className="font-mono text-lg font-black tracking-tight text-[#342d2b]">
          {metric.value}
        </p>
        {metric.note && (
          <p className="text-[11px] text-[#8b7770]">{metric.note}</p>
        )}
      </div>
    </div>
  );
}

function ModelCard({
  model,
  pricingContext,
}: {
  model: ApiModel;
  pricingContext: PricingRenderContext;
}) {
  const vendor = getVendorName(model);
  const capabilities = getDisplayCapabilities(model);
  const primaryCapability = capabilities[0];
  const PrimaryIcon = primaryCapability
    ? getCapabilityIcon(primaryCapability)
    : Sparkles;
  const pricing = buildPricingData(model, pricingContext);
  const showRatioSection =
    pricingContext.showRatio || pricingContext.siteDisplayType === 'TOKENS';
  const description = model.description?.trim();

  return (
    <article
      className="flex h-full flex-col gap-3 rounded-[24px] border border-[#f0e2d8] bg-white p-3 shadow-[0_12px_30px_rgba(145,95,74,0.06)]"
      style={{ contentVisibility: 'auto' }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <ModelIconTile
            vendor={vendor}
            vendorIcon={model.vendor_icon}
            fallbackIcon={PrimaryIcon}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <h3 className="truncate text-[17px] font-extrabold tracking-tight text-[#2f2624]">
                {model.model_name}
              </h3>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              <VendorBadge vendor={vendor} vendorIcon={model.vendor_icon} />
              {capabilities.map((capability) => (
                <Badge
                  key={capability}
                  variant="secondary"
                  className="h-6 rounded-full bg-[#fff7f2] px-2 text-[10px] font-medium text-[#5f4d47]"
                >
                  {getCapabilityLabel(capability)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'h-6 shrink-0 rounded-full border px-2 text-[10px] font-semibold',
            pricing.quotaInfo.className,
          )}
        >
          {pricing.quotaInfo.shortLabel}
        </Badge>
      </div>

      {description && (
        <p className="text-[13px] leading-5 text-[#78645c] text-pretty">
          {description}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {pricing.primaryMetrics.map((metric) => (
          <PricePanel key={metric.key} metric={metric} />
        ))}
      </div>

      <div className="grid gap-1.5 rounded-2xl border border-[#f4e3db] bg-[#fff8f5] p-2.5 text-[13px]">
        {pricing.infoRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-[#8b7770]">{row.label}</span>
            <span className="text-right text-[12px] font-medium text-[#342d2b]">
              {formatMetric(row)}
            </span>
          </div>
        ))}

        {showRatioSection && pricing.ratioRows.length > 0 && (
          <div className="mt-0.5 space-y-1.5 border-t border-[#f2e3db] pt-2.5">
            {pricing.ratioRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-[#8b7770]">{row.label}</span>
                <span className="font-mono text-[12px] font-bold tabular-nums text-primary">
                  {formatMetric(row)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {pricing.auxiliaryMetrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pricing.auxiliaryMetrics.map((metric) => (
            <Badge
              key={metric.key}
              variant="secondary"
              className="h-auto items-start rounded-xl bg-[#f6ebe5] px-2.5 py-1.5 text-left text-[10px] font-medium text-[#5f4d47]"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[#917a71]">{metric.label}</span>
                <span className="font-mono font-semibold text-[#342d2b]">
                  {formatMetric(metric)}
                </span>
              </span>
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}

function PricingTableView({
  models,
  pricingContext,
}: {
  models: ApiModel[];
  pricingContext: PricingRenderContext;
}) {
  const showRatioColumn =
    pricingContext.showRatio || pricingContext.siteDisplayType === 'TOKENS';

  return (
    <div className={cn(surfaceCardClass, 'overflow-hidden')}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#f1e4dd] bg-[#fcf3ef]">
            <TableHead className="pl-6">模型</TableHead>
            <TableHead>厂商</TableHead>
            <TableHead>能力</TableHead>
            <TableHead>价格概览</TableHead>
            <TableHead>分组与计费</TableHead>
            <TableHead className="pr-6">标签与端点</TableHead>
            {showRatioColumn && <TableHead className="pr-6 text-right">倍率</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => {
            const vendor = getVendorName(model);
            const pricing = buildPricingData(model, pricingContext);
            const capabilities = getDisplayCapabilities(model);
            const endpointLabels = getEndpointLabels(
              model,
              pricingContext.endpointLabelMap,
            );
            const tags = getTagList(model.tags);

            return (
              <TableRow
                key={model.model_name}
                className="border-b border-[#f5ebe6] hover:bg-[#fffaf8]"
              >
                <TableCell className="whitespace-normal pl-6 align-top">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-[#342d2b]">{model.model_name}</p>
                    <p className="line-clamp-2 text-sm leading-6 text-[#7d685f]">
                      {model.description?.trim() || getFallbackDescription(model)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal align-top">
                  <VendorBadge vendor={vendor} vendorIcon={model.vendor_icon} />
                </TableCell>
                <TableCell className="whitespace-normal align-top">
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((capability) => (
                      <Badge
                        key={capability}
                        variant="secondary"
                        className="h-7 rounded-full bg-[#fff7f2] px-2.5 text-[11px] font-medium text-[#5f4d47]"
                      >
                        {getCapabilityLabel(capability)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal align-top">
                  <div className="space-y-2">
                    {pricing.primaryMetrics.map((metric) => (
                      <div key={metric.key}>
                        <p className="text-xs text-[#927d74]">{metric.label}</p>
                        <p className="font-mono font-semibold text-[#342d2b]">
                          {formatMetric(metric)}
                        </p>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal align-top">
                  <div className="space-y-2">
                    {pricing.infoRows.map((row) => (
                      <div key={row.key}>
                        <p className="text-xs text-[#927d74]">{row.label}</p>
                        <p className="text-sm font-medium text-[#342d2b]">
                          {formatMetric(row)}
                        </p>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal pr-6 align-top">
                  <div className="flex flex-wrap gap-2">
                    {endpointLabels.map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="h-7 rounded-full bg-[#fff7f2] px-2.5 text-[11px] font-medium text-[#8b6b60]"
                      >
                        {label}
                      </Badge>
                    ))}
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="h-7 rounded-full border-[#ead7d0] px-2.5 text-[11px] font-medium text-[#4f3f3b]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {showRatioColumn && (
                  <TableCell className="whitespace-normal pr-6 text-right align-top">
                    <div className="space-y-2">
                      {pricing.ratioRows.map((row) => (
                        <div key={row.key}>
                          <p className="text-xs text-[#927d74]">{row.label}</p>
                          <p className="font-mono font-semibold text-primary">
                            {formatMetric(row)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PricingListView({
  models,
  pricingContext,
}: {
  models: ApiModel[];
  pricingContext: PricingRenderContext;
}) {
  const showRatioSection =
    pricingContext.showRatio || pricingContext.siteDisplayType === 'TOKENS';

  return (
    <div className={cn(surfaceCardClass, 'divide-y divide-[#f4e6df] overflow-hidden')}>
      {models.map((model) => {
        const vendor = getVendorName(model);
        const pricing = buildPricingData(model, pricingContext);
        const capabilities = getDisplayCapabilities(model);
        const endpointLabels = getEndpointLabels(
          model,
          pricingContext.endpointLabelMap,
        );

        return (
          <div
            key={model.model_name}
            className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-start lg:justify-between"
          >
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[#342d2b]">{model.model_name}</p>
                <VendorBadge vendor={vendor} vendorIcon={model.vendor_icon} />
                {capabilities.map((capability) => (
                  <Badge
                    key={capability}
                    variant="secondary"
                    className="h-7 rounded-full bg-[#fff7f2] px-2.5 text-[11px] font-medium text-[#5f4d47]"
                  >
                    {getCapabilityLabel(capability)}
                  </Badge>
                ))}
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[#7d685f]">
                {model.description?.trim() || getFallbackDescription(model)}
              </p>

              {(endpointLabels.length > 0 || pricing.auxiliaryMetrics.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {endpointLabels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="h-7 rounded-full bg-[#fff7f2] px-2.5 text-[11px] font-medium text-[#8b6b60]"
                    >
                      {label}
                    </Badge>
                  ))}
                  {pricing.auxiliaryMetrics.slice(0, 3).map((metric) => (
                    <Badge
                      key={metric.key}
                      variant="outline"
                      className="h-7 rounded-full border-[#ead7d0] px-2.5 text-[11px] font-medium text-[#5f4d47]"
                    >
                      {metric.label}: {formatMetric(metric)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-start gap-6 text-sm lg:justify-end">
              {pricing.primaryMetrics.map((metric) => (
                <div key={metric.key}>
                  <p className="text-xs text-[#927d74]">{metric.label}</p>
                  <p className="font-mono font-semibold text-[#342d2b]">
                    {formatMetric(metric)}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-xs text-[#927d74]">计费方式</p>
                <p className="font-medium text-[#342d2b]">{pricing.quotaInfo.label}</p>
              </div>
              {showRatioSection && pricing.ratioRows.length > 0 && (
                <div>
                  <p className="text-xs text-[#927d74]">倍率</p>
                  <p className="font-mono font-semibold text-primary">
                    {pricing.ratioRows.map((item) => item.value).join(' / ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PricingPage() {
  const { status } = useStatus();
  const statusData = (status ?? {}) as Record<string, unknown>;
  const siteDisplayType = resolveDisplayType(statusData.quota_display_type);

  const priceRate = useMemo(() => toFiniteNumber(statusData.price, 1), [statusData]);
  const usdExchangeRate = useMemo(
    () => toFiniteNumber(statusData.usd_exchange_rate, priceRate || 1),
    [priceRate, statusData],
  );
  const customExchangeRate = useMemo(
    () => toFiniteNumber(statusData.custom_currency_exchange_rate, 1),
    [statusData],
  );
  const customCurrencySymbol = useMemo(() => {
    const raw = statusData.custom_currency_symbol;
    return typeof raw === 'string' && raw.trim() ? raw : '¤';
  }, [statusData]);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [view, setView] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityKey[]>(
    [],
  );
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedQuota, setSelectedQuota] = useState<QuotaFilter>('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState('all');
  const [showWithRecharge, setShowWithRecharge] = useState(false);
  const [showRatio, setShowRatio] = useState(false);
  const [tokenUnit, setTokenUnit] = useState<TokenUnit>('M');
  const [currency, setCurrency] = useState<Currency>(getDefaultCurrency(siteDisplayType));
  const [models, setModels] = useState<ApiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupRatios, setGroupRatios] = useState<Record<string, number>>({});
  const [usableGroups, setUsableGroups] = useState<Record<string, unknown>>({});
  const [endpointLabelMap, setEndpointLabelMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (siteDisplayType === 'TOKENS') {
      setShowWithRecharge(false);
      setCurrency('USD');
      return;
    }

    setCurrency(getDefaultCurrency(siteDisplayType));
  }, [siteDisplayType]);

  const loadPricing = useCallback(async () => {
    setLoading(true);

    try {
      const res = await API.get('/api/pricing');
      const {
        success,
        message,
        data,
        vendors,
        group_ratio,
        usable_group,
        supported_endpoint,
      } = res.data as {
        success: boolean;
        message?: string;
        data?: ApiModel[];
        vendors?: Vendor[];
        group_ratio?: Record<string, unknown>;
        usable_group?: Record<string, unknown>;
        supported_endpoint?: Record<string, unknown>;
      };

      if (!success) {
        toast.error(message || '加载失败');
        return;
      }

      const vendorMap = new Map<number, Vendor>();
      for (const vendor of vendors ?? []) {
        vendorMap.set(vendor.id, vendor);
      }

      const normalizedGroupRatios: Record<string, number> = {};
      for (const [key, value] of Object.entries(group_ratio ?? {})) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          normalizedGroupRatios[key] = parsed;
        }
      }

      const normalizedEndpointMap: Record<string, string> = {};
      for (const [key, value] of Object.entries(supported_endpoint ?? {})) {
        if (typeof value === 'string' && value.trim()) {
          normalizedEndpointMap[key] = value.trim();
        }
      }

      const enriched = (data ?? []).map((model) => {
        const vendor = model.vendor_id ? vendorMap.get(model.vendor_id) : undefined;
        const upstreamVendorName = model.vendor_name?.trim() || vendor?.name;
        const inferredVendorName = inferVendorFromModelName(model.model_name);
        const vendorName: string = isUnknownVendorName(upstreamVendorName)
          ? inferredVendorName ?? upstreamVendorName ?? '未知供应商'
          : upstreamVendorName ?? '未知供应商';

        return {
          ...model,
          vendor_name: vendorName,
          vendor_icon: resolveVendorIcon(
            vendorName,
            model.vendor_icon ?? vendor?.icon,
          ),
          model_completion_ratio:
            model.model_completion_ratio ?? model.completion_ratio,
        };
      });

      enriched.sort((left, right) => {
        const leftQuota = getQuotaType(left);
        const rightQuota = getQuotaType(right);
        if (leftQuota !== rightQuota) {
          return leftQuota - rightQuota;
        }

        const leftIsGpt = left.model_name.startsWith('gpt');
        const rightIsGpt = right.model_name.startsWith('gpt');
        if (leftIsGpt !== rightIsGpt) {
          return leftIsGpt ? -1 : 1;
        }

        return left.model_name.localeCompare(right.model_name);
      });

      setModels(enriched);
      setGroupRatios(normalizedGroupRatios);
      setUsableGroups(usable_group ?? {});
      setEndpointLabelMap(normalizedEndpointMap);
    } catch {
      toast.error('加载定价数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPricing();
  }, [loadPricing]);

  const matchesFilters = useCallback(
    (model: ApiModel, ignore: readonly FilterKey[] = []) => {
      if (!ignore.includes('group') && selectedGroup !== 'all') {
        if (!(model.enable_groups ?? []).includes(selectedGroup)) {
          return false;
        }
      }

      if (!ignore.includes('quota') && selectedQuota !== 'all') {
        if (getQuotaType(model) !== selectedQuota) {
          return false;
        }
      }

      if (!ignore.includes('vendor') && selectedVendors.length > 0) {
        if (!selectedVendors.includes(getVendorName(model))) {
          return false;
        }
      }

      if (!ignore.includes('capability') && selectedCapabilities.length > 0) {
        const capabilities = getCapabilities(model);
        if (!selectedCapabilities.some((capability) => capabilities.includes(capability))) {
          return false;
        }
      }

      if (!ignore.includes('tag') && selectedTag !== 'all') {
        const tags = getTagList(model.tags).map(normalizeTagValue);
        if (!tags.includes(normalizeTagValue(selectedTag))) {
          return false;
        }
      }

      if (!ignore.includes('endpoint') && selectedEndpoint !== 'all') {
        if (!(model.supported_endpoint_types ?? []).includes(selectedEndpoint)) {
          return false;
        }
      }

      if (!ignore.includes('search') && deferredSearch) {
        const haystacks = [
          model.model_name,
          model.description ?? '',
          model.tags ?? '',
          getVendorName(model),
        ]
          .join(' ')
          .toLowerCase();

        if (!haystacks.includes(deferredSearch)) {
          return false;
        }
      }

      return true;
    },
    [
      deferredSearch,
      selectedCapabilities,
      selectedEndpoint,
      selectedGroup,
      selectedQuota,
      selectedTag,
      selectedVendors,
    ],
  );

  const filteredModels = useMemo(
    () => models.filter((model) => matchesFilters(model)),
    [matchesFilters, models],
  );

  const vendorScopedModels = useMemo(
    () => models.filter((model) => matchesFilters(model, ['vendor'])),
    [matchesFilters, models],
  );
  const capabilityScopedModels = useMemo(
    () => models.filter((model) => matchesFilters(model, ['capability'])),
    [matchesFilters, models],
  );
  const quotaScopedModels = useMemo(
    () => models.filter((model) => matchesFilters(model, ['quota'])),
    [matchesFilters, models],
  );
  const groupScopedModels = useMemo(
    () => models.filter((model) => matchesFilters(model, ['group'])),
    [matchesFilters, models],
  );
  const tagScopedModels = useMemo(
    () => models.filter((model) => matchesFilters(model, ['tag'])),
    [matchesFilters, models],
  );
  const endpointScopedModels = useMemo(
    () => models.filter((model) => matchesFilters(model, ['endpoint'])),
    [matchesFilters, models],
  );

  const vendorIcons = useMemo(() => {
    return models.reduce<Record<string, string>>((acc, model) => {
      const vendor = getVendorName(model);
      if (!acc[vendor] && model.vendor_icon) {
        acc[vendor] = model.vendor_icon;
      }
      return acc;
    }, {});
  }, [models]);

  const allVendors = useMemo(
    () => Array.from(new Set(models.map((model) => getVendorName(model)))).sort(),
    [models],
  );
  const vendorCounts = useMemo(() => {
    return vendorScopedModels.reduce<Record<string, number>>((acc, model) => {
      const vendor = getVendorName(model);
      acc[vendor] = (acc[vendor] ?? 0) + 1;
      return acc;
    }, {});
  }, [vendorScopedModels]);

  const allCapabilities = useMemo(
    () =>
      Array.from(
        new Set(models.flatMap((model) => getCapabilities(model))),
      ) as CapabilityKey[],
    [models],
  );
  const capabilityCounts = useMemo(() => {
    return capabilityScopedModels.reduce<Record<string, number>>((acc, model) => {
      for (const capability of getCapabilities(model)) {
        acc[capability] = (acc[capability] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [capabilityScopedModels]);

  const allGroups = useMemo(() => {
    const groups = new Set<string>();

    for (const key of Object.keys(usableGroups)) {
      if (key) {
        groups.add(key);
      }
    }

    for (const model of models) {
      for (const group of model.enable_groups ?? []) {
        if (group) {
          groups.add(group);
        }
      }
    }

    return ['all', ...Array.from(groups).sort()];
  }, [models, usableGroups]);
  const groupCounts = useMemo(() => {
    return groupScopedModels.reduce<Record<string, number>>((acc, model) => {
      for (const group of model.enable_groups ?? []) {
        acc[group] = (acc[group] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [groupScopedModels]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const model of models) {
      for (const tag of getTagList(model.tags)) {
        tags.add(normalizeTagValue(tag));
      }
    }
    return ['all', ...Array.from(tags).sort()];
  }, [models]);
  const tagCounts = useMemo(() => {
    return tagScopedModels.reduce<Record<string, number>>((acc, model) => {
      for (const tag of getTagList(model.tags)) {
        const normalized = normalizeTagValue(tag);
        acc[normalized] = (acc[normalized] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [tagScopedModels]);

  const allEndpoints = useMemo(() => {
    const endpoints = new Set<string>();

    for (const model of models) {
      for (const endpoint of model.supported_endpoint_types ?? []) {
        endpoints.add(endpoint);
      }
    }

    for (const endpoint of Object.keys(endpointLabelMap)) {
      endpoints.add(endpoint);
    }

    return ['all', ...Array.from(endpoints).sort()];
  }, [endpointLabelMap, models]);
  const endpointCounts = useMemo(() => {
    return endpointScopedModels.reduce<Record<string, number>>((acc, model) => {
      for (const endpoint of model.supported_endpoint_types ?? []) {
        acc[endpoint] = (acc[endpoint] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [endpointScopedModels]);

  const quotaCounts = useMemo(() => {
    return quotaScopedModels.reduce<Record<string, number>>((acc, model) => {
      const quotaType = getQuotaType(model);
      acc.all = (acc.all ?? 0) + 1;
      if (quotaType === 0 || quotaType === 1) {
        acc[String(quotaType)] = (acc[String(quotaType)] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [quotaScopedModels]);

  const activeFilterCount =
    selectedVendors.length +
    selectedCapabilities.length +
    (selectedGroup !== 'all' ? 1 : 0) +
    (selectedQuota !== 'all' ? 1 : 0) +
    (selectedTag !== 'all' ? 1 : 0) +
    (selectedEndpoint !== 'all' ? 1 : 0);

  const pricingContext = useMemo<PricingRenderContext>(
    () => ({
      selectedGroup,
      groupRatios,
      endpointLabelMap,
      tokenUnit,
      currency,
      siteDisplayType,
      showWithRecharge,
      showRatio,
      priceRate,
      usdExchangeRate,
      customExchangeRate,
      customCurrencySymbol,
    }),
    [
      currency,
      customCurrencySymbol,
      customExchangeRate,
      endpointLabelMap,
      groupRatios,
      priceRate,
      selectedGroup,
      showRatio,
      showWithRecharge,
      siteDisplayType,
      tokenUnit,
      usdExchangeRate,
    ],
  );

  const summaryChips = useMemo(() => {
    const items: string[] = [];

    if (search.trim()) {
      items.push(`关键词: ${search.trim()}`);
    }
    if (selectedVendors.length > 0) {
      items.push(
        selectedVendors.length === 1
          ? `供应商: ${selectedVendors[0]}`
          : `供应商: ${selectedVendors.length} 项`,
      );
    }
    if (selectedCapabilities.length > 0) {
      items.push(
        `能力: ${selectedCapabilities.map(getCapabilityLabel).join(' / ')}`,
      );
    }
    if (selectedGroup !== 'all') {
      items.push(`分组: ${selectedGroup}`);
    }
    if (selectedQuota !== 'all') {
      items.push(`计费: ${selectedQuota === 0 ? '按量计费' : '按次计费'}`);
    }
    if (selectedTag !== 'all') {
      items.push(`标签: ${selectedTag}`);
    }
    if (selectedEndpoint !== 'all') {
      items.push(`端点: ${getEndpointLabel(selectedEndpoint, endpointLabelMap)}`);
    }

    return items;
  }, [
    endpointLabelMap,
    search,
    selectedCapabilities,
    selectedEndpoint,
    selectedGroup,
    selectedQuota,
    selectedTag,
    selectedVendors,
  ]);

  const heroTitle = useMemo(() => {
    if (selectedVendors.length === 1) {
      return selectedVendors[0];
    }
    if (selectedVendors.length > 1) {
      return `${selectedVendors.length} 个供应商`;
    }
    return '全部供应商';
  }, [selectedVendors]);

  const heroSubtitle = useMemo(() => {
    if (summaryChips.length === 0) {
      return '查看当前可用模型的价格、倍率、分组、标签与端点信息。页面结构按参考稿重写，但展示逻辑保持与旧版模型广场一致。';
    }
    return `当前筛选为 ${summaryChips.join('，')}。右侧内容区会同步保留价格、倍率、分组和能力展示。`;
  }, [summaryChips]);

  const currentViewMeta =
    viewModes.find((mode) => mode.key === view) ?? viewModes[0];
  const currentViewLabel = currentViewMeta.label;
  const CurrentViewIcon = currentViewMeta.icon;
  const displayModeLabel =
    siteDisplayType === 'TOKENS'
      ? '倍率模式'
      : `${currency}${showWithRecharge ? ' · 充值价' : ''}`;
  const pricingStatusLabel =
    siteDisplayType === 'TOKENS'
      ? '站点默认按倍率展示'
      : showWithRecharge
        ? '已启用充值价格显示'
        : '显示标准价格';

  const clearFilterSelections = useCallback(() => {
    setSearch('');
    setSelectedVendors([]);
    setSelectedCapabilities([]);
    setSelectedGroup('all');
    setSelectedQuota('all');
    setSelectedTag('all');
    setSelectedEndpoint('all');
  }, []);

  const resetAll = useCallback(() => {
    clearFilterSelections();
    setShowWithRecharge(false);
    setShowRatio(false);
    setTokenUnit('M');
    setView('grid');
    setCurrency(getDefaultCurrency(siteDisplayType));
  }, [clearFilterSelections, siteDisplayType]);

  return (
    <div className="min-h-screen bg-[#f3ede6]">
      <nav className="sticky top-0 z-30 border-b border-[#e8ddd3] bg-[#f6f1eb]/92 backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 2xl:px-10">
          <TopPrimaryNav />
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b7770]">
            <Sparkles className="size-4 text-primary" />
            <span className="tabular-nums">
              当前 {filteredModels.length} / {models.length} 个模型
            </span>
          </div>
        </div>
      </nav>

      <div className="w-full px-4 py-8 sm:px-6 lg:h-[calc(100vh-4rem)] lg:overflow-hidden lg:px-8 2xl:px-10">
        <div
          className={cn(
            'grid gap-6 xl:gap-8 lg:h-full',
            showFilters ? 'lg:grid-cols-[492px_minmax(0,1fr)]' : 'lg:grid-cols-1',
          )}
        >
          {showFilters && (
            <aside className="lg:h-full lg:min-h-0">
              <div className={cn(sidebarCardClass, 'space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col')}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#342d2b]">筛选</h2>
                    <p className="mt-1 text-sm text-[#7d685f]">
                      按供应商、分组、能力和价格维度筛模型。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-full bg-[#fff1e7] px-3 py-1.5 text-xs font-medium text-[#b85a34] transition-colors hover:bg-[#ffe9dd]"
                  >
                    重置
                  </button>
                </div>

                <div className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                  <SidebarSection icon={Layers3} title="供应商" withBorder={false}>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={selectedVendors.length === 0}
                        onClick={() => setSelectedVendors([])}
                        count={vendorCounts.all ?? vendorScopedModels.length}
                      >
                        全部供应商
                      </FilterChip>
                      {allVendors.map((vendor) => (
                        <FilterChip
                          key={vendor}
                          active={selectedVendors.includes(vendor)}
                          onClick={() =>
                            startTransition(() => {
                              setSelectedVendors((current) => toggleInList(current, vendor));
                            })
                          }
                          count={vendorCounts[vendor] ?? 0}
                          icon={
                            <VendorAvatar
                              vendor={vendor}
                              vendorIcon={vendorIcons[vendor]}
                            />
                          }
                        >
                          {vendor}
                        </FilterChip>
                      ))}
                    </div>
                  </SidebarSection>

                  <SidebarSection icon={Boxes} title="可用令牌分组">
                    <div className="flex flex-wrap gap-2">
                      {allGroups.map((group) => {
                        const count =
                          group === 'all' ? groupScopedModels.length : groupCounts[group] ?? 0;
                        const ratio =
                          group === 'all' ? null : groupRatios[group] ?? 1;

                        return (
                          <FilterChip
                            key={group}
                            active={selectedGroup === group}
                            onClick={() => setSelectedGroup(group)}
                            count={group === 'all' ? count : `${ratio?.toFixed(2)}x`}
                          >
                            {group === 'all' ? '全部分组' : group}
                          </FilterChip>
                        );
                      })}
                    </div>
                  </SidebarSection>

                  <SidebarSection icon={Sparkles} title="能力类型">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={selectedCapabilities.length === 0}
                        onClick={() => setSelectedCapabilities([])}
                        count={capabilityScopedModels.length}
                      >
                        全部能力
                      </FilterChip>
                      {allCapabilities.map((capability) => {
                        const CapabilityIcon = getCapabilityIcon(capability);
                        return (
                          <FilterChip
                            key={capability}
                            active={selectedCapabilities.includes(capability)}
                            onClick={() =>
                              startTransition(() => {
                                setSelectedCapabilities((current) =>
                                  toggleInList(current, capability),
                                );
                              })
                            }
                            count={capabilityCounts[capability] ?? 0}
                            icon={<CapabilityIcon className="size-3.5" />}
                          >
                            {getCapabilityLabel(capability)}
                          </FilterChip>
                        );
                      })}
                    </div>
                  </SidebarSection>

                  <SidebarSection icon={TableIcon} title="计费类型">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={selectedQuota === 'all'}
                        onClick={() => setSelectedQuota('all')}
                        count={quotaCounts.all ?? quotaScopedModels.length}
                      >
                        全部类型
                      </FilterChip>
                      <FilterChip
                        active={selectedQuota === 0}
                        onClick={() =>
                          setSelectedQuota((current) => (current === 0 ? 'all' : 0))
                        }
                        count={quotaCounts['0'] ?? 0}
                      >
                        按量计费
                      </FilterChip>
                      <FilterChip
                        active={selectedQuota === 1}
                        onClick={() =>
                          setSelectedQuota((current) => (current === 1 ? 'all' : 1))
                        }
                        count={quotaCounts['1'] ?? 0}
                      >
                        按次计费
                      </FilterChip>
                    </div>
                  </SidebarSection>

                  <SidebarSection icon={Tags} title="标签">
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <FilterChip
                          key={tag}
                          active={selectedTag === tag}
                          onClick={() => setSelectedTag(tag)}
                          count={tag === 'all' ? tagScopedModels.length : tagCounts[tag] ?? 0}
                        >
                          {tag === 'all' ? '全部标签' : tag}
                        </FilterChip>
                      ))}
                    </div>
                  </SidebarSection>

                  <SidebarSection icon={Filter} title="端点类型">
                    <div className="flex flex-wrap gap-2">
                      {allEndpoints.map((endpoint) => (
                        <FilterChip
                          key={endpoint}
                          active={selectedEndpoint === endpoint}
                          onClick={() => setSelectedEndpoint(endpoint)}
                          count={
                            endpoint === 'all'
                              ? endpointScopedModels.length
                              : endpointCounts[endpoint] ?? 0
                          }
                        >
                          {endpoint === 'all'
                            ? '全部端点'
                            : getEndpointLabel(endpoint, endpointLabelMap)}
                        </FilterChip>
                      ))}
                    </div>
                  </SidebarSection>
                </div>
              </div>
            </aside>
          )}

          <section className="min-w-0 flex flex-col gap-4 lg:h-full lg:min-h-0">
            <div className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-[linear-gradient(135deg,#f89b7b_0%,#f26b48_100%)] p-4 shadow-[0_18px_40px_rgba(242,107,72,0.16)] lg:p-5">
              <div className="absolute -right-8 -top-10 size-40 rounded-full bg-white/18 blur-3xl" />
              <div className="absolute -bottom-10 right-28 size-36 rounded-full bg-[#ffc3af]/24 blur-3xl" />

              <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">
                    模型广场
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      {heroTitle}
                    </h1>
                    <Badge
                      variant="secondary"
                      className="h-7 rounded-full border border-white/15 bg-white/12 px-2.5 text-[11px] font-medium text-white"
                    >
                      共 {filteredModels.length} / {models.length} 个模型
                    </Badge>
                  </div>
                  <p className="max-w-3xl text-[13px] leading-5 text-white/82">
                    {heroSubtitle}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <HeroStat label="结果数" value={String(filteredModels.length)} />
                  <HeroStat label="活跃筛选" value={String(activeFilterCount)} />
                  <HeroStat label="当前展示" value={displayModeLabel} />
                </div>
              </div>
            </div>

            <div className={cn(surfaceCardClass, 'p-2.5 sm:p-3')}>
              <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative flex-1 xl:max-w-lg">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b7770]" />
                  <Input
                    placeholder="搜索模型、描述、标签或供应商"
                    value={search}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      startTransition(() => {
                        setSearch(nextValue);
                      });
                    }}
                    className="h-10 rounded-full border-[#ead7d0] bg-[#fffaf7] pl-10 text-sm shadow-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-[#ead7d0] bg-[#fffaf7] px-3"
                    onClick={() => void loadPricing()}
                    disabled={loading}
                  >
                    <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                    刷新
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-[#ead7d0] bg-[#fffaf7] px-3"
                    onClick={() => setShowFilters((current) => !current)}
                  >
                    <Filter />
                    筛选
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4.5 rounded-full bg-[#fff1e7] px-1.5 text-[10px] text-[#b85a34]"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>

                  {siteDisplayType !== 'TOKENS' && (
                    <div className="flex min-h-9 items-center gap-2 rounded-full border border-[#ead7d0] bg-[#fffaf7] px-2.5">
                      <span className="text-[13px] text-[#6e5a53]">充值价格显示</span>
                      <Switch
                        checked={showWithRecharge}
                        onCheckedChange={(checked) => setShowWithRecharge(checked)}
                      />
                    </div>
                  )}

                  <div className="flex min-h-9 items-center gap-2 rounded-full border border-[#ead7d0] bg-[#fffaf7] px-2.5">
                    <span className="text-[13px] text-[#6e5a53]">倍率信息</span>
                    <Switch
                      checked={showRatio}
                      onCheckedChange={(checked) => setShowRatio(checked)}
                    />
                  </div>

                  {siteDisplayType !== 'TOKENS' && (
                    <Select
                      value={currency}
                      onValueChange={(value) => setCurrency((value as Currency | null) ?? 'USD')}
                    >
                      <SelectTrigger
                        size="xs"
                        className="min-w-[118px] rounded-full border-[#ead7d0] bg-[#fffaf7]"
                        aria-label="计价币种"
                      >
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="CNY">CNY (¥)</SelectItem>
                        <SelectItem value="CUSTOM">自定义货币</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {siteDisplayType !== 'TOKENS' && (
                    <Select
                      value={tokenUnit}
                      onValueChange={(value) => setTokenUnit((value as TokenUnit | null) ?? 'M')}
                    >
                      <SelectTrigger
                        size="xs"
                        className="min-w-[122px] rounded-full border-[#ead7d0] bg-[#fffaf7]"
                        aria-label="Token 显示单位"
                      >
                        <SelectValue placeholder="1M Tokens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">1M Tokens</SelectItem>
                        <SelectItem value="K">1K Tokens</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex items-center gap-1 rounded-full border border-[#ead7d0] bg-[#fffaf7] p-0.5">
                    {viewModes.map(({ key, label, icon: Icon }) => (
                      <Button
                        key={key}
                        type="button"
                        variant={view === key ? 'secondary' : 'ghost'}
                        size="icon-xs"
                        aria-label={label}
                        className={cn(
                          'rounded-full',
                          view === key &&
                            'bg-white text-primary shadow-[0_8px_20px_-16px_rgba(0,0,0,0.35)] hover:bg-white',
                        )}
                        onClick={() => setView(key)}
                      >
                        <Icon />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {summaryChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {summaryChips.map((item) => (
                    <Badge
                      key={item}
                      variant="outline"
                      className="h-6 rounded-full border-[#ead7d0] bg-[#fff7f2] px-2 text-[10px] font-medium text-[#705b54]"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2.5">
                <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#ead7d0] bg-[#fff7f2] px-3 text-[12px] text-[#6f5d57]">
                  <CurrentViewIcon className="size-3.5 text-primary" />
                  <span className="text-[#8e776e]">当前视图</span>
                  <span className="font-semibold text-[#3f312d]">
                    {currentViewLabel}
                  </span>
                </div>
                <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#ead7d0] bg-[#fff7f2] px-3 text-[12px] text-[#6f5d57]">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-[#8e776e]">价格状态</span>
                  <span className="font-semibold text-[#3f312d]">
                    {pricingStatusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-28 lg:min-h-full">
                  <Loader2 className="size-7 animate-spin text-primary" />
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-[#ead8cc] bg-[#fffdfb] px-8 py-20 text-center lg:min-h-full">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-[#fff7f2]">
                    <Search className="size-6 text-[#8b7770]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-[#342d2b]">
                      没有找到匹配的模型
                    </p>
                    <p className="max-w-md text-sm leading-6 text-[#7d685f]">
                      你可以尝试清空筛选条件，或者换一个更宽泛的关键词继续搜索。
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full border-[#e2cfc6] bg-white"
                    onClick={clearFilterSelections}
                  >
                    清除筛选
                  </Button>
                </div>
              ) : (
                <>
                  {view === 'grid' && (
                    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                      {filteredModels.map((model) => (
                        <ModelCard
                          key={model.model_name}
                          model={model}
                          pricingContext={pricingContext}
                        />
                      ))}
                    </div>
                  )}
                  {view === 'table' && (
                    <PricingTableView
                      models={filteredModels}
                      pricingContext={pricingContext}
                    />
                  )}
                  {view === 'list' && (
                    <PricingListView
                      models={filteredModels}
                      pricingContext={pricingContext}
                    />
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
