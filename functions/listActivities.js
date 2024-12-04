const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async () => {
  const params = {
    TableName: ACTIVITIES_TABLE,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error listando actividades', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor.' }),
    };
  }
};
