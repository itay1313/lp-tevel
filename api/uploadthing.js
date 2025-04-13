import { createUploadthing } from "uploadthing/express";

const f = createUploadthing({
  apiKey: process.env.UPLOADTHING_SECRET,
  appId: process.env.UPLOADTHING_APP_ID
});

export const ourFileRouter = {
  documentUploader: f({ pdf: { maxFileSize: "4MB" }, image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete");
      console.log("file url", file.url);
      return { url: file.url };
    }),
}; 