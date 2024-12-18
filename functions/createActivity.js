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

  try {
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

    // Verificar si event.body está definido y no es nulo
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "El cuerpo de la solicitud no puede estar vacío.",
        }),
      };
    }

    // Parsear el cuerpo de la solicitud
    const { activityId, name, description, capacity } = JSON.parse(event.body);

    // Validar campos obligatorios
    if (!activityId || !name || !description || capacity == null) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message:
            "Faltan campos obligatorios: activityId, name, description, capacity.",
        }),
      };
    }

    // Validar que la capacidad sea un número positivo
    if (typeof capacity !== "number" || capacity <= 0) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "La capacidad debe ser un número positivo.",
        }),
      };
    }

    // Crear el objeto de actividad
    const activity = {
      activityId,
      name,
      description,
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
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
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
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "La actividad ya existe con el mismo activityId.",
        }),
      };
    }

    console.error("Error creando actividad", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Error interno del servidor." }),
    };
  }
};
