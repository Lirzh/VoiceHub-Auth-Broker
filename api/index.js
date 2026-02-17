const http = require('http');
const path = require('path');

// 适配 Vercel 风格的 handler（req, res）以便本地运行
const callbackHandler = require('./callback');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // 解析 URL 和查询参数
    const host = req.headers.host || `localhost:${PORT}`;
    const parsed = new URL(req.url, `http://${host}`);

    // 为 handler 提供类似 Vercel 的 `req.query`
    req.query = Object.fromEntries(parsed.searchParams.entries());
    req.pathname = parsed.pathname;

    // 构造一个兼容的 res 对象（支持 res.status(x).json(...) 以及 setHeader/end 等）
    const wrapper = {
        setHeader: (k, v) => res.setHeader(k, v),
        getHeader: (k) => res.getHeader(k),
        statusCode: 200,
        end: (body) => {
            // 如果 body 是对象，序列化
            if (typeof body === 'object' && !Buffer.isBuffer(body)) {
                if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(body));
            } else {
                res.end(body);
            }
        },
        write: (...args) => res.write(...args),
        status(code) {
            res.statusCode = code;
            return this;
        },
        json(obj) {
            if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(obj));
        }
    };

    try {
        // 调用回调处理器（它会负责结束响应或设置重定向）
        callbackHandler(req, wrapper);
        // 不强行结束响应，让 handler 控制响应生命周期
    } catch (err) {
        console.error('Local wrapper 错误:', err && err.message ? err.message : err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'server_error', message: String(err) }));
    }
});

server.listen(PORT, () => {
    console.log(`Local server listening on http://localhost:${PORT}`);
});

module.exports = server;
