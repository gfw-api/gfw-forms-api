# GFW Forms API


This repository is the microservice that implements the forms and Questionnaire funcionalities

1. [Getting Started](#getting-started)

## Getting Started

### OS X

**First, make sure that you have the [API gateway running
locally](https://github.com/control-tower/control-tower).**

We're using Docker which, luckily for you, means that getting the
application running locally should be fairly painless. First, make sure
that you have [Docker Compose](https://docs.docker.com/compose/install/)
installed on your machine.

```
git clone https://github.com/Vizzuality/gfw-forms-api.git
cd gfw-forms-api
./forms.sh develop
```text

You can now access the microservice through the CT gateway.

```

### Configuration

It is necessary to define these environment variables:

* CT_URL => Control Tower URL
* NODE_ENV => Environment (prod, staging, dev)


## Quick Overview

### Report template entity

```json

{
  "data": [
    {
      "type": "template",
      "id": "5893463dbd106700c9cbef3c",
      "attributes": {
        "areaOfInterest": "aoi-id",
        "languages": ["EN", "ES"],
        "defaultLanguage": "EN",
        "name": {
          "EN": "My report template",
          "ES": "Mi report templato"
        },
        "questions": [
          {
            "type": "text",
            "label": {
              "EN": "Name",
              "ES": "Nombre"
            },
            "name": "name",
            "_id": "591b198189199500118c568a",
            "conditions": [],
            "childQuestions": [],
            "order": 1,
            "required": false,
            "values": {},
            "defaultValue": {
              "EN": "Insert your name",
              "ES": "Spanish"
            }
          },
          {
            "type": "checkbox",
            "label": {
              "EN": "Range age",
              "ES": "Spanish"
            },
            "name": "age",
            "_id": "591b198189199500118c5688",
            "conditions": [],
            "order": 2,
            "required": false,
            "values": {
              "EN": [
                { "value": 0, "label": "0-32"},
                { "value": 1, "label": "33-50"}
              ],
              "ES": [
                { "value": 0, "label": "0-32"},
                { "value": 1, "label": "33-50"}
              ]
            },
            "defaultValue": 0,
            "childQuestions": [
              {
                "type": "text",
                "label": {
                  "EN": "Specific age",
                  "ES": "Specific age"
                },
                "name": "specific-age",
                "defaultValue": {
                  "EN": "Insert your name",
                  "ES": "Spanish"
                },
                "conditionalValue": 0,
                "_id": "591b198189199500118c5689",
                "order": 0,
                "required": true,
                "values": {}
              }
            ]
          }
        ],
        "createdAt": "2017-05-17T17:45:03.188Z"
      }
    }
  ]
}

```

### CRUD Questionnaire

```json

All endpoints are logged.  Check if user is ADMIN or MANAGER in gfw application

GET: /template -> Return all report templates of the user logged
GET: /template/:id -> Return report templates with the same id. Check if user is ADMIN or MANAGER in gfw application
POST: /template -> Create an report template and associate to the user. With body:
{  
   "areaOfInterest": "aoi-id",
   "languages": ["EN", "ES"],
   "defaultLanguage": "EN",
   "name": {
     "EN": "My report template",
     "ES": "Mi report templato"
   },
   "questions":[  
      {  
         "type":"text",
         "label":"Name",
         "name": "name",
         "defaultValue":"Insert your name",
         "order": 1,
      },
      {  
         "type":"checkbox",
         "label":"Range age",
         "name": "age",
         "values":[  
            "0-18",
            "19-50",
            "+50"
         ],
         "order": 2,
         "childQuestions": [
            {
              "type": "text",
              "label": "Specific age",
              "name": "specific-age",
              "defaultValue": "Insert your age",
              "conditionalValue": "0-18",
              "order": 0,
              "required": true,
              "values": []
            }
          ]
      },
      {  
         "type":"radio",
         "label":"Gender",
         "name": "gender",
         "values":[  
            "Male",
            "Female"
         ],
         "order": 3,
      },
      {  
         "type":"blob",
         "label":"Photo",
         "name": "photo",
         "required":true,
         "order": 4,
      },
      {  
         "type":"select",
         "label":"Country",
         "name": "country",
         "conditions": [{
           "name": "gender",
           "value": "Female"
         }],
         "order": 5,
         "values":[  
            "Spain",
            "EEUU"
         ]
      }
   ]
}


PATCH: /template/:id -> Update the report template with the same id.
DELETE: /template/:id -> Delete the report template with the same id.

```


### CRUD report answers

```

GET: /report/:id/answer -> Return all answers of the questionnaires of the user logged
GET: /report/:id/answer/answer/:id -> Return answer with the same id. Check if the answer is owned of the logged user
POST: /questionnaire/:id/answer  -> Create an answer of the questionnaire with the id of the param and associate to the user. With body:
Without Content-type (is possible send files)
<questionId>:<responseValue>
5893463dbd106700c9cbef41:Pepe
5893463dbd106700c9cbef40:0-18,19-50
5893463dbd106700c9cbef3f:Male
5893463dbd106700c9cbef3d:Spain


PATCH: /questionnaire/:id/answer/:id -> Update the answer with the same id. Check if the ansers is owned of the logged user
DELETE: /questionnaire/:id/answer/:id -> Delete the asnwer with the same id. Check if the answer is owned of the logged user

```
