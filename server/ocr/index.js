const express = require("express");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const { Translate } = require("@google-cloud/translate").v2;
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const exec = promisify(require("child_process").exec);
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const port = 4001;

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Increase payload size limit
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

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

  const visionClient = new vision.ImageAnnotatorClient({
    credentials: key,
  });

  const translateClient = new Translate({
    credentials: key,
  });

  app.post("/process", async (req, res) => {
    try {
      const { file_key, file_name } = req.body;
      const file = bucket.file(file_name);
      const [fileExists] = await file.exists();

      if (!fileExists) {
        return res.status(404).send("File not found");
      }

      // Ensure the downloads directory exists
      const downloadsDir = path.join(__dirname, "downloads");
      if (!fs.existsSync(downloadsDir)) {
        await mkdir(downloadsDir);
      }

      // Download the file
      const localFilePath = path.join(downloadsDir, file_key);
      await file.download({ destination: localFilePath });

      // Convert PDF pages to images using `pdftoppm`
      await exec(
        `pdftoppm -png ${localFilePath} ${path.join(downloadsDir, "page")}`
      );

      const imageFiles = fs
        .readdirSync(downloadsDir)
        .filter((file) => file.endsWith(".png"));
      const ocrResults = [];
      const images = [];

      for (const imageFile of imageFiles) {
        const imagePath = path.join(downloadsDir, imageFile);

        // Perform text detection on the image
        const [result] = await visionClient.textDetection(imagePath);
        const detections = result.textAnnotations;

        // Add only descriptions and vertices to the results
        const structuredDetections = detections.map((detection) => ({
          description: detection.description,
          boundingPoly: detection.boundingPoly,
        }));

        ocrResults.push(...structuredDetections);

        // Read image file data
        const imageData = fs.readFileSync(imagePath, { encoding: "base64" });
        images.push(`data:image/png;base64,${imageData}`);

        // Remove the image file after processing
        await unlink(imagePath);
      }

      // Remove the local PDF file after processing
      await unlink(localFilePath);

      if (ocrResults.length === 0) {
        return res.status(200).send("No text detected in the file.");
      }

      // Detect the language of the OCR results
      const descriptions = ocrResults
        .map((result) => result.description)
        .join("\n");
      const [detection] = await translateClient.detect(descriptions);
      const originalLanguage = detection.language;

      // Send OCR results and images to the client
      res.status(200).json({
        ocrResults,
        originalLanguage,
        images,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).send(`Error processing file: ${error.message}`);
    }
  });

  app.listen(port, () => {
    console.log(`OCR service running on port ${port}`);
  });
})();
