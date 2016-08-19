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
				lum: "=", 
				contrast: "=", 
				showName: "=", 
				showHex: "=", 
				showLum: "=", 
				showContrast: "=", 
				setLeftBg: "&",
				setMidBg: "&",  
				setRightBg: "&"
			}, 
			transclude: true, 
			link: link,
			template: '<i class="color-selected fa fa-check text-success"></i>' + 
								'<div ng-show="showName" class="{{labelClass}} color-label color-name"><b>Name:</b> {{name}}</div>' +
								'<div ng-show="showHex" class="{{labelClass}} color-label color-hex"><b>Hex:</b> {{hex | uppercase}}</div>' +
								'<div ng-show="showLum" class="{{labelClass}} color-label color-lum"><b>Luminance:</b> {{lum | number: 4}}</div>' +
								'<div ng-show="showContrast" class="{{labelClass}} color-label color-contrast"><b>Contrast:</b> {{contrast | number: 1}}</div>' + 
								'<div class="{{labelClass}} toolbar">' + 
									'<i clipboard text="hex|uppercase" class="icon fa fa-clipboard fa-lg" title="Copy hex to clipboard."></i>' +
									'<span ng-click="setLeftBg({hex:hex})" class="icon fa-stack fa-lg" style="font-size: 0.8em;" title="Set this color to left background.">' + 
									  '<i class="fa fa-columns fa-stack-2x"></i>' + 
									  '<i class="fa fa-long-arrow-left fa-stack-1x"></i>' + 
									'</span>' + 
									'<span ng-click="setMidBg({hex:hex})" class="icon fa-stack fa-lg" style="font-size: 0.8em;" title="Set this color to middle hue.">' + 
									  '<i class="fa fa-columns fa-stack-2x"></i>' +
									'</span>' + 
									'<span ng-click="setRightBg({hex:hex})" class="icon fa-stack fa-lg" style="font-size: 0.8em;" title="Set this color to right background.">' + 
									  '<i class="fa fa-columns fa-stack-2x"></i>' + 
									  '<i class="fa fa-long-arrow-right fa-stack-1x"></i>' + 
									'</span>' +
								'</div>'
		};

		function link (scope, element, attrs) {
			if (scope.lum > 0.18) {
				scope.labelClass = 'black';
			} else {
				scope.labelClass = 'white';
			}
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

		vm.luminanceMap = {
				5: 0.8784000000000001,
				10: 0.750200962650953,
				20: 0.523519337589966,
				30: 0.378252376695115,
				40: 0.294571586112391,
				50: 0.182744645346758,
				60: 0.098909147989603,
				70: 0.061541559224324,
				80: 0.033805835121627,
				90: 0.020023471550597,
				//100: 0.000608268075032
			};

		vm.colors = [];
		vm.setShades = setShades;
		vm.shades;
		vm.setLeftBg = setLeftBg;
		vm.setMidBg = setMidBg;
		vm.setRightBg = setRightBg;
		vm.resetLeftBg = resetLeftBg;
		vm.resetRightBg = resetRightBg;

		vm.headerBg = "#ffffff";
		vm.textColor = "#333333";
		vm.leftBgHex = "#ffffff";
		vm.midBgHex = "#ffffff";
		vm.rightBgHex = "#ffffff";

		vm.contrastRatio;

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
					vm.colors.ilmn[key].shades = _createShades(vm.colors.ilmn[key].hex);
				}
			});
		}

		function setShades(color, name) {
			vm.shades = color.shades;
			vm.activeColor = name;
			vm.activeHex = color.hex;
			vm.textColor = color.hex;
			vm.passed = _passedContrast(vm.shades, 4.5);
		}

		// core: String (color hex value or RGB value)
		// name: String (opt, the name of the color)
		function _createShades(core) {
			var lumMap = Object.assign({}, vm.luminanceMap);
			
			var color = chroma(core);
			
			var hue = color.get('hsl.h');
			var saturation = color.get('hsl.s');

			var shades = {};

			angular.forEach(lumMap, function (lum, i) {
				var obj = {
					hex: color
								.luminance(lum, 'hsl')
								.set('hsl.h', hue)
								.luminance(lum, 'hsl')
								.hex(),
					luminance: color.luminance()
				};

				// Exception, replace Portage 60 with Denim 60 #0f50C5
				// if (core == '#798FED' && i == 60) {
				// 	obj = {
				// 		hex: '#0f50C5',
				// 		luminance: color.luminance()
				// 	};
				// }
					

				shades[i] = obj;
				shades[i].color = chroma(obj.hex);

				// Calculate contrast against black
				if (i <= 50) {
					shades[i].contrast = chroma.contrast(obj.hex, '#000');
				}

				// Calculate contrast against white (or take whichever contrast is lower on the 50 color)
				if (i >= 50) {
					shades[i].contrast = chroma.contrast(obj.hex, '#fff');
					if (i == 50) {
						shades[i].contrast <= chroma.contrast(obj.hex, '#fff') ? shades[i].contrast : chroma.contrast(obj.hex, '#fff');	
					}
				}
			});

			return shades;
		}

		function _passedContrast(arr, threshold) {
			var passed = true;
			for (key in arr) {
				if (Math.round(arr[key].contrast, 1) < threshold) {
					passed = false;
					break;
				}
			}

			return passed;
		}

		function setLeftBg(hex) {
			vm.leftBgHex = hex;
			calculateContrast();
		}		

		function setMidBg(hex) {
			vm.midBgHex = hex;
		}

		function setRightBg(hex) {
			vm.rightBgHex = hex;
			calculateContrast();
		}

		function resetLeftBg() {
			vm.leftBgHex = '#ffffff';
			calculateContrast();
		}

		function resetRightBg() {
			vm.rightBgHex = '#ffffff';
			calculateContrast();
		}

		function calculateContrast() {
			vm.contrastRatio = chroma.contrast(vm.rightBgHex, vm.leftBgHex);
		}

		function _multiHue(num) {
			var bez = chroma.bezier([vm.leftBgHex, vm.midBgHex, vm.rightBgHex]);
			var norm = chroma.scale([vm.leftBgHex, vm.midBgHex, vm.rightBgHex]);

			var scale = norm.mode('lab').correctLightness(true).colors(num);

			console.log(scale);

			return scale;
		}

		$scope.$watchGroup(['main.leftBgHex', 'main.midBgHex', 'main.rightBgHex'], function() {
			vm.multiHueScale = _multiHue(9);
		});

	}
})();