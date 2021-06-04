const xhrReq = async function (method, url, data, header) {
	let dat = null;
	if (method == "POST") {
		dat = await axios.post(url, data, { headers: header });
		if (dat.data.rc && parseInt(dat.data.rc) >= 400) {
			throw `Network Error: ${dat.data.rc}`;
		}
		return dat.data;
	}
	else if (method == "GET") {
		dat = await axios.get(url, { headers: header });
		if (dat.data.rc && parseInt(dat.data.rc) >= 400) {
			throw `Network Error: ${dat.data.rc}`;
		}
		return dat.data;
	}
}

const LOGIN_TIMEOUT = 40;

class umangWorker {

	constructor() {
		this.apiHead = 'https://app.umang.gov.in/t/negd.gov.in/umang';
		this.loginBearer = '02f6dd09-7573-3c7d-a9e7-7f0f429f9d50';
		this.dataBearer = '15974e40-bafd-316d-acef-8cdae0b0f7d5';
		this.phoneNumber = null;
		this.mPin = null;
		this.umangToken = null;
		this.umangUID = null;

		this.cowinToken = null;

		this.beneficiaries = null;
		this.aptData = null;
		this.trkr = null;

		this.txnIDCowin = null;
		this.OTPCowin = null;
		this.calendarData = null;

		this.bookingSlotNow = false;
	}

	dateStr(dateVal) {
		let date = new Date(dateVal);

		let day = String(date.getDate()).padStart(2, '0');
		let month = String(date.getMonth() + 1).padStart(2, '0');
		let year = date.getFullYear();

		return `${day}-${month}-${year}`;
	}

	generateTRKR() {
		return `UW-${"abcdefghijklmnopqrstuvwxyz"
			.split("")
			.sort(() => Math.random() - Math.random())
			.slice(0, 2)
			.join("")
			.toUpperCase()
			.replace(/^(.)/g, (c) => c.toLowerCase())
			}${new Date()
				.toISOString()
				.slice(-24)
				.replace(/\D/g, "")
				.slice(0, 14)
			}`;
	}

	getHeader(authType) {
		let header = {
			"accept": "application/json",
			"content-type": "application/json"
		};

		return authType == 'login' ?
			{
				...header,
				"authorization": `Bearer ${this.loginBearer}`
			} :
			{
				...header,
				"authorization": `Bearer ${this.dataBearer}`,
				"deptid": "355",
				"formtrkr": "0",
				"srvid": "1604",
				"subsid": "0",
				"subsid2": "0",
				"tenantid": ""
			};
	}

	setCowinToken(token) {
		this.cowinToken = token;
	}

	async login(phoneNumber, mPin) {
		this.phoneNumber = phoneNumber;
		this.mPin = mPin;

		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/coreapi/opn/ws2/openlgv1`,
			{
				lid: this.mPin,
				mno: this.phoneNumber,
				mod: "web",
				type: "mobm"
			},
			this.getHeader('login')
		);

		this.umangToken = fetchData.pd.tkn;
		this.umangUID = fetchData.pd.generalpd.uid;

		this.trkr = this.generateTRKR();
	}

	async generateOTPCowin() {
		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/generateOTP`,
			{
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				formtrkr: "0",
				lang: "en",
				language: "en",
				mode: "web",
				pltfrm: "windows",
				srvid: "1604",
				subsid: "0",
				subsid2: "0",
				/* end random params: might not need all of these, not tested */

				/* begin UMANG params */
				tkn: this.umangToken,
				trkr: this.trkr,
				usrid: this.umangUID,
				/* end UMANG params */

				mobile: this.phoneNumber
			},
			this.getHeader('data')
		);

		this.txnIDCowin = fetchData.pd.txnId;
	}

	async confirmOTPCowin(OTP) {
		this.OTPCowin = OTP;

		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/confirmOTP`,
			{
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				formtrkr: "0",
				lang: "en",
				language: "en",
				mode: "web",
				pltfrm: "windows",
				srvid: "1604",
				subsid: "0",
				subsid2: "0",
				/* end random params: might not need all of these, not tested */

				/* begin UMANG params */
				tkn: this.umangToken,
				trkr: this.trkr,
				usrid: this.umangUID,
				/* end UMANG params */

				otp: this.OTPCowin,
				txnId: this.txnIDCowin
			},
			this.getHeader('data')
		);

		this.cowinToken = fetchData.pd.token;
	}

	async loginCowin(waitForOTP, resolvePromise) {
		await this.generateOTPCowin();
		let timeOutOTP = setTimeout(() => { resolvePromise.receivedOTP('000000') }, LOGIN_TIMEOUT * 1000);
		let OTP = await waitForOTP;
		clearTimeout(timeOutOTP);
		console.log('OTP received:', OTP);
		await this.confirmOTPCowin(OTP);
	}

	async getCalendarList(method, id, dateString) {
		let endpoint = null;
		let payload = null;
		if (method == 'stateAndDistrict') {
			endpoint = 'calendarByDistrict';
			payload = { district_id: id };
		}
		else if (method == 'pinCode') {
			endpoint = 'calendarByPin';
			payload = { pincode: id.toString() };
		}

		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/${endpoint}`,
			{
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				formtrkr: "0",
				lang: "en",
				language: "en",
				mode: "web",
				pltfrm: "windows",
				srvid: "1604",
				subsid: "0",
				subsid2: "0",
				/* end random params: might not need all of these, not tested */

				/* begin UMANG params */
				tkn: this.umangToken,
				trkr: this.trkr,
				usrid: this.umangUID,
				/* end UMANG params */

				...payload,
				token: this.cowinToken,
				date: this.dateStr(dateString),
				vaccine: ""
			},
			this.getHeader('data')
		);

		this.calendarData = fetchData.pd;

		return this.calendarData;
	}

	async getBeneficiaryList() {
		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/beneficiaries`,
			{
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				formtrkr: "0",
				lac: "0",
				lang: "en",
				language: "en",
				lat: "0",
				lon: "0",
				mode: "web",
				pltfrm: "windows",
				srvid: "1604",
				subsid: "0",
				subsid2: "0",
				usag: "0",
				/* end random params: might not need all of these, not tested */

				/* begin UMANG params */
				tkn: this.umangToken,
				trkr: this.trkr,
				usrid: this.umangUID,
				/* end UMANG params */

				/* begin Co-WIN params */
				token: this.cowinToken,
				/* end Co-WIN params */
			},
			this.getHeader('data')
		);

		let bList = fetchData.pd;
		let b_ids = [];

		bList.beneficiaries.forEach(elem => {
			if (elem.vaccination_status == "Not Vaccinated" || elem.vaccination_status == "Partially Vaccinated")
				b_ids.push({ id: elem.beneficiary_reference_id, name: elem.name });
		});

		this.beneficiaries = b_ids;

		return this.beneficiaries;
	}

	async bookSlot(sessionID, beneficiaries, doseNumber, slotTime) {
		if (this.bookingSlotNow)
			return;

		try {
			this.bookingSlotNow = true;

			let packData = {
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				formtrkr: "0",
				lac: "0",
				lang: "en",
				language: "en",
				lat: "0",
				lon: "0",
				mode: "web",
				pltfrm: "windows",
				srvid: "1604",
				subsid: "0",
				subsid2: "0",
				usag: "0",
				/* end random params: might not need all of these, not tested */

				/* begin UMANG params */
				tkn: this.umangToken,
				trkr: this.trkr,
				usrid: this.umangUID,
				/* end UMANG params */

				/* begin Co-WIN params */
				token: this.cowinToken,
				beneficiaries: beneficiaries,
				session_id: sessionID,
				slot: slotTime,
				dose: doseNumber
				/* end Co-WIN params */
			};

			console.log("Data:", packData);

			let fetchData = await xhrReq(
				'POST',
				`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/scheduleappointment`,
				packData,
				this.getHeader('data')
			);

			this.aptData = fetchData.pd;

			this.bookingSlotNow = false;

			return this.aptData;
		} catch (err) {
			this.bookingSlotNow = false;
		}
	}

	async downloadCert(appointment_id, fileName) {
		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/downloadAppointmentSlip`,
			{
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				formtrkr: "0",
				lang: "en",
				language: "en",
				mode: "web",
				pltfrm: "windows",
				srvid: "1604",
				subsid: "0",
				subsid2: "0",
				/* end random params: might not need all of these, not tested */

				/* begin UMANG params */
				tkn: this.umangToken,
				trkr: this.trkr,
				usrid: this.umangUID,
				/* end UMANG params */

				/* begin Co-WIN params */
				token: this.cowinToken,
				appointment_id: appointment_id,
				/* end Co-WIN params */
			},
			this.getHeader('data')
		);

		let b64String = "data:application/pdf;base64," + fetchData.pd;

		const link = document.createElement('a');
		link.href = b64String;
		link.download = fileName;
		document.body.append(link);
		link.click();
		link.remove();
	}
}

class cowinWorker {

	constructor() {
		this.secret = "U2FsdGVkX19mD56KTNfQsZgXJMwOG7u/6tuj0Qvil1LEjx783oxHXGUTDWYm+XMYVGXPeu+a24sl5ndEKcLTUQ==";
		//this.secret = "U2FsdGVkX19FiwwDY6Mfv0CASsezxTOUT9bemE+bW2QvQUJVwc58pyvUKWzcjMnDuRGo/sp26Y/hzgE/4ZBa6A==";
		this.apiHead = "https://cdn-api.co-vin.in/api/v2";
		this.phoneNumber = null;
		this.txnID = null;
		this.OTP = null;
		this.token = null;

		this.stateData = null;
		this.districtData = null;
		this.beneficiaries = null;
		this.calendarData = null;
		this.captcha = null;
		this.aptData = null;
	}

	getHeader(includeAuth) {
		let header = {
			"accept": "application/json",
			"content-type": "application/json"
		};
		return includeAuth ? { ...header, "authorization": `Bearer ${this.token}` } : header;
	}

	dateStr(dateVal) {
		let date = new Date(dateVal);

		let day = String(date.getDate()).padStart(2, '0');
		let month = String(date.getMonth() + 1).padStart(2, '0');
		let year = date.getFullYear();

		return `${day}-${month}-${year}`;
	}

	getToken() {
		return this.token;
	}

	setToken(token) {
		this.token = token;
	}

	async digestMessage(message) {
		const msgUint8 = new TextEncoder().encode(message);
		const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex;
	}

	async login(phoneNumber, waitForOTP, resolvePromise) {
		await this.generateOTP(phoneNumber);
		let timeOutOTP = setTimeout(() => { resolvePromise.receivedOTP('000000') }, LOGIN_TIMEOUT * 1000);
		let OTP = await waitForOTP;
		clearTimeout(timeOutOTP);
		console.log('OTP received:', OTP);
		await this.confirmOTP(OTP);
	}

	async generateOTP(phoneNumber) {
		this.phoneNumber = phoneNumber;

		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/auth/generateMobileOTP`,
			{
				"mobile": this.phoneNumber,
				"secret": this.secret
			},
			this.getHeader(false)
		);

		this.txnID = fetchData.txnId;
	}

	async confirmOTP(OTP) {
		this.OTP = OTP;

		let otpSHA = await this.digestMessage(this.OTP);

		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/auth/validateMobileOtp`,
			{
				"otp": otpSHA,
				"txnId": this.txnID
			},
			this.getHeader(false)
		);

		this.token = fetchData.token;
	}

	async getStateList() {
		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/admin/location/states`,
			{},
			this.getHeader(false)
		);

		this.stateData = fetchData.states;

		return this.stateData;
	}

	async getDistrictList(stateID) {
		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/admin/location/districts/${stateID}`,
			{},
			this.getHeader(false)
		);

		this.districtData = fetchData.districts;

		return this.districtData;
	}

	async getBeneficiaryList() {
		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/appointment/beneficiaries`,
			{},
			this.getHeader(true)
		);

		let bList = fetchData;
		let b_ids = [];

		bList.beneficiaries.forEach(elem => {
			if (elem.vaccination_status == "Not Vaccinated" || elem.vaccination_status == "Partially Vaccinated")
				b_ids.push({ id: elem.beneficiary_reference_id, name: elem.name });
		});

		this.beneficiaries = b_ids;

		return this.beneficiaries;
	}

	async getCalendarList(districtID, dateString) {

		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/appointment/sessions/calendarByDistrict?district_id=${districtID}&date=${this.dateStr(dateString)}`,
			{},
			this.getHeader(true)
		);

		this.calendarData = fetchData;

		return this.calendarData;
	}

	async getCaptcha() {
		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/auth/getRecaptcha`,
			{},
			this.getHeader(true)
		);

		this.captcha = fetchData;

		return this.captcha;
	}

	async bookSlot(sessionID, centerID, beneficiaries, doseNumber, slotTime, captcha) {

		let packData = {
			"center_id": centerID,
			"session_id": sessionID,
			"beneficiaries": beneficiaries,
			"slot": slotTime,
			"captcha": captcha,
			"dose": doseNumber
		};
		console.log("Data:", packData);

		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/appointment/schedule`,
			packData,
			this.getHeader(true)
		);

		this.aptData = fetchData;

		return this.aptData;

	}
}

class otpWorker {

	constructor() {
		this.otpPromise = null;
	}

	waitForOTP() {
		return new Promise((inner_res) => {
			this.otpPromise = inner_res;
		});
	}

	receivedOTP(OTP) {
		this.otpPromise(OTP);
	}
}
