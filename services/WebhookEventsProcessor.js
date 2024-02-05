const AWS = require("aws-sdk");
const md5 = require("md5");
const fetch = require("cross-fetch");

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION || "ap-south-1",
});

//API_KEY and SECRET_KEY - need to be moved to secrets
const API_KEY = "qz8writfyk91pokAwozw";
const SECRET_KEY = "hwyZnxQ7munqDzevfBxm";

module.exports.handler = async (event) => {
  const tenantName = event.pathParameters.tenant;
  console.log(tenantName);
  const eventData = JSON.parse(event.body);
  let response = {};
  try {
    const dbParams = await getEventsItemPutParams(eventData, tenantName);
    const ddbResponse = await dynamo.put(dbParams).promise();
    console.log(ddbResponse);
    response = {
      statusCode: 201,
      body: JSON.stringify({ message: "success " + tenantName }),
    };
  } catch (error) {
    console.log(error);
    response = {
      statusCode: 502,
      body: JSON.stringify({ message: "Failed " + tenantName }),
    };
  }

  return response;
};

const getEventsItemPutParams = async (data, tenant) => {
  const now = new Date().toISOString();
  const categoryLabel = await getCategory(data.url);
  return {
    TableName: process.env.EVENT_TABLE,
    Item: {
      tenant: tenant,
      event_timestamp: data.event_timestamp,
      user_id: data.user_id,
      urlName: data.url,
      body: data.body,
      category: categoryLabel,
      CreatedAt: now,
      UpdatedAt: now,
    },
  };
};

const getCategory = async (url) => {
  let bufferObj = Buffer.from(url, "utf8");
  let base64Data = bufferObj.toString("base64");
  let md5Data = SECRET_KEY + ":categories/v3/" + base64Data + "?key=" + API_KEY;
  let hash = md5(md5Data);
  let categoryUrl =
    "https://api.webshrinker.com/categories/v3/" +
    base64Data +
    "?key=" +
    API_KEY +
    "&hash=" +
    hash;
  console.log("categoryUrl", categoryUrl);
  const resp = await fetch(categoryUrl);
  if (resp.status >= 400) {
    console.log("Bad response from server");
    // throw new Error("Bad response from server");
  }
  const jsonData = await resp.json();
  console.log("jsonData", jsonData);
  console.log("jsonData", jsonData.data[0].categories[0].label);
  let categoryLabel = "";
  try {
    categoryLabel = jsonData.data[0].categories[0].label;
  } catch (error) {
    categoryLabel = "NA";
  }
  return categoryLabel;
};
