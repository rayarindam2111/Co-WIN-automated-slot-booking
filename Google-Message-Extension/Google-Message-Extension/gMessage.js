const mainWindow = window.opener;

const init = async () => {
  const timeout = function (time) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { resolve(time); }, time);
    });
  }

  window.addEventListener("beforeunload", (event) => {
    mainWindow.postMessage({
      type: "gMessage",
      message: {
        command: "gMessageWindowClosing",
        data: ""
      }
    }, "*");
    event.returnValue = "Do you really want to quit?";
    event.preventDefault();
  });

  window.addEventListener("unload", (event) => {
    mainWindow.postMessage({
      type: "gMessage",
      message: {
        command: "gMessageWindowClosed",
        data: ""
      }
    }, "*");
  });

  console.log('Google Messages vaccine extension loaded.');

  var watchForOTP = false;
  var alreadySentOTP = false;

  var targetNode = null;
  var loaded = false;

  const signalIcon = `<div id="msgStatus" style="
                      position: absolute;
                      top: 24px;
                      left: 24px;
                      width: 25px;
                      height: 25px;
                      background-color: #f00;
                      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAsFQTFRFAAAAZWYPEA8DZmkPDxADCwoCZ2kPHB0FAAAAbm8QJSUFHx8FGxwEWFsNDA0CCgoBGhsFCQgBHyAEU1YNDQ0CICAEHx8FU1UNJSUGAgMAFBUDDw8CFBMDCAcBCwsCAQEAIyIGQUIJFhYDERIDBwcBJCUFEhIDQ0QKJCUFExQDBgcBLzAHMzQITE0MNzgIOjoJDg4CCgoBHyAFGhsECAgAKSkFEBEDCgkBKywHMzQIFRUCW10NKioGIiIGEhIDCgkBKisHMzMICgkBCgoBHR0EFBQCDg8DKioHEhIDCAgBKSkHMjMHCQkBJycHODkHLC0GDg4CDQwCDQ0BVFUNIyMFAwMBEBADBgYBMDEIMTIHCwoBBwcBHRwEHyAEDQwDUlUMFRYDEA8DUFAMLS4GERIDNDYIKysHCwsBHBwELzAHQ0UKHh4EEBADVVYNGBkDDg4DU1UMDhACNjcIKywHCAgBLC0GEA8DVlUNFRYDExIDUVIMEREDNTQIKysHCAgBISEFHB0EQEEJHh4EDw8DVlcNGRkEERIDVFUMExQDAwQBNzYIOjsIFxYEJicGXl8PISIGCgsBVlYMLCsHBQUBNTYIOTsIBQQBJygGBwgBYWIOJCUFXV8PISIECQoBVVUMERECGBgEAwMAGRkEISAFXF0PHR0ECgsBVFYMOzsJFxcEQ0MKAgIBHh4FJSUGCAgBXl0PICEEXV8OQ0QKREQJBgUALC4GQkIJCwoBZ2kQGhsEVVYOQEEJICEFSEkLIiIFNDUHWFoNFRUDCwwBYWMPZWcQGRoEEhICISEFP0AKBAUBHR0EFxcDEREDXmANCQkBFBQDNjYIJCUFODkIAAAAY2QPXV4OBgYBICAFPD0JBwYBISIFNzcHRkcKDAwBBgYBDg0CEBECDw4CEBACKioHIyUGDw8CDhACQEIJDw8CEBADEBADKZHkggAAAOt0Uk5TABr/CH7/CDL/A4QmNzJ+/4X/HTbAlyQ3gf+O/0r/t/8zBm1L/1ZyOYFM/1ZiMGkNQvptdv8ZQvpsUsESdh1W+WxR9NKirvUeVf9rUftaIV4JuvkRfv9V/05T+PJqruYaufwTOFVNZ/BUJy+s7DfA+xNVTWf6Luw2v98VVU9m/kBXMKrsOL7eEjP/ZkO7kTmn9hog/2pC/2fPBpM4p/cYhcb/dLQ4p/cYK0lk/zCx/DinGChH/01j+RqpGBJlQkY0E831GAnR72ND/0/M7RnQ6FljOvYEF/RVK/+NSBTr/fyQ36pPXt+yF+CRnvz0kIEAAAGMSURBVHicY2DABRiZmHHKQQALKxt+BewcOFRwcnGDKB4OXj5+7CoEBIVA8sIMDCKC2FWIcogxcIgzMEhISkljk5eRlZNXANISHIoMSljklVVUGdQ41Bk0gPLYgKaWNpDU4dDV08cqb2BoBKaNTUyxypuZW1haWYNYNhy2WOTt7B0cnZxdQExXNxV3DHkPTy9vH18GP/8AhsCg4JBQdPmw8IjIqOgYhti4+ITEJAaGZDT5FJXUtPSMzKzsnNy8/AJM+wu1iopVSkoZssvKKyqrMOWrVWpq6+obGpuaW1rb2jHlOzq7ujl6GBh6Vfr6J0zElJ80ecrUadNnzJylMnvO3HlYAmD+AoaFixgYFqssWbpsORZ5hhXhK1etXrN23foNyzZik2fYtHnL1m2rt+/YuWwXVvndHHv2Lty3/8DBQ4exyh85ekzw+ImTp06fOYtVnuHceYYLHBcvXZ5xBbv81WvXb9y8dRu7JAjcuXvv/gPc0gy7Hz56/ASf/NNneGQJyz9/gV+e4eUr/PIASEp2QBmfKbkAAAAASUVORK5CYII=);
                      background-size: 60%;
                      z-index: 999999;
                      border-radius: 50%;
                      background-position: center;
                      background-repeat: no-repeat;">
                    </div>`;
  document.body.insertAdjacentHTML("beforeend", signalIcon);

  const processAndSendOTP = (sender, textOTP) => {
    let OTP = textOTP.split('CoWIN is ')[1].split(".")[0];
    console.log({ sender, textOTP, OTP });
    mainWindow.postMessage({
      type: "gMessage",
      message: {
        command: "OTP",
        data: OTP
      }
    }, "*");
  }

  const configNewMessage = { childList: true, subtree: true };
  const observerNewMessage = new MutationObserver((mutationsList) => {
    if (!watchForOTP || alreadySentOTP) return;

    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes[0]) {
        if (mutation.addedNodes[0].nodeName.toLowerCase() == "mws-conversation-list-item") {
          let base = mutation.addedNodes[0].firstElementChild.children[1];
          let sender = base.firstElementChild.textContent;
          if (sender.endsWith('NHPSMS')) {
            let textOTP = base.lastElementChild.textContent;
            processAndSendOTP(sender, textOTP);
            alreadySentOTP = true;
            break;
          }
        }
        else if (mutation.addedNodes[0].nodeName.toLowerCase() == "#text") {
          let curElem = mutation.addedNodes[0];
          let base = curElem.parentNode.parentNode.parentNode.parentNode;
          let headElement = base.parentNode.parentNode;
          if (headElement.nodeName.toLowerCase() == "mws-conversation-list-item") {
            let sender = base.firstElementChild.textContent;
            if (sender.endsWith('NHPSMS')) {
              let textOTP = curElem.data;
              processAndSendOTP(sender, textOTP);
              alreadySentOTP = true;
              break;
            }
          }
        }
      }
    }
  });

  const configPageChange = { subtree: true, childList: true };
  const observerPageChange = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      let removed = Array.from(mutation.removedNodes).some(parent => parent.contains(targetNode));
      if (removed) {
        observerPageChange.disconnect();
        observerNewMessage.disconnect();

        await waitForLoad();

        observerNewMessage.observe(targetNode, configNewMessage);
        observerPageChange.observe(document.body, configPageChange);

        console.log('Started re-observing.');

        break;
      }
    }
  });

  const waitForHeader = async () => {
    document.getElementById('msgStatus').style.left = '24px';

    let headerNode = null;
    let pageLoadEnd = false;
    while (!(headerNode && pageLoadEnd)) {
      headerNode = document.querySelector("mw-main-nav>div");
      pageLoadEnd = !document.querySelector("#loader");
      await timeout(100);
    }

    document.getElementById('msgStatus').style.left = '115px';
  }

  const waitForLoad = async () => {
    document.getElementById('msgStatus').style.backgroundColor = '#f00';

    targetNode = null;
    loaded = false;
    while (!(targetNode && loaded)) {
      targetNode = document.querySelector("mws-conversations-list>nav>div.conv-container");
      loaded = document.querySelector("mws-conversations-list>nav>mws-spinner") && document.querySelector("mws-conversations-list>nav>mws-spinner").classList.contains('hide');
      await timeout(200);
    }

    document.getElementById('msgStatus').style.backgroundColor = '#0f0';
  }

  await waitForHeader();
  await waitForLoad();

  observerNewMessage.observe(targetNode, configNewMessage);
  observerPageChange.observe(document.body, configPageChange);

  window.addEventListener("message", (event) => {
    if (!event.data.type || (event.data.type != "mainMessage")) return;

    let command = event.data.message.command;
    let data = event.data.message.data;

    if (command == 'watchForOTP') {
      console.log('Watching for OTP...');
      watchForOTP = true;
      alreadySentOTP = false;
    }
    else if (command == 'stopWatchOTP') {
      console.log('Stopped watching for OTP.');
      watchForOTP = false;
    }

  });
}

mainWindow && init();