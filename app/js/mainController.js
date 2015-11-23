(function () {
	var app = angular.module('colorApp');

	app.controller('mainController', mainController);

	function mainController() {
		var vm = this;

		activate();

		function activate() {
			console.log('main!');
		}
	}
})();