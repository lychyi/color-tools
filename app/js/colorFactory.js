(function (){
	var app = angular.module('colorApp');

	app.factory('colorFactory', colorFactory);

	colorFactory.$inject = ['$http', 'DATA_DIR'];

	function colorFactory($http, DATA_DIR) {
		var service = {
			get: get
		}

		function get(file) {
			var promise = $http.get(DATA_DIR + file).then(function(response) {
				return response.data;
			}, function (err) {
				console.log(err);
			});

			return promise;
		}

		return service;
	}
})();