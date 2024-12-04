const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE;

module.exports.handler = async () => {
  try {
    // Verificar si la variable de entorno ACTIVITIES_TABLE está configurada
    if (!ACTIVITIES_TABLE) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "La tabla de actividades no está configurada correctamente." }),
      };
    }

    // Parámetros para DynamoDB
    const params = {
      TableName: ACTIVITIES_TABLE,
    };

    // Realizar el escaneo de la tabla
    const result = await dynamoDb.scan(params).promise();

    // Validar si hay datos en la tabla
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No se encontraron actividades." }),
      };
    }

    // Devolver la lista de actividades
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error("Error listando actividades", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno del servidor." }),
    };
  }
};
