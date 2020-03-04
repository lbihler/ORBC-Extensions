"use Strict"

// Lading parameters
const params = require('./conf/parameters.json');

// include node modules
const oracledb = require('oracledb');
const fs = require('fs');


const dbUser = params.dbConnection.dbUser;
const dbPassword = params.dbConnection.dbPassword;
const dbConnectString = params.dbConnection.dbConnectString;

// SODA operations - inserts a JSON object into Collection
async function dbInsert(connection, item) {
    // DB parameters
    oracledb.autoCommit = true;

    const createdby = 'InserSpecList.js';
    const query = `INSERT INTO bcspeclist (
        recordid,
        recordlink,
        specnumber,
        specversion,
        title,
        createdby,
        tscreated,
        updatedby,
        tsupdated
    ) VALUES (
        :recordid,
        :recordlink,
        :specnumber,
        :specversion,
        :title,
        :createdby,
        CURRENT_TIMESTAMP,
        NULL,
        NULL
    )`

    let values = [item.recordId[0], item.recordLink[0], item.specNumber[0], item.specVersion[0], item.title[0], createdby];

    try {
        let result = await connection.execute(query, values);
        console.log('Rows inserted: ' + result.rowsAffected);
    } catch (err) { console.error(err); }

}

async function readSpecList() {
    // Connecting to Oracle Autonomous Transaction Processing DB
    // Requires instant_client to be correctly configured
    // Requires TNS_ADMIN environment variable to be positionned

    let connection = await oracledb.getConnection({
        user: dbUser,
        password: dbPassword,
        connectString: dbConnectString
    });

    fs.readFile(params.specFile, "utf8", (err, data) => {
        specListJson = JSON.parse(data);
        specListJson.ProductSpecificationLinkList.entries.map(dbInsert.bind(null, connection));
    });

};

readSpecList();