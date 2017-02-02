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

### Questionnaire Entity

```json

{
  "data": [
    {
      "type": "questionnaire",
      "id": "5893463dbd106700c9cbef3c",
      "attributes": {
        "name": "Ra questionnaire",
        "questions": [
          {
            "type": "text",
            "label": "Name",
            "defaultValue": "Insert your name",
            "_id": "5893463dbd106700c9cbef41",
            "required": false,
            "values": []
          },
          {
            "type": "checkbox",
            "label": "Range age",
            "_id": "5893463dbd106700c9cbef40",
            "required": false,
            "values": [
              "0-18",
              "19-50",
              "+50"
            ]
          },
          {
            "type": "radio",
            "label": "Gender",
            "_id": "5893463dbd106700c9cbef3f",
            "required": false,
            "values": [
              "Male",
              "Female"
            ]
          },
          {
            "type": "text",
            "label": "Photo",
            "_id": "5893463dbd106700c9cbef3e",
            "required": true,
            "values": []
          },
          {
            "type": "select",
            "label": "Country",
            "_id": "5893463dbd106700c9cbef3d",
            "required": false,
            "values": [
              "Spain",
              "EEUU"
            ]
          }
        ],
        "createdAt": "2017-02-02T14:46:21.862Z"
      }
    }
  ]
}

```

### CRUD Questionnaire

```

All endpoints are logged.  Check if user is ADMIN or MANAGER in gfw application

GET: /questionnaire -> Return all questionnaires of the user logged
GET: /questionnaire/:id -> Return questionnaire with the same id. Check if user is ADMIN or MANAGER in gfw application
POST: /questionnaire -> Create an questionnaire and associate to the user. With body:
{  
   "name":"Example",
   "questions":[  
      {  
         "type":"text",
         "label":"Name",
         "defaultValue":"Insert your name"
      },
      {  
         "type":"checkbox",
         "label":"Range age",
         "values":[  
            "0-18",
            "19-50",
            "+50"
         ]
      },
      {  
         "type":"radio",
         "label":"Gender",
         "values":[  
            "Male",
            "Female"
         ]
      },
      {  
         "type":"blob",
         "label":"Photo",
         "required":true
      },
      {  
         "type":"select",
         "label":"Country",
         "values":[  
            "Spain",
            "EEUU"
         ]
      }
   ]
}


PATCH: /questionnaire/:id -> Update the questionnaire with the same id. 
DELETE: /questionnaire/:id -> Delete the questionnaire with the same id. 

```


### CRUD Questionnaire answers

```

GET: /questionnaire/:idQuestionnaire/answer -> Return all answers of the questionnaires of the user logged
GET: /questionnaire/:idQuestionnaire/answer/answer/:id -> Return answer with the same id. Check if the answer is owned of the logged user
POST: /questionnaire/:idQuestionnaire/answer  -> Create an answer of the questionnaire with the id of the param and associate to the user. With body:
Without Content-type (is possible send files)
<questionId>:<responseValue>
5893463dbd106700c9cbef41:Pepe
5893463dbd106700c9cbef40:0-18,19-50
5893463dbd106700c9cbef3f:Male
5893463dbd106700c9cbef3d:Spain


PATCH: /questionnaire/:idQuestionnaire/answer/:id -> Update the answer with the same id. Check if the ansers is owned of the logged user
DELETE: /questionnaire/:idQuestionnaire/answer/:id -> Delete the asnwer with the same id. Check if the answer is owned of the logged user

```
