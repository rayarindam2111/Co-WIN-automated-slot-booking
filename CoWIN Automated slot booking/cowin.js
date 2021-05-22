let api_head = "https://cdn-api.co-vin.in/api/v2";
let user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36";
let tokenString = "";
let OTPText = "";
let phoneNumber = "";


let digestMessage = async function (message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

let dateStr = function (dateVal) {
  let date = new Date(dateVal);

  let day = String(date.getDate()).padStart(2, '0');
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

let generateOTP = async function () {
  let secret = "U2FsdGVkX1//EanSfJMhknl5j8wJ6JEXg02R1uJDck53GNKTIfqk8tH4F4kfgcVyiODyWGMmxyGu/bHZrjg6AQ==";

  let fetchData = await fetch(`${api_head}/auth/public/generateOTP`,
    {
      "headers": {
        "accept": "application/json",
        "Content-Type": "application/json",
        "user-agent": user_agent
      },
      "body": JSON.stringify({
        "mobile": phoneNumber,
        "secret": secret
      }),
      "method": "POST"
    });

  let txnID = await fetchData.json();
  txnID = txnID.txnId;

  return txnID;
}

let confirmOTP = async function (OTP) {
  let otpSHA = await digestMessage(OTP);

  let fetchData = await fetch(`${api_head}/auth/public/confirmOTP`,
    {
      "headers": {
        "accept": "application/json",
        "Content-Type": "application/json",
        "user-agent": user_agent
      },
      "body": JSON.stringify({
        "otp": otpSHA,
        "txnId": txnID
      }),
      "method": "POST"
    });

  let tokenString = await fetchData.json();
  tokenString = tokenString.token;

  return tokenString;
}

let stateList = async function () {

  let fetchData = await fetch(`${api_head}/admin/location/states`, {
    "headers": {
      "accept": "application/json*",
      "Content-Type": "application/json",
      "user-agent": user_agent,
      "authorization": "Bearer " + tokenString
    },
    "method": "GET",
  });

  let sList = await fetchData.json();
  sList = sList.states;

  return sList;
}

let districtList = async function (stateID) {

  let fetchData = await fetch(`${api_head}/admin/location/districts/${stateID}`, {
    "headers": {
      "accept": "application/json*",
      "Content-Type": "application/json",
      "user-agent": user_agent,
      "authorization": "Bearer " + tokenString
    },
    "method": "GET",
  });

  let dList = await fetchData.json();
  dList = dList.districts;

  return dList;
}

let beneficiaryList = async function () {
  try {
    let fetchData = await fetch(`${api_head}/appointment/beneficiaries`, {
      "headers": {
        "accept": "application/json*",
        "Content-Type": "application/json",
        "user-agent": user_agent,
        "authorization": "Bearer " + tokenString
      },
      "method": "GET",
    });

    let bList = await fetchData.json();
    let b_ids = [];

    bList.beneficiaries.forEach(elem => {
      if (elem.vaccination_status == "Not Vaccinated")
        b_ids.push({ id: elem.beneficiary_reference_id, name: elem.name });
    });

    return b_ids;
  } catch (err) {
    showError();
  }
}

let calendarList = async function (districtID, dateString) {
  let fetchData = await fetch(`${api_head}/appointment/sessions/calendarByDistrict?district_id=${districtID}&date=${dateStr(dateString)}`, {
    "headers": {
      "accept": "application/json*",
      "Content-Type": "application/json",
      "user-agent": user_agent,
      "authorization": "Bearer " + tokenString
    },
    "method": "GET"
  });

  let datalist = await fetchData.json();

  return datalist;
}

let getCaptcha = async function () {
  let fetchData = await fetch(`${api_head}/auth/getRecaptcha`, {
    "headers": {
      "accept": "application/json*",
      "Content-Type": "application/json",
      "user-agent": user_agent,
      "authorization": "Bearer " + tokenString
    },
    "body": "{}",
    "method": "POST"
  });

  let svgData = await fetchData.json();

  return svgData;
}

let bookSlot = async function (sessionID, centerID, beneficiaries, dose, vaccineSlot, captcha) {

  let packData = {
    "center_id": centerID,
    "session_id": sessionID,
    "beneficiaries": beneficiaries,
    "slot": vaccineSlot,
    "captcha": captcha,
    "dose": dose
  };
  console.log("Data:", packData);

  let fetchData = await fetch(`${api_head}/appointment/schedule`,
    {
      "headers": {
        "accept": "application/json*",
        "Content-Type": "application/json",
        "user-agent": user_agent,
        "authorization": "Bearer " + tokenString
      },
      "body": JSON.stringify(packData),
      "method": "POST"
    });

  let appointmentIDDict = await fetchData.json();

  return appointmentIDDict;
}

let retryBook = async function (distID, dateStr, beneficiaries, minAge, dose, vaccineSlot, feeType, vaccineName, captcha) {
  let calendarData = await calendarList(distID, dateStr);
  let booked = false;

  let centers = calendarData.centers;

  for (let i = 0; i < centers.length; i++) {
    let hospital = centers[i];

    if (feeType != "0" && feeType.toLowerCase() != hospital.fee_type.toLowerCase()) continue;
    let sessions = hospital.sessions;
    let center_id = hospital.center_id;
    booked = false;

    for (let j = 0; j < sessions.length; j++) {
      let session = sessions[j];

      if (session.min_age_limit > minAge) continue;
      if (session[`available_capacity_dose${dose}`] == 0) continue;
      if (vaccineName != "0" && vaccineName.toLowerCase() != session.vaccine.toLowerCase()) continue;

      let slotString = session.slots.slice(vaccineSlot)[0];

      let responseBooking = await bookSlot(session.session_id, center_id, beneficiaries, dose, slotString, captcha);
      console.log('Booked.', responseBooking);
      booked = true;
      break;
    }

    if (booked) break;
  }

  return booked;
}

let main = async function (district, beneficiary, age, dose, slot, feeType, vaccineName, frequency, captcha) {
  // let txnID = await generateOTP();
  // tokenString = await confirmOTP(OTPText);

  let today = Date.now();
  let timerInterval = 1000 * (300 / frequency);

  bookingTimer = setInterval(async function () {
    //////
    let bFs = await beneficiaryList();
    ////////

    let booked = await retryBook(district, today, beneficiary, age, dose, slot, feeType, vaccineName, captcha);
    let status = "";
    let lastUpdated = new Date(Date.now()).toLocaleString();

    if (!booked) {
      status = 'Not booked.';
    }
    else {
      clearInterval(bookingTimer);
      working = false;
      status = 'Booked slot!';

      windowIframe.postMessage({
        type: "mainFrame",
        message: {
          command: "stopSuccess",
          data: ""
        }
      }, "*");
    }

    console.log(status, lastUpdated);
    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "update",
        data: { status, lastUpdated }
      }
    }, "*");

  }, timerInterval);
}

let workMain = async function () {
  let htmlData = await fetch(chrome.runtime.getURL('/modal.html'));
  let htmlText = await htmlData.text();

  let modalText =
    `<div id="modalContainer" class="hideModal">
      <div class="modalBox">
          <div id="minimizeModal" class="closeButton">
          ___
          </div>
          <div class="mainContent">
              <iframe id="optionsFrame">
              </iframe>
          </div>
      </div>
    </div>
    <div id="modalOpen"></div>`;

  document.body.insertAdjacentHTML("beforeend", modalText);
  document.getElementById("optionsFrame").contentDocument.write(htmlText);
}

let init = async function () {
  await workMain();
  let modalOpen = document.getElementById('modalOpen');
  modalOpen.addEventListener('click', async function () {
    document.getElementById('modalContainer').classList.remove('hideModal');
    if (working) return;

    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "errorMessage",
        data: false
      }
    }, "*");

    tokenString = sessionStorage.getItem("userToken").slice(1, -1);
    let sList = await stateList();
    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "states",
        data: sList
      }
    }, "*");

    let bFs = await beneficiaryList();
    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "beneficiaries",
        data: bFs
      }
    }, "*");

    await requestCaptcha();
  });

  let modalClose = document.getElementById('minimizeModal');
  modalClose.addEventListener('click', function () {
    document.getElementById('modalContainer').classList.add('hideModal');
  });
}

let showError = function () {
  windowIframe.postMessage({
    type: "mainFrame",
    message: {
      command: "errorMessage",
      data: true
    }
  }, "*");

}

let requestCaptcha = async function () {
  let captchaData = await getCaptcha();
  let imgString = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(captchaData.captcha)))}`;
  windowIframe.postMessage({
    type: "mainFrame",
    message: {
      command: "captcha",
      data: imgString
    }
  }, "*");
}

let windowIframe = null;
let bookingTimer = null;
let working = false;

window.addEventListener("message", async (event) => {
  if (!event.data.type || (event.data.type != "iframeOptions")) return;

  let command = event.data.message.command;
  let data = event.data.message.data;
  if (command == "loaded") {
    windowIframe = event.source;
  }
  else if (command == "districts") {
    let districts = await districtList(data);
    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "districts",
        data: districts
      }
    }, "*");
  }
  else if (command == "start") {
    await main(data.district, data.beneficiary, data.age, data.dose, data.slot, data.feeType, data.vaccineName, data.frequency, data.captcha);
    working = true;
    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "startSuccess",
        data: ""
      }
    }, "*");

  }
  else if (command == "stop") {
    clearInterval(bookingTimer);
    working = false;
    windowIframe.postMessage({
      type: "mainFrame",
      message: {
        command: "stopSuccess",
        data: ""
      }
    }, "*");
  }
}, false);

console.log("Extension script loaded.");
init();