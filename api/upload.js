import { createUploadthing } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();
const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    "image/*": { maxFileSize: "4MB", maxFileCount: 4 },
    "application/pdf": { maxFileSize: "4MB", maxFileCount: 4 }
  })
    .middleware(({ req }) => {
      return { uploadedBy: "guest" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for file:", file.name);
      console.log("File URL:", file.url);
      return { url: file.url };
    })
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const response = await ourFileRouter.documentUploader(req, res);
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in upload:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 