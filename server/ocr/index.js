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
const bodyParser = require("body-parser");

const app = express();
const port = 4001;

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

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

      const downloadsDir = path.join(__dirname, "downloads");
      if (!fs.existsSync(downloadsDir)) {
        await mkdir(downloadsDir);
      }

      const localFilePath = path.join(downloadsDir, file_key);
      await file.download({ destination: localFilePath });

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

        const [result] = await visionClient.documentTextDetection(imagePath);
        const fullTextAnnotation = result.fullTextAnnotation;

        fullTextAnnotation.pages.forEach((page) => {
          page.blocks.forEach((block) => {
            block.paragraphs.forEach((paragraph) => {
              let paragraphText = "";
              paragraph.words.forEach((word) => {
                const wordText = word.symbols
                  .map((symbol) => symbol.text)
                  .join("");
                paragraphText += wordText + " ";
              });

              const vertices = paragraph.boundingBox.vertices;
              ocrResults.push({
                description: paragraphText.trim(),
                boundingPoly: { vertices },
              });
            });
          });
        });

        const imageData = fs.readFileSync(imagePath, { encoding: "base64" });
        images.push(`data:image/png;base64,${imageData}`);

        await unlink(imagePath);
      }

      await unlink(localFilePath);

      if (ocrResults.length === 0) {
        return res.status(200).send("No text detected in the file.");
      }

      const descriptions = ocrResults
        .map((result) => result.description)
        .join("\n");
      const [detection] = await translateClient.detect(descriptions);
      const originalLanguage = detection.language;

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
