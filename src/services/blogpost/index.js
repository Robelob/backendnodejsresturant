import express from "express" // 3RD PARTY MODULE DOES NEED TO INSTALL
import uniqid from "uniqid" // genertae unique id => 3RD PARTY MODULE DOES NEED TO INSTALL (npm i uniqid)
import { blogPostValidatioMiddlewares } from "./validation.js"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"
import { readBlogPostJson, writeBlogPostJson } from "../../lib/fs-tools.js"
import { uploadFile, uploadAvatarFile } from "../../lib/fs-tools.js"
import multer from "multer" // it is middleware

const blogpostRouter = express.Router()

// ================================CREATING END POINT METHODS===========================

//1 *******POST******
blogpostRouter.post("/", blogPostValidatioMiddlewares, async (req, res, next) => {
  const errorList = validationResult(req)
  try {
    if (!errorList.isEmpty()) {
      // if we had validation errors -> we need to trigger bad request Error handler
      next(createHttpError(400, { errorList }))
    } else {
      const newBlogPost = { id: uniqid(), ...req.body, createdAt: new Date() }
      const BlogpostsJsonArray = await readBlogPostJson()
      BlogpostsJsonArray.push(newBlogPost)
      await writeBlogPostJson(BlogpostsJsonArray)
      res.status(201).send({ id: newBlogPost.id })
    }
  } catch (error) {
    next(error)
  }
})

//1 *******GET******
blogpostRouter.get("/", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()
    if (req.query && req.query.title) {
      const filterdAuthors = BlogpostsJsonArray.filter((blog) => blog.title == req.query.title)
      res.send(filterdAuthors)
    } else {
      res.send(BlogpostsJsonArray)
    }
  } catch (error) {
    next(error)
  }
})

// *******GET WITH ID******
blogpostRouter.get("/:id", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()

    const specficAuthor = BlogpostsJsonArray.find((blog) => blog.id == req.params.id)

    res.send(specficAuthor)
  } catch (error) {
    next(error)
  }
})

//1 **********PUT **************
blogpostRouter.put("/:id", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()
    const index = BlogpostsJsonArray.findIndex((blog) => blog.id === req.params.id) //findIndexToUpdate
    const blogpostToModify = BlogpostsJsonArray[index]
    const updateBlogpost = { ...blogpostToModify, ...req.body, updatedAt: new Date() }

    BlogpostsJsonArray[index] = updateBlogpost
    await writeBlogPostJson(BlogpostsJsonArray)
    res.send(updateBlogpost)
  } catch (error) {
    next(error)
  }
})

//1 *******DELETE******
blogpostRouter.delete("/:id", async (req, res, next) => {
  try {
    const BlogpostsJsonArray = await readBlogPostJson()
    const remainingAuthors = BlogpostsJsonArray.filter((blog) => blog.id !== req.params.id)
    await writeBlogPostJson(remainingAuthors)
    res.status(204).send(`USER SUCCESSFULLY DELETED`)
  } catch (error) {
    next(error)
  }
})

// ===========================  for comment============================

blogpostRouter.put("/:id/comments", async (req, res, next) => {
  try {
    const { text, userName } = req.body
    const comment = { id: uniqid(), text, userName, createdAt: new Date() }
    const blogPostJson = await readBlogPostJson() //reading  blogPostJson is (array of object) =--> [{--},{--},{--},{--},{--}]
    const index = blogPostJson.findIndex((blog) => blog.id == req.params.id)
    // console.log("this is index", index)

    const blogToModify = blogPostJson[index]
    // console.log("this is index 2", bookToModify)
    blogToModify.comments = blogToModify.comments || []
    // const UpdatedReqBody = req.body // incoming change inputted by user from FE
    // console.log("this is req.body", UpdatedReqBody)

    const updatedBlog = { ...blogToModify, comments: [...blogToModify.comments, comment], updatedAt: new Date(), id: req.params.id } // union of two bodies
    // console.log("this is updateBook", updatedBlog)

    blogPostJson[index] = updatedBlog
    await writeBlogPostJson(blogPostJson)

    res.send(updatedBlog)
  } catch (error) {
    next(error)
  }
})
blogpostRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const blogPostJson = await readBlogPostJson() //reading  blogPostJson is (array of object) =--> [{--},{--},{--},{--},{--}]

    const singleBlog = blogPostJson.find((b) => b.id == req.params.id) //findindg the exact data needed
    console.log(singleBlog)

    singleBlog.comments = singleBlog.comments || []
    res.send(singleBlog.comments)
  } catch (error) {
    next(error)
  }
})
// ===========================//============================

// ===========================  for file upload============================
blogpostRouter.patch("/:id/uploadSingleCover", multer().single("cover"), uploadFile, async (req, res, next) => {
  try {
    const blogPostJson = await readBlogPostJson() //reading  blogPostJson is (array of object) =--> [{--},{--},{--},{--},{--}]
    const index = blogPostJson.findIndex((blog) => blog.id == req.params.id)
    // console.log("this is index", index)

    const blogToModify = blogPostJson[index]
    // console.log("this is index 2", bookToModify)

    const UpdatedReqBody = req.body // incoming change inputted by user from FE
    // console.log("this is req.body", UpdatedReqBody)

    const updatedBlog = { ...blogToModify, cover: req.file, updatedAt: new Date(), id: req.params.id } // union of two bodies
    // console.log("this is updateBook", updatedBlog)

    blogPostJson[index] = updatedBlog
    await writeBlogPostJson(blogPostJson)

    res.send(updatedBlog)
  } catch (error) {
    next(error)
  }
})

blogpostRouter.put("/:id/uploadSingleAvatar", multer().single("avatar"), uploadAvatarFile, async (req, res, next) => {
  try {
    const blogPostJson = await readBlogPostJson() //array  json read//array json file reading
    const index = blogPostJson.findIndex((blog) => blog.id === req.params.id) //find index id matched with params
    const avatarlink = blogPostJson[index].author.name
    console.log(avatarlink)
    const updateAuthor = { ...blogPostJson[index], author: { name: avatarlink, avatar: req.file }, updatedAt: new Date(), id: req.params.id }
    blogPostJson[index] = updateAuthor
    await writeBlogPostJson(blogPostJson) //write//write
    res.send(updateAuthor)
  } catch (error) {
    next(error)
  }
})

export default blogpostRouter
