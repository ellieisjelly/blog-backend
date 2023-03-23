import {serve} from "https://deno.land/std@0.180.0/http/server.ts";
function sendJson(json) {
  return new Response(JSON.stringify(json), {headers:{"Content-Type": "application/json"}, status:200}) // 200 = successful
}
function sendJsonWithStatus(json, status) {
  return new Response(JSON.stringify(json), {headers:{"Content-Type": "application/json"}, status:status})
}
// Ideally this should be cached, but for now I won't do it.
function getPosts(){
  // Iteratres through ./blogs and returns a list of blog posts
  
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
      return sendJsonWithStatus({response:"Missing valid type, aborting"}, 400)
  }
  return sendJsonWithStatus({response:"Could not find file"}, 404)
}
serve(handler, { port: 80, hostname:"192.168.1.69" })