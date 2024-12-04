const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  try {
    // Verificar si event.body está definido y no es nulo
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El cuerpo de la solicitud no puede estar vacío." }),
      };
    }

    // Parsear el cuerpo de la solicitud
    const { activityId, name, description, capacity } = JSON.parse(event.body);

    // Validar campos obligatorios
    if (!activityId || !name || !description || !capacity) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Faltan campos obligatorios: activityId, name, description, capacity.",
        }),
      };
    }

    // Crear el objeto de actividad
    const activity = {
      activityId,
      name,
      description,
      capacity,
    };

    // Parámetros para DynamoDB
    const params = {
      TableName: ACTIVITIES_TABLE,
      Item: activity,
    };

    // Insertar actividad en DynamoDB
    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Actividad creada exitosamente." }),
    };
  } catch (error) {
    console.error("Error creando actividad", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno del servidor." }),
    };
  }
};