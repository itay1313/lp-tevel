import { createUploadthing } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  documentUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
    pdf: { maxFileSize: "4MB", maxFileCount: 4 }
  })
    .middleware(() => {
      return { uploadedBy: "guest" };
    })
    .onUploadComplete((data) => {
      console.log("Upload complete:", data);
      return { url: data.file.url };
    })
};

// Export config helper
export const config = {
  api: {
    bodyParser: false
  }
};

// Export handler
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Get the file from the request
      const file = req.files?.[0];
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Upload using UploadThing
      const result = await ourFileRouter.documentUploader.upload({
        file,
        input: { uploadedBy: "guest" }
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in upload:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 