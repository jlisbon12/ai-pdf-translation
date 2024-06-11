const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const { Firestore } = require("@google-cloud/firestore");
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
  const storage = new Storage({ credentials: key });
  const firestore = new Firestore({ credentials: key });
  const bucketName = "pdf_upload_bucket-1";
  const bucket = storage.bucket(bucketName);

  const upload = multer({ dest: "uploads/" });

  app.use(cors({ origin: "http://localhost:3000" }));
  app.use(express.json());

  app.post("/create-user", async (req, res) => {
    const { userId, email } = req.body;

    try {
      await firestore.collection("users").doc(userId).set({
        email,
        createdAt: Firestore.Timestamp.now(),
      });
      res.status(200).send("User created successfully");
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).send(`Error creating user: ${error.message}`);
    }
  });

  app.post("/upload", upload.single("file"), async (req, res) => {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filePath = path.join(__dirname, "uploads", req.file.filename);
    const destination = req.file.originalname;

    try {
      await bucket.upload(filePath, { destination });
      fs.unlinkSync(filePath);

      const fileUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

      const userRef = firestore.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).send("User not found");
      }

      const pdfRef = userRef.collection("pdfs").doc(req.file.filename);
      await pdfRef.set({
        file_key: req.file.filename,
        file_name: destination,
        upload_time: new Date(),
        pdf_url: fileUrl,
      });

      res.status(200).json({
        file_key: req.file.filename,
        file_name: destination,
        pdf_url: fileUrl,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).send("Error uploading file");
    }
  });

  app.get("/pdfs/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const userRef = firestore.collection("users").doc(userId);
      const pdfsSnapshot = await userRef.collection("pdfs").get();
      const pdfs = pdfsSnapshot.docs.map((doc) => doc.data());
      res.status(200).json(pdfs);
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      res.status(500).send("Error fetching PDFs");
    }
  });

  app.get("/pdfs/:userId/:pdfId", async (req, res) => {
    const { userId, pdfId } = req.params;

    try {
      const userRef = firestore.collection("users").doc(userId);
      const pdfDoc = await userRef.collection("pdfs").doc(pdfId).get();
      if (!pdfDoc.exists) {
        return res.status(404).send("PDF not found");
      }
      res.status(200).json(pdfDoc.data());
    } catch (error) {
      console.error("Error retrieving PDF:", error);
      res.status(500).send("Error retrieving PDF");
    }
  });

  app.listen(port, () => {
    console.log(`PDF Upload service running on port ${port}`);
  });
})();
