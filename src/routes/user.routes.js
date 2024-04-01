import { Router } from "express";
import resisterUser from "../controllers/user.controller.js";
import { upload } from "../middlewires/multer.middlewire.js";
const router = Router();

router.route("/resister").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  resisterUser
);
// router.route("/login").post(loginUser);

export default router;
