# Campaign Products Demo

Corrected Named Credential metadata for API 60. Use this repo if your deploy failed on identityType.

## Deploy
sf project deploy start -o <org>
sf org assign permset -n Campaign_Products_Demo -o <org>

## Configure Named Credential
Edit ProductsAPI in Setup and set the Endpoint to either the GitHub raw URL of data/products.json or your Render /products URL.

## Use
Add Campaign Products to the Campaign record page. Save selections to Campaign.Products__c.
