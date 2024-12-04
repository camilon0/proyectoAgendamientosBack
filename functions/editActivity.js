const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  const { activityId } = event.pathParameters; // Obtiene el activityId de la URL
  const requestBody = JSON.parse(event.body); // Cuerpo de la solicitud con los nuevos datos

  // Verifica que el body contenga los datos necesarios
  if (!requestBody.name || !requestBody.description) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Faltan campos requeridos en el cuerpo de la solicitud.' }),
    };
  }

  const { name, description, totalCapacity, availableCapacity, reservationDate } = requestBody;

  // Parámetros para la actualización
  const params = {
    TableName: ACTIVITIES_TABLE,
    Key: {
      activityId: activityId, // Usa el activityId para buscar el item
    },
    UpdateExpression: 'set #name = :name, #description = :description, #totalCapacity = :totalCapacity, #availableCapacity = :availableCapacity, #reservationDate = :reservationDate',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#description': 'description',
      '#totalCapacity': 'totalCapacity',
      '#availableCapacity': 'availableCapacity',
      '#reservationDate': 'reservationDate',
    },
    ExpressionAttributeValues: {
      ':name': name,
      ':description': description,
      ':totalCapacity': totalCapacity || 0, // Si no se pasa, lo actualizamos a 0
      ':availableCapacity': availableCapacity || 0, // Si no se pasa, lo actualizamos a 0
      ':reservationDate': reservationDate || '', // Si no se pasa, lo actualizamos a un string vacío
    },
    ReturnValues: 'ALL_NEW', // Devuelve la actividad actualizada
  };

  try {
    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Actividad actualizada correctamente', activity: result.Attributes }),
    };
  } catch (error) {
    console.error('Error actualizando actividad', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error interno del servidor.',
        error: error.message,
      }),
    };
  }
};
