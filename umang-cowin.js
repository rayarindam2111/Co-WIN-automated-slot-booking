let xhrReq = async function (method, url, data, header) {
	let dat = null;
	if (method == "POST") {
		dat = await axios.post(url, data, { headers: header });
		return dat.data;
	}
	else if (method == "GET") {
		dat = await axios.get(url, { headers: header });
		return dat.data;
	}
}

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
	}

	generateTRKR() {
		return `UW-${["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"][Math.floor(26 * Math.random())] + ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"][Math.floor(26 * Math.random())] + (new Date).toISOString().slice(-24).replace(/\D/g, "").slice(0, 14)}`;
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
	}

	async getBeneficiaries() {
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
				trkr: this.generateTRKR(),
				usrid: this.umangUID,
				/* end UMANG params */

				/* begin Co-WIN params */
				token: this.cowinToken,
				/* end Co-WIN params */
			},
			this.getHeader('data')
		);

		this.beneficiaries = fetchData.pd.beneficiaries
		return this.beneficiaries;
	}

	async scheduleAppointment(beneficiaryList, sessionID, slotTime) {
		let fetchData = await xhrReq(
			'POST',
			`${this.apiHead}/depttapi/COWINApi/ws1/1.0/v2/scheduleappointment`,
			{
				/* begin random params: might not need all of these, not tested */
				deptid: "355",
				did: null,
				dose: 1,
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
				trkr: this.generateTRKR(),
				usrid: this.umangUID,
				/* end UMANG params */

				/* begin Co-WIN params */
				token: this.cowinToken,
				beneficiaries: beneficiaryList,
				session_id: sessionID,
				slot: slotTime
				/* end Co-WIN params */
			},
			this.getHeader('data')
		);

		this.aptData = fetchData.pd;

		return this.aptData;
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

	async digestMessage(message) {
		const msgUint8 = new TextEncoder().encode(message);
		const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex;
	}

	async login(phoneNumber, waitForOTP) {
		await this.generateOTP(phoneNumber);
		let OTP = await waitForOTP;
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

	async stateList() {
		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/admin/location/states`,
			{},
			this.getHeader(true)
		);

		this.stateData = fetchData.states;

		return this.stateData;
	}

	async districtList(stateID) {
		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/admin/location/districts/${stateID}`,
			{},
			this.getHeader(true)
		);

		this.districtData = fetchData.districts;

		return this.districtData;
	}

	async beneficiaryList() {
		let fetchData = await xhrReq(
			'GET',
			`${this.apiHead}/appointment/beneficiaries`,
			{},
			this.getHeader(true)
		);

		let bList = fetchData;
		let b_ids = [];

		bList.beneficiaries.forEach(elem => {
			if (elem.vaccination_status == "Not Vaccinated")
				b_ids.push({ id: elem.beneficiary_reference_id, name: elem.name });
		});

		this.beneficiaries = b_ids;

		return this.beneficiaries;
	}

	async calendarList(districtID, dateString) {

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

	async bookSlot(sessionID, centerID, beneficiaries, dose, vaccineSlot, captcha) {

		let packData = {
			"center_id": centerID,
			"session_id": sessionID,
			"beneficiaries": beneficiaries,
			"slot": vaccineSlot,
			"captcha": captcha,
			"dose": dose
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
