// utils/loadEvaluators.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function loadEvaluators() {
  return new Promise((resolve, reject) => {
    const evaluators = [];
    fs.createReadStream(path.join(__dirname, '../data/evaluator.csv'))
      .pipe(csv())
      .on('data', (row) => {
        evaluators.push({
          username: row.firstname.toLowerCase(),
          password: row.id
        });
      })
      .on('end', () => resolve(evaluators))
      .on('error', reject);
  });
}

module.exports = loadEvaluators;
