const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const client = new DynamoDBClient({ region: process.env.REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });
const db = {
  async put(t, item) { await docClient.send(new PutCommand({ TableName: t, Item: item })); return item; },
  async get(t, pk, sk) { const { Item } = await docClient.send(new GetCommand({ TableName: t, Key: { PK: pk, SK: sk } })); return Item || null; },
  async query(t, pk, skPrefix, opts = {}) {
    const p = { TableName: t, ScanIndexForward: opts.ascending ?? false, ...(opts.limit && { Limit: opts.limit }) };
    if (opts.indexName) { p.IndexName = opts.indexName; p.KeyConditionExpression = skPrefix ? "GSI1PK = :pk AND begins_with(GSI1SK, :sk)" : "GSI1PK = :pk"; }
    else { p.KeyConditionExpression = skPrefix ? "PK = :pk AND begins_with(SK, :sk)" : "PK = :pk"; }
    p.ExpressionAttributeValues = { ":pk": pk }; if (skPrefix) p.ExpressionAttributeValues[":sk"] = skPrefix;
    const { Items } = await docClient.send(new QueryCommand(p)); return Items || [];
  },
  async update(t, pk, sk, updates) {
    const keys = Object.keys(updates).filter(k => updates[k] !== undefined); if (!keys.length) return;
    const expr = keys.map((k, i) => `#k${i} = :v${i}`).join(", ");
    const names = {}, values = {}; keys.forEach((k, i) => { names[`#k${i}`] = k; values[`:v${i}`] = updates[k]; });
    const { Attributes } = await docClient.send(new UpdateCommand({ TableName: t, Key: { PK: pk, SK: sk }, UpdateExpression: `SET ${expr}`, ExpressionAttributeNames: names, ExpressionAttributeValues: values, ReturnValues: "ALL_NEW" }));
    return Attributes;
  },
  async delete(t, pk, sk) { await docClient.send(new DeleteCommand({ TableName: t, Key: { PK: pk, SK: sk } })); },
};
module.exports = { db, docClient };
