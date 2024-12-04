const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

// Función para verificar la disponibilidad de una actividad
module.exports.checkAvailability = async (activityId, reservationDate, quantity) => {
  const params = {
    TableName: RESERVATIONS_TABLE,
    IndexName: 'activityId-index',
    KeyConditionExpression: 'activityId = :activityId and reservationDate = :reservationDate',
    ExpressionAttributeValues: {
      ':activityId': activityId,
      ':reservationDate': reservationDate,
    },
  };

  try {
    // Consultar las reservas existentes para la actividad en la fecha dada
    const result = await dynamoDb.query(params).promise();
    const totalReserved = result.Items.reduce((sum, reservation) => sum + reservation.quantity, 0);

    // Obtener la capacidad de la actividad
    const activity = await getActivityCapacity(activityId);
    if (!activity || typeof activity.availableCapacity !== 'number') {
      console.error(`Capacidad no definida para la actividad con ID: ${activityId}`);
      return false;
    }

    // Verificar si hay capacidad suficiente
    const availableCapacity = activity.availableCapacity - totalReserved;
    return availableCapacity >= quantity; // Retorna true si hay suficiente capacidad
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return false; // Asumimos que no hay disponibilidad si ocurre un error
  }
};

// Función para obtener la capacidad de una actividad
const getActivityCapacity = async (activityId) => {
  const params = {
    TableName: ACTIVITIES_TABLE,
    Key: {
      activityId: activityId,
    },
  };

  try {
    // Obtener la actividad desde la tabla de actividades
    const result = await dynamoDb.get(params).promise();
    if (!result.Item) {
      console.error(`Actividad no encontrada con ID: ${activityId}`);
    }
    return result.Item || {}; // Retorna la actividad o un objeto vacío si no existe
  } catch (error) {
    console.error('Error obteniendo la capacidad de la actividad:', error);
    throw new Error('Error al consultar la capacidad de la actividad');
  }
};

// Función para actualizar la capacidad disponible de una actividad
module.exports.updateActivityCapacity = async (activityId, quantity) => {
  const params = {
    TableName: ACTIVITIES_TABLE,
    Key: {
      activityId: activityId,
    },
    UpdateExpression: 'SET availableCapacity = availableCapacity - :quantity',
    ExpressionAttributeValues: {
      ':quantity': quantity,
    },
    ReturnValues: 'UPDATED_NEW',
  };

  try {
    // Actualizar la capacidad disponible
    const result = await dynamoDb.update(params).promise();
    console.log('Capacidad actualizada exitosamente:', result.Attributes);
    return result.Attributes; // Retorna los valores actualizados
  } catch (error) {
    console.error('Error actualizando la capacidad de la actividad:', error);
    throw new Error('Error al actualizar la capacidad');
  }
};
