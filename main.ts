import {serve} from "https://deno.land/std@0.180.0/http/server.ts";
async function handler(req: Request): Promise<Response> {
  let abort = false;
  const json = await req.json().catch(() => {
    console.log("no json lol")
    abort = true
  })
  if (abort) {
    return new Response("Invalid json, aborting")
  }
  return new Response("File not found.")
}
serve(handler, { port: 80, hostname:"192.168.1.69" })