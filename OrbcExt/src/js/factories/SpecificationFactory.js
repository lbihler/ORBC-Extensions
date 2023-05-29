define(['ojs/ojmodel', 'jquery'], function(Model, $) {


    var SpecificationFactory = {
        // Create a single Specification instance
        proxy: function() {
            var retObj = {};
            var resourceURL = 'https://orbc-wtss.snphxprshared1.gbucdsint02phx.oraclevcn.com:9999/orbcuat/services/rest/specification';
            var prAuthEncoded = 'Basic QVBJU1BFQzpPcmFjbGUxMjM0NSE=';
            retObj['headers'] = { 'prUrl': resourceURL, 'pr-authoriztion': prAuthEncoded };
            retObj['mimeType'] = "text/xml";
            return retObj;
        },
        parseSpecList: function(response) {
            var xmlDoc = response;
            var x = $(xmlDoc).find("entries").text();
            for (i = 0; i < x.length; i++) {
                l_specNumber = x[i].getElementsById("specNumber")[0].nodeValue;
                l_specVersion = x[i].getElementsById("specVersion")[0].nodeValue;
                l_specTitle = x[i].getElementsById("title")[0].nodeValue;
                if (i === 0) {
                    var specArray = [{ id: i, specNumber: l_specNumber, specVersion: l_specVersion, specTitle: l_specTitle }];
                } else {
                    specArray.push({ id: i, specNumber: l_specNumber, specVersion: l_specVersion, specTitle: l_specTitle });
                }

            }
            //console.log('number of specs:' + specArray.length);
            // JSONdata = promisesParser(response, { tagNameProcessors: [stripNS] });
            return specArray;
        },
        createSpecificationModel: function() {
            var Specification = Model.Model.extend({
                //                urlRoot: this.resourceURL,
                //customURL: proxy(),
                parse: this.parseSpecList,
                idAttribute: 'id'
            });
            return new Specification()
        },
        //Create a Specification collection
        createSpecificationCollection: function() {
            var Specifications = Model.Collection.extend({
                //              url: this.resourceURL,
                model: this.createSpecificationModel(),
                customURL: this.proxy(),
                comparator: "id"
            });
            return new Specifications();
        }

    };
    return SpecificationFactory;
});

//fetch({ headers: { "Authorization": "Basic " + btoa("user@domain.com:$password"),