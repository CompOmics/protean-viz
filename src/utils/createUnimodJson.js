// const fs = require("fs");
import * as fs from "fs"
/**
 * 
 * 0 unimod_id: Number
 * 1 code_name: String
 * 2 full_name: String
 * 3 avg_mass: Float
 * 7 classification: String
 * 
 */
let unimodJson = []
let unimodIds = []
fs.readFile("Unimod_database.csv", "utf-8", (err, data) => {
    if (err) console.log(err);
    else {
        const dataArray = data.split(/\r?\n/).filter(Boolean).map(row => row.split(','))
        dataArray.forEach((row, index) => {
            if(index !== 0 && !unimodIds.includes(row[0])) {
                const tmp = {
                    unimod_id: row[0],
                    code_name: row[1],
                    full_name: row[2],
                    avg_mass: row[3],
                    classification: row[7]
                }
                unimodIds.push(row[0])
                unimodJson.push(tmp)
            }
        })
        const jsonString = JSON.stringify(unimodJson, null, 2)
        fs.writeFile("unimod_db.json", jsonString, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('Data written to file');
            }
        });
    }
});