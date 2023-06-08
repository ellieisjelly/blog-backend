import {
  serve,
  json,
  validateRequest,
} from "https://deno.land/x/sift@0.6.0/mod.ts";
import { MongoClient } from "https://deno.land/x/atlas_sdk@v1.1.1/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { Int32 } from "https://deno.land/x/web_bson@v0.3.0/mod.js";
import { Feed } from "https://esm.sh/feed";
try {
  config({ export: true });
} catch (err: any) {
  console.log("no .env, probably production server.");
}
const client = new MongoClient({
  endpoint: Deno.env.get("endpoint") || "",
  dataSource: "Blog",
  auth: {
    apiKey: Deno.env.get("key") || "",
  },
});
interface Post {
  _id: number;
  title: string;
  desc: string;
  content: string;
  postDate: Date;
  e: boolean;
}
const db = client.database("blog");
const postDB = db.collection<Post>("posts");
function corsHeader(): HeadersInit {
  let header = new Headers();
  header.set("Access-Control-Allow-Origin", "*");
  header.set("Access-Control-Allow-Headers", "*");
  return header;
}
async function getPosts() {
  const posts = await postDB.find({ e: true });
  return posts;
}
async function getSinglePost(id: number) {
  if (typeof id == "string") {
    id = parseInt(id);
  }
  return await postDB.findOne({ _id: id });
}
async function registerPost(post: {
  id: number;
  title: string;
  desc: string;
  content: string;
  postDate: Date;
}) {
  await postDB.insertOne({
    _id: post.id,
    title: post.title,
    desc: post.desc,
    content: post.content,
    postDate: post.postDate,
    e: true,
  });
}
async function removePost(id: number) {
  await postDB.deleteOne({ _id: id });
}
async function updatePost(id: any, content: string) {
  await postDB.updateOne({ _id: parseInt(id) }, { $set: { content: content } });
}
async function getPostList(req: Request) {
  const { error } = await validateRequest(req, {
    GET: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const posts = await getPosts();
  return json({ post: posts }, { headers: corsHeader() });
}
async function getPost(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const id = (await req.json()) as { id: number };
  const post = await getSinglePost(id.id);
  return json({ post: post }, { headers: corsHeader() });
}
async function makePost(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const post = await req.json(); // as {id: number, title: string, desc: string, content: string, postDate: Date, auth:password}
  if (post.auth == Deno.env.get("secretPassword")) {
    console.log(post);
    await registerPost(post);
    post.auth = true;
    return json(post, { headers: corsHeader() });
  } else {
    return json(
      { auth: false, error: "Could not authenticate." },
      { headers: corsHeader() }
    );
  }
}
async function deletePost(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const args = await req.json(); // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    removePost(args.id);
    return json({ auth: true }, { headers: corsHeader() });
  } else {
    return json(
      { auth: false, error: "Could not authenticate." },
      { headers: corsHeader() }
    );
  }
}
async function updatePostContent(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const args = await req.json(); // as {id: number, content: string, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    updatePost(args.id, args.content);
    return json({ auth: true }, { headers: corsHeader() });
  } else {
    return json(
      { auth: false, error: "Could not authenticate." },
      { headers: corsHeader() }
    );
  }
}
async function validatePassword(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const args = await req.json(); // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    return json({ auth: true }, { headers: corsHeader() });
  } else {
    return json(
      { auth: false, error: "Could not authenticate." },
      { headers: corsHeader() }
    );
  }
}
async function getFeed(req: Request) {
  const { error } = await validateRequest(req, {
    GET: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const feed = new Feed({
    title: "Personal Blog",
    description: "This is the RSS feed for my personal blog",
    id: "https://api.caiomgt.com/feed",
    language: "en",
    copyright: "",
    author: {
      name: "Caio Mendes",
      email: "caio@caiomgt.com",
    },
  });
  const posts = await getPosts();
  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: post._id.toString(),
      link: "https://www.caiomgt.com/blog/post?id=" + post._id,
      description: post.desc,
      content: post.content,
      date: new Date(post.postDate),
    });
  });
  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml" },
  });
}
serve({
  "/getPosts": getPostList,
  "/getPost": getPost,
  "/publishPost": makePost,
  "/removePost": deletePost,
  "/updatePost": updatePostContent,
  "/validatePassword": validatePassword,
  "/feed": getFeed,
});
