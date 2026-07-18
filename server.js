const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".mp3": "audio/mpeg",
    ".ico": "image/x-icon"
};

const CACHEABLE = new Set([".css", ".js", ".json", ".svg", ".pdf", ".mp3"]);

const server = http.createServer((req, res) => {

    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end();
        return;
    }

    let urlPath;
    try {
        urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad request");
        return;
    }

    const filePath = path.resolve(ROOT, `.${urlPath === "/" ? "/index.html" : urlPath}`);

    // stay inside the project root
    if (path.relative(ROOT, filePath).startsWith("..") || path.isAbsolute(path.relative(ROOT, filePath))) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.stat(filePath, (err, stats) => {

        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found: " + urlPath);
            return;
        }

        const ext = path.extname(filePath);
        const headers = { "Content-Type": MIME[ext] || "application/octet-stream", "Content-Length": stats.size, "X-Content-Type-Options": "nosniff" };

        if (CACHEABLE.has(ext)) {
            headers["Cache-Control"] = "public, max-age=31536000, immutable";
        }

        res.writeHead(200, headers);
        if (req.method === "HEAD") return res.end();
        fs.createReadStream(filePath).on("error", () => res.destroy()).pipe(res);
    });
});

server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && !process.env.PORT) {
        console.warn(`Port ${PORT} is in use; starting on an available port instead.`);
        server.listen(0);
        return;
    }

    console.error(error.message);
    process.exitCode = 1;
});

server.on("listening", () => {
    const { port } = server.address();
    console.log(`Portfolio server running at http://localhost:${port}`);
});

server.listen(PORT);
