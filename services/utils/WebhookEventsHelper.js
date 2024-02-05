const md5 = require("md5");
const fetch = require("cross-fetch");

class WebhookEventsHelper {
  static async getEventsItemPutParams(data, tenant) {
    const now = new Date().toISOString();
    await this.getCategory(data.url);
    return {
      TableName: process.env.EVENT_TABLE,
      Item: {
        tenant: tenant,
        event_timestamp: data.event_timestamp,
        user_id: data.user_id,
        url: data.url,
        body: data.body,
        category: data.category ? data.category : "",
        CreatedAt: now,
        UpdatedAt: now,
      },
    };
  }

  static async getCategory(url) {
    const API_KEY = "qz8writfyk91pokAwozw";
    const SECRET_KEY = "hwyZnxQ7munqDzevfBxm";
    let base64Data = Buffer.from(url, "base64");
    let md5Data =
      SECRET_KEY + ":categories/v3/" + base64Data + "?key=" + API_KEY;
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
    const data = await resp.json();
    console.log("data", data);
  }
}

export default WebhookEventsHelper;
