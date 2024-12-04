const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;

module.exports.handler = async (event) => {
  const { activityId } = event.pathParameters; // activityId en la URL

  // Validación de activityId
  if (!activityId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'activityId es obligatorio.' }),
    };
  }

  const params = {
    TableName: RESERVATIONS_TABLE,
    Key: { activityId }, // El activityId para identificar la actividad
  };

  try {
    await dynamoDb.delete(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Actividad eliminada con éxito.' }),
    };
  } catch (error) {
    console.error('Error eliminando la actividad', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor.', error: error.message }),
    };
  }
};
