import {serve, json, validateRequest} from "https://deno.land/x/sift@0.6.0/mod.ts";
import {
  MongoClient,
  ObjectId,
} from "https://deno.land/x/atlas_sdk@v1.1.1/mod.ts";
import {config} from 'https://deno.land/x/dotenv/mod.ts'
config({export: true, path:".env"})
const client = new MongoClient({
  endpoint: Deno.env.get("endpoint"),
  dataSource: "Blog",
  auth: {
    apiKey: Deno.env.get("key")
  }
})
interface PostSchema {
  id: number
  title: string
  desc: string
  content: string
  postDate: Date
}
const db = client.database("blog")
const posts = db.collection<PostSchema>("posts")
// deno-lint-ignore no-unused-vars
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
async function getPosts(sendContent : boolean){
  // Iterates through ./blogs and returns a list of blog posts
  const cache = []
  for await (const path of Deno.readDir('./blogs')) {
    if (path.isFile) {
      const file : Post = JSON.parse(await Deno.readTextFile('./blogs/' + path.name))
      // I'm making the content null to save bandwith per file, 
      // as it's not guaranteed that the person will click on this post.
      // Instead, you're meant to request for a specific post, as to not unecessary download a bunch.
      if (!sendContent) {
        file.content = ""
      }
      cache[file.id] = file
    }
  }
  return cache
}

/*
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
}*/
async function getPostList(req: Request) {
  const { error } = await validateRequest(req, {
    GET: {}
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  const quotes = await getPosts(false)
  return json({quotes})
}
async function getPost(req: Request){
  const { error, body } = await validateRequest(req, {
    POST: {
      body: ["id"]
    }
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  const posts = await getPosts(true)
  const id = body as {id : number}
  return json({post:posts[id.id]})
}
async function makePost(req: Request){
  const { error, body } = await validateRequest(req, {
    POST: {
      body: ["id"]
    }
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  return json({})
}
serve({"/getPosts": getPostList, "/getPost": getPost, "/publishPost" : makePost})