import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { response } from "express";
import cookieParser from "cookie-parser";
import Jwt, { decode } from "jsonwebtoken";
import verifyJWT from "../middlewires/auth.middlewire.js";
import { compareSync } from "bcrypt";
// as generate and access token will be used many times so we are going to make a method of it

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    console.log(accessToken);

    const refreshToken = user.generateRefreshToken();
    // as we need to save refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `something went wrong while generating refresh and access token`
    );
  }
};

export const resisterUser = asyncHandler(async (req, res) => {
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

export const loginUser = asyncHandler(async (req, res) => {
  // req body se data le aao
  // username or email ( kiska access dena hai )
  // find the user
  // password check
  // access and refresh token
  // send cookie for cheking the tokens
  // ......................................
  // 1. req body se data le aao

  const { email, username, password } = req.body;

  // console.log(req);
  // console.log(req);
  // console.log(email);
  if (!username || !email) {
    throw new ApiError(400, "username or email is required ");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(4001, "Invalid user credentials ");
  }

  // accessing access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user LoggedIn successfully "
      )
    );
});

export const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user Logged out "));
});

export const refrehAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            newrefreshToken,
          },
          "acces token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message, "invalid refresh token ");
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "old and new passwords are not same ");
  }
  const user = User.findById(req.user?.id);
  const isPasswordCorrect = await isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changes succesfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched succesfully ");
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname || email)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

// how to update files???

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new error(400, "Avatar file is missing ");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar ");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar is updated Successfully"));
});
export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new error(400, "coverImage  file is missing ");
  }

  const coverImage = await uploadOnCloudinary(CoverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage is updated Successfully"));
});
