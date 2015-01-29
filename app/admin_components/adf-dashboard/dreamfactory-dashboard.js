'use strict';

// Declare our new module
angular.module('dfDashboard', ['dfUtility'])

    // Set a constant so we can access the 'local' path of our assets
    .constant('MOD_DASHBOARD_ASSET_PATH', 'admin_components/adf-dashboard/')
//    .constant('MOD_DASHBOARD_ROUTER_PATH', '/dashboard')
    .constant('MOD_DASHBOARD_ROUTER_PATH', '/quickstart')
    .config(['$routeProvider', 'MOD_DASHBOARD_ROUTER_PATH', 'MOD_DASHBOARD_ASSET_PATH',
        function ($routeProvider, MOD_DASHBOARD_ROUTER_PATH, MOD_DASHBOARD_ASSET_PATH) {
            $routeProvider
                .when(MOD_DASHBOARD_ROUTER_PATH, {
                    templateUrl: MOD_DASHBOARD_ASSET_PATH + 'views/main.html',
                    controller: 'DashboardCtrl',
                    resolve: {
                        checkAppObj:['dfApplicationData', function (dfApplicationData) {

                            if (dfApplicationData.initInProgress) {

                                return dfApplicationData.initDeferred.promise;
                            }
                        }],
                        checkCurrentUser: ['UserDataService', '$location', '$q', function (UserDataService, $location, $q) {

                            var currentUser = UserDataService.getCurrentUser(),
                                defer = $q.defer();

                            // If there is no currentUser and we don't allow guest users
                            if (!currentUser) {

                                $location.url('/login');

                                // This will stop the route from loading anything
                                // it's caught by the global error handler in
                                // app.js
                                throw {
                                    routing: true
                                }
                            }

                            // There is a currentUser but they are not an admin
                            else if (currentUser && !currentUser.is_sys_admin) {

                                $location.url('/launchpad');

                                // This will stop the route from loading anything
                                // it's caught by the global error handler in
                                // app.js
                                throw {
                                    routing: true
                                }
                            }

                            defer.resolve();
                            return defer.promise;
                        }]
                    }
                });
        }])

    .controller('DashboardCtrl', ['$scope', '$rootScope', 'dfApplicationData',  function($scope, $rootScope, dfApplicationData) {


        $scope.$parent.title = 'Quickstart';
//        $scope.$parent.title = 'Dashboard';

        // Set module links
        $scope.links = [
            {
                name: 'quick-start',
                label: 'QuickStart',
                path: 'quick-start'
            }
//            {
//                name: 'dashboard-home',
//                label: 'Home',
//                path: 'dashboard-home'
//            },
//            {
//                name: 'about',
//                label: 'About',
//                path: 'about'
//            }
//            {
//                name: 'usage',
//                label: 'Usage',
//                path: 'usage'
//            }
        ];

    }])

    .directive('dfDashboardHome', ['MOD_DASHBOARD_ASSET_PATH', function (MOD_DASHBOARD_ASSET_PATH) {


        return {
            restrict: 'E',
            scope: false,
            templateUrl: MOD_DASHBOARD_ASSET_PATH + 'views/df-dashboard-home.html',
            link: function (scope, elem, attrs) {



            }
        }
    }])

    .directive('dfQuickStart', ['MOD_DASHBOARD_ASSET_PATH', '$location', 'dfApplicationData', 'dfNotify', 'dfStringService', function (MOD_DASHBOARD_ASSET_PATH, $location,  dfApplicationData, dfNotify, dfStringService) {


        return {
            restrict: 'E',
            scope: false,
            templateUrl: MOD_DASHBOARD_ASSET_PATH + 'views/df-quick-start.html',
            link: function (scope, elem, attrs) {

                var App = function  (appData) {

                    var _app = {
                        name: '',
                        native: false,
                        is_url_external: '0',
                        api_name: '',
                        description: '',
                        storage_service_id: null,
                        storage_container: 'applications',
                        launch_url: '',
                        roles:[]
                    };

                    appData = appData || _app;

                    return {
                        __dfUI: {
                            selected: false,
                            devLocal: null
                        },
                        record: angular.copy(appData),
                        recordCopy: angular.copy(appData)
                    }
                };


                scope.step = 1;

                // This is where we will store you new app object during the
                // quickstart
                scope.app = new App();


                // Let's get the other apps so that we can compare
                // api names to make sure you haven't already created
                // an app with the same api name.
                scope.apps = dfApplicationData.getApiData('app');

                // We'll need your storage containers because we 'll need to assign
                // this app to a storage container if it is a 'hosted on this system' app.
                scope.storageServices = dfApplicationData.getApiData('service', {type: 'Local File Storage,File Storage'});

                // We don't know the containers you may have because you haven't chosen
                // a service yet. In reality we just find the 'applications' container from your
                // local storage and put the app there if you are creating a 'hosted' app.
                scope.storageContainers = [];


                scope.downloadSDK = function() {

                    window.top.location = location.protocol + '//' + location.host + '/rest/system/app/' + scope.app.record.id + '?sdk=true&app_name=admin';
                };


                scope.setStep = function (step) {

                   scope._setStep(step);
                };

                scope.goToDocs = function() {
                    $location.path( '/apidocs' );
                };


                // This checks to see if you have already used this api name
                // for an application
                scope._isApiNameUnique = function () {

                    // let's loop through the apps
                    for (var i = 0; i < scope.apps.length; i++) {

                        // Do we already have an app with that api_name
                        if (dfStringService.areIdentical(scope.apps[i].api_name, scope.app.record.api_name)) {

                            // Yes.
                            return false;
                        }
                    }

                    // The name is unique.
                    return true;
                };

                scope._saveAppToServer = function (requestDataObj) {

                    return dfApplicationData.saveApiData('app', requestDataObj).$promise;
                };

                scope._prepareAppData = function (record) {

                    var _app = angular.copy(record);

                    if (_app.record.native) {

                        // No need for storage service.  Make sure
                        // it's set to null
                        _app.record.storage_service_id = null;
                        _app.record.storage_container = null;

                        // we take care of the app name for the user
                        _app.record.name = _app.record.api_name;

                        // no need for a launch_url
                        _app.record.launch_url = "";

                        // this is actually supposed to be a bool but
                        // we have set the radio buttons value to -1
                        // to distinguish it from a url supplied app
                        _app.record.is_url_external = 0;

                        // prepare data to be sent to server
                        return _app.record;
                    }
                    else {

                        if (_app.__dfUI.devLocal == 1) {

                            // No need for storage service.  Make sure
                            // it's set to null
                            _app.record.storage_service_id = null;
                            _app.record.storage_container = null;


                        }
                        else {

                            angular.forEach(scope.storageServices, function (service) {

                                if (service.type === 'Local File Storage') {
                                    _app.record.storage_service_id = service.id
                                }
                                else {

                                    var messageOptions = {
                                        module: 'Quickstart Error',
                                        type: 'error',
                                        provider: 'dreamfactory',
                                        message: 'No local file storage service found.'
                                    }

                                    dfNotify.error(messageOptions);
                                }
                            });

                            _app.record.storage_container = 'applications';

                        }

                        _app.record.is_url_external = false;

                        // we take care of the app name for the user
                        _app.record.name = _app.record.api_name;


                        return _app.record;
                    }
                };

                scope._createApp = function (stepOnSuccess) {


                    // Set so we can distinguish a remote client web app from a native app
                    scope.isWebAppOnLocalMachine = scope.app.__dfUI.devLocal;

                    // Create our request obj
                    var requestDataObj = {
                        params: {
                            fields: '*',
                            related: 'roles'
                        },
                        data: scope._prepareAppData(scope.app)
                    };


                    scope._saveAppToServer(requestDataObj).then(
                        function (result) {

                            // notify success
                            var messageOptions = {
                                module: 'Apps',
                                type: 'success',
                                provider: 'dreamfactory',
                                message: scope.app.record.api_name + ' saved successfully.'
                            };

                            dfNotify.success(messageOptions);

                            scope.app = new App (result);

                            if (!scope.app.record.is_url_external && !scope.app.record.storage_service_id && (scope.isWebAppOnLocalMachine === null)) {
                                scope.app.record['native'] = true;
                            }
                            else {
                                scope.app.record['native'] = false;
                            }

                            scope.setStep(stepOnSuccess);

                        },
                        function (reject) {

                            var messageOptions = {
                                module: 'Api Error',
                                type: 'error',
                                provider: 'dreamfactory',
                                message: reject
                            };

                            dfNotify.error(messageOptions);

                        }
                    )
                }

                scope._setStep = function (step) {

                    switch (step) {

                        case 1:
                            scope.step = step;

                        case 2:
                            if (scope.app.record.native) {

                                scope._createApp(3);
                                break;
                            }

                            scope.step = step;
                            break;

                        case 3:
                            scope.step = step;
                            break;

                        default:
                            scope.step = step;

                    }
                }
            }
        }
    }])

    .directive('dfAbout', ['MOD_DASHBOARD_ASSET_PATH', function (MOD_DASHBOARD_ASSET_PATH) {


        return {
            restrict: 'E',
            scope: false,
            templateUrl: MOD_DASHBOARD_ASSET_PATH + 'views/df-about.html',
            link: function (scope, elem, attrs) {
            }
        }
    }])

    .directive('dfUsage', ['MOD_DASHBOARD_ASSET_PATH', function (MOD_DASHBOARD_ASSET_PATH) {


        return {
            restrict: 'E',
            scope: false,
            templateUrl: MOD_DASHBOARD_ASSET_PATH + 'views/df-usage.html',
            link: function (scope, elem, attrs) {
            }
        }
    }]);

