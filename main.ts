import {serve, json, validateRequest} from "https://deno.land/x/sift@0.6.0/mod.ts";
import {
  MongoClient,
} from "https://deno.land/x/atlas_sdk@v1.1.1/mod.ts";
import {config} from 'https://deno.land/x/dotenv@v3.2.2/mod.ts'
try {config({export: true})} catch(err : any) {
  console.log("no .env, probably production server.")
}
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
const db = client.database("blog")
const postDB = db.collection<Post>("posts")
function corsHeader() : HeadersInit {
  let header = new Headers()
  header.set("Access-Control-Allow-Origin", "*")
  header.set("Access-Control-Request-Method", "*")
  header.set("Access-Control-Request-Headers", "*")
  header.set("Access-Control-Allow-Headers", "*")
  return header
}
async function getPosts(){
  const posts = await postDB.find({e:true})
  return posts
}
async function getSinglePost(id : number) {
  return await postDB.findOne({_id: id})
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
async function removePost(id : number) {
  await postDB.deleteOne({_id:id})
}

async function getPostList(req: Request) {
  const { error } = await validateRequest(req, {
    GET: {}
  })
  if (error) {
    return json({error: error.message}, {headers:corsHeader()})
  }
  const posts = await getPosts()
  return json({post: posts}, {headers:corsHeader()})
}
async function getPost(req: Request){
  const { error} = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error: error.message}, {headers:corsHeader()})
  }
  const id = await req.json() as {id : number}
  const post = await getSinglePost(id.id)
  return json({post:post}, {headers:corsHeader()})
}
async function makePost(req: Request){
  const { error} = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error: error.message}, {headers:corsHeader()})
  }
  const post = await req.json() // as {id: number, title: string, desc: string, content: string, postDate: Date, auth:password}
  if (post.auth == Deno.env.get("secretPassword")) {
    console.log(post)
    await registerPost(post)
    post.auth = true
    return json(post, {headers:corsHeader()})
  } else {
    return json({auth: false, error: "Could not authenticate."}, {headers:corsHeader()})
  }

}
async function deletePost(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error:error.message}, {headers:corsHeader()})
  }
  const args = await req.json() // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    removePost(args.id)
    return json({auth: true}, {headers:corsHeader()})
  } else {
    return json({auth: false, error: "Could not authenticate."}, {headers:corsHeader()})
  }
}
async function validatePassword(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error:error.message})
  }
  const args = await req.json() // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    return json({auth: true}, {headers:corsHeader()})
  } else {
    return json({auth: false, error: "Could not authenticate."}, {headers:corsHeader()})
  }
}
serve({"/getPosts": getPostList, "/getPost": getPost, "/publishPost" : makePost, "/removePost" : deletePost, "/validatePassword" : validatePassword})
