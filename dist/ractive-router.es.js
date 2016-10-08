import Ractive from 'ractive';
import hasher from 'hasher';
import crossroads from 'crossroads';

var babelHelpers = {};
babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};
babelHelpers;

var RactiveRouter = Ractive.extend({
    template: '<main class="routeContainer"></main>',
    oninit: function oninit() {
        var _this = this;

        //Will hold all constructed crossroads Route objects, for a further use I didn't find yet
        this.routesObjects = [];

        //The current componet the Router displays at a time
        this.currentComponent = undefined;

        //Get user config
        this.routesConfig = this.get('routesConfig');

        //Register for every route, a callback that will display the matching Component
        Object.keys(this.routesConfig).map(function (routePattern) {

            var routeObject = crossroads.addRoute(routePattern, function () {
                var routeConfig = this.routesConfig[routePattern];

                //Build a Route Params Object that will be available in child Component Data
                var routeParams = this.buildRouteParams(routePattern, arguments);

                //Prepare Route callback, if applied
                var callback = routeConfig.callback instanceof Function ? routeConfig.callback : undefined;

                //Create the Route Component or just execute the Route Callback
                if (routeConfig.component) {
                    this.currentComponent = new routeConfig.component({
                        el: this.find('main.routeContainer'),
                        data: {
                            routeParams: routeParams,
                            parentGlobals: this.get('globals')
                        },
                        oncomplete: function oncomplete() {
                            if (callback) callback(routeParams);
                        }
                    });
                } else {
                    if (callback) callback(routeParams);
                }
            }.bind(_this));
            _this.routesObjects.push(routeObject);
        });

        //Observe Global Data and notify current route Component
        this.observe('globals', function (globals) {
            if (this.currentComponent && this.currentComponent.update) {
                this.currentComponent.update('parentGlobals');
            }
        });

        //Redirect Not found route to 404
        crossroads.bypassed.add(function () {
            hasher.replaceHash('404');
        });
    },
    onrender: function onrender() {
        //Hasher init
        var parseHash = function parseHash(newHash, oldHash) {
            crossroads.parse(newHash);
        };
        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.prependHash = '';
        hasher.init();

        //Launch home
        if (!location.hash) {
            this.navigateToHome();
        }
    },
    buildRouteParams: function buildRouteParams(routePattern, values) {
        var routeParamNames = crossroads.patternLexer.getParamIds(routePattern);
        var result = routeParamNames.reduce(function (result, field, index) {
            var value = values[index];
            if (babelHelpers.typeof(values[index]) !== 'object') {
                result[field] = values[index] || undefined;
            } else {
                Object.keys(value).map(function (key) {
                    result[key] = value[key];
                });
            }
            return result;
        }, {});
        return result;
    },
    navigateToHome: function navigateToHome() {
        var _this2 = this;

        var routePattern = Object.keys(this.routesConfig).find(function (patten) {
            return _this2.routesConfig[patten].index;
        });
        if (routePattern) {
            hasher.replaceHash(routePattern);
        }
    }
});

//Programatically navigate to a new route
RactiveRouter.go = function (hash) {
    hasher.setHash(hash);
};

//Similar to Router.go(hash), but doesn't create a new record in browser history.
RactiveRouter.replace = function (hash) {
    hasher.replaceHash(hash);
};

export default RactiveRouter;
//# sourceMappingURL=ractive-router.es.js.map