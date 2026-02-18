# VoiceHub Auth Broker

这是一个轻量级的 OAuth 回调中转服务，专门用于解决 VoiceHub 项目在多环境部署时，GitHub OAuth App 只能配置单一回调地址的问题。

## 🚀 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVoiceHub%2FVoiceHub-Auth-Broker&env=OAUTH_STATE_SECRET&project-name=voicehub-auth-broker&repository-name=voicehub-auth-broker)

## 🛠 配置说明

部署后，你需要在 Vercel 的项目设置中配置以下环境变量：

| 变量名                  | 说明                                                |
|:---------------------|:--------------------------------------------------|
| `OAUTH_STATE_SECRET` | **必须**。用于解密 State 参数的密钥。必须与 VoiceHub 主项目中的配置完全一致。 |

## 🔗 连接 GitHub App

1. 部署完成后，获得你的 Broker 域名，例如 `https://your-broker.vercel.app`。
2. 前往 GitHub Developer Settings -> OAuth Apps。
3. 将 **Authorization callback URL** 设置为：
   `https://your-broker.vercel.app/callback`

## 🔗 连接 VoiceHub 主项目

在你的 VoiceHub 主项目（无论是本地开发还是线上部署）的 `.env` 中配置：

```bash
# 指向刚刚部署的 Broker 服务地址
OAUTH_REDIRECT_URI=https://your-broker.vercel.app/callback

# 必须与 Broker 服务中的密钥一致
OAUTH_STATE_SECRET=your_super_secret_key
```

## 📦 项目结构

- `api/callback.js`: 核心 Serverless Function，处理回调转发。
- `vercel.json`: Vercel 路由配置，将 `/callback` 映射到 API。

## 🛡 安全原理

1. **State 加密**: VoiceHub 主项目生成包含自身 URL 的 State，并使用 AES 加密。
2. **中转解析**: Broker 收到 GitHub 回调后，使用相同密钥解密 State，获取目标 URL。
3. **安全跳转**: Broker 将请求 302 重定向回目标 URL，完成 OAuth 流程。

## 🧪 本地开发与 .env 支持

为方便本地调试，项目在 `api/callback.js` 顶部包含一个轻量级的 `.env` 加载器（**不依赖任何第三方包**）。本地运行时它会从仓库根目录读取 `.env` 并将未定义的键注入 `process.env`，但不会覆盖已存在的环境变量；在 Vercel 或当 `NODE_ENV=production` 时，该加载器会被跳过，保证部署行为不变。

快速开始（本地）：

1. 在项目根创建 `.env`，示例内容：

```env
# Broker 用于解密 state 的密钥（必须与 VoiceHub 主项目一致）
OAUTH_STATE_SECRET=your_super_secret_key

# 可选：本地服务端口，默认 3000
PORT=3000
```

2. 启动本地服务器：

```bash
npm start
```

3. 调试调用（示例）:

```
GET http://localhost:3000/callback?code=xxx&state=yyy
```

注意事项：
- 本地加载器会在 `process.env.VERCEL` 已定义或 `NODE_ENV=production` 时跳过。
- 加载器不会覆盖已存在的环境变量，所以你可以在终端中预先设置变量来覆盖 `.env`。
- Vercel 部署不受影响；请继续在 Vercel 控制台中配置 `OAUTH_STATE_SECRET`。

## 🐳 Docker 部署

镜像默认将 `NODE_ENV=production`，因此容器运行时应通过环境变量传入 `OAUTH_STATE_SECRET`（不要依赖仓库内的 `.env`，因为生产镜像会跳过本地 `.env` 加载器）。

构建镜像：

```bash
docker build -t voicehub-auth-broker .
```

以生产模式运行（通过 `--env-file` 或 `-e` 提供密钥）：

```bash
docker run -p 3000:3000 --env OAUTH_STATE_SECRET=your_super_secret_key --name voicehub-auth-broker voicehub-auth-broker
```

如果你想在容器中使用仓库根的 `.env`（仅用于本地调试），可以在运行时将 `NODE_ENV` 设为非 `production`，并挂载 `.env` 文件：

```bash
docker run -p 3000:3000 --env-file .env -e NODE_ENV=development -v "$PWD/.env":/usr/src/app/.env --name voicehub-auth-broker-debug voicehub-auth-broker
```

### 若想使用预构建镜像：

以生产模式运行（通过 `--env-file` 或 `-e` 提供密钥）：

```bash
docker run -p 3000:3000 --env OAUTH_STATE_SECRET=your_super_secret_key --name voicehub-auth-broker ghcr.io/lirzh/voicehub-auth-broker:1.0.0
```

如果你想在容器中使用仓库根的 `.env`（仅用于本地调试），可以在运行时将 `NODE_ENV` 设为非 `production`，并挂载 `.env` 文件：

```bash
docker run -p 3000:3000 --env-file .env -e NODE_ENV=development -v "$PWD/.env":/usr/src/app/.env --name voicehub-auth-broker-debug ghcr.io/lirzh/voicehub-auth-broker:1.0.0
```
