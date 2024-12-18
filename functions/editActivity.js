const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

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

  // Verificar si la variable de entorno ACTIVITIES_TABLE está configurada
  if (!ACTIVITIES_TABLE) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "La tabla de actividades no está configurada correctamente.",
      }),
    };
  }

  const { activityId } = event.pathParameters; // Obtiene el activityId de la URL

  if (!activityId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "El activityId es obligatorio en la URL.",
      }),
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body); // Parsear el cuerpo de la solicitud
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "El cuerpo de la solicitud debe ser un JSON válido.",
      }),
    };
  }

  const {
    name,
    description,
    totalCapacity,
    availableCapacity,
    reservationDate,
  } = requestBody;

  // Verifica que el body contenga los datos necesarios
  if (!name || !description) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message:
          "Faltan campos requeridos: name y description son obligatorios.",
      }),
    };
  }

  // Parámetros para la actualización
  const params = {
    TableName: ACTIVITIES_TABLE,
    Key: {
      activityId: activityId, // Usa el activityId para buscar el item
    },
    UpdateExpression:
      "set #name = :name, #description = :description, #totalCapacity = :totalCapacity, #availableCapacity = :availableCapacity, #reservationDate = :reservationDate",
    ExpressionAttributeNames: {
      "#name": "name",
      "#description": "description",
      "#totalCapacity": "totalCapacity",
      "#availableCapacity": "availableCapacity",
      "#reservationDate": "reservationDate",
    },
    ExpressionAttributeValues: {
      ":name": name,
      ":description": description,
      ":totalCapacity": totalCapacity || 0, // Si no se pasa, lo actualizamos a 0
      ":availableCapacity": availableCapacity || 0, // Si no se pasa, lo actualizamos a 0
      ":reservationDate": reservationDate || "", // Si no se pasa, lo actualizamos a un string vacío
    },
    ReturnValues: "ALL_NEW", // Devuelve la actividad actualizada
  };

  try {
    // Actualizar la actividad en DynamoDB
    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Actividad actualizada correctamente.",
        activity: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error actualizando actividad", error);

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
