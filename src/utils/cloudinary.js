import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (LocalFilePath) => {
  try {
    if (!LocalFilePath) return null;
    //upload the file on cloudinary
    const Response = await cloudinary.uploader.upload(LocalFilePath, {
      resource_type: "auto",
    });
    console.log(
      "file has been successfully uploaded on cloudinary ",
      Response.url
    );
    return Response;
  } catch (error) {
    fs.unlinkSync(LocalFilePath); // remove the locally saved temporay saved file as the upload operation got failed
    return null;
  }
};

export default uploadOnCloudinary;
