const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  try {
    // Verificar si el cuerpo de la solicitud (event.body) está definido
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "El cuerpo de la solicitud no puede estar vacío.",
        }),
      };
    }

    // Parsear el cuerpo de la solicitud
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "El cuerpo de la solicitud no tiene un formato JSON válido.",
        }),
      };
    }

    // Desestructurar los parámetros del cuerpo
    const { activityId, name, description, capacity, reservationDate } = body;

    // Validar campos obligatorios
    if (
      !activityId ||
      !name ||
      !description ||
      capacity == null || // Asegurarse de que el valor no sea nulo ni undefined
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
      activityId: String(activityId), // Asegurarse de que el ID sea un string
      name: String(name).trim(), // Asegurarse de que el nombre sea un string y eliminar espacios en blanco
      description: String(description).trim(), // Asegurarse de que la descripción sea un string
      reservationDate: String(reservationDate).trim(), // Convertir la fecha a string
      totalCapacity: capacity, // Capacidad total inicial
      availableCapacity: capacity, // Capacidad disponible inicialmente
    };

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
