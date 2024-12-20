const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async (event) => {
  try {
    console.log("Request event:", JSON.stringify(event, null, 2));

    let body;
    if (typeof event.body === "string") {
      try {
        body = JSON.parse(event.body);
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
      body = event.body;
    }

    console.log("Parsed body:", body);

    const { activityId, name, reservationDate, description, capacity } = body;

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

    if (typeof capacity !== "number" || capacity <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "La capacidad debe ser un número positivo.",
        }),
      };
    }

    if (isNaN(Date.parse(reservationDate))) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "La fecha de reservación no tiene un formato válido.",
        }),
      };
    }

    const activity = {
      activityId: String(activityId).trim(),
      name: String(name).trim(),
      reservationDate: String(reservationDate).trim(),
      description: String(description).trim(),
      //totalCapacity: capacity,
      availableCapacity: capacity,
    };

    console.log("Activity object to save:", activity);

    // Parámetros para DynamoDB (actualizar o crear actividad)
    const params = {
      TableName: ACTIVITIES_TABLE,
      Key: { activityId: activity.activityId },
      UpdateExpression:
        "SET #name = :name, #reservationDate = :reservationDate, #description = :description, #availableCapacity = :availableCapacity",
      ExpressionAttributeNames: {
        "#name": "name",
        "#reservationDate": "reservationDate",
        "#description": "description",
        "#availableCapacity": "availableCapacity"
      },
      ExpressionAttributeValues: {
        ":name": activity.name,
        ":reservationDate": activity.reservationDate,
        ":description": activity.description,
        ":availableCapacity": activity.availableCapacity,
      },
      ReturnValues: "ALL_NEW",
    };

    // Realizar operación en DynamoDB
    const result = await dynamoDb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Actividad creada o actualizada exitosamente.",
        activity: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Error creando o actualizando actividad:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor.",
        error: error.message,
      }),
    };
  }
};
