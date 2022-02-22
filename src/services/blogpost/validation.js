import {} from "express";
import { body } from "express-validator";

export const blogPostValidatioMiddlewares = [
  body("title").exists().withMessage("title is a mandatory filed"),
  body("description").exists().withMessage("description is a mandatory filed"),
  body("price").exists().withMessage("price is a mandatory filed"),
];
