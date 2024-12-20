const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  try {
    console.log("Request event:", JSON.stringify(event, null, 2)); // Log completo para depuración
    console.log("Request event body:", event.body); // Log específico del cuerpo

    let body;
    if (typeof event.body === "string") {
      try {
        body = JSON.parse(event.body); // Intentar parsear si es una cadena
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "El cuerpo de la solicitud no tiene un formato JSON válido.",
          }),
        };
      }
    } else {
      body = event.body; // Usar directamente si ya es un objeto
    }

    // Desestructurar los parámetros
    const { activityId, name, description, capacity, reservationDate } = body;

    // Validar campos obligatorios
    if (
      !activityId ||
      !name ||
      !description ||
      capacity == null ||
      !reservationDate
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Faltan campos obligatorios: activityId, name, description, capacity, reservationDate.",
        }),
      };
    }

    // Validar que la capacidad sea un número positivo
    if (typeof capacity !== "number" || capacity <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "La capacidad debe ser un número positivo.",
        }),
      };
    }

    // Crear el objeto de actividad
    const activity = {
      activityId: String(activityId),
      name: String(name).trim(),
      description: String(description).trim(),
      reservationDate: String(reservationDate).trim(),
      availableCapacity: availableCapacity
    };

    // Parámetros para DynamoDB
    const params = {
      TableName: ACTIVITIES_TABLE,
      Item: activity,
      ConditionExpression: "attribute_not_exists(activityId)",
    };

    // Insertar actividad en DynamoDB
    await dynamoDb.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Actividad creada exitosamente.",
        activity,
      }),
    };
  } catch (error) {
    if (error.code === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "La actividad ya existe con el mismo activityId.",
        }),
      };
    }

    console.error("Error creando actividad", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor.",
        error: error.message,
      }),
    };
  }
};
