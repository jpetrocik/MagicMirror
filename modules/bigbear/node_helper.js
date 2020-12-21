
const NodeHelper = require("node_helper");
const Log = require("../../js/logger");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { DOMParser } = require('xmldom')

module.exports = NodeHelper.create({

	url: "https://www.bigbearmountainresort.com/Feeds/Xml/Mtn/v2.ashx?Resort=BigBearMountainResorts",

	start: function () {
		Log.log("Starting node helper for: " + this.name);
		this.fetchResortInfo();

		setInterval(() => {
			this.fetchResortInfo()
		}, 5 * 60 * 1000)
	},

	socketNotificationReceived: function (notification, payload) {
		this.broadcastFeeds();
	},

	setRoadConditions: function (roadConditions) {
		this.roadConditions = roadConditions;
	},

	setLiftConditions: function (liftConditions) {
		this.liftConditions = liftConditions;
	},

	generateRoadConditions(currentResortInfo) {
		let currentRoadConditions = {};

		let allRoads = currentResortInfo.getElementsByTagName("roads").item(0).getElementsByTagName("road");

		for (let i = 0; i < allRoads.length; i++) {
			let road = allRoads.item(i);
			currentRoadConditions[road.getAttribute("name")] = road.getAttribute("status");
		}

		return currentRoadConditions;
	},

	generateLiftConditions(currentResortInfo) {
		let currentLiftStatus = {};

		let allFacilities = currentResortInfo.getElementsByTagName("facility");

		for (let i = 0; i < allFacilities.length; i++) {
			let facility = allFacilities.item(i);
			if (facility.getAttribute("season") == "winter") {
				let allLifts = currentResortInfo.getElementsByTagName("lift");
				for (let j = 0; j < allLifts.length; j++) {
					let lift = allLifts.item(j);
					let areaName = lift.getAttribute("areaName");
					if (!currentLiftStatus[areaName]) {
						currentLiftStatus[areaName] = {};
					}

					currentLiftStatus[areaName][lift.getAttribute("name")] = lift.getAttribute("status");
				}
			}
		}

		return currentLiftStatus;
	},

	fetchResortInfo() {
		Log.log("Fetching resort information");
		this.fetchData(this.url)
			.then((data) => {
				if (!data) {
					return;
				}

				let roadConditions = this.generateRoadConditions(data);
				this.setRoadConditions(roadConditions);

				let liftConditions = this.generateLiftConditions(data);
				this.setLiftConditions(liftConditions);

			})
			.catch(function (request) {
				Log.error("Could not load data ... ", request);
			})
			.finally(() => this.broadcastFeeds());

	},

	fetchData: function (url, method = "GET", data = null) {
		return new Promise(function (resolve, reject) {
			var request = new XMLHttpRequest();
			request.open(method, url, true);
			request.onreadystatechange = function () {
				if (this.readyState === 4) {
					if (this.status === 200) {
						const parser = new DOMParser();
						let responseXML = parser.parseFromString(this.responseText, "application/xml");
						resolve(responseXML);
					} else {
						reject(request);
					}
				}
			};
			request.responseType = "document"
			request.send();
		});
	},

	broadcastFeeds: function () {
		this.sendSocketNotification("roads", this.roadConditions);
		this.sendSocketNotification("lifts", this.liftConditions);
	}
});
