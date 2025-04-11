import { createUploadthing } from "uploadthing/server";

const f = createUploadthing();

const auth = (req) => ({ id: "guest" }); // Add simple auth

export const ourFileRouter = {
  // Define a single uploader for both images and PDFs
  documentUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
    pdf: { maxFileSize: "4MB", maxFileCount: 4 }
  })
    .middleware(async ({ req }) => {
      const user = auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.url);
      return { url: file.url };
    }),
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await ourFileRouter.documentUploader(req, res);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
} 