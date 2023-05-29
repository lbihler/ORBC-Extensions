"use Strict"

// Lading parameters
const params = require('./conf/parameters.json');

// include node modules
// const oracledb = require('oracledb');
const axios = require('axios');
const xml2jsParser = require('xml2js').parseString;
const stripNS = require('xml2js').processors.stripPrefix;
const fs = require('fs');
const axioslogger = require('axios-response-logger');
const util = require('util');
const promisesParser = util.promisify(xml2jsParser);
const path = require('path');

let date = new Date();
var logFileName = params.errDir + '/' + path.parse(module.filename).base + '.' + date.getTime() + '.log';
// Only set on test environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// item is a JSON Object corresponding to the SPEC fro, the Specs list
async function recordSpec(item, onSuccess, onError) {
    //let result = await axios.get(item.recordLink[0], {

    const instance = await axios.create({
        baseURL: item.recordLink[0],
        //withCredentials: true,
        headers: {
            'Cache-Control': 'no-cache',
            'Content-type': 'application/json',
            'Connection': 'keep-alive',
            //'Authorization': 'Basic QVBJU1BFQzpPcmFjbGUxMjM0NSE='
            'Authorization': 'Basic ' + params.orbcParameters.token
        },
    });
    await instance.get('/').then(async(response) => {
        // docXML is the list of specifications
        let docXML = response.data;
        await promisesParser(docXML, { tagNameProcessors: [stripNS] }, ).then(
            async specJson => {
                fs.writeFile(params.jsonDir + '/spec' + item.recordId + '-' + item.specNumber + '-' + item.specVersion + '.json', JSON.stringify(specJson), (err) => {
                    if (err) onError('Error writing spec file', err);
                });
                if (onSuccess) onSuccess(specJson, () => {}, onError);
            }).catch((err) => {
            onError('Error parsing API return', err);
        });
    }).catch((err) => {
        onError('Error during spec API call', err);
        fs.writeFile(params.errDir + '/spec' + item.recordId + '-' + item.specNumber + '-' + item.specVersion + '.error', err, (err) => {
            if (err) onError('Error writing spec error file', err);
        });
    })
};

async function dbSodaClean(onSuccess, onError) {
    // SODA parameters
    oracledb.autoCommit = true;
    let connection; // DB Connection
    let soda; // SODA Connection
    let collection; // SODA Collection

    try {
        // Connecting to Oracle Autonomous Transaction Processing DB
        // Requires instant_client to be correctly configured
        // Requires TNS_ADMIN environment variable to be positionned

        connection = await oracledb.getConnection({
            user: params.dbConnection.dbUser,
            password: params.dbConnection.dbPassword,
            connectString: params.dbConnection.dbConnectString
        });

        // Connecting to the DB Soda Database
        soda = connection.getSodaDatabase();
        collection = await soda.createCollection("specifications").then(async(collection) => {
            await collection.drop();
        }).then(dropResult => { if (onSuccess) onSuccess(dropResult); }).catch((err) => { if (err) onError('Error dropping SODA DB', err) });

    } catch (err) {
        onError('ERROR Connection', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                onError('Soda Clean: Close Connection Failed', err);
            }
        }
    }
}

// SODA operations - inserts a JSON object into Collection
async function dbSodaInsert(docJson, onSuccess, onError) {
    // SODA parameters

    const instance = await axios.create({
        baseURL: params.ordsParameters.idcsUrl,
        //withCredentials: true,
        headers: {
            'Cache-Control': 'no-cache',
            'Content-type': 'application/json',
            'Connection': 'keep-alive',
            //'Authorization': 'Basic QVBJU1BFQzpPcmFjbGUxMjM0NSE='
            'Authorization': 'Basic ' + params.orbcParameters.token
        },
    });

    pm.sendRequest({
        url: "" + pm.variables.get('baseUrl') + "/services/private/PurchaseOrders/order/id",
        method: 'GET',
        header: {
            'content-type': 'application/json',
            'Accept': 'application/json',
            'Accept-Version': pm.variables.get('rms_rest_version'),
            'Accept-Language': 'en',
            'Authorization': `${'Bearer ' + pm.environment.get('OAuth_Token')}`
        }
    }, function(err, res) {
        pm.collectionVariables.set('po_number', res.json().order_no);
        console.log("Po Number: " + pm.collectionVariables.get('po_number'));
    });

    /*    oracledb.autoCommit = true;
        let connection;
        try {
            connection = await oracledb.getConnection({
                user: params.dbConnection.dbUser,
                password: params.dbConnection.dbPassword,
                connectString: params.dbConnection.dbConnectString
            });

            let soda = connection.getSodaDatabase();
            let collection = await soda.createCollection("specifications");
            try {
                let newDoc = await collection.insertOneAndGet(docJson);
                if (onSuccess) onSuccess(newDoc, () => {}, onError);
            } catch (err) {
                onError('SODA Insert Failure:', err);
            }
        } catch (err) {
            onError('Error SODA connect or create', err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    onError('Error closing SODA connection', err);
                }
            }
        }
        */
}

async function getSpecList(offset, pageSize, onSuccess, onError) {
    const instance = axios.create({
        url: params.orbcParameters.specSessionUrl,
        timeout: 100000,
        withCredentials: true,
        headers: {
            Authorization: 'Basic ' + params.orbcParameters.token
        }
    });
    let url = params.orbcParameters.specSessionUrl + '/?offset=' + offset + '&pageSize=' + pageSize;

    let specListJson = await instance.get(url).then(async docXML => {
            let specListJson = await promisesParser(docXML.data, { tagNameProcessors: [stripNS] }, );
            return specListJson;
        }).then(specListJson => {
            console.log('retrieved spec');
            fs.writeFile(params.specListFile + offset + '.json', JSON.stringify(specListJson), (errWrite) => { if (errWrite) onError('Error writing specs list', errWrite); });
            return specListJson;
        }).then(async specListJson => {
            if ((offset + pageSize) < specListJson.ProductSpecificationLinkList.totalRecords) {
                await getSpecList(offset + pageSize, pageSize, onSuccess, onError);
            }
            return specListJson;
        })
        .catch((err) => {
            onError('Error listing specs', err);
        });
    let result = await Promise.all([specListJson]);
    if (onSuccess) onSuccess(result[0], onError);
};

async function sync2soda(specListJson) {
    //await Promise.all(specListJson.ProductSpecificationLinkList.entries.map(recordSpec.bind(null, instance)));

    try {
        for (const item of specListJson.ProductSpecificationLinkList.entries) await recordSpec(item, dbSodaInsert, logError);
    } catch (err) {
        console.error('Error Recording Spec');
        console.error(err);
    };
};

async function logError(msg, err) {
    let date = new Date();

    if (logFileName) {
        fs.appendFile(logFileName, '\nERROR at ' + date.getTime() + '\n', (err) => { if (err) console.error(err) });
        if (msg) fs.appendFile(logFileName, 'MSG: ' + msg + '\n', (errWrite) => { if (errWrite) console.error(errWrite) });
        if (err) fs.appendFile(logFileName, 'ERR: ' + err + '\n', (errWrite) => { if (errWrite) console.error(errWrite) });
    } else {
        if (msg) console.error(msg);
        if (err) console.error(err);
    }
};

//dbSodaClean(() => { getSpecList(0, params.orbcParameters.pageSize, sync2soda, logError) }, logError);
getSpecList(0, params.orbcParameters.pageSize, sync2soda, logError);