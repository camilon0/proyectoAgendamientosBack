const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;

module.exports.handler = async (event) => {
  const { activityId } = event.queryStringParameters || {};

  let params = {
    TableName: RESERVATIONS_TABLE,
  };

  if (activityId) {
    params = {
      ...params,
      IndexName: 'activityId-index',
      KeyConditionExpression: 'activityId = :activityId',
      ExpressionAttributeValues: {
        ':activityId': activityId,
      },
    };
  }

  try {
    const result = await dynamoDb.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error listando reservas', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor.' }),
    };
  }
};
