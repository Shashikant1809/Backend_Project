import { Router } from "express";
import resisterUser from "../controllers/user.controller.js";

const router = Router();

router.route("/resister").post(resisterUser);
// router.route("/login").post(loginUser);

export default router;
