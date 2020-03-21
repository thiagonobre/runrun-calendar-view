(function() {

	var newScript = document.createElement("script");
	newScript.src = "https://knockoutjs.com/downloads/knockout-3.5.1.js";
	newScript.onload = makeEverythingHappen;
	document.body.appendChild(newScript);



	function makeEverythingHappen() {
		fetch("https://runrun.it/api/tasks?limit=250&page=1&filter_id=85986&bypass_status_default=true&include_not_assigned=true&sort=desired_start_date&sort_dir=desc", {
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

			console.log(tasks[0]);

		});
	}


}());