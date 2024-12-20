const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const { checkAvailability, updateActivityCapacity } = require('./utils');

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

module.exports.handler = async (event) => {
  try {
    // Parsear el cuerpo del evento
    const { name, activityId, reservationDate, quantity } = JSON.parse(event.body);

    // Validar campos obligatorios y valores válidos
    if (!name || !activityId || !reservationDate || !quantity || quantity <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: "Faltan campos obligatorios o la cantidad no es válida (debe ser mayor que 0)." 
        }),
      };
    }

    // Verificar disponibilidad de la actividad
    const available = await checkAvailability(activityId, reservationDate, quantity);
    if (!available) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: "No hay disponibilidad suficiente para esta actividad en esta fecha." 
        }),
      };
    }

    // Crear un ID único para la reserva
    const reservationId = `RES-${Date.now()}`;
    const reservation = {
      reservationId,
      name,
      activityId,
      reservationDate,
      quantity,
      status: 'confirmed',
    };

    // Parámetros para insertar la reserva en DynamoDB
    const params = {
      TableName: RESERVATIONS_TABLE,
      Item: reservation,
    };

    // Guardar la reserva en la tabla y actualizar la capacidad de la actividad
    await dynamoDb.put(params).promise();
    await updateActivityCapacity(activityId, quantity);

    // Crear el mensaje de notificación
    const message = {
      subject: `Confirmación de Reserva " ${reservationId}"`,
      body: `Se ha realizado una reserva para la actividad "${activityId}" en la fecha "${reservationDate}". Número de confirmación: ${reservationId}.`,
    };

    // Publicar el mensaje en el SNS Topic
    const snsParams = {
      Message: JSON.stringify(message),
      TopicArn: SNS_TOPIC_ARN,
    };

    // Publicar el mensaje a SNS
    await sns.publish(snsParams).promise();

    // Respuesta exitosa
    return {
      statusCode: 201,
      body: JSON.stringify({ 
        message: "Reserva realizada con éxito.", 
        reservationId 
      }),
    };
  } catch (error) {
    console.error("Error procesando la reserva:", error);

    // Manejo de errores internos
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "Error interno del servidor. Por favor, inténtelo más tarde." 
      }),
    };
  }
};
