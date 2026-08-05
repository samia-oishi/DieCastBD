import { Address } from "./address.model.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

async function clearOtherDefaults(userId, exceptId) {
  await Address.updateMany({ user: userId, _id: { $ne: exceptId } }, { isDefault: false });
}

export const listMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, { data: addresses });
});

export const createAddress = asyncHandler(async (req, res) => {
  const isFirstAddress = (await Address.countDocuments({ user: req.user.id })) === 0;
  const address = await Address.create({
    ...req.body,
    user: req.user.id,
    isDefault: req.body.isDefault || isFirstAddress, // first address is always the default
  });

  if (address.isDefault) await clearOtherDefaults(req.user.id, address._id);
  sendSuccess(res, { data: address, status: 201, message: "Address added" });
});

export const updateAddress = asyncHandler(async (req, res) => {
  // This is a $set merge, so an address saved before the district/thana
  // dropdowns would keep its old free-text city forever. Once a thana arrives
  // the address is on the new shape — drop the legacy pair rather than leave a
  // record that reads "Dhaka" next to a district of Khulna. Both keys are
  // removed from $set first: setting and unsetting the same path in one update
  // is a MongoDB conflict error.
  const { city, postalCode, ...rest } = req.body;
  const update = req.body.thana?.trim()
    ? { $set: rest, $unset: { city: "", postalCode: "" } }
    : { $set: req.body };

  const address = await Address.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, update, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!address) throw ApiError.notFound("Address not found");

  if (address.isDefault) await clearOtherDefaults(req.user.id, address._id);
  sendSuccess(res, { data: address, message: "Address updated" });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!address) throw ApiError.notFound("Address not found");

  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (next) await Address.updateOne({ _id: next._id }, { isDefault: true });
  }

  sendSuccess(res, { message: "Address deleted" });
});
