import type { Env } from "./env";
// All gameplay is client-local. No WebSocket actions or uploaded scores are accepted.
export default {
 async fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if(url.pathname === "/health") return Response.json({ok:true,game:"Potrero Rush"});
  if(request.headers.get("Upgrade") === "websocket") return new Response("Local single-player game",{status:404});
  if(request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed",{status:405,headers:{Allow:"GET, HEAD"}});
  return env.ASSETS.fetch(request);
 }
} satisfies ExportedHandler<Env>;
