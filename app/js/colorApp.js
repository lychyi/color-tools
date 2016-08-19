(function () {
	angular.module('colorApp', ['ngAnimate', 'angular-clipboard']);

	var app = angular.module('colorApp');

	app.constant('DATA_DIR', 'https://lychyi.github.io/color-tools/app/data/');
	// app.constant('DATA_DIR', 'app/data/');

	app.config(config);

	function config() {

	}
})();
