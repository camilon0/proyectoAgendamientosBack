const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;  // Usamos la tabla de actividades

module.exports.handler = async (event) => {
  const { activityId } = event.pathParameters;  // activityId de la URL

  // Validación de activityId
  if (!activityId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'activityId es obligatorio.' }),
    };
  }

  // Verificación de si la actividad existe en la tabla 'activities'
  const getParams = {
    TableName: ACTIVITIES_TABLE,  // Comprobamos en la tabla de actividades
    Key: { activityId },  // Usamos el activityId para buscar el ítem
  };

  try {
    const getResult = await dynamoDb.get(getParams).promise();

    // Si la actividad no existe, devolvemos un error
    if (!getResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Actividad no encontrada.' }),
      };
    }

    // Si la actividad existe, procedemos a eliminarla
    const deleteParams = {
      TableName: ACTIVITIES_TABLE,
      Key: { activityId },
    };

    await dynamoDb.delete(deleteParams).promise();
    
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
