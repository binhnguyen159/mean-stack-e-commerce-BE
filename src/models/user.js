const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    require: true,
  },
  passwordHash: {
    type: String,
    require: true,
    // select: false,
  },
  street: String,
  apartment: String,
  city: String,
  zip: String,
  country: String,
  phone: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.virtual("id", function () {
  return this._id.toHexString();
});
userSchema.set("toJSON", {
  virtuals: true,
});

exports.User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
