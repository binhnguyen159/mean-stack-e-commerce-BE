const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpge",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type");
    if (isValid) {
      uploadError = null;
      cb(null, `public/uploads`);
    } else {
      cb(new Error("Invalid image type"));
    }
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("_");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}_${Date.now()}.${extension}`);
  },
});
const uploadImages = multer({ storage: storage });

const Category = require("../models/category");
const Product = require("../models/product");

const router = express.Router();

router.get(`/`, async (req, res, next) => {
  const filter = {};
  if (req.query.categories) {
    filter.category = req.query.categories.split(",");
  }
  const products = await Product.find(filter).populate("category");
  if (!products) {
    return res.status(500).json({ success: false });
  }
  res.status(200).send(products);
});
router.get("/:id", async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(500).json({ success: false });
  return res.status(200).json(product);
});
router.get("/list/ids", async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) return res.status(500).json({ success: false });
  return res.status(200).json(product);
});

router.post(`/`, uploadImages.single("image"), async (req, res, next) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(404).json("Invalid category");
  const file = req.file;
  if (!file) {
    return res.status(400).json({
      success: false,
      message: "No image in the request",
    });
  }
  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  let product = new Product({
    ...req.body,
    image: `${basePath}${fileName}`,
    price: Number(req.body.price) || 0,
    countInStock: Number(req.body.countInStock) || 0,
    rating: Number(req.body.rating) || 0,
    numReviews: Number(req.body.numReviews) || 0,
  });

  product = await product.save();
  if (!product) {
    res.status(500).json({
      message: "Product cannot be created!",
      success: false,
    });
  }
  res.status(200).json(product);
});

router.put("/:id", uploadImages.single("image"), async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Product ID!" });
  }

  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(404).json("Invalid category");
  }
  const oldProduct = await Product.findById(req.params.id);
  if (!oldProduct) return res.status(404).json("Invalid Product");

  const file = req.file;
  let imagePath = oldProduct.image;
  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagePath = basePath + fileName;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { ...req.body, image: imagePath },
    { new: true }
  );
  if (!product) return res.status(500).json("The Product can not be created!");
  res.status(200).json(product);
});

router.put(
  "/gallery-images/:id",
  uploadImages.array("images", 10),
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID!" });
    }
    const files = req.files;
    const imagesPath = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    if (files) {
      files.map((file) => {
        imagesPath.push(basePath + file.filename);
      });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images: imagesPath },
      { new: true }
    );
    if (!product)
      return res.status(500).json("The Product can not be created!");
    res.status(200).json(product);
  }
);

router.delete("/:id", async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Product ID!" });
  }
  const id = req.params.id;
  Product.findByIdAndRemove(id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "product was deleted!" });
      }
      return res
        .status(404)
        .json({ success: false, message: "product not found!" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/count", async (req, res, next) => {
  const productCount = await Product.countDocuments();
  if (!productCount) return res.status(500).json({ success: false });
  return res.status(200).json(productCount);
});

router.get("/get/featured/:count", async (req, res, next) => {
  const count = Number(req.params.count) ?? 0;
  const products = await Product.find({ isFeatured: true }).limit(count);
  if (!products) return res.status(500).json({ success: false });
  return res.status(200).json(products);
});

module.exports = router;
