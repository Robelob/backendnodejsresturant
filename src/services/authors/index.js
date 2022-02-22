import express from "express"; // 3RD PARTY MODULE DOES NEED TO INSTALL
import uniqid from "uniqid"; // genertae unique id => 3RD PARTY MODULE DOES NEED TO INSTALL (npm i uniqid)

import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { readfeedbackJson, writefeedbackJson } from "../../lib/fs-tools.js";
import { uploadFile, uploadAvatarFile } from "../../lib/fs-tools.js";
import multer from "multer"; // it is middleware

const feedbackRouter = express.Router();

// ================================CREATING END POINT METHODS===========================

//1 *******POST******
feedbackRouter.post(
  "/",

  async (req, res, next) => {
    const errorList = validationResult(req);
    try {
      if (!errorList.isEmpty()) {
        // if we had validation errors -> we need to trigger bad request Error handler
        next(createHttpError(400, { errorList }));
      } else {
        const newfeedback = {
          id: uniqid(),
          ...req.body,
          createdAt: new Date(),
        };
        const feedbacksJsonArray = await readfeedbackJson();
        feedbacksJsonArray.push(newfeedback);
        await writefeedbackJson(feedbacksJsonArray);
        res.status(201).send({ id: newfeedback.id });
      }
    } catch (error) {
      next(error);
    }
  }
);

//1 *******GET******
feedbackRouter.get("/", async (req, res, next) => {
  try {
    const feedbacksJsonArray = await readfeedbackJson();
    if (req.query && req.query.title) {
      const filterdAuthors = feedbacksJsonArray.filter(
        (blog) => blog.title == req.query.title
      );
      res.send(filterdAuthors);
    } else {
      res.send(feedbacksJsonArray);
    }
  } catch (error) {
    next(error);
  }
});

// *******GET WITH ID******
feedbackRouter.get("/:id", async (req, res, next) => {
  try {
    const feedbacksJsonArray = await readfeedbackJson();

    const specficAuthor = feedbacksJsonArray.find(
      (blog) => blog.id == req.params.id
    );

    res.send(specficAuthor);
  } catch (error) {
    next(error);
  }
});

//1 **********PUT **************
feedbackRouter.put("/:id", async (req, res, next) => {
  try {
    const feedbacksJsonArray = await readfeedbackJson();
    const index = feedbacksJsonArray.findIndex(
      (blog) => blog.id === req.params.id
    ); //findIndexToUpdate
    const feedbackToModify = feedbacksJsonArray[index];
    const updatefeedback = {
      ...feedbackToModify,
      ...req.body,
      updatedAt: new Date(),
    };

    feedbacksJsonArray[index] = updatefeedback;
    await writefeedbackJson(feedbacksJsonArray);
    res.send(updatefeedback);
  } catch (error) {
    next(error);
  }
});

//1 *******DELETE******
feedbackRouter.delete("/:id", async (req, res, next) => {
  try {
    const feedbacksJsonArray = await readfeedbackJson();
    const remainingAuthors = feedbacksJsonArray.filter(
      (blog) => blog.id !== req.params.id
    );
    await writefeedbackJson(remainingAuthors);
    res.status(204).send(`USER SUCCESSFULLY DELETED`);
  } catch (error) {
    next(error);
  }
});

// ===========================  for comment============================

feedbackRouter.put("/:id/comments", async (req, res, next) => {
  try {
    const { text, userName } = req.body;
    const comment = { id: uniqid(), text, userName, createdAt: new Date() };
    const feedbackJson = await readfeedbackJson(); //reading  feedbackJson is (array of object) =--> [{--},{--},{--},{--},{--}]
    const index = feedbackJson.findIndex((blog) => blog.id == req.params.id);
    // console.log("this is index", index)

    const blogToModify = feedbackJson[index];
    // console.log("this is index 2", bookToModify)
    blogToModify.comments = blogToModify.comments || [];
    // const UpdatedReqBody = req.body // incoming change inputted by user from FE
    // console.log("this is req.body", UpdatedReqBody)

    const updatedBlog = {
      ...blogToModify,
      comments: [...blogToModify.comments, comment],
      updatedAt: new Date(),
      id: req.params.id,
    }; // union of two bodies
    // console.log("this is updateBook", updatedBlog)

    feedbackJson[index] = updatedBlog;
    await writefeedbackJson(feedbackJson);

    res.send(updatedBlog);
  } catch (error) {
    next(error);
  }
});
feedbackRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const feedbackJson = await readfeedbackJson(); //reading  feedbackJson is (array of object) =--> [{--},{--},{--},{--},{--}]

    const singleBlog = feedbackJson.find((b) => b.id == req.params.id); //findindg the exact data needed
    console.log(singleBlog);

    singleBlog.comments = singleBlog.comments || [];
    res.send(singleBlog.comments);
  } catch (error) {
    next(error);
  }
});
// ===========================//============================

// ===========================  for file upload============================
feedbackRouter.patch(
  "/:id/uploadSingleCover",
  multer().single("cover"),
  uploadFile,
  async (req, res, next) => {
    try {
      const feedbackJson = await readfeedbackJson(); //reading  feedbackJson is (array of object) =--> [{--},{--},{--},{--},{--}]
      const index = feedbackJson.findIndex((blog) => blog.id == req.params.id);
      // console.log("this is index", index)

      const blogToModify = feedbackJson[index];
      // console.log("this is index 2", bookToModify)

      const UpdatedReqBody = req.body; // incoming change inputted by user from FE
      // console.log("this is req.body", UpdatedReqBody)

      const updatedBlog = {
        ...blogToModify,
        cover: req.file,
        updatedAt: new Date(),
        id: req.params.id,
      }; // union of two bodies
      // console.log("this is updateBook", updatedBlog)

      feedbackJson[index] = updatedBlog;
      await writefeedbackJson(feedbackJson);

      res.send(updatedBlog);
    } catch (error) {
      next(error);
    }
  }
);

feedbackRouter.put(
  "/:id/uploadSingleAvatar",
  multer().single("avatar"),
  uploadAvatarFile,
  async (req, res, next) => {
    try {
      const feedbackJson = await readfeedbackJson(); //array  json read//array json file reading
      const index = feedbackJson.findIndex((blog) => blog.id === req.params.id); //find index id matched with params
      const avatarlink = feedbackJson[index].author.name;
      console.log(avatarlink);
      const updateAuthor = {
        ...feedbackJson[index],
        author: { name: avatarlink, avatar: req.file },
        updatedAt: new Date(),
        id: req.params.id,
      };
      feedbackJson[index] = updateAuthor;
      await writefeedbackJson(feedbackJson); //write//write
      res.send(updateAuthor);
    } catch (error) {
      next(error);
    }
  }
);

export default feedbackRouter;
