var umangController = null;
var cowinController = null;
var otpController = null;
var gMessageWindow = null;
var UI = null;

var phoneNumber = null;
var mPin = null;
var bookingOptions = {};
var availableSlots = [];
var bookingTimer = null;
var loginTimer = null;

var waitingForOTP = false;

const DEFAULT_STATEID = 1;
const LOGIN_REFRESH_TOKEN = 12 * (60 * 1000);

document.addEventListener('DOMContentLoaded', function () {
    console.log("Loaded DOM.");

    UI = new ui(respondToUI);

    let loginButton = document.getElementById('login');
    let gMessageButton = document.getElementById('gMessage');

    loginButton.addEventListener('click', loginAll);
    gMessageButton.addEventListener('click', connectToGMessage);
    addWindowListener();
});

var loginAll = async () => {
    try {

        UI.lockLogin('Logging in...');

        phoneNumber = document.getElementById('phoneNumber').value;
        mPin = document.getElementById('MPIN').value;

        umangController = new umangWorker();
        cowinController = new cowinWorker();
        otpController = new otpWorker();

        await umangController.login(phoneNumber, mPin);
        gMessageWindow.postMessage({ type: "mainMessage", message: { command: "watchForOTP", data: "" } }, "*");
        await cowinController.login(phoneNumber, otpController.waitForOTP());
        gMessageWindow.postMessage({ type: "mainMessage", message: { command: "stopWatchOTP", data: "" } }, "*");
        umangController.setCowinToken(cowinController.getToken());

        console.log('Logged in.');
        UI.loginComplete();
        loadValues();
    }
    catch (err) {
        console.log('Error logging in.');
        UI.releaseLogin('Login');
    }
};

var connectToGMessage = () => {
    gMessageWindow = window.open('https://messages.google.com/web');
    console.log('Connected to Google Messages.');
};

var addWindowListener = () => {
    window.addEventListener("message", (event) => {
        if (!event.data.type || (event.data.type != "gMessage")) return;

        let command = event.data.message.command;
        let data = event.data.message.data;

        if (command == 'OTP') {
            console.log('OTP received!');
            otpController.receivedOTP(data);
        }
    });
}

var respondToUI = async (command, data) => {
    if (command == 'updateValue') {
        bookingOptions = data;
        for (const [key, val] of Object.entries(data)) {
            sessionStorage.setItem(key, val);
        }
    }
    else if (command == 'getDistricts') {
        let dList = await cowinController.getDistrictList(data);
        UI.performCommand('districts', dList);
    }
    else if (command == 'start') {
        main();
    }
    else if (command == 'stop') {
        clearInterval(bookingTimer);
        //clearInterval(loginTimer);
    }
}

var loadValues = async () => {
    let data = {};
    data.state = sessionStorage.getItem("state");
    data.district = sessionStorage.getItem("district");
    data.beneficiary = sessionStorage.getItem("beneficiary");
    data.age = sessionStorage.getItem("age");
    data.dose = sessionStorage.getItem("dose");
    data.slot = sessionStorage.getItem("slot");
    data.feeType = sessionStorage.getItem("feeType");
    data.vaccineName = sessionStorage.getItem("vaccineName");
    data.frequency = sessionStorage.getItem("frequency");

    let sList = await cowinController.getStateList();
    UI.performCommand('states', sList);

    let dList = await cowinController.getDistrictList(DEFAULT_STATEID || state);
    UI.performCommand('districts', dList);

    let bList = await cowinController.getBeneficiaryList();
    UI.performCommand('beneficiaries', bList);

    UI.performCommand('setData', data);
    bookingOptions = data;
}

var retryBook = async (dateStr, distID, beneficiaries, minAge, dose, vaccineSlot, feeType, vaccineName) => {
    let calendarData = await cowinController.getCalendarList(distID, dateStr);
    let booked = false;

    availableSlots = [];

    let centers = calendarData.centers;

    for (let m = centers.length - 1; m > 0; m--) {
        const n = Math.floor(Math.random() * (m + 1));
        [centers[m], centers[n]] = [centers[n], centers[m]];
    }

    for (let i = 0; i < centers.length; i++) {
        let hospital = centers[i];

        if (feeType != "0" && feeType.toLowerCase() != hospital.fee_type.toLowerCase()) continue;
        let sessions = hospital.sessions;
        let center_id = hospital.center_id;

        for (let j = 0; j < sessions.length; j++) {
            let session = sessions[j];

            if (session.min_age_limit > minAge) continue;
            if (session[`available_capacity_dose${dose}`] == 0) continue;
            if (vaccineName != "0" && vaccineName.toLowerCase() != session.vaccine.toLowerCase()) continue;

            let slotString = session.slots.slice(vaccineSlot)[0];
            let session_id = session.session_id;

            availableSlots.push({
                sid: session_id,
                cid: center_id,
                ben: beneficiaries,
                dose: dose,
                slot: slotString
            });

            let responseBooking = await umangController.bookSlot(session_id, beneficiaries, dose, slotString);
            console.log('Booking response:', responseBooking);
            if (responseBooking.appointment_id) {
                booked = true;
                break;
            }
        }

        if (booked) break;
    }

    return booked;
}

var main = async () => {
    let district = bookingOptions.district;
    let beneficiary = bookingOptions.beneficiary;
    let age = bookingOptions.age;
    let dose = bookingOptions.dose;
    let slot = bookingOptions.slot;
    let feeType = bookingOptions.feeType;
    let vaccineName = bookingOptions.vaccineName;
    let frequency = bookingOptions.frequency;

    let today = Date.now();
    let timerInterval = 1000 * (300 / frequency);

    let booked = false;

    let tryFunc = async function () {
        booked = await retryBook(today, district, beneficiary, age, dose, slot, feeType, vaccineName);
        let status = "";
        let lastUpdated = new Date(Date.now()).toLocaleString();

        if (!booked) {
            status = 'Not booked.';
        }
        else {
            clearInterval(bookingTimer);
            clearInterval(loginTimer);
            status = 'Booked slot!';

            UI.performCommand('stopSuccess', '');
        }

        // console.log(status, lastUpdated);
        UI.performCommand('update', { status, lastUpdated });
        return booked;
    }

    booked = await tryFunc();

    if (!booked) {
        bookingTimer = setInterval(tryFunc, timerInterval);
        loginTimer = setInterval(reLogin, LOGIN_REFRESH_TOKEN);
    }
}

var reLogin = async () => {
    if (waitingForOTP)
        return;

    waitingForOTP = true;

    await umangController.login(phoneNumber, mPin);
    gMessageWindow.postMessage({ type: "mainMessage", message: { command: "watchForOTP", data: "" } }, "*");
    await cowinController.login(phoneNumber, otpController.waitForOTP());
    gMessageWindow.postMessage({ type: "mainMessage", message: { command: "stopWatchOTP", data: "" } }, "*");
    umangController.setCowinToken(cowinController.getToken());

    waitingForOTP = false;
}
