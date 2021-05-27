class ui {
    constructor(optionsCallback) {
        this.toast = null;
        this.optionsCallback = optionsCallback;
        this.beneficiaries = null;
        this.attachEventListeners();
    }

    attachEventListeners() {
        var toastElList = [].slice.call(document.querySelectorAll('.toast'));
        var toastList = toastElList.map(function (toastEl) {
            return new bootstrap.Toast(toastEl, { delay: 2000 });
        });
        this.toast = toastList[0];

        var stateSelect = document.getElementById('stateSelect');

        stateSelect.addEventListener('change', () => {
            this.optionsCallback('getDistricts', document.getElementById('stateSelect').value);
        });

        var startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            let message = {
                state: parseInt(document.getElementById('stateSelect').value),
                district: parseInt(document.getElementById('districtSelect').value),
                beneficiary: document.getElementById('beneficiarySelect').value == "0" ? this.beneficiaries : [document.getElementById('beneficiarySelect').value],
                age: parseInt(document.getElementById('ageSelect').value),
                dose: parseInt(document.getElementById('doseSelect').value),
                slot: parseInt(document.getElementById('slotSelect').value),
                feeType: document.getElementById('paymentSelect').value,
                vaccineName: document.getElementById('vaccineSelect').value,
                frequency: parseInt(document.getElementById('rangeDuration').value),
                captcha: document.getElementById('captchaInput').value
            }

            this.optionsCallback('updateValue', message);
            this.optionsCallback('start', '');
            this.performCommand('startSuccess');
        });

        var stopButton = document.getElementById('stopButton');
        stopButton.addEventListener('click', () => {
            this.optionsCallback('stop', '');
            this.performCommand('stopSuccess');
        });
    }

    toastMessage(message) {
        document.getElementById('toastMessage').innerHTML = message;
        this.toast.show();
    }

    lockLogin(message) {
        document.getElementById('gMessage').setAttribute('disabled', '');
        document.getElementById('phoneNumber').setAttribute('disabled', '');
        document.getElementById('MPIN').setAttribute('disabled', '');
        document.getElementById('login').setAttribute('disabled', '');
        document.getElementById('loginText').innerText = message;
        document.getElementById('loginSpinner').classList.remove('d-none');
    }

    releaseLogin(message) {
        document.getElementById('gMessage').removeAttribute('disabled', '');
        document.getElementById('phoneNumber').removeAttribute('disabled', '');
        document.getElementById('MPIN').removeAttribute('disabled', '');
        document.getElementById('login').removeAttribute('disabled', '');
        document.getElementById('loginText').innerText = message;
        document.getElementById('loginSpinner').classList.add('d-none');
        this.toastMessage('<red>Failed to log in. Please retry.</red>');
    }

    loginComplete() {
        document.getElementById('loginForm').classList.add('d-none');
        document.getElementById('mainArea').classList.remove('d-none');
        this.toastMessage('Login successfull.');
    }

    performCommand(command, data) {
        if (command == "beneficiaries") {
            this.beneficiaries = [];
            let str = '<option value="0" selected>All</option>';
            data.forEach(element => {
                str += `<option value="${element.id}">${element.name}</option>`;
                this.beneficiaries.push(element.id);
            });
            document.getElementById("beneficiarySelect").innerHTML = str;
        }
        else if (command == "states") {
            let str = '';
            data.forEach(element => {
                str += `<option value="${element.state_id}">${element.state_name}</option>`;
            });
            document.getElementById("stateSelect").innerHTML = str;
        }
        else if (command == "districts") {
            let str = '';
            data.forEach(element => {
                str += `<option value="${element.district_id}">${element.district_name}</option>`;
            });
            document.getElementById("districtSelect").innerHTML = str;
        }
        else if (command == "startSuccess") {
            document.getElementById('stateSelect').setAttribute("disabled", "");
            document.getElementById('districtSelect').setAttribute("disabled", "");
            document.getElementById('beneficiarySelect').setAttribute("disabled", "");
            document.getElementById('ageSelect').setAttribute("disabled", "");
            document.getElementById('doseSelect').setAttribute("disabled", "");
            document.getElementById('slotSelect').setAttribute("disabled", "");
            document.getElementById('vaccineSelect').setAttribute("disabled", "");
            document.getElementById('paymentSelect').setAttribute("disabled", "");
            document.getElementById('captchaInput').setAttribute("disabled", "");
            document.getElementById('rangeDuration').setAttribute("disabled", "");
            document.getElementById('startButton').setAttribute("disabled", "");
            document.getElementById('stopButton').removeAttribute("disabled", "");
        }
        else if (command == "stopSuccess") {
            document.getElementById('stateSelect').removeAttribute("disabled", "");
            document.getElementById('districtSelect').removeAttribute("disabled", "");
            document.getElementById('beneficiarySelect').removeAttribute("disabled", "");
            document.getElementById('ageSelect').removeAttribute("disabled", "");
            document.getElementById('doseSelect').removeAttribute("disabled", "");
            document.getElementById('slotSelect').removeAttribute("disabled", "");
            document.getElementById('vaccineSelect').removeAttribute("disabled", "");
            document.getElementById('paymentSelect').removeAttribute("disabled", "");
            document.getElementById('captchaInput').removeAttribute("disabled", "");
            document.getElementById('rangeDuration').removeAttribute("disabled", "");
            document.getElementById('startButton').removeAttribute("disabled", "");
            document.getElementById('stopButton').setAttribute("disabled", "");
        }
        else if (command == "update") {
            document.getElementById('status').value = data.status;
            document.getElementById('lastUpdated').value = data.lastUpdated;
        }
        else if (command == "errorMessage") {
            if (data) {
                document.getElementById('autherr').classList.remove('d-none');
                document.getElementById('mainArea').classList.add('d-none');
            }
            else {
                document.getElementById('autherr').classList.add('d-none');
                document.getElementById('mainArea').classList.remove('d-none');
            }
        }
        else if (command == "captcha") {
            document.getElementById('captchaImage').setAttribute("src", data);
        }
        else if (command == "focusCaptcha") {
            document.getElementById('captchaInput').focus();
        }
        else if (command == "setData") {
            data.state && (document.getElementById('stateSelect').value = data.state);
            data.district && (document.getElementById('districtSelect').value = data.district);
            data.beneficiary && (document.getElementById('beneficiarySelect').value = data.beneficiary);
            data.age && (document.getElementById('ageSelect').value = data.age);
            data.dose && (document.getElementById('doseSelect').value = data.dose);
            data.slot && (document.getElementById('slotSelect').value = data.slot);
            data.feeType && (document.getElementById('paymentSelect').value = data.feeType);
            data.vaccineName && (document.getElementById('vaccineSelect').value = data.vaccineName);
            data.frequency && (document.getElementById('rangeDuration').value = data.frequency);
        }
    }
}