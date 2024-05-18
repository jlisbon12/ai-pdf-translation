const express = require("express");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 4000;

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

async function getSecret() {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: "projects/793976137070/secrets/pdf-upload-service-account-key/versions/latest",
  });

  const payload = version.payload.data.toString("utf8");
  return JSON.parse(payload);
}

(async () => {
  const key = await getSecret();
  const storage = new Storage({
    credentials: key,
  });
  const bucketName = "pdf_upload_bucket-1";
  const bucket = storage.bucket(bucketName);

  const upload = multer({ dest: "uploads/" });

  app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filePath = path.join(__dirname, "uploads", req.file.filename);
    const destination = req.file.originalname;

    try {
      await bucket.upload(filePath, { destination });
      fs.unlinkSync(filePath); // Remove file from local storage after upload

      res.status(200).send("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).send("Error uploading file");
    }
  });

  app.listen(port, () => {
    console.log(`PDF Upload service running on port ${port}`);
  });
})();
