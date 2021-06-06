class ui {
    constructor(optionsCallback) {
        this.toast = null;
        this.optionsCallback = optionsCallback;
        this.beneficiaries = { id: [], name: [] };
        this.beneficiaryModal = null;
        this.selectedBeneficiaries = [];
        this.datePicker = null;
        this.selectAreaOption = 'stateAndDistrict';

        this.attachEventListeners();
    }

    attachEventListeners() {
        let toastElList = [].slice.call(document.querySelectorAll('.toast'));
        let toastList = toastElList.map(function (toastEl) {
            return new bootstrap.Toast(toastEl, { delay: 2000 });
        });
        this.toast = toastList[0];

        this.beneficiaryModal = new bootstrap.Modal(document.getElementById('beneficiaryModal'));

        let datePicker = document.getElementById('dateRangePicker');
        this.datePicker = new DateRangePicker(datePicker, {
            buttonClass: 'btn',
            autohide: true,
            clearBtn: true,
            todayBtn: true,
            todayHighlight: true,
            todayBtnMode: 1,
            allowOneSidedRange: true,
            format: 'dd MM yyyy'
        });
        this.datePicker.setDates('today', { clear: true });

        let stateOrPinSelect = document.querySelectorAll('input[name=stateOrPIN]');
        stateOrPinSelect.forEach((elem) => {
            elem.addEventListener('click', () => {
                this.changeAreaSelect(elem.value);
                if (elem.value != 'pinCode')
                    document.getElementById('pinSelect').classList.remove('is-invalid');
            });
        });

        let stateSelect = document.getElementById('stateSelect');
        stateSelect.addEventListener('change', () => {
            this.optionsCallback('getDistricts', document.getElementById('stateSelect').value);
        });

        let pinCodeSelect = document.getElementById('pinSelect');
        pinCodeSelect.addEventListener('input', (e) => {
            (! /^[1-9]\d{5}$/.test(e.target.value.trim())) ? e.target.classList.add('is-invalid') : e.target.classList.remove('is-invalid');
        });

        let beneficiarySelect = document.getElementById('beneficiarySelect');
        beneficiarySelect.addEventListener('change', () => {
            if (document.getElementById('beneficiarySelect').value == "custom") {
                let str = '';
                for (let i = 0; i < this.beneficiaries.id.length; i++) {
                    str += `
                    <div class="form-check col-5 offset-1">
                        <input class="form-check-input" type="checkbox" value="${this.beneficiaries.id[i]}" id="benCheck${i}" checked>
                        <label class="form-check-label" for="benCheck${i}">${this.beneficiaries.name[i]}</label>
                    </div>
                    `;
                }
                document.getElementById('beneficiaryCheckboxes').innerHTML = str;
                this.beneficiaryModal.show();
            }
        });

        let beneficiaryModalOk = document.getElementById('beneficiaryModalOk');
        beneficiaryModalOk.addEventListener('click', () => {
            let checks = document.querySelectorAll('#beneficiaryCheckboxes>div.form-check>input.form-check-input');
            this.selectedBeneficiaries = [];
            for (let i = 0; i < checks.length; i++) {
                if (checks[i].checked)
                    this.selectedBeneficiaries.push(checks[i].value);
            }
            this.beneficiaryModal.hide();
        });

        let startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            let beneficiariestoSend = document.getElementById('beneficiarySelect').value;
            if (beneficiariestoSend == "0")
                beneficiariestoSend = this.beneficiaries.id;
            else if (beneficiariestoSend == "custom")
                beneficiariestoSend = this.selectedBeneficiaries;
            else
                beneficiariestoSend = [beneficiariestoSend];

            let datesSelected = this.datePicker.getDates('dd-mm-yyyy');
            let date = { start: datesSelected[0], end: datesSelected[1] };

            let message = {
                state: parseInt(document.getElementById('stateSelect').value),
                district: parseInt(document.getElementById('districtSelect').value),
                pincode: parseInt(document.getElementById('pinSelect').value.trim() || -1),
                selectAreaOption: this.selectAreaOption,
                beneficiary: beneficiariestoSend,
                age: parseInt(document.getElementById('ageSelect').value),
                dose: parseInt(document.getElementById('doseSelect').value),
                slot: parseInt(document.getElementById('slotSelect').value),
                feeType: document.getElementById('paymentSelect').value,
                vaccineName: document.getElementById('vaccineSelect').value,
                frequency: parseInt(document.getElementById('rangeDuration').value),
                captcha: document.getElementById('captchaInput').value,
                date: date
            }

            this.optionsCallback('updateValue', message);
            this.optionsCallback('start', '');
            this.performCommand('startSuccess');
        });

        let stopButton = document.getElementById('stopButton');
        stopButton.addEventListener('click', () => {
            this.optionsCallback('stop', '');
            this.performCommand('stopSuccess');
        });
    }

    changeAreaSelect(value) {
        if (value == 'stateAndDistrict') {
            document.getElementById('pinSelect').setAttribute('disabled', '');
            document.getElementById('stateSelect').removeAttribute('disabled', '');
            document.getElementById('districtSelect').removeAttribute('disabled', '');
        }
        else if (value == 'pinCode') {
            document.getElementById('stateSelect').setAttribute('disabled', '');
            document.getElementById('districtSelect').setAttribute('disabled', '');
            document.getElementById('pinSelect').removeAttribute('disabled', '');
        }
        document.querySelector(`input[value=${value}]`).checked = true;
        this.selectAreaOption = value;
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
    }

    performCommand(command, data) {
        if (command == "beneficiaries") {
            this.beneficiaries = { id: [], name: [] };
            let str = '<option value="0" selected>All</option>';
            data.forEach(element => {
                str += `<option value="${element.id}">${element.name}</option>`;
                this.beneficiaries.id.push(element.id);
                this.beneficiaries.name.push(element.name);
            });
            str += `<option value="custom">Custom</option>`;
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
            document.getElementById('pinSelect').setAttribute('disabled', '');
            document.querySelectorAll('input[name=stateOrPIN]').forEach(elem => elem.setAttribute("disabled", ""));
            document.getElementById('beneficiarySelect').setAttribute("disabled", "");
            document.getElementById('ageSelect').setAttribute("disabled", "");
            document.getElementById('doseSelect').setAttribute("disabled", "");
            document.getElementById('slotSelect').setAttribute("disabled", "");
            document.getElementById('vaccineSelect').setAttribute("disabled", "");
            document.getElementById('paymentSelect').setAttribute("disabled", "");
            document.getElementById('captchaInput').setAttribute("disabled", "");
            document.getElementById('rangeDuration').setAttribute("disabled", "");
            document.getElementById('startButton').setAttribute("disabled", "");
            document.getElementById('dateFromSelect').setAttribute("disabled", "");
            document.getElementById('dateToSelect').setAttribute("disabled", "");

            document.querySelector('#lastUpdated>div.spinner-border').classList.remove('d-none');

            document.querySelector('#status>span.textData').innerText = '-';
            document.querySelector('#lastUpdated>span.textData').innerText = '-';
            document.getElementById('status').style.backgroundColor = '#e9ecef';


            document.getElementById('stopButton').removeAttribute("disabled", "");
        }
        else if (command == "stopSuccess") {
            document.getElementById('stateSelect').removeAttribute("disabled", "");
            document.getElementById('districtSelect').removeAttribute("disabled", "");
            document.getElementById('pinSelect').removeAttribute('disabled', '');
            document.querySelectorAll('input[name=stateOrPIN]').forEach(elem => elem.removeAttribute("disabled", ""));
            document.getElementById('beneficiarySelect').removeAttribute("disabled", "");
            document.getElementById('ageSelect').removeAttribute("disabled", "");
            document.getElementById('doseSelect').removeAttribute("disabled", "");
            document.getElementById('slotSelect').removeAttribute("disabled", "");
            document.getElementById('vaccineSelect').removeAttribute("disabled", "");
            document.getElementById('paymentSelect').removeAttribute("disabled", "");
            document.getElementById('captchaInput').removeAttribute("disabled", "");
            document.getElementById('rangeDuration').removeAttribute("disabled", "");
            document.getElementById('startButton').removeAttribute("disabled", "");
            document.getElementById('dateFromSelect').removeAttribute("disabled", "");
            document.getElementById('dateToSelect').removeAttribute("disabled", "");

            document.querySelector('#lastUpdated>div.spinner-border').classList.add('d-none');

            this.changeAreaSelect(this.selectAreaOption);

            document.getElementById('stopButton').setAttribute("disabled", "");
        }
        else if (command == "update") {
            document.querySelector('#status>span.textData').innerText = data.status;
            document.getElementById('status').style.backgroundColor = data.status.startsWith('Booked') ? '#3fe03f' : '#e9ecef';
            document.querySelector('#lastUpdated>span.textData').innerText = data.lastUpdated;
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
            let benValue = data.beneficiary && (data.beneficiary != -1) && ((data.beneficiary.length == 0 || data.beneficiary.length > 1) ? '0' : data.beneficiary[0]);
            data.state && (data.state != -1) && (document.getElementById('stateSelect').value = data.state);
            data.district && (data.district != -1) && (document.getElementById('districtSelect').value = data.district);
            data.pincode && (data.pincode != -1) && (document.getElementById('pinSelect').value = data.pincode);
            data.selectAreaOption && this.changeAreaSelect(data.selectAreaOption);
            data.beneficiary && (data.beneficiary != -1) && (document.getElementById('beneficiarySelect').value = benValue);
            data.age && (data.age != -1) && (document.getElementById('ageSelect').value = data.age);
            data.dose && (data.dose != -1) && (document.getElementById('doseSelect').value = data.dose);
            data.slot && (data.slot != -1) && (document.getElementById('slotSelect').value = data.slot);
            data.feeType && (data.feeType != -1) && (document.getElementById('paymentSelect').value = data.feeType);
            data.vaccineName && (data.vaccineName != -1) && (document.getElementById('vaccineSelect').value = data.vaccineName);
            data.frequency && (data.frequency != -1) && (document.getElementById('rangeDuration').value = data.frequency);
            data.date && this.datePicker.setDates(data.date.start || 'today', data.date.end || { clear: true });
        }
    }
}