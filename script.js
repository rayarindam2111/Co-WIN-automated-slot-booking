var umangController = null;
var cowinController = null;
var otpController = null;
var gMessageWindow = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log("Loaded DOM.");

    let loginButton = document.getElementById('login');
    let gMessageButton = document.getElementById('gMessage');

    loginButton.addEventListener('click', loginAll);
    gMessageButton.addEventListener('click', connectToGMessage);
});

var loginAll = async () => {

    let phoneNumber = document.getElementById('phoneNumber').value;
    let mPin = document.getElementById('MPIN').value;

    umangController = new umangWorker();
    cowinController = new cowinWorker();
    otpController = new otpWorker();

    await umangController.login(phoneNumber, mPin);
    gMessageWindow.postMessage({ type: "mainMessage", message: { command: "watchForOTP", data: "" } }, "*");
    await cowinController.login(phoneNumber, otpController.waitForOTP());
    gMessageWindow.postMessage({ type: "mainMessage", message: { command: "stopWatchOTP", data: "" } }, "*");
    umangController.setCowinToken(cowinController.getToken());

    console.log('Logged in.');
};

var connectToGMessage = () => {
    gMessageWindow = window.open('https://messages.google.com/web');
    console.log('Connected to Google Messages.');
};

window.addEventListener("message", (event) => {
    if (!event.data.type || (event.data.type != "gMessage")) return;

    let command = event.data.message.command;
    let data = event.data.message.data;

    if (command == 'OTP') {
        console.log('OTP received!');
        otpController.receivedOTP(data);
    }
});

