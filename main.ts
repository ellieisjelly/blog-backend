import {serve} from "https://deno.land/std@0.180.0/http/server.ts";
// deno-lint-ignore ban-types
function sendJson(json : Object) {
  return new Response(JSON.stringify(json), {headers:{"Content-Type": "application/json"}, status:200}) // 200 = successful
}
// deno-lint-ignore ban-types
function sendJsonWithStatus(json : Object, status : number) {
  return new Response(JSON.stringify(json), {headers:{"Content-Type": "application/json"}, status:status})
}
class Post {
  public id : number
  public title : string
  public desc : string
  public content : string
  public constructor(id : number, title : string, desc: string, content : string) {
    this.id = id
    this.title = title
    this.desc = desc
    this.content = content
  }
}
// Ideally this should be cached, but for now I won't do it.
async function getPosts(){
  // Iterates through ./blogs and returns a list of blog posts
  const posts = []
  for await (const path of Deno.readDir('./blogs')) {
    if (path.isFile) {
      const file : Post = JSON.parse(await Deno.readTextFile('./blogs/' + path.name))
      // I'm making the content null to save bandwith per file, 
      // as it's not guaranteed that the person will click on this post.
      file.content = ""
      posts[file.id] = file
    }
  }
  return posts
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
      return sendJson({response: "Successful", posts:await getPosts()})
    default:
      return sendJsonWithStatus({response:"Missing valid type, aborting"}, 400)
  }
}
serve(handler, { port: 80, hostname:"192.168.1.69" })