const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  try {
    // Verificar si event.body está definido y no es nulo
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "El cuerpo de la solicitud no puede estar vacío.",
        }),
      };
    }

    // Parsear el cuerpo de la solicitud
    const { activityId, name, description, capacity, reservationDate } =
      JSON.parse(event.body);

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
      activityId, // ID de la actividad
      name, // Nombre de la actividad
      description, // Descripción de la actividad
      reservationDate, // Fecha de reservación
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
      body: JSON.stringify({ message: "Error interno del servidor." }),
    };
  }
};
