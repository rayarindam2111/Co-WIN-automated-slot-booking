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
const LOGIN_REFRESH_TOKEN = 3.25 * (60 * 1000);

const timeout = function (time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () { resolve(time); }, time);
    });
}

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
        UI.lockLogin('Login');

        phoneNumber = document.getElementById('phoneNumber').value;
        mPin = document.getElementById('MPIN').value;

        umangController = new umangWorker();
        cowinController = new cowinWorker();
        otpController = new otpWorker();

        await umangController.login(phoneNumber, mPin);
        gMessageWindow.postMessage({ type: "mainMessage", message: { command: "watchForOTP", data: "" } }, "*");
        await umangController.loginCowin(otpController.waitForOTP(), otpController);
        gMessageWindow.postMessage({ type: "mainMessage", message: { command: "stopWatchOTP", data: "" } }, "*");
        //umangController.setCowinToken(cowinController.getToken());

        console.log('Logged in.');
        UI.loginComplete();
        loginTimer = setInterval(reLogin, LOGIN_REFRESH_TOKEN);
        loadValues();
    }
    catch (err) {
        console.log('Error logging in.', err);
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
        else if (command == 'gMessageWindowClosing') {
            console.log('User tried to close Google Messages!');
            UI.toastMessage('Please do not close the Google Messages tab!');
        }
        else if (command == 'gMessageWindowClosed') {
            console.log('User closed Google Messages!');
            UI.toastMessage('Connection to Google Messages lost. Please Refresh.');
        }
    });
}

var respondToUI = async (command, data) => {
    if (command == 'updateValue') {
        bookingOptions = data;
        for (const [key, val] of Object.entries(data)) {
            sessionStorage.setItem(key, JSON.stringify(val));
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
        bookingTimer = null;
    }
}

var normalizeDate = (dateStr) => { //dd-mm-yyyy
    if (dateStr) {
        if (typeof dateStr == 'string') {
            let dateParts = dateStr.split('-');
            dateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            dateStr = Date.parse(dateStr);
        }
        dateStr = new Date(dateStr);
        dateStr.setHours(0, 0, 0, 0);
        dateStr = dateStr.getTime();
    }
    return dateStr;
}

var loadValues = async () => {
    let data = {};
    data.state = JSON.parse(sessionStorage.getItem("state"));
    data.district = JSON.parse(sessionStorage.getItem("district"));
    data.pincode = JSON.parse(sessionStorage.getItem("pincode"));
    data.selectAreaOption = JSON.parse(sessionStorage.getItem("selectAreaOption"));
    data.beneficiary = JSON.parse(sessionStorage.getItem("beneficiary"));
    data.age = JSON.parse(sessionStorage.getItem("age"));
    data.dose = JSON.parse(sessionStorage.getItem("dose"));
    data.slot = JSON.parse(sessionStorage.getItem("slot"));
    data.feeType = JSON.parse(sessionStorage.getItem("feeType"));
    data.vaccineName = JSON.parse(sessionStorage.getItem("vaccineName"));
    data.frequency = JSON.parse(sessionStorage.getItem("frequency"));
    data.date = JSON.parse(sessionStorage.getItem("date"));

    let sList = await cowinController.getStateList();
    UI.performCommand('states', sList);

    let sID = (!data.state || (data.state == -1)) ? DEFAULT_STATEID : data.state;

    let dList = await cowinController.getDistrictList(sID);
    UI.performCommand('districts', dList);

    let bList = await umangController.getBeneficiaryList();
    UI.performCommand('beneficiaries', bList);

    UI.performCommand('setData', data);
    bookingOptions = data;
}

var retryBook = async (dateStart, dateEnd, areaDetails, beneficiaries, minAge, dose, vaccineSlot, feeType, vaccineName) => {
    let calendarData = await umangController.getCalendarList(areaDetails.method, areaDetails.id, dateStart);
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
            if (dateEnd && (normalizeDate(session.date) > dateEnd)) continue;

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
            if (responseBooking.appointment_confirmation_no) {
                booked = true;
                umangController.downloadCert(responseBooking.appointment_confirmation_no, "Vaccine_Booking.pdf");
                break;
            }
        }

        if (booked) break;
    }

    return booked;
}

var main = async () => {
    let selectAreaOption = bookingOptions.selectAreaOption;
    let district = bookingOptions.district;
    let beneficiary = bookingOptions.beneficiary;
    let age = bookingOptions.age;
    let dose = bookingOptions.dose;
    let slot = bookingOptions.slot;
    let feeType = bookingOptions.feeType;
    let vaccineName = bookingOptions.vaccineName;
    let frequency = bookingOptions.frequency;
    let startDate = normalizeDate(bookingOptions.date.start || Date.now());
    let endDate = normalizeDate(bookingOptions.date.end);

    let areaDetails = { method: selectAreaOption };
    if (selectAreaOption == 'stateAndDistrict') {
        areaDetails.id = bookingOptions.district;
    }
    else if (selectAreaOption == 'pinCode') {
        areaDetails.id = bookingOptions.pincode;
    }


    let timerInterval = 1000 * (300 / frequency);

    let booked = false;

    let tryFunc = async function () {
        booked = await retryBook(startDate, endDate, areaDetails, beneficiary, age, dose, slot, feeType, vaccineName);
        let status = "";
        let lastUpdated = new Date(Date.now()).toLocaleString();

        if (!booked) {
            status = 'Not booked.';
        }
        else {
            clearInterval(bookingTimer);
            clearInterval(loginTimer);
            bookingTimer = null;
            loginTimer = null;

            status = 'Booked slot!';

            UI.performCommand('stopSuccess', '');
        }

        // console.log(status, lastUpdated);
        UI.performCommand('update', { status, lastUpdated });
        return booked;
    }

    if (!loginTimer) {
        await reLogin();
        loginTimer = setInterval(reLogin, LOGIN_REFRESH_TOKEN);
    }

    //booked = await tryFunc();

    //if (!booked) {
    bookingTimer = setInterval(tryFunc, timerInterval);
    //}
}

var reLogin = async () => {
    if (waitingForOTP)
        return;

    waitingForOTP = true;

    let errors = true;

    while (errors) {
        try {
            console.log('Waiting for OTP.');
            await umangController.login(phoneNumber, mPin);
            gMessageWindow.postMessage({ type: "mainMessage", message: { command: "watchForOTP", data: "" } }, "*");
            await umangController.loginCowin(otpController.waitForOTP(), otpController);
            gMessageWindow.postMessage({ type: "mainMessage", message: { command: "stopWatchOTP", data: "" } }, "*");
            //umangController.setCowinToken(cowinController.getToken());
            errors = false;
        }
        catch (err) {
            errors = true;
            UI.toastMessage('Error in automatic relogin - Network Issue. Retrying.');
            console.log('Retrying relogin.');
            await timeout(500);
        }
    }

    waitingForOTP = false;
}
