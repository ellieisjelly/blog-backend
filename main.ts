import {serve, json, validateRequest} from "https://deno.land/x/sift@0.6.0/mod.ts";
import {
  MongoClient,
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
    return json({error: error.message}, {status: error.status})
  }
  const posts = await getPosts()
  return json({post: posts})
}
async function getPost(req: Request){
  const { error} = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  const id = await req.json() as {id : number}
  const post = await getSinglePost(id.id)
  return json({post:post})
}
async function makePost(req: Request){
  const { error} = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error: error.message}, {status: error.status})
  }
  const post = await req.json() // as {id: number, title: string, desc: string, content: string, postDate: Date, auth:password}
  if (post.auth == Deno.env.get("secretPassword")) {
    console.log(post)
    await registerPost(post)
    post.auth = true
    return json(post)
  } else {
    return json({auth: false, error: "Could not authenticate."})
  }

}
async function deletePost(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error:error.message}, {status: error.status})
  }
  const args = await req.json() // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    removePost(args.id)
    return json({auth: true})
  } else {
    return json({auth: false, error: "Could not authenticate."})
  }
}
async function validatePassword(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {}
  })
  if (error) {
    return json({error:error.message}, {status: error.status})
  }
  const args = await req.json() // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    return json({auth: true})
  } else {
    return json({auth: false, error: "Could not authenticate."})
  }
}
serve({"/getPosts": getPostList, "/getPost": getPost, "/publishPost" : makePost, "/removePost" : deletePost, "/validatePassword" : validatePassword})
