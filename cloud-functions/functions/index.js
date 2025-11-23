/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
setGlobalOptions({ maxInstances: 10 });

const admin = require("firebase-admin");
try { admin.initializeApp(); } catch {}

const {discountPublisher} = require("./src/cron/discountPublisher");
const {orderAutoCancel} = require("./src/cron/orderAutoCancel");
const {inventorySyncCron, inventorySyncHttp} = require("./src/cron/inventorySync");
const {promoApplier} = require("./src/http/promoApplier");
const {imageThumbs} = require("./src/storage/imageThumbs");

exports.discountPublisher = discountPublisher;
exports.orderAutoCancel = orderAutoCancel;
exports.inventorySyncCron = inventorySyncCron;
exports.inventorySyncHttp = inventorySyncHttp;
exports.promoApplier = promoApplier;
exports.imageThumbs = imageThumbs;
