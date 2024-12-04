const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;

module.exports.handler = async (event) => {
  const { activityId } = event.queryStringParameters || {};

  let params = {
    TableName: RESERVATIONS_TABLE,
  };

  if (activityId) {
    // Si hay un activityId, usamos la condición de clave
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
    let result;
    
    // Si no hay un activityId, hacemos un scan para obtener todas las reservas
    if (activityId) {
      result = await dynamoDb.query(params).promise();
    } else {
      result = await dynamoDb.scan(params).promise();
    }

    // Verifica si se encontraron resultados
    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No se encontraron reservas.' }),
      };
    }

  } catch (error) {
    console.error('Error listando reservas', error);

    // Mejor manejo de error
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error interno del servidor.',
        error: error.message,
      }),
    };
  }
};
