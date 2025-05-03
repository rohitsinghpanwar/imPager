import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.uploader.destroy()

const uploadOnCloudinary = async (filepath) => {
    try {
        if (!filepath || !fs.existsSync(filepath)) {
            console.log("File not found:", filepath);
            return null;
        }

        const response = await cloudinary.uploader.upload(filepath, { resource_type: "auto",folder:"uploads" });
        
        // Delete the file after successful upload
        try {
            fs.unlinkSync(filepath);
        } catch (unlinkError) {
            console.log("Error deleting file:", unlinkError);
        }

        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Ensure file deletion even on failure
        try {
            fs.unlinkSync(filepath);
        } catch (unlinkError) {
            console.log("Error deleting file after failed upload:", unlinkError);
        }

        return null;
    }
};

const deleteOldProfile = async (publicId) => {
    try {
      if (!publicId) {
        console.log("No public ID provided for deletion");
        return false;
      }
  
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === "ok") {
        console.log(`Successfully deleted image with public ID: ${publicId}`);
        return true;
      } else {
        console.log(`Failed to delete image with public ID: ${publicId}`, result);
        return false;
      }
    } catch (error) {
      console.error("Cloudinary Delete Error:", error);
      return false;
    }
  };

export { uploadOnCloudinary,deleteOldProfile };
