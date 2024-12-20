const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const { checkAvailability, updateActivityCapacity } = require('./utils');

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

module.exports.handler = async (event) => {
  try {
    let body;

    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El cuerpo de la solicitud no es válido." }),
      };
    }

    const { name, activityId, reservationDate, quantity } = body;
    const parsedQuantity = Number(quantity);

    if (!name || !activityId || !reservationDate || parsedQuantity <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Faltan campos obligatorios o la cantidad no es válida." }),
      };
    }

    const available = await checkAvailability(activityId, reservationDate, parsedQuantity);
    if (!available) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No hay disponibilidad suficiente para esta actividad en esta fecha." }),
      };
    }

    // Consultar la actividad por ID
    const activityParams = {
      TableName: ACTIVITIES_TABLE,
      Key: { activityId },
    };

    const activityResult = await dynamoDb.get(activityParams).promise();

    if (!activityResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "La actividad no fue encontrada." }),
      };
    }

    const activity = activityResult.Item;

    const reservationId = `RES-${Date.now()}`;
    const reservation = {
      reservationId,
      name,
      activityId,
      reservationDate,
      quantity: parsedQuantity,
      status: 'confirmed',
    };

    const params = {
      TableName: RESERVATIONS_TABLE,
      Item: reservation,
    };

    await dynamoDb.put(params).promise();
    await updateActivityCapacity(activityId, parsedQuantity);

    // Crear el mensaje con la información de la actividad
    const textMessage = `
    Confirmación de Reserva
    =======================
    ¡Gracias por tu reserva!
    Correo: ${name}
    Actividad: ${activity.name}
    Descripción: ${activity.description}
    Fecha de la Reserva: ${reservationDate}
    Cantidad: ${parsedQuantity}
    Número de Confirmación: ${reservationId}
    
    Si tienes alguna duda, no dudes en contactarnos.
  `;

    const snsParams = {
      Message: textMessage,
      TopicArn: SNS_TOPIC_ARN,
    };

    await sns.publish(snsParams).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Reserva realizada con éxito.", reservationId }),
    };
  } catch (error) {
    console.error("Error procesando la reserva:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno del servidor. Por favor, inténtelo más tarde." }),
    };
  }
};
