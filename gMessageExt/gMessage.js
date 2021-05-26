console.log('Extension loaded.');

var mainWindow = window.opener;
var watchForOTP = false;

const signalIcon = '<div id="msgStatus" style="position:absolute;top:24px;right:12px;width:20px;height:20px;background:#f00;z-index:999999;border-radius:50%"></div>';
document.body.insertAdjacentHTML("beforeend", signalIcon);

const timeout = function (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () { resolve(time); }, time);
  });
}

const callback = function (mutationsList, observer) {

  if (!watchForOTP) return;

  for (const mutation of mutationsList) {
    if (mutation.type === 'childList' && mutation.addedNodes[0] && mutation.addedNodes[0].nodeName.toUpperCase() == "MWS-MESSAGE-WRAPPER") {
      let msgID = mutation.addedNodes[0].getAttribute('msg-id');
      let lastMsg = mutation.addedNodes[0].getAttribute('is-last');
      let textOTP = mutation.addedNodes[0].firstElementChild.innerText;
      let OTP = textOTP.split('CoWIN is ')[1].split(".")[0];

      if (lastMsg) {

        console.log({ 'msgID': msgID, 'lastMsg': lastMsg, 'OTP': OTP });

        mainWindow.postMessage({
          type: "gMessage",
          message: {
            command: "OTP",
            data: OTP
          }
        }, "*");
      }


    }
  }
};

window.addEventListener("message", (event) => {
  if (!event.data.type || (event.data.type != "mainMessage")) return;

  let command = event.data.message.command;
  let data = event.data.message.data;

  if (command == 'watchForOTP') {
    console.log('Watching for OTP...');
    watchForOTP = true;
  }
  else if (command == 'stopWatchOTP') {
    console.log('Stopped watching for OTP.');
    watchForOTP = false;
  }

});

const observer = new MutationObserver(callback);
const config = { childList: true };

var targetNode = null;
const getElement = async () => {
  while (!targetNode) {
    targetNode = document.querySelector("mws-messages-list>mws-bottom-anchored>div>div>div.content");
    await timeout(200);
  }

  document.getElementById('msgStatus').style.background = '#0f0';

  observer.observe(targetNode, config);
}

getElement();
