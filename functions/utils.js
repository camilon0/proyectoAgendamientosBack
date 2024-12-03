const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE;

module.exports.checkAvailability = async (activityId, reservationDate) => {
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
    const result = await dynamoDb.query(params).promise();
    return result.Items.length < 1; // Disponible si no hay reservas existentes
  } catch (error) {
    console.error('Error verificando disponibilidad', error);
    return false;
  }
};
