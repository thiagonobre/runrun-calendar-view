(function() {

	function CalendarViewModel() {

		var self = this;

		self.taskPartSize = ko.observable(15);
		self.currentDay = ko.observable();
		self.dayStartHours = ko.observable(9);
		self.dayStartMinutes = ko.observable(0);
		self.businessHours = ko.observable(8);
		self.lunchDurationInMinutes = ko.observable(60);
		self.lunchStartHours = ko.observable(12);
		self.lunchStartMinutes = ko.observable(0);

		self.businessStartDay = ko.observable(1);
		// monday
		self.businessEndDay = ko.observable(5);
		// friday

		self.days = ko.observable({});
		self.weeks = ko.observable({});

		self.init = function(date) {

			var start = new Date;

			self.currentDay(date || new Date);

			self.loadTasks().then((tasks) => {

				self.assignees = ko.observable({});

				self.tasks = ko.observable({});
				self.tasksArray = ko.observable(tasks.filter(task => task.desired_start_date || task.desired_date_with_time).map(t => new Task(t)));

				tasks = self.tasks();

				self.tasksArray().forEach((t, i) => {
					tasks[t.id()] = t;
				});

				self.week = ko.observable(new Week(self.currentDay()));

				self.currentDay.subscribe(function(day) {

					console.log(day, self.currentDay(), +day < +self.week().days()[0].start(), +self.week().days()[6].end() < +day);

					if (+day < +self.week().days()[0].start() || +self.week().days()[6].end() < +day) {
						self.week(new Week(self.currentDay()));
						self.calculateTaskParts();
					}

				});

				self.calculateTaskParts();

				// 			    self.week.subscribe(function() { console.log('change week') });
				console.log('done', new Date-start, 'ms');

			});
		}
	}

	CalendarViewModel.prototype.loadTasks = function() {
		return fetch("/api/tasks?limit=50&page=1&filter_id=85986&bypass_status_default=true&include_not_assigned=true&sort=board_stage_name&sort_dir=desc", {
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
		}).then((r) => r.json());
	}

	CalendarViewModel.getInstance = function() {
		CalendarViewModel.__instance__ = CalendarViewModel.__instance__ || new CalendarViewModel;
		return CalendarViewModel.__instance__;
	}

	function Week(date) {

		var self = this,
			calendar = CalendarViewModel.getInstance();

		var dayInMilis = 1000 * 60 * 60 * 24;
		var dateMilis = +date;
		var weekStart = new Date(+date - date.getDay() * dayInMilis);
		self.id = ko.pureComputed(function() {
			return weekStart.toISOString().substring(0, 10)
		});

		if (calendar.weeks()[self.id()]) {
			return calendar.weeks()[self.id()];
		} else {
            
            calendar.weeks()[self.id()] = self;

			self.days = ko.observable([]);

			for (var i = 0, j = 7; i + 1 < j; i++) {

				var yesterday = new Date(+weekStart + (i - 1) * dayInMilis);
				var yesterdayKey = yesterday.toISOString().substring(0, 10);

				var today = new Date(+weekStart + i * dayInMilis);
				var todayKey = today.toISOString().substring(0, 10);

				var tomorrow = new Date(+weekStart + (i + 1) * dayInMilis);
				var tomorrowKey = tomorrow.toISOString().substring(0, 10);

				calendar.days()[todayKey] = calendar.days()[todayKey] || ko.observable(new Day(today, calendar.days()[yesterdayKey], calendar.days()[tomorrowKey]));
				self.days()[i] = calendar.days()[todayKey]();

				if (i + 1 < j) {
					calendar.days()[tomorrowKey] = calendar.days()[tomorrowKey] || ko.observable(new Day(tomorrow, calendar.days()[todayKey]));
					self.days()[i + 1] = calendar.days()[tomorrowKey]();
					// 			    console.log(i, tomorrowKey, calendar.days()[tomorrowKey]());
				}

				if (calendar.days()[tomorrowKey]) {
					calendar.days()[todayKey]().tomorrow = calendar.days()[tomorrowKey];
				}

			}

			self.start = ko.observable(self.days()[0]);

			var partsHelper = self.days().filter(d => d.isBusinessDay()).map(d => [d.start(), d.end()]).reduce((acc, i) => acc.concat(i));

			self.parts = [];
			var firstHalfHours = calendar.lunchStartHours() - calendar.dayStartHours();
			var secondHalfHours = calendar.businessHours() - firstHalfHours;
			var lunchDurationHours = calendar.lunchDurationInMinutes() / 60;
			var partInMilis = Math.max(calendar.taskPartSize() * 60 * 1000, 1);

			for (var i = 0, j = partsHelper.length; i + 1 < j; i += 2) {

				var startFirstTime = +partsHelper[i];
				var endFirstTime = startFirstTime + firstHalfHours * 60 * 60 * 1000;

				var endSecondTime = +partsHelper[i + 1];
				var startSecondTime = endSecondTime - secondHalfHours * 60 * 60 * 1000;

				//             console.log(new Date(startFirstTime), new Date(endFirstTime));

				while (startFirstTime < endFirstTime) {

					//                 console.log(new Date(startFirstTime), new Date(startFirstTime+partInMilis));
					self.parts.push(startFirstTime);

					startFirstTime += partInMilis;
				}

				while (startSecondTime < endSecondTime) {

					//                 console.log(new Date(startFirstTime), new Date(startFirstTime+partInMilis));
					self.parts.push(startSecondTime);

					startSecondTime += partInMilis;
				}

				//             console.log(new Date(startSecondTime), new Date(endSecondTime));

			}

			self.parts = ko.observable(self.parts);
		}

	}

	function Day(date, yesterday, tomorrow) {

		var self = this,
			calendar = CalendarViewModel.getInstance();

		self.today = ko.observable(new Date(date));
		self.yesterday = yesterday;
		self.tomorrow = tomorrow;

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
			return !isHoliday() && self.start().getDay() >= calendar.businessStartDay() && self.start().getDay() <= calendar.businessEndDay();
		});

	}

	function Task(task) {

		var self = this,
			calendar = CalendarViewModel.getInstance();

		self.id = ko.pureComputed(function() {
			return task.id
		});
		self.raw = ko.observable(task);

		if (task.desired_start_date || task.desired_date_with_time) {

			if (task.desired_start_date && task.desired_date_with_time) {
				
				self.start = ko.observable(new Date(task.desired_start_date));
				self.end = ko.observable(new Date(task.desired_date_with_time));

			} else if (task.desired_start_date) {

				self.start = ko.observable(new Date(task.desired_start_date));
				self.end = ko.observable(new Date(+new Date(task.desired_start_date) + task.current_estimate_seconds * 1000));

			} else if(task.desired_date_with_time) {

				self.start = ko.observable(new Date(+new Date(task.desired_date_with_time) - task.current_estimate_seconds * 1000));
				self.end = ko.observable(new Date(task.desired_date_with_time));

			}

			// console.log(self.start().toISOString().substring(0, 10), calendar.days()[self.start().toISOString().substring(0, 10)]);

			self.currentEstimateSeconds = ko.observable(task.current_estimate_seconds);

			self.parts = ko.observable([]);

			self.dayParts = ko.pureComputed(function(){
				return self.parts().map(p => new Date(p).toISOString().slice(0, 10));
			})

			self.totalParts = ko.pureComputed(function() {

				return (self.end() - self.start()) / (calendar.taskPartSize() * 60 * 1000);

			});

			self.assignees = ko.observable(task.assignments.map(a => new Assignee(a)));

			self.assignees().forEach(a => calendar.tasks()[task.id] || a.tasks().push(self));
		}

	}

	CalendarViewModel.prototype.calculateTaskParts = function() {

		var self = this, parts = self.week().parts();

		self.tasksArray().forEach(task => {
			var start = parts.indexOf(+task.start()), end = parts.indexOf(+task.end() - calendar.taskPartSize() * 60 * 1000);

			// calculate task parts
			console.log('start', task.id(), start, task.start());
			console.log('end', task.id(), end, new Date(task.end() - calendar.taskPartSize() * 60 * 1000));

			if (start > -1 && end > -1) {

				task.parts(parts.slice(start, end+1));

			} else if (start > -1) {
				
				task.parts(parts.slice(start, start + task.totalParts()));
			
			} else if (end > -1) {
			
				task.parts(parts.slice(Math.max(end - task.totalParts(), 0), end+1));
			
			} else {
			
			    task.parts([]);
			
			}
		})

	}

	function Assignee(assignment) {

		// 		console.log(0, assignment.assignee_id);

		var self = this,
			calendar = CalendarViewModel.getInstance();

		if (calendar.assignees()[assignment.assignee_id]) {
			return calendar.assignees()[assignment.assignee_id];
		} else {
			self.assignment = ko.observable(assignment);
			self.id = ko.observable(assignment.assignee_id);
			self.name = ko.observable(assignment.assignee_name);
			self.tasks = ko.observable([]);

			calendar.assignees()[assignment.assignee_id] = self;
		}

	}

	function makeItHappen() {

		CalendarViewModel.getInstance().init(new Date('2020-03-20T03:00'));

		window.calendar = CalendarViewModel.getInstance();

	}



	if (!window.ko) {
		var newScript = document.createElement("script");
		newScript.src = "https://knockoutjs.com/downloads/knockout-3.5.1.js";
		newScript.onload = makeItHappen;
		document.body.appendChild(newScript);
	} else {
		makeItHappen();
	}

}());