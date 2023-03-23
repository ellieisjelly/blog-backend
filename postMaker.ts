// This makes a post in the right format by taking user input.
// You are expected to run this locally only to add new blog posts.
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
let title = prompt("What title?")
let id = prompt("What id?")
let desc = prompt("What description?")
let content = prompt("What content? type 'file' if you want to read from a file.")
if (!title){
  title = "example title"
}
if (!id) {
  id = "0"
}
if (!desc) {
  desc = "example description"
}
if (!content){
  content = "example content"
} else if(content == "file") {
  const file = prompt("file name with extension")
  if (file) {
    content = await Deno.readTextFile(file)
    console.log(content)
  } else {
    content = ""
  }
}
const post = new Post(parseInt(id), title, desc, content)
let fileName = prompt("file name?")
if (!fileName) {
  fileName = "post.json"
}
await Deno.writeTextFile(fileName, JSON.stringify(post))