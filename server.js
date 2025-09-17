import express from "express";
import multer from "multer";
import path from "path";
import { convert } from "pdf-poppler";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/pdf-to-jpg", upload.single("file"), async (req, res) => {
  const filePath = path.resolve(req.file.path);
  const output = filePath + "-page";

  let options = {
    format: "jpeg",
    out_dir: path.dirname(filePath),
    out_prefix: path.basename(output),
    page: null // all pages
  };

  try {
    await convert(filePath, options);
    res.download(output + "-1.jpg"); // send first page as JPG
  } catch (err) {
    res.status(500).send("Conversion failed: " + err.message);
  }
});

app.listen(10000, () => console.log("Server running on port 10000"));
