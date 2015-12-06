// Extend Math.round to allow for precision
Math.round = (function(){
	var round = Math.round;
	
	return function (number, decimals) {
		decimals = +decimals || 0;
		
		var multiplier = Math.pow(10, decimals);
		
		return round(number * multiplier) / multiplier;
	};
})();

// Simple class for handling sRGB colors
(function(){

var _ = self.Color = function(colorVal) {
	if (colorVal === 'transparent') {
		colorVal = [0,0,0,0];
	}
	else if (typeof colorVal === 'string') {
		var colorString = colorVal;

		// For the case of RGBA passed in
		colorVal = colorString.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
		isHex = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(colorString);

		if (colorVal) {
			colorVal.shift();
		} else if (isHex) {
			colorVal = hexToRgb(colorString);
		}	else {
			throw new Error('Invalid string: ' + colorString);
		}

		// For the case of HEX passed in
		function hexToRgb(hex) {
		    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		        return r + r + g + g + b + b;
		    });

		    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		    return result ? [
		        parseInt(result[1], 16),
		        parseInt(result[2], 16),
		        parseInt(result[3], 16), 
		        1
		    ] : null;
		}
	}

	if (colorVal[3] === undefined) {
		colorVal[3] = 1;	
	}
	
	colorVal = colorVal.map(function (a) { return Math.round(a, 3) });

	this.rgba = colorVal;
}

_.prototype = {
	get rgb () {
		return this.rgba.slice(0,3);
	},
	
	get alpha () {
		return this.rgba[3];
	},
	
	set alpha (alpha) {
		this.rgba[3] = alpha;
	},
	
	get luminance () {
		// Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
		var rgba = this.rgba.slice();
		
		for(var i=0; i<3; i++) {
			var rgb = rgba[i];
			
			rgb /= 255;
			
			rgb = rgb < .03928 ? rgb / 12.92 : Math.pow((rgb + .055) / 1.055, 2.4);
			
			rgba[i] = rgb;
		}
		
		return .2126 * rgba[0] + .7152 * rgba[1] + 0.0722 * rgba[2];
	},
	
	get inverse () {
		return new _([
			255 - this.rgba[0],
			255 - this.rgba[1],
			255 - this.rgba[2],
			this.alpha
		]);
	},
	
	toString: function() {
		return 'rgb' + (this.alpha < 1? 'a' : '') + '(' + this.rgba.slice(0, this.alpha >= 1? 3 : 4).join(', ') + ')';
	},
	
	clone: function() {
		return new _(this.rgba);
	},
	
	// Overlay a color over another
	overlayOn: function (color) {
		var overlaid = this.clone();
		
		var alpha = this.alpha;
		
		if (alpha >= 1) {
			return overlaid;
		}
		
		for(var i=0; i<3; i++) {
			overlaid.rgba[i] = overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha);
		}
		
		overlaid.rgba[3] = alpha + color.rgba[3] * (1 - alpha)
		
		return overlaid;
	},
	
	contrast: function (color) {
		// Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
		var alpha = this.alpha;
		
		if (alpha >= 1) {
			if (color.alpha < 1) {
				color = color.overlayOn(this);
			}
			
			var l1 = this.luminance + .05,
				l2 = color.luminance + .05,
				ratio = l1/l2;
			
			if (l2 > l1) {
				ratio = 1 / ratio;
			}
			
			ratio = Math.round(ratio, 1);
			
			return {
				ratio: ratio,
				error: 0,
				min: ratio,
				max: ratio
			}
		}
		
		// If we’re here, it means we have a semi-transparent background
		// The text color may or may not be semi-transparent, but that doesn't matter
		
		var onBlack = this.overlayOn(_.BLACK).contrast(color).ratio,
		    onWhite = this.overlayOn(_.WHITE).contrast(color).ratio;
		    
		var max = Math.max(onBlack, onWhite);
		
		var closest = this.rgb.map(function(c, i) {
			return Math.min(Math.max(0, (color.rgb[i] - c * alpha)/(1-alpha)), 255);
		});
		
		closest = new _(closest);

		var min = this.overlayOn(closest).contrast(color).ratio;
				
		return {
			ratio: Math.round((min + max) / 2, 2),
			error: Math.round((max - min) / 2, 2),
			min: min,
			max: max,
			closest: closest,
			farthest: onWhite == max? _.WHITE : _.BLACK
		};
	}
}

_.BLACK = new _([0,0,0]);
_.GRAY = new _([127.5, 127.5, 127.5]);
_.WHITE = new _([255,255,255]);

})();

(function () {
	angular.module('colorApp', ['ngAnimate', 'angular-clipboard']);

	var app = angular.module('colorApp');

	app.constant('DATA_DIR', '../app/data/');

	app.config(config);

	function config() {

	}
})();

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