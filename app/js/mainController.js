(function () {
	var app = angular.module('colorApp');

	app.controller('mainController', mainController);
	app.directive('colorBlock', colorBlock);

	mainController.$inject = ['$scope', 'colorFactory'];

	function colorBlock() {
		return {
			restrict: 'EA', 
			scope: {
				hex: "=", 
				name: "=", 
				lum: "="
			}, 
			link: link,
			template: '<i class="color-selected text-success fa fa-check"></i><span class="color-text">{{name}} - {{lum | number: 4}} - {{hex | uppercase}}</span>'
		};

		function link (scope, element, attrs) {
			element.addClass('color-block');
			element.css("background-color", scope.hex);
			
			scope.$watch(
				function() { return scope.hex }, 
				function() {
					element.css("background-color", scope.hex);
				}
			);
		}
	}

	function mainController($scope, colorFactory) {
		var vm = this;

		var luminanceMap = {
				10: 0.750200962650953,
				20: 0.523519337589966,
				30: 0.378252376695115,
				40: 0.294571586112391,
				50: 0.182744645346758,
				60: 0.098909147989603,
				70: 0.061541559224324,
				80: 0.033805835121627,
				90: 0.020023471550597,
				100: 0.000608268075032
			};

		vm.colors = [];

		vm.setShades = setShades;

		vm.shades;

		activate();

		function activate() {
			colorFactory.get('ilmn-colors.json').then(function(data) {
				vm.colors.ilmn = data;
				vm.colors.shades;

				// Create a chroma color for each color returned from files
				for (key in vm.colors.ilmn) {
					var color = chroma(vm.colors.ilmn[key].hex);
					
					vm.colors.ilmn[key].color = color;

					// For convenience, add lum
					vm.colors.ilmn[key].luminance = color.luminance();

					// Calculate shades
					vm.colors.ilmn[key].shades = createShades(vm.colors.ilmn[key].hex);
				}
			});
		}

		function setShades(obj, name) {
			vm.shades = obj;
			vm.activeColor = name;

			console.log('setting shades');
		}

		// core: String (color hex value or RGB value)
		// name: String (opt, the name of the color)
		function createShades(core) {
			// Generates shades of colors with the lumiance values in the luminance map
			var luminanceMap = {
				10: 0.750200962650953,
				20: 0.523519337589966,
				30: 0.378252376695115,
				40: 0.294571586112391,
				50: 0.182744645346758,
				60: 0.098909147989603,
				70: 0.061541559224324,
				80: 0.033805835121627,
				90: 0.020023471550597,
				100: 0.000608268075032
			};

			var color = chroma(core);
			
			var hue = color.get('hsl.h');

			var shades = {};

			for(var i = 10; i <= 100; i+=10) {
				var obj = {
					hex: color.luminance(luminanceMap[i], 'hsl')
								.set('hsl.h', hue)
								.luminance(luminanceMap[i], 'hsl')
								.hex(), 
					luminance: color.luminance()
				}
				shades[i] = obj;
			}

			return shades;
		}

		function sortLuminance(arr, reverse) {
			return arr.sort(function(a,b) {
				return b.color.luminance - a.color.luminance;
			})
		}

		// Takes an array of objects
		// {name: String, hex: String}
		function createColors(arr) {
			return arr.map(function(item) {
				var color = new Color(item.hex);
				item.color = color;
				return item;
			})
		}

		function chromaCreate(arr) {
			return arr.map(function(item) {
				var color = chroma(item.hex);
				item.color = color;
				item.color.luminance = color.luminance();
				return item;
			})
		}

	}
})();