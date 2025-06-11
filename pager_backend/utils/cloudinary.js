import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import streamifier from "streamifier";  
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (fileInput) => {
  try {
    if (Buffer.isBuffer(fileInput)) {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "uploads" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(fileInput).pipe(stream);
      });
    }


    if (!fileInput || !fs.existsSync(fileInput)) {
      console.log("File not found:", fileInput);
      return null;
    }

    const response = await cloudinary.uploader.upload(fileInput, {
      resource_type: "auto",
      folder: "uploads",
    });

    // Delete the temp file after upload
    fs.unlink(fileInput, () => {});
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // On failure: delete temp file if it exists
    if (typeof fileInput === "string" && fs.existsSync(fileInput)) {
      fs.unlink(fileInput, () => {});
    }
    return null;
  }
};

// ➌  Delete helper (unchanged)
export const deleteOldProfile = async (publicId) => {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (err) {
    console.error("Cloudinary Delete Error:", err);
    return false;
  }
};
