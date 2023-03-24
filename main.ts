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
  public postDate : Date
  public constructor(id : number, title : string, desc: string, content : string, postDate : Date) {
    this.id = id
    this.title = title
    this.desc = desc
    this.content = content
    this.postDate = postDate
  }
}
// Ideally this should be cached, but for now I won't do it.
async function getPosts(sendContent : boolean){
  // Iterates through ./blogs and returns a list of blog posts
  const posts = []
  for await (const path of Deno.readDir('./blogs')) {
    if (path.isFile) {
      const file : Post = JSON.parse(await Deno.readTextFile('./blogs/' + path.name))
      // I'm making the content null to save bandwith per file, 
      // as it's not guaranteed that the person will click on this post.
      // Instead, you're meant to request for a specific post, as to not unecessary download a bunch.
      if (!sendContent) {
        file.content = ""
      }
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
    // Do not send anything else if you want a list of posts.
    case "list":
      return sendJson({response: "Successful", posts:await getPosts(false)})
    // You are required to send an id argument with the post id
    case "getPost":
      for (const post of await getPosts(true)) {
        if (post.id == json.id) {
          return sendJson({response: "Successful", post:post})
        }
      }
      return sendJsonWithStatus({response:"Could not find file"}, 404)
    default:
      return sendJsonWithStatus({response:"Missing valid type, aborting"}, 400)
  }
}
serve(handler, { port: 80, hostname:"192.168.1.69" })