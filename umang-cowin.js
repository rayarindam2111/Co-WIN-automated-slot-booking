let api_head = "https://app.umang.gov.in/t/negd.gov.in/umang";
let phoneNumber = "8334031994";
let mPin = "";

let umangData = await fetch(`${api_head}/coreapi/opn/ws2/openlgv1`, {
	"headers": {
		"accept": "application/json",
		"accept-language": "en-US,en",
		"authorization": "Bearer 02f6dd09-7573-3c7d-a9e7-7f0f429f9d50",
		"content-type": "application/json",
	},
	"body": JSON.stringify({
		lid: mPin,
		mno: phoneNumber,
		mod: "web",
		type: "mobm"
	}),
	"method": "POST",
});

let umangJSON = await umangData.json();
let umangToken = umangJSON.pd.tkn;
let umangUID = umangJSON.pd.generalpd.uid;

let generateTRKR = () => {
	const t = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"][Math.floor(26 * Math.random())] + ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"][Math.floor(26 * Math.random())] + (new Date).toISOString().slice(-24).replace(/\D/g, "").slice(0, 14); return `UW-${t}`;
}

let trkr = generateTRKR();

let tokenStr = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiI0YTVhMDc2ZS0wZjY5LTRlZWItODgyOC1kNGZlYzZmNjM0ZWIiLCJ1c2VyX2lkIjoiNGE1YTA3NmUtMGY2OS00ZWViLTg4MjgtZDRmZWM2ZjYzNGViIiwidXNlcl90eXBlIjoiQkVORUZJQ0lBUlkiLCJtb2JpbGVfbnVtYmVyIjo4MzM0MDMxOTk0LCJiZW5lZmljaWFyeV9yZWZlcmVuY2VfaWQiOjI0NjA5NjA3NjMxNzgwLCJzZWNyZXRfa2V5IjoiYjVjYWIxNjctNzk3Ny00ZGYxLTgwMjctYTYzYWExNDRmMDRlIiwic291cmNlIjoiY293aW4iLCJ1YSI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS85MC4wLjQ0MzAuMjEyIFNhZmFyaS81MzcuMzYiLCJkYXRlX21vZGlmaWVkIjoiMjAyMS0wNS0yNVQxMzowMDo1Ny40NjZaIiwiaWF0IjoxNjIxOTQ3NjU3LCJleHAiOjE2MjE5NDg1NTd9.8PAi8A8y_KYVoWYwMoDpFGujUu-vCiTTe3eRkPiw8gM";

let beneficiaries = await fetch(`${api_head}/depttapi/COWINApi/ws1/1.0/v2/beneficiaries`, {
	"headers": {
		"accept": "application/json",
		"accept-language": "en-US,en",
		"authorization": "Bearer 15974e40-bafd-316d-acef-8cdae0b0f7d5",
		"content-type": "application/json",
		/* begin UMANG required headers */
		"deptid": "355",
		"formtrkr": "0",
		"srvid": "1604",
		"subsid": "0",
		"subsid2": "0",
		"tenantid": ""
		/* end UMANG required headers */
	},
	"body": JSON.stringify({
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
		tkn: umangToken,
		trkr: trkr,
		usrid: umangUID,
		/* end UMANG params */

		/* begin Co-WIN params */
		token: tokenStr,
		/* end Co-WIN params */
	}),
	"method": "POST"
});

let appointment = await fetch(`${api_head}/depttapi/COWINApi/ws1/1.0/v2/scheduleappointment`, {
	"headers": {
		"accept": "application/json",
		"accept-language": "en-US,en",
		"authorization": "Bearer 15974e40-bafd-316d-acef-8cdae0b0f7d5",
		"content-type": "application/json",
		/* begin UMANG required headers */
		"deptid": "355",
		"formtrkr": "0",
		"srvid": "1604",
		"subsid": "0",
		"subsid2": "0",
		"tenantid": ""
		/* end UMANG required headers */
	},
	"body": JSON.stringify({
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
		tkn: umangToken,
		trkr: trkr,
		usrid: umangUID,
		/* end UMANG params */

		/* begin Co-WIN params */
		token: tokenStr,
		beneficiaries: ["24609607631780"],
		session_id: "b6e1d482-2567-40c6-a759-efafc1494867",
		slot: "09:00AM-6:00PM"
		/* end Co-WIN params */
	}),
	"method": "POST"
});