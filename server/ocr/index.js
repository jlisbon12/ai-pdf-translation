const express = require("express");
const app = express();
const port = 4001;
app.get("/ocr", (req, res) => {
  res.status(200).send("Hello OCR!");
});
app.listen(port);
