# web-next Vercel 部署说明

本文档适用于 `web-next` 作为独立前端站点部署到 Vercel，并通过同域代理转发 API 到 `https://ogog.ai` 的场景。

## 目录结构

当前 `web-next` 已包含以下部署文件：

- `vercel.json`
- `.env.production.example`

## 部署目标

- 前端部署到独立域名，例如 `https://app.example.com`
- 浏览器访问同源路径：
  - `/api/*`
  - `/v1/*`
  - `/mj/*`
  - `/pg/*`
- Vercel 通过 `rewrites` 将这些请求转发到 `https://ogog.ai`

这样做的原因：

- 避免浏览器直接跨域请求 `https://ogog.ai/api/*`
- 保持 `web-next` 现有代码不需要改成绝对 API 地址
- 保证 React Router 刷新页面时仍能正常回到 `index.html`

## 本地准备

建议先在本地确认构建正常：

```bash
cd /home/boj/github/new-api/web-next
cp .env.production.example .env.production
bun run build
```

如果你要模拟独立站点根路径部署，确保 `.env.production` 中为：

```env
VITE_WEB_BASE_PATH=/
```

## 首次使用 Vercel CLI

如果本机还没有安装 Vercel CLI：

```bash
npm i -g vercel
```

登录：

```bash
vercel login
```

## 首次绑定项目

在 `web-next` 目录执行：

```bash
cd /home/boj/github/new-api/web-next
vercel
```

首次交互时建议这样选：

1. `Set up and deploy` 选择 `Y`
2. 选择你的 Vercel 账号或 Team
3. `Link to existing project?` 如果是新项目选 `N`
4. `What’s your project’s name?` 自定义项目名，例如 `new-api-web-next`
5. `In which directory is your code located?` 直接填 `.` 

`web-next/vercel.json` 已包含：

- 输出目录 `dist`
- `/api` `/v1` `/mj` `/pg` 转发到 `https://ogog.ai`
- SPA fallback 到 `/index.html`

## 环境变量

### 推荐生产变量

把示例文件复制为本地参考：

```bash
cp .env.production.example .env.production
```

当前推荐值：

```env
VITE_WEB_BASE_PATH=/
```

### 在 Vercel 中录入

录入生产环境：

```bash
vercel env add VITE_WEB_BASE_PATH production
```

输入：

```text
/
```

录入预览环境：

```bash
vercel env add VITE_WEB_BASE_PATH preview
```

输入：

```text
/
```

### 不要这样配置

不要把下面这个值设置成 `https://ogog.ai`：

```env
VITE_REACT_APP_SERVER_URL=
```

原因是：

- 当前方案依赖 Vercel 同域代理
- 如果直接填 `https://ogog.ai`，浏览器会直接跨域请求后端
- `web-next` 里很多页面依赖 `/api/*`，浏览器下容易被 CORS 限制拦住

## 正式发布

完成绑定和环境变量后：

```bash
vercel --prod
```

部署成功后，Vercel 会返回一个生产地址，例如：

```text
https://new-api-web-next.vercel.app
```

## 自定义域名

如果你要绑定自己的域名：

```bash
vercel domains add app.example.com
vercel domains ls
```

然后在 Vercel 控制台或 DNS 服务商处按提示配置解析。

## 部署后检查项

上线后建议依次检查：

1. 首页静态资源是否加载成功
2. 刷新 `/console`、`/login`、`/console/personal` 这类前端路由是否仍能正常打开
3. 登录接口是否正常
4. `/console/personal`、`/console/topup` 等需要 `/api/*` 的页面是否正常请求
5. 令牌、日志、设置页是否正常返回数据

## OAuth 与 Passkey 注意事项

独立部署到新域名后，下面两类能力可能仍然受后端配置限制。

### OAuth

`web-next` 会根据当前站点域名动态生成 OAuth 回调地址。

这意味着如果你使用：

- GitHub OAuth
- Discord OAuth
- OIDC
- 其他自定义 OAuth

则后端和第三方 OAuth 提供方都必须允许你的新域名回调地址。

### Passkey

Passkey 依赖后端配置的 `rp_id` 和允许的 origin。

如果后端仍然只允许 `ogog.ai`，那你把前端部署到自己的 Vercel 域名后，Passkey 很可能无法正常工作。

## 常见问题

### 1. 页面能打开，但登录失败或请求报跨域

优先检查：

- 是否错误设置了 `VITE_REACT_APP_SERVER_URL=https://ogog.ai`
- 是否确实通过 `vercel.json` 走了同域 `/api/*` 代理

### 2. 刷新子路由出现 404

优先检查：

- `vercel.json` 是否存在
- `rewrites` 里是否保留了 `/(.*) -> /index.html`
- `VITE_WEB_BASE_PATH` 是否误设成 `/new/`

### 3. 静态资源路径不对

优先检查：

- 独立部署到根域名时，`VITE_WEB_BASE_PATH` 必须为 `/`

### 4. OAuth 登录跳转后失败

优先检查：

- 新域名是否已加入 OAuth 平台回调白名单
- 后端是否允许该回调地址

## 常用命令

```bash
cd /home/boj/github/new-api/web-next
bun run build
vercel
vercel env add VITE_WEB_BASE_PATH production
vercel env add VITE_WEB_BASE_PATH preview
vercel --prod
vercel ls
vercel inspect <deployment-url>
vercel logs <deployment-url>
```

## 参考文档

- Vercel Rewrites: https://vercel.com/docs/rewrites
- Vercel Vite Framework Docs: https://vercel.com/docs/frameworks/vite
