'use strict';

var util = require('util');

module.exports = {
  getAll: getAll
};

function getAll(req, res) {
  var cases = [
  {
    "id": "tc001",
    "name": "test-case",
    "targets": [
      {
        "id": "trg000001",
        "caseId": "test-case",
        "title": "test-case",
        "lastUpdateDate": "2016-08-16T11:43:45.665Z",
        "resolution": 23.45,
        "count": 1,
        "polygon": {
          "type": "MultiPolygon",
          "coordinates": [
            [
              [
                [
                  35.169988771058954,
                  32.90734716142751,
                  0
                ],
                [
                  35.16969307561126,
                  32.9072573298991,
                  0
                ],
                [
                  35.169835308864585,
                  32.90686618845247,
                  0
                ],
                [
                  35.170164691135426,
                  32.90695789147106,
                  0
                ],
                [
                  35.169988771058954,
                  32.90734716142751,
                  0
                ]
              ]
            ]
          ]
        },
        "state": {}
      }
    ]
  }
]
  res.json(cases);
}
