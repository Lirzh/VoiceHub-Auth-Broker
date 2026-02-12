const CryptoJS = require('crypto-js');
const url = require('url');

// Vercel Serverless 函数处理程序
module.exports = (req, res) => {
    // 启用 CORS 以防万一，虽然重定向通常不需要
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 检查请求方法
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '方法不允许' });
    }

    // 获取密钥
    const SECRET_KEY = process.env.OAUTH_STATE_SECRET;
    if (!SECRET_KEY) {
        console.error('配置错误：缺少 OAUTH_STATE_SECRET');
        return res.status(500).json({ error: '服务器配置错误' });
    }

    // 解析查询参数
    // Vercel req.query 已经是解析后的对象
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ error: '缺少 code 或 state 参数' });
    }

    try {
        // 解密 State
        // 重要：从 VoiceHub 传递的 state 必须是 URL 安全编码的（如果需要），
        // 但这里我们假设是标准的加密字符串，可能包含特殊字符。
        // 通常 OAuth 提供商会原样返回 state。
        
        // 处理 URL 解码中潜在的空格与加号问题（如果框架未处理）
        const rawState = state.replace(/ /g, '+');
        
        const bytes = CryptoJS.AES.decrypt(rawState, SECRET_KEY);
        const jsonStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!jsonStr) {
            throw new Error('解密结果为空字符串');
        }

        const payload = JSON.parse(jsonStr);
        const target = payload.target;

        if (!target) {
            throw new Error('在 state 负载中未找到目标来源');
        }

        // 安全检查（可选但推荐）
        // 如果需要，可以将目标限制为特定域名
        // const ALLOWED_DOMAINS = ['.vercel.app', '.netlify.app', 'localhost'];
        // if (!ALLOWED_DOMAINS.some(d => target.includes(d))) { ... }

        // 构建重定向 URL
        // 我们保留 code 和 state 以将它们传回原始应用
        const redirectUrl = `${target}/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(rawState)}`;

        // 执行重定向
        res.statusCode = 302;
        res.setHeader('Location', redirectUrl);
        res.end();

    } catch (error) {
        console.error('Broker 逻辑错误:', error.message);
        console.error('收到的 State:', state);
        
        return res.status(400).json({ 
            error: '无效请求', 
            details: '无法验证 state 参数。链接可能已过期或无效。' 
        });
    }
};
