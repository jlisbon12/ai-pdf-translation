const express = require("express");
const app = express();
const port = 4002;
app.get("/translate", (req, res) => {
  res.status(200).send("Hello OCR!");
});
app.listen(port);
