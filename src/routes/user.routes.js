import { Router } from "express";
import { refrehAccessToken } from "../controllers/user.controller.js";
import {
  resisterUser,
  loginUser,
  logOutUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewires/multer.middlewire.js";
import verifyJWT from "../middlewires/auth.middlewire.js";

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

router.route("/login").post(loginUser);

//securedRoutes

// router.route("/logout").post(verifyJWT, logOutUser);
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refrehAccessToken);

export default router;
