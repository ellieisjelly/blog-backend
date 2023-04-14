import {serve, json, validateRequest} from "https://deno.land/x/sift@0.6.0/mod.ts";
import {
  MongoClient,
  //ObjectId,
} from "https://deno.land/x/atlas_sdk@v1.1.1/mod.ts";
import {config} from 'https://deno.land/x/dotenv@v3.2.2/mod.ts'
config({export: true, path:".env"})
const client = new MongoClient({
  endpoint: Deno.env.get("endpoint") || "",
  dataSource: "Blog",
  auth: {
    apiKey: Deno.env.get("key") || ""
  }
})
interface Post{
  _id: number
  title: string
  desc: string
  content: string
  postDate: Date
  e: boolean
}
const db = client.database("blogTest")
const postDB = db.collection<Post>("posts")
async function getPosts(){
  // Iterates through ./blogs and returns a list of blog posts
  /*const cache = []
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
  return cache*/
  const posts = await postDB.find({e:true})
  return posts
}
async function getSinglePost(id : number) {
  return await postDB.findOne({id: id})
}
async function registerPost(post : {id: number, title: string, desc: string, content: string, postDate: Date}) {
  await postDB.insertOne({
    _id: post.id,
    title: post.title,
    desc: post.desc,
    content: post.content,
    postDate: post.postDate,
    e: true
  })
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
  const posts = await getPosts()
  return json({post: posts})
}
async function getPost(req: Request){
  const { error, body } = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  const id = body as {id : number}
  const post = await getSinglePost(id.id)
  return json({post:post})
}
async function makePost(req: Request){
  const { error, body } = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  const post = body as {id: number, title: string, desc: string, content: string, postDate: Date}
  console.log(post)
  await registerPost(post)
  return json({})
}
serve({"/getPosts": getPostList, "/getPost": getPost, "/publishPost" : makePost})