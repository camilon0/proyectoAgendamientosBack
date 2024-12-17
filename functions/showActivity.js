const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  const { activityId } = event.pathParameters; // Obtiene el activityId de la URL

  // Parámetros para la lectura de la actividad
  const params = {
    TableName: ACTIVITIES_TABLE,
    Key: {
      activityId: activityId, // Usa el activityId para buscar el item
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();

    // Verifica si la actividad existe
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Actividad no encontrada.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error obteniendo actividad', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error interno del servidor.',
        error: error.message,
      }),
    };
  }
};
