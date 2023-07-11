const express = require("express");
const Category = require("../models/category");

const router = express.Router();

router.get("/", async (req, res, next) => {
  const categories = await Category.find();
  if (!categories) {
    res.status(500).json({ success: false });
  }
  res.status(200).json(categories);
});

router.get("/:id", async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({
      success: false,
      message: "Can not found any category with the given ID",
    });
  res.status(200).json(category);
});

router.post("/", async (req, res, next) => {
  const newCategory = await new Category({ ...req.body }).save();
  if (!newCategory)
    return res.status(500).json("The category can not be created!");
  res.status(200).json(newCategory);
});

router.put("/:id", async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true }
  );
  if (!category)
    return res.status(500).json("The category can not be created!");
  res.status(200).json(category);
});

router.delete("/:id", async (req, res, next) => {
  const id = req.params.id;
  Category.findByIdAndRemove(id)
    .then((category) => {
      if (category) {
        return res
          .status(200)
          .json({ success: true, message: "Category was deleted!" });
      }
      return res
        .status(404)
        .json({ success: false, message: "Category not found!" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
