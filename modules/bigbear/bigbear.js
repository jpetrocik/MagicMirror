/* Magic Mirror
 * Module: HelloWorld
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("bigbear", {
	// Default module config.
	defaults: {
		type: "roads",
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		initialLoadDelay: 0
	},

	roadConditions: {},
	liftStatus: {},

	start: function () {
		this.sendSocketNotification("ADD_RESORT", {
			resort: "BigBearMountainResorts",
		});

		this.addFilters();
	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (notification == this.config.type) {
			if (notification === "lifts") {
				Log.log("New lift status information available for " + this.config.type + ".");
				this.liftStatus = payload;
				this.updateAvailable();
			}
			else {
				Log.log("New road condition information.");
				this.roadConditions = payload;
				this.updateAvailable();
			}
		}
	},

	getHeader: function () {
		switch (this.config.type) {
			case "roads":
				return "Road Conditions"
			default:
				return "";
			}
	},

	getTemplate: function () {
		switch (this.config.type.toLowerCase()) {
			case "lifts":
				return "lifts.njk"
			default:
				return "road.njk"
			}
	},

	getTemplateData: function () {
		switch (this.config.type.toLowerCase()) {
			case "lifts":
				return { liftStatus: this.liftStatus };
			default:
				return { roadConditions: this.roadConditions} ;
			}
	},

	updateAvailable: function () {
		this.updateDom(0);
	},

	addFilters() {
		this.nunjucksEnvironment().addFilter(
			"image",
			function (status) {
				switch (status){
					case "Open": 
						return "trail_status-02.png";
					case "Closed":
						return "trail_status-07.png";
					case "Expected":
						return "trail_status-14.png";
					case "Hold":
						return "trail_status-16.png";
					case "Maintenance":
						return "trail_status-12.png";
						case "Soon":
							return "trail_status-15.png";
						default:
						return status + ".png";
				}
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"logo",
			function (status) {
				switch (status){
					case "Bear Mountain": 
						return "bearmtn_sm.png";
					default:
						return "summit_sm.png";
				}
			}.bind(this)
		);

	}

});
