const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  try {
    // Log para depuración de la solicitud completa
    console.log("Request event:", JSON.stringify(event, null, 2));

    // Manejo de event.body (puede llegar como string o como objeto)
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
      body = event.body; // Usar directamente si ya está parseado
    }

    // Log para depuración del cuerpo de la solicitud
    console.log("Parsed body:", body);

    // Desestructurar los parámetros necesarios
    const { activityId, name, reservationDate, description, capacity } = body;

    // Validar campos obligatorios
    if (
      !activityId ||
      !name ||
      !reservationDate ||
      !description ||
      capacity == null
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Faltan campos obligatorios: activityId, name, reservationDate, description, capacity.",
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

    // Validar que la fecha tenga el formato correcto (opcional)
    if (isNaN(Date.parse(reservationDate))) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "La fecha de reservación no tiene un formato válido.",
        }),
      };
    }

    // Crear el objeto de actividad
    const activity = {
      activityId: String(activityId).trim(), // Asegurarse de que sea una cadena
      name: String(name).trim(), // Limpiar espacios
      reservationDate: String(reservationDate).trim(), // Validar formato de fecha
      description: String(description).trim(), // Limpiar espacios
      totalCapacity: capacity, // Capacidad total inicial
      availableCapacity: capacity, // Capacidad disponible inicialmente
    };

    // Log para depuración del objeto de actividad
    console.log("Activity object to save:", activity);

    // Parámetros para DynamoDB
    const params = {
      TableName: ACTIVITIES_TABLE,
      Item: activity,
      ConditionExpression: "attribute_not_exists(activityId)", // Prevenir duplicados
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
    // Manejo de errores específicos
    if (error.code === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "La actividad ya existe con el mismo activityId.",
        }),
      };
    }

    // Log del error para depuración
    console.error("Error creando actividad:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor.",
        error: error.message,
      }),
    };
  }
};
