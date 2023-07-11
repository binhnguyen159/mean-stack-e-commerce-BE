const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress1: String,
  shippingAddress2: String,
  city: String,
  zip: String,
  country: String,
  phone: String,
  status: {
    type: Number,
    required: true,
    default: 0,
  },
  totalPrice: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dateOrdered: {
    type: Date,
    default: Date.now(),
  },
});

OrderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

OrderSchema.set("toJSON", {
  virtuals: true,
});

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
