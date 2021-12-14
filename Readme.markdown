## Searchly Sample Node.js Application

This example illustrates basic search features of Searchly.

Sample application is using [Nodejs](https://github.com/elasticsearch/elasticsearch-js) Elasticsearch client to integrate with Searchly.

To create initial index and sample data click Create Sample Index & Data!

Type "John" or "Robert" to search box and hit enter for sample search results.

## Local Setup

To run example in your local environment with a local Elasticsearch instance, change connection string with local url string inside web.js

var connectionString = 'http://localhost:9200';

## PAAS Deployment

This sample can be deployed to Heroku, Pivotal, IBM Cloud with no change.

## Using

1-) start command `node app.js`

2-) Go: http://localhost:4000

3-) edit the index and type app.js (line 31-32) & line 23 data route (Json)

4-) CREATE INDICES: http://localhost:4000/index

INSERT DATA FROM JSON http://localhost:4000/insert

Other routes optional
