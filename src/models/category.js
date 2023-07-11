const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: { type: String, required: true },
  // #000
  color: { type: String },
  icon: { type: String },
  // image: { type: String, default: "" },
});

categorySchema.virtual("id", function () {
  return this._id.toHexString();
});
categorySchema.set("toJSON", {
  virtuals: true,
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
