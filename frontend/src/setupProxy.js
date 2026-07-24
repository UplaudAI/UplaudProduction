// Proxies API + websocket calls to the FastAPI backend running on :8001.
// In this environment the ingress routes everything (including /api) to :3000
// (the CRA dev server), so we forward /api here to the backend.
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8001",
      changeOrigin: true,
    })
  );
};
