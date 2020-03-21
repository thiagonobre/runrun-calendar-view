(function() {

	var newScript = document.createElement("script");
	newScript.src = "https://knockoutjs.com/downloads/knockout-3.5.1.js";
	newScript.onload = makeItHappen;
	document.body.appendChild(newScript);

	function CalendarViewModel() {

		var self = this;

		self.weekStartDay = ko.observable(1); // monday
		self.weekEndDay = ko.observable(5); // friday
		self.taskPartSize = ko.observable(15);
		self.dayStartHour = ko.observable(9);
		self.dayStartMinute = ko.observable(0);
		self.tasks = ko.observableArray();
		self.currentDay = ko.observable(new Date);
		self.week = ko.computed(function() {
			return new Week(self.currentDay());
		})

		self.init = function(tasks) {
			self.tasks(tasks);
		}
	}

	CalendarViewModel.getInstance = function() {
		CalendarViewModel.__instance__ = CalendarViewModel.__instance__ || new CalendarViewModel;
		return CalendarViewModel.__instance__;
	}

	function Week(date) {

		var self = this, calendar = CalendarViewModel.getInstance();

		var dateMilis = +date;
		// var week

		this.start = ko.observable(date);

	}

	function Day(date) {

		var self = this, calendar = CalendarViewModel.getInstance();

		this.date = ko.observable(date);

	}

	function Task(task) {

		var self = this, calendar = CalendarViewModel.getInstance();

		self.raw = ko.observable(task);

		self.start = ko.observable(new Date(task.desired_start_date));
		self.end = ko.observable(new Date(task.desired_date_with_time));
		self.currentEstimateSeconds = ko.observable(task.current_estimate_seconds);

		self.parts = ko.pureComputed(function(){

			return self.currentEstimateSeconds() / (calendar.taskPartSize() * 60);

		});

	}



	function makeItHappen() {

		fetch("https://runrun.it/api/tasks?limit=1&page=1&filter_id=85986&bypass_status_default=true&include_not_assigned=true&sort=desired_start_date&sort_dir=desc", {
			"credentials": "include",
			"headers": {
				"accept": "application/json, text/javascript, */*; q=0.01",
				"accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
				"if-none-match": "\"f5c8b35f17ee1ae405f171e50df1f9ec\"",
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"x-requested-with": "XMLHttpRequest"
			},
			"referrerPolicy": "no-referrer-when-downgrade",
			"body": null,
			"method": "GET",
			"mode": "cors"
		}).then((r) => r.json()).then((tasks) => {

			CalendarViewModel.getInstance().init(tasks.map(t => new Task(t)));

			task = new Task(tasks[0]);

			console.log(task.parts());

			window.CalendarViewModel = CalendarViewModel;

		});
	}


}());