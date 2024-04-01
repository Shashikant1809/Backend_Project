import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (avatarLocalPath) => {
  try {
    if (!avatarLocalPath) {
      return null;
    }
    //upload the file on cloudinary
    const Response = await cloudinary.uploader.upload(avatarLocalPath, {
      resource_type: "auto",
    });
    // console.log(
    //   "file has been successfully uploaded on cloudinary ",
    //   Response.url
    // );
    fs.unlinkSync(avatarLocalPath);
    return Response;

    // console.log("this is the respone ", response);
  } catch (error) {
    // console.log(error);
    fs.unlinkSync(avatarLocalPath); // remove the locally saved temporay saved file as the upload operation got failed
    return null;
  }
};

export default uploadOnCloudinary;
