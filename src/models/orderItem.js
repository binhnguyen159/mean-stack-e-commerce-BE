const mongoose = require("mongoose");
const Product = require("./product");

const OrderItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

OrderItemSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

OrderItemSchema.set("toJSON", {
  virtuals: true,
});

const OrderItem = mongoose.model("OrderItem", OrderItemSchema);

module.exports = OrderItem;
