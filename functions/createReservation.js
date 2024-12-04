const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { checkAvailability } = require('./utils'); // Llamamos a la función de verificación de disponibilidad

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;

module.exports.handler = async (event) => {
  const { name, activityId, reservationDate } = JSON.parse(event.body);

  // Verificar disponibilidad
  const available = await checkAvailability(activityId, reservationDate);
  if (!available) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No hay disponibilidad para esta actividad en esta fecha.' }),
    };
  }

  const reservationId = `RES-${Date.now()}`;
  const reservation = {
    reservationId,
    name,
    activityId,
    reservationDate,
    status: 'confirmed',
  };

  const params = {
    TableName: RESERVATIONS_TABLE,
    Item: reservation,
  };

  try {
    await dynamoDb.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Reserva realizada con éxito.' }),
    };
  } catch (error) {
    console.error('Error procesando la reserva', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor.' }),
    };
  }
};
