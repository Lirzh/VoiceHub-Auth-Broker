# VoiceHub Auth Broker

这是一个轻量级的 OAuth 回调中转服务，专门用于解决 VoiceHub 项目在多环境（Vercel, Netlify, Localhost）部署时，GitHub OAuth App 只能配置单一回调地址的问题。

## 🚀 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVoiceHub%2FVoiceHub-Auth-Broker&env=OAUTH_STATE_SECRET&project-name=voicehub-auth-broker&repository-name=voicehub-auth-broker)

## 🛠 配置说明

部署后，你需要在 Vercel 的项目设置中配置以下环境变量：

| 变量名 | 说明 |
| :--- | :--- |
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
