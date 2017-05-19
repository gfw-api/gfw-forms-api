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

### Report entity

```json

{
  "data": [
    {
      "type": "reports",
      "id": "591f2513d3a6c4003f4960b4",
      "attributes": {
        "name": {},
        "languages": [
          "EN",
          "ES"
        ],
        "defaultLanguage": "EN",
        "areaOfInterest": "aoi-id",
        "user": "1a10d7c6e0a37126611fd7a7",
        "questions": [
          {
            "type": "text",
            "name": "name",
            "defaultValue": {
              "EN": "Insert your name",
              "ES": "Spanish"
            },
            "_id": "591f2513d3a6c4003f4960b7",
            "conditions": [],
            "childQuestions": [],
            "order": 1,
            "required": false,
            "label": {
              "EN": "Name",
              "ES": "Nombre"
            }
          },
          {
            "type": "checkbox",
            "name": "age",
            "defaultValue": 0,
            "_id": "591f2513d3a6c4003f4960b5",
            "conditions": [],
            "childQuestions": [
              {
                "type": "text",
                "name": "specific-age",
                "defaultValue": {
                  "EN": "Insert your name",
                  "ES": "Spanish"
                },
                "conditionalValue": 0,
                "_id": "591f2513d3a6c4003f4960b6",
                "order": 0,
                "required": true,
                "label": {
                  "EN": "Specific age",
                  "ES": "Specific age"
                }
              }
            ],
            "order": 2,
            "required": false,
            "values": {
              "EN": [
                {
                  "value": 0,
                  "label": "19-32"
                },
                {
                  "value": 1,
                  "label": "12-43"
                }
              ],
              "ES": [
                {
                  "value": 0,
                  "label": "18-12"
                },
                {
                  "value": 1,
                  "label": "12-45"
                }
              ]
            },
            "label": {
              "EN": "Range age",
              "ES": "Spanish"
            }
          }
        ],
        "createdAt": "2017-05-19T17:02:11.415Z"
      }
    }
  ]
}

```

### CRUD Questionnaire

```json

All endpoints are logged.  Check if user is ADMIN or MANAGER in gfw application

GET: /reports -> Return all reports accessible to user logged
GET: /reports/:id -> Returns report with the same id. Check if user is ADMIN or MANAGER in gfw application
POST: /reports -> Create an report and associate to the user. With body:
{
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
      "conditions": [],
      "order": 2,
      "required": false,
      "values": {
        "EN": [
          { "value": 0, "label": "19-32"},
          { "value": 1, "label": "12-43"}
        ],
        "ES": [
          { "value": 0, "label": "18-12"},
          { "value": 1, "label": "12-45"}
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
          "order": 0,
          "required": true,
          "values": {}
        }
      ]
    }
  ]
}



PATCH: /reports/:id -> Update the report with the same id.
DELETE: /reports/:id -> Delete the report with the same id.

```


### CRUD report answers

```

GET: /report/:id/answers -> Return all answers of the report by id of the user logged
GET: /report/:id/answers/:id -> Return answer with the same id. Check if the answer is owned of the logged user
POST: /reports/:id/answers  -> Create an answer to the report with the id of the report and associate to the user. With body:
Without Content-type (it is possible send files)
<questionName>:<responseValue>
name:Pepe
age:0-18,19-50
specific-age:32


PATCH: /reports/:id/answer/:id -> Update the answer with the same id. Check if the answer is owned by the logged user
DELETE: /reports/:id/answer/:id -> Delete the answer with the same id. Check if the answer is owned by the logged user

```

### Download report answers

```

GET: /reports/:id/download-answers -> downloads all answers to the report by :id.

```

WIP:
* All PATCH under development
* Accept query params to all GET requests
* Download individual answers for reports
