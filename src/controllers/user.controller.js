import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { response } from "express";

const resisterUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "ok",
  // });

  //get user details from frontend

  const { fullname, email, username, password } = req.body;
  // console.log("this is the req.body", req.body);
  console.log("email:", email);
  // way 2
  // ..............................

  // if (
  //   [fullname, password, email, username].some((field) => {
  //     field?.trim() === "";
  //   })
  // ) {
  //   throw new ApiError(400, "All fields  are required");
  // }

  // way 1 check this for all fields
  // .......................................

  function check(input) {
    if (input === "") {
      throw new ApiError(400, `${input} is required`);
    }
  }
  check(fullname);
  check(password);
  check(email);
  check(username);

  // checking if user is already existing or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username is already exist ");
  }

  //file handling
  // req.files; // we are able to access it from the multer middlewire that we had added for handling of the images and videos
  // .path will be giving the local file path as till now our images and videos are on local server only so the path will bw local only
  const avatarLocalPath = req.files?.avatar[0]?.path; // local path as file is not uploaded at our server tilll now
  // console.log("this is  req.files ", req.files);

  // its problem of javascript so it will thow error now let's check it throw if else

  // const coverImageLocalPath = req.files?.coverImage[0].path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // now we have to check whether these files are there or not

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required not uploded yet ");
  }

  // uploading the images
  // uploading will take time
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // console.log(avatarLocalPath);
  // console.log(avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // again checking wheather avatar file is uploaded or not
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // if all of the above thigns are done correctly now crate a object and do entry in database

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    // we have to check coverimage is there or not
    coverImage: coverImage?.url || " ",
    email,
    password,
    username: username.toLowerCase(),
  });

  // to check whether user is created or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while resistering a user ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User resistered successfully"));
});

export default resisterUser;
