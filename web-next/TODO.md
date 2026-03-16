# web-next 待办清单

> 对比 `web/`（旧前端）和 `web-next/`（新前端），整理所有需要完成的工作。

## 一、已完成（真实 API 已接入）

| 页面 | API 调用 |
|------|---------|
| Login | `POST /api/user/login`, `POST /api/user/2fa/verify` |
| Register | `GET /api/verification`, `POST /api/user/register` |
| UserMenu (logout) | `GET /api/user/logout` |

## 二、Mock 数据需替换为真实 API（14 个页面）

### 用户侧页面

#### 1. Dashboard（仪表盘）
- `GET /api/user/self` — 用户信息（用户名、角色、余额）
- `GET /api/data/self/?start_timestamp=&end_timestamp=&default_time=` — 用量图表数据
- `GET /api/uptime/status` — UptimeKuma 状态
- `GET /api/notice` — 公告
- `GET /api/status` — 系统状态

#### 2. Token（令牌管理）
- `GET /api/token/?p=&size=` — 令牌列表（分页）
- `GET /api/token/:id` — 单个令牌详情
- `POST /api/token/` — 创建令牌
- `PUT /api/token/` — 更新令牌
- `DELETE /api/token/:id` — 删除令牌
- `PUT /api/token/?status_only=true` — 启用/禁用
- `POST /api/token/batch` — 批量删除
- `GET /api/user/models` — 可用模型列表（创建令牌时选择）
- `GET /api/user/self/groups` — 用户分组（创建令牌时选择）

#### 3. Log（日志）
- `GET /api/log/self?p=&size=` — 用户日志（分页）
- `GET /api/log/self/search?keyword=` — 搜索日志
- `GET /api/log/self/stat` — 用量统计

#### 4. TopUp（充值）
- `GET /api/user/self` — 余额信息
- `GET /api/user/topup/info` — 充值配置信息
- `GET /api/user/topup/self` — 充值历史
- `POST /api/user/topup` — 兑换码充值
- `POST /api/user/pay` — Epay 支付
- `POST /api/user/stripe/pay` — Stripe 支付
- `POST /api/user/creem/pay` — Creem 支付
- `POST /api/user/amount` — 查询金额
- `GET /api/user/aff` — 邀请码
- `POST /api/user/aff_transfer` — 转移邀请额度
- `GET /api/subscription/plans` — 订阅计划
- `GET /api/subscription/self` — 当前订阅
- `PUT /api/subscription/self/preference` — 更新订阅偏好

#### 5. PersonalSettings（个人设置）
- `GET /api/user/self` — 用户信息
- `PUT /api/user/self` — 更新用户信息
- `DELETE /api/user/self` — 注销账户
- `GET /api/user/token` — 生成 API Token
- `GET /api/user/passkey` — Passkey 状态
- `POST /api/user/passkey/register/begin` — 注册 Passkey
- `POST /api/user/passkey/register/finish` — 完成 Passkey 注册
- `DELETE /api/user/passkey` — 删除 Passkey
- `GET /api/user/2fa/status` — 2FA 状态
- `POST /api/user/2fa/setup` — 设置 2FA
- `POST /api/user/2fa/enable` — 启用 2FA
- `POST /api/user/2fa/disable` — 禁用 2FA
- `POST /api/user/2fa/backup_codes` — 重新生成备份码
- `PUT /api/user/setting` — 更新用户设置
- `GET /api/user/oauth/bindings` — OAuth 绑定列表
- `DELETE /api/user/oauth/bindings/:provider_id` — 解绑 OAuth
- `GET /api/user/checkin` — 签到状态
- `POST /api/user/checkin` — 签到

#### 6. Pricing（模型定价）
- `GET /api/pricing` — 模型定价列表

#### 7. Midjourney（MJ 绘图）
- `GET /api/mj/self?p=&size=` — 用户 MJ 任务列表

#### 8. Task（异步任务）
- `GET /api/task/self?p=&size=` — 用户任务列表

### 管理员页面

#### 9. admin/Channel（渠道管理）
- `GET /api/channel/?p=&size=` — 渠道列表
- `GET /api/channel/search?keyword=` — 搜索
- `GET /api/channel/:id` — 渠道详情
- `POST /api/channel/` — 创建渠道
- `PUT /api/channel/` — 更新渠道
- `DELETE /api/channel/:id` — 删除渠道
- `GET /api/channel/test/:id` — 测试渠道
- `GET /api/channel/update_balance/:id` — 更新余额
- `GET /api/channel/models` — 渠道模型列表
- `GET /api/channel/fetch_models/:id` — 获取上游模型
- `POST /api/channel/batch` — 批量删除
- `POST /api/channel/tag/enabled` — 按标签启用
- `POST /api/channel/tag/disabled` — 按标签禁用
- `PUT /api/channel/tag` — 编辑标签渠道
- `POST /api/channel/batch/tag` — 批量设置标签
- `POST /api/channel/copy/:id` — 复制渠道
- `POST /api/channel/multi_key/manage` — 多密钥管理

#### 10. admin/User（用户管理）
- `GET /api/user/?p=&size=` — 用户列表
- `GET /api/user/search?keyword=` — 搜索
- `GET /api/user/:id` — 用户详情
- `POST /api/user/` — 创建用户
- `PUT /api/user/` — 更新用户
- `DELETE /api/user/:id` — 删除用户
- `POST /api/user/manage` — 管理用户（启用/禁用/升级等）
- `GET /api/user/:id/oauth/bindings` — 用户 OAuth 绑定
- `DELETE /api/user/:id/2fa` — 管理员禁用 2FA

#### 11. admin/Model（模型管理）
- `GET /api/models/?p=&size=` — 模型列表
- `GET /api/models/search?keyword=` — 搜索
- `GET /api/models/:id` — 模型详情
- `POST /api/models/` — 创建模型
- `PUT /api/models/` — 更新模型
- `DELETE /api/models/:id` — 删除模型
- `PUT /api/models/?status_only=true` — 启用/禁用
- `POST /api/models/sync_upstream` — 同步上游模型
- `GET /api/models/missing` — 缺失模型
- `GET /api/vendors/?page_size=1000` — 供应商列表

#### 12. admin/Redemption（兑换码管理）
- `GET /api/redemption/?p=&size=` — 兑换码列表
- `GET /api/redemption/search?keyword=` — 搜索
- `GET /api/redemption/:id` — 详情
- `POST /api/redemption/` — 创建
- `PUT /api/redemption/` — 更新
- `DELETE /api/redemption/:id` — 删除
- `DELETE /api/redemption/invalid` — 删除无效
- `PUT /api/redemption/?status_only=true` — 启用/禁用

#### 13. admin/Deployment（部署管理）
- `GET /api/deployments/?p=&size=` — 部署列表
- `GET /api/deployments/search?keyword=` — 搜索
- `GET /api/deployments/:id` — 详情
- `POST /api/deployments/` — 创建
- `PUT /api/deployments/:id` — 更新
- `DELETE /api/deployments/:id` — 删除
- `GET /api/deployments/settings` — 部署设置
- `GET /api/deployments/hardware-types` — 硬件类型
- `GET /api/deployments/locations` — 位置
- `POST /api/deployments/price-estimation` — 价格估算

#### 14. admin/Subscription（订阅管理）
- `GET /api/subscription/admin/plans` — 订阅计划列表
- `POST /api/subscription/admin/plans` — 创建计划
- `PUT /api/subscription/admin/plans/:id` — 更新计划
- `PATCH /api/subscription/admin/plans/:id` — 更新状态
- `POST /api/subscription/admin/bind` — 绑定订阅

#### 15. admin/Settings（系统设置）
- `GET /api/option/` — 获取所有设置
- `PUT /api/option/` — 更新设置
- 涵盖子模块：通用、运营、模型、支付、绘图、聊天、仪表盘、性能、限流、比率等

## 三、缺失页面（web/ 有但 web-next/ 没有或是 Placeholder）

| 路由 | 旧前端页面 | web-next 状态 | 优先级 |
|------|-----------|--------------|--------|
| `/` | Home（首页/落地页） | 直接跳转 /console | 低（可后做） |
| `/reset` | PasswordResetForm（忘记密码） | Placeholder | 高 |
| `/user/reset` | PasswordResetConfirm（重置密码确认） | Placeholder | 高 |
| `/about` | About（关于页面） | Placeholder | 中 |
| `/user-agreement` | UserAgreement（用户协议） | Placeholder | 中 |
| `/privacy-policy` | PrivacyPolicy（隐私政策） | Placeholder | 中 |
| `/oauth/:provider` | OAuth2Callback（OAuth 回调） | Placeholder | 高 |
| `/setup` | Setup（初始化向导） | Placeholder | 高 |
| `/forbidden` | Forbidden（403 页面） | Placeholder | 中 |
| `/console/playground` | Playground（API 调试） | Placeholder | 低（复杂） |
| `/console/chat/:id?` | Chat（聊天页面） | Placeholder | 低（复杂） |
| `/chat2link` | Chat2Link（聊天链接跳转） | 缺失 | 低 |
| `*` (404) | NotFound | Placeholder | 中 |

## 四、缺失的全局功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| StatusContext | 旧前端有全局 Status 上下文（`GET /api/status`），web-next 只在 localStorage 读 | 高 |
| SetupCheck | 旧前端有初始化检测组件，未初始化跳转 /setup | 高 |
| NoticeModal | 旧前端有公告弹窗（`GET /api/notice`） | 中 |
| i18n | 旧前端有完整国际化，web-next 尚未接入 | 低（可后做） |

## 五、实施优先级建议

### P0 — 核心功能（先做）
1. StatusContext 全局状态 + SetupCheck
2. Dashboard 接入真实 API
3. Token 管理接入真实 API
4. Log 日志接入真实 API
5. PersonalSettings 接入真实 API
6. OAuth2Callback 页面
7. PasswordReset 相关页面

### P1 — 管理功能
8. admin/Channel 接入真实 API
9. admin/User 接入真实 API
10. admin/Settings 接入真实 API
11. admin/Redemption 接入真实 API
12. admin/Model 接入真实 API

### P2 — 次要功能
13. TopUp 充值接入真实 API
14. Pricing 定价接入真实 API
15. Midjourney / Task 接入真实 API
16. admin/Deployment / admin/Subscription 接入真实 API
17. About / UserAgreement / PrivacyPolicy 页面
18. Forbidden / NotFound 页面
19. Setup 初始化向导

### P3 — 复杂功能（最后做）
20. Playground（API 调试）
21. Chat（聊天页面）
22. Chat2Link
23. i18n 国际化
