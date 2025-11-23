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
try { admin.initializeApp(); } catch (e) { void e; }

const {discountPublisher} = require("./src/cron/discountPublisher");
const {orderAutoCancel} = require("./src/cron/orderAutoCancel");
const {inventorySyncCron, inventorySyncHttp} = require("./src/cron/inventorySync");
const {promoApplier} = require("./src/http/promoApplier");
const {authProxyLogin} = require("./src/http/authProxyLogin");
const {userRegisterProxy} = require("./src/http/userRegisterProxy");
const {changePasswordProxy} = require("./src/http/changePasswordProxy");
const {passwordResetMailer} = require("./src/http/passwordResetMailer");
const {auditForwarder} = require("./src/http/auditForwarder");
const {supportTicketNotifier} = require("./src/http/supportTicketNotifier");
const {imageThumbs} = require("./src/storage/imageThumbs");
const {webhookShipmentStatus, runWebhookShipmentStatus} = require("./src/http/webhookShipmentStatus");
const {shipmentTrackingRefresh, runShipmentTrackingRefresh} = require("./src/cron/shipmentTrackingRefresh");

exports.discountPublisher = discountPublisher;
exports.orderAutoCancel = orderAutoCancel;
exports.inventorySyncCron = inventorySyncCron;
exports.inventorySyncHttp = inventorySyncHttp;
exports.promoApplier = promoApplier;
exports.imageThumbs = imageThumbs;
exports.authProxyLogin = authProxyLogin;
exports.userRegisterProxy = userRegisterProxy;
exports.changePasswordProxy = changePasswordProxy;
exports.passwordResetMailer = passwordResetMailer;
exports.auditForwarder = auditForwarder;
exports.supportTicketNotifier = supportTicketNotifier;
exports.webhookShipmentStatus = webhookShipmentStatus;
exports.runWebhookShipmentStatus = runWebhookShipmentStatus;
exports.shipmentTrackingRefresh = shipmentTrackingRefresh;
exports.runShipmentTrackingRefresh = runShipmentTrackingRefresh;
