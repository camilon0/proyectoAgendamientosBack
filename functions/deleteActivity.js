const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE; // Usamos la tabla de actividades

module.exports.handler = async (event) => {
  // Manejar solicitudes preflight (OPTIONS) para CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Cambia "*" por un dominio específico si necesitas restringir el acceso.
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: null,
    };
  }

  // Validar si la variable de entorno RESERVATIONS_TABLE está configurada
  if (!RESERVATIONS_TABLE) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "La tabla de reservas no está configurada correctamente.",
      }),
    };
  }

  const { activityId } = event.pathParameters; // activityId en la URL

  // Validación de activityId
  if (!activityId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "activityId es obligatorio." }),
    };
  }

  // Verificación de si la actividad existe en la tabla 'activities'
  const getParams = {
    TableName: ACTIVITIES_TABLE, // Comprobamos en la tabla de actividades
    Key: { activityId }, // Usamos el activityId para buscar el ítem
  };

  try {
    // Eliminar actividad de DynamoDB
    await dynamoDb.delete(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Actividad eliminada con éxito." }),
    };
  } catch (error) {
    console.error("Error eliminando la actividad", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error interno del servidor.",
        error: error.message,
      }),
    };
  }
};
