import {serve} from "https://deno.land/std@0.180.0/http/server.ts";
function sendJson(json) {
  return new Response(JSON.stringify(json), {headers:{"Content-Type": "application/json"}})
}
function sendJsonWithStatus(json, status) {
  return new Response(JSON.stringify(json), {headers:{"Content-Type": "application/json"}, status:status})
}
async function handler(req: Request): Promise<Response> {
  let abort = false;
  const json = await req.json().catch(() => {
    abort = true
  })
  if (abort) {
    return sendJsonWithStatus({response:"Invalid json, aborting."}, 400)
  }
  switch(json.type) {
    case "list":
      return sendJson({response:"noob"})
      break
    default:
      return sendJsonWithStatus({response:"Invalid json, aborting."}, 400)
  }
  return sendJsonWithStatus({response:"Could not find file"}, 404)
}
serve(handler, { port: 80, hostname:"192.168.1.69" })