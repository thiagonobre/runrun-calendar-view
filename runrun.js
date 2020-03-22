(function() {

	if (!window.ko) {
		var newScript = document.createElement("script");
		newScript.src = "https://knockoutjs.com/downloads/knockout-3.5.1.js";
		newScript.onload = makeItHappen;
		document.body.appendChild(newScript);
	} else {
		makeItHappen();
	}

	function CalendarViewModel() {

		var self = this;

		self.init = function(tasks) {

			self.taskPartSize = ko.observable(15);
			self.currentDay = ko.observable(new Date);
			self.dayStartHours = ko.observable(9);
			self.dayStartMinutes = ko.observable(0);
			self.businessHours = ko.observable(8);
			self.lunchDurationInMinutes = ko.observable(60);
			self.lunchStartHours = ko.observable(12);
			self.lunchStartMinutes = ko.observable(0);


			self.week = ko.computed(function() {
				return new Week(self.currentDay());
			});

			self.tasks = ko.observable(tasks.map(t => new Task(t)));

			// self.tasks(tasks);
		}
	}

	CalendarViewModel.getInstance = function() {
		CalendarViewModel.__instance__ = CalendarViewModel.__instance__ || new CalendarViewModel;
		return CalendarViewModel.__instance__;
	}

	function Week(date) {

		var self = this,
			calendar = CalendarViewModel.getInstance();

		self.businessStartDay = ko.observable(1); // monday
		self.businessEndDay = ko.observable(5); // friday

		var dayInMilis = 1000 * 60 * 60 * 24;
		var dateMilis = +date;
		var weekStart = new Date(+date - date.getDay() * dayInMilis);

		var days = [];

		for (var i = 0, j = 7; i < j; i++) {

			days.push(new Day(new Date(+weekStart + i * dayInMilis), self));

		}

		self.days = ko.observable(days);

		this.start = ko.observable(date);

	}

	function Day(date, week) {

		var self = this,
			calendar = CalendarViewModel.getInstance();

		self.start = ko.observable(date);
		self.start().setHours(calendar.dayStartHours());
		self.start().setMinutes(calendar.dayStartMinutes());
		self.start().setSeconds(0);

		self.lunchStart = ko.observable(new Date(date));
		self.lunchStart().setHours(calendar.lunchStartHours());
		self.lunchStart().setMinutes(calendar.lunchStartMinutes());

		self.lunchEnd = ko.pureComputed(function() {
			return new Date(+self.lunchStart() + calendar.lunchDurationInMinutes() * 60 * 1000);
		})

		var dayInMilis = ko.pureComputed(function() {
			return (calendar.businessHours() + calendar.lunchDurationInMinutes() / 60) * 60 * 60 * 1000;
		});

		self.end = ko.observable(new Date(+self.start() + dayInMilis()));

		var isHoliday = ko.observable(false);
		self.isBusinessDay = ko.pureComputed(function() {
			return !isHoliday() && self.start().getDay() >= week.businessStartDay() && self.start().getDay() <= week.businessEndDay();
		});

	}

	function Task(task) {

		var self = this,
			calendar = CalendarViewModel.getInstance();

		self.raw = ko.observable(task);

		if (task.desired_start_date) {
			self.start = ko.observable(new Date(task.desired_start_date));
		} else {
			self.start = ko.observable(new Date(+new Date(task.desired_date_with_time) - task.current_estimate_seconds * 1000));
		}

		self.end = ko.observable(new Date(task.desired_date_with_time));
		self.currentEstimateSeconds = ko.observable(task.current_estimate_seconds);

		self.parts = ko.pureComputed(function() {

			return (self.end() - self.start()) / (calendar.taskPartSize() * 60 * 1000);

		});

	}



	function makeItHappen() {

		fetch("https://runrun.it/api/tasks?limit=1&page=1&filter_id=85986&bypass_status_default=true&include_not_assigned=true&sort=board_stage_name&sort_dir=desc", {
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

			CalendarViewModel.getInstance().init(tasks);

			task = new Task(tasks[0]);

			console.log('done');

			window.calendar = CalendarViewModel.getInstance();

		});
	}

	mih = makeItHappen;


}());