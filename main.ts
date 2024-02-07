import {
  serve,
  json,
  validateRequest,
} from "https://deno.land/x/sift@0.6.0/mod.ts";
import { MongoClient } from "https://deno.land/x/atlas_sdk@v1.1.1/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { Feed } from "https://esm.sh/feed@4.2.2";
try {
  config({ export: true });
} catch {
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
  image?: string;
  desc: string;
  tags: string[];
  content: string;
  postDate: Date;
}

interface validatePassReq {
  auth: string;
}

interface makePostReq extends validatePassReq, Post {}
interface updatePostReq extends validatePassReq, Post {}
interface removePostReq extends validatePassReq {
  _id: number;
}

const db = client.database("blogTestV2");
const postDB = db.collection<Post>("posts");
function corsHeader(): HeadersInit {
  const header = new Headers();
  header.set("Access-Control-Allow-Origin", "*");
  header.set("Access-Control-Allow-Headers", "*");
  return header;
}
async function getPosts() {
  const posts = await postDB.find({});
  return posts;
}
async function getSinglePost(id: number) {
  if (typeof id == "string") {
    id = parseInt(id);
  }
  return await postDB.findOne({ _id: id });
}
async function registerPost(post: Post) {
  await postDB.insertOne(post);
}
async function removePost(id: number) {
  await postDB.deleteOne({ _id: id });
}
async function updatePost(post: Post) {
  console.log(post);
  await postDB.updateOne(
    { _id: post._id },
    {
      $set: {
        title: post.title,
        desc: post.desc,
        image: post.image,
        tags: post.tags,
        content: post.content,
      },
    }
  );
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
  const id = (await req.json()) as { _id: number };
  const post = await getSinglePost(id._id);
  return json({ post: post }, { headers: corsHeader() });
}
async function makePost(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const post: makePostReq = await req.json();
  if (post.auth == Deno.env.get("secretPassword")) {
    console.log(post);
    await registerPost(post);
    return json({ auth: true }, { headers: corsHeader() });
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
  const args: removePostReq = await req.json(); // as {id: number, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    removePost(args._id);
    return json({ auth: true }, { headers: corsHeader() });
  } else {
    return json(
      { auth: false, error: "Could not authenticate." },
      { headers: corsHeader() }
    );
  }
}
async function updatePostReq(req: Request) {
  const { error } = await validateRequest(req, {
    POST: {},
  });
  if (error) {
    return json({ error: error.message }, { headers: corsHeader() });
  }
  const args: updatePostReq = await req.json(); // as {id: number, content: string, auth:password}
  if (args.auth == Deno.env.get("secretPassword")) {
    updatePost(args);
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
  const args = await req.json();
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
    title: "Ellie's Blog",
    description: "This is the RSS feed for my personal blog",
    id: "https://api.ellieis.me/feed",
    language: "en",
    copyright: "",
    author: {
      name: "Ellie",
      email: "ellie@ellieis.me",
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
  "/updatePost": updatePostReq,
  "/validatePassword": validatePassword,
  "/feed": getFeed,
});
