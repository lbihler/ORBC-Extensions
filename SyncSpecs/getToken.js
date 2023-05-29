const params = require('./conf/parameters.json');
const axios = require('axios');
const idcsUrl = params.ordsParameters.idcsUrl;
const fs = require('fs');
const util = require('util');
const path = require('path');
var querystring = require('querystring');

var access_token;

let date = new Date();
var logFileName = params.errDir + '/' + path.parse(module.filename).base + '.' + date.getTime() + '.log';
// Only set on test environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// item is a JSON Object corresponding to the SPEC fro, the Specs list

//const axioslogger = require('axios-response-logger');
// Refresh the OAuth token if necessary
console.log('Starting OAuth2 routine');
var tokenDate = new Date(2010, 1, 1);
//var tokenTimestamp = pglobals.get("OAuth_Timestamp");
var tokenTimestamp;
if (tokenTimestamp) {
    tokenDate = Date.parse(tokenTimestamp);
}
//var expiresInTime = pm.environment.get("Oauth_ExpiresInTime");
var expiresInTime;;
if (!expiresInTime) {
    expiresInTime = 5000; // Set default expiration time to 5 minutes
} else {
    expiresInTime = expiresInTime - 5000; // If expiring within 5 seconds, renew
}


async function callAPI() {

    if ((new Date() - tokenDate) >= expiresInTime) {
        console.log("TEST PASSAGE");
        //const idcsUrl = pm.environment.get("idcsUrl_token");
        //let keys = pm.environment.get("client_id") + ":" + pm.environment.get("client_secret");
        //let encodedKeys = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(keys));

        axios.post(idcsUrl,
            querystring.stringify({
                grant_type: 'client_credentials',
                client_id: params.ordsParameters.clientId,
                client_secret: params.ordsParameters.clientSecret,
                scope: params.ordsParameters.oauthScope
            }), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(function(response) {
            access_token = response.data.access_token
            console.log('Bearer: ' + access_token);
            //console.log(response);
        });

    }
}

/*tokenPayload() {
    let config = {
      headers: {
        'Authorization': 'Bearer ' + validToken()
      }
    }
    Axios.post( 
        'http://localhost:8000/api/v1/get_token_payloads',
        config
      )
      .then( ( response ) => {
        console.log( response )
      } )
      .catch()
  }
  */

callAPI();