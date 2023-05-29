/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['accUtils',
        'ojs/ojcore',
        'knockout',
        'factories/SpecificationFactory',
        'ojs/ojresponsiveutils',
        'ojs/ojresponsiveknockoututils',
        'ojs/ojCollectionDataProvider',
        'ojs/ojtable'
    ],
    function(accUtils, oj, ko, SpecificationFactory, ResponsiveUtils,
        ResponsiveKnockoutUtils, CollectionDataProvider) {
        'use strict';

        function DashboardViewModel() {
            var self = this;
            // Below are a set of the ViewModel methods invoked by the oj-module component.
            // Please reference the oj-module jsDoc for additional information.
            self.datasource = ko.observable();
            self.SpecCol = ko.observable();

            //var resourceURL = 'https://orbc-wtss.snphxprshared1.gbucdsint02phx.oraclevcn.com:9999/orbcuat/services/rest/specification';
            //var prAuthEncoded = 'Basic QVBJU1BFQzpPcmFjbGUxMjM0NSE=';
            self.resourceURL = 'https://orbc-wtss.snphxprshared1.gbucdsint02phx.oraclevcn.com:9999/orbcuat/services/rest/specification';
            self.prAuthEncoded = 'Basic QVBJU1BFQzpPcmFjbGUxMjM0NSE=';

            self.proxy = function(operation, collection, options) {
                var retObj = {};
                if (operation == 'read') {
                    retObj['headers'] = { 'prUrl': self.resourceURL, 'pr-authoriztion': self.prAuthEncoded };
                    retObj['mimeType'] = "text/xml";
                }
                return retObj;
            };

            self.parseSpec = function(response) {
                var xmlDoc = response;
                var x = $(xmlDoc).find("entries").text();
                for (let i = 0; i < x.length; i++) {
                    l_specNumber = x[i].getElementsById("specNumber")[0].nodeValue;
                    l_specVersion = x[i].getElementsById("specVersion")[0].nodeValue;
                    l_specTitle = x[i].getElementsById("title")[0].nodeValue;
                    if (i === 0) {
                        var specArray = [{ id: i, specNumber: l_specNumber, specVersion: l_specVersion, specTitle: l_specTitle }];
                    } else {
                        specArray.push({ id: i, specNumber: l_specNumber, specVersion: l_specVersion, specTitle: l_specTitle });
                    }

                }
                return specArray;
            };

            self.Specification = oj.Model.extend({
                parse: self.parseSpec,
                idAttribute: 'id'
            });

            self.mySpec = new self.Specification();

            self.SpecCollection = oj.Collection.extend({
                customURL: self.proxy,
                model: this.mySpec,
                comparator: "id"
            });

            self.SpecCol(new this.SpecCollection());

            self.datasource(new CollectionDataProvider(self.SpecCol()));

            self.isSmall = ResponsiveKnockoutUtils.createMediaQueryObservable(
                ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY));

            self.columns = ko.computed(function() {
                return this.isSmall() ? 1 : 3;
            }.bind(this));

            /**
             * Optional ViewModel method invoked after the View is inserted into the
             * document DOM.  The application can put logic that requires the DOM being
             * attached here.
             * This method might be called multiple times - after the View is created
             * and inserted into the DOM and after the View is reconnected
             * after being disconnected.
             */
            self.connected = function() {
                accUtils.announce('Dashboard page loaded.', 'assertive');
                document.title = "Dashboard";
                // Implement further logic if needed
            };

            /**
             * Optional ViewModel method invoked after the View is disconnected from the DOM.
             */
            self.disconnected = function() {
                // Implement if needed
            };

            /**
             * Optional ViewModel method invoked after transition to the new View is complete.
             * That includes any possible animation between the old and the new View.
             */
            self.transitionCompleted = function() {
                // Implement if needed
            };
        }

        /*
         * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
         * return a constructor for the ViewModel so that the ViewModel is constructed
         * each time the view is displayed.
         */
        return DashboardViewModel;
    }
);