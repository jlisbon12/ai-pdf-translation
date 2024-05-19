const express = require("express");
const { Storage } = require("@google-cloud/storage");
const { Translate } = require("@google-cloud/translate").v2;
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = 4002;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

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

  const translate = new Translate({
    credentials: key,
  });

  app.post("/translate", async (req, res) => {
    try {
      const { ocrData, originalLanguage } = req.body;
      const targetLanguage = req.query.targetLanguage || "en"; // Set default target language to English
      if (!ocrData || !originalLanguage) {
        return res
          .status(400)
          .send("OCR data and original language must be provided.");
      }

      const translations = await Promise.all(
        ocrData.map(async (item) => {
          const [translatedText] = await translate.translate(
            item.description,
            targetLanguage
          );
          return {
            description: translatedText,
            boundingPoly: item.boundingPoly,
            originalLanguage: originalLanguage,
          };
        })
      );

      res.status(200).json(translations);
    } catch (error) {
      console.error("Error translating file:", error);
      res.status(500).send(`Error translating file: ${error.message}`);
    }
  });

  app.listen(port, () => {
    console.log(`Translation service running on port ${port}`);
  });
})();
