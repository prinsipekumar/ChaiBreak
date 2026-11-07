import { body } from "express-validator";

export const updateProfileValidation = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Name parameter is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Name must be a valid non-empty string."),
];
