const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION || "ap-south-1",
});

module.exports.handler = async (event) => {
  const tenantName = event.pathParameters.tenant;
  const querystring = event.queryStringParameters;
  console.log(querystring);
  console.log(tenantName);

  // var params = {
  //   KeyConditionExpression: "tenant = :tenant",
  //   ExpressionAttributeValues: {
  //     ":tenant": tenantName,
  //   },
  //   TableName: process.env.EVENT_TABLE,
  // };
  const dQueries = queryFomationEvents(tenantName, querystring);
  let response = {};
  try {
    var result = await dynamo.query(dQueries).promise();
    response.statusCode = 200;
    console.log(JSON.stringify(result));
    response.body = JSON.stringify(result.Items);
  } catch (error) {
    response.statusCode = 500;
    response.body = JSON.stringify("Error Occured on fetching the data");
    console.log(error);
  }
  return response;
};

const queryFomationEvents = (tenantName, querystring) => {
  var params = {};
  if (querystring) {
    if (querystring.from_date && querystring.to_date) {
      params = {
        KeyConditionExpression:
          "tenant = :tenant AND event_timestamp BETWEEN :stardDate AND :endDate",
        ExpressionAttributeValues: {
          ":tenant": tenantName,
          ":stardDate": querystring.from_date,
          ":endDate": querystring.to_date,
        },
        TableName: process.env.EVENT_TABLE,
      };
    } else if (querystring.user_id) {
      params = {
        KeyConditionExpression: "tenant = :tenant AND user_id = :userId",
        ExpressionAttributeValues: {
          ":tenant": tenantName,
          ":userId": querystring.user_id,
        },
        IndexName: "events_userid",
        TableName: process.env.EVENT_TABLE,
      };
    } else if (querystring.url) {
      params = {
        KeyConditionExpression: "tenant = :tenant AND urlName = :url",
        ExpressionAttributeValues: {
          ":tenant": tenantName,
          ":url": querystring.url,
        },
        IndexName: "events_url",
        TableName: process.env.EVENT_TABLE,
      };
    } else if (querystring.category) {
      params = {
        KeyConditionExpression: "tenant = :tenant AND category = :category",
        ExpressionAttributeValues: {
          ":tenant": tenantName,
          ":category": querystring.category,
        },
        IndexName: "events_category",
        TableName: process.env.EVENT_TABLE,
      };
    }
  } else {
    params = {
      KeyConditionExpression: "tenant = :tenant",
      ExpressionAttributeValues: {
        ":tenant": tenantName,
      },
      TableName: process.env.EVENT_TABLE,
    };
  }

  return params;
};
