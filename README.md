<!--
title: 'AWS Simple HTTP Endpoint example in NodeJS'
description: 'This template demonstrates how to make a simple HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.'
layout: Doc
framework: v4
platform: AWS
language: nodeJS
authorLink: 'https://github.com/serverless'
authorName: 'Serverless, Inc.'
authorAvatar: 'https://avatars1.githubusercontent.com/u/13742415?s=200&v=4'
-->

# Serverless Framework Node HTTP API on AWS

Esta plantilla demuestra cómo crear una API HTTP simple con Node.js que se ejecuta en AWS Lambda y API Gateway utilizando el Framework Serverless, y usa DynamoDB para persistencia de datos.

Este ejemplo incluye la integración con DynamoDB para almacenar y recuperar datos. Si buscas ejemplos más avanzados, consulta el [repositorio de ejemplos de Serverless](https://github.com/serverless/examples/), que incluye ejemplos con Typescript y otras bases de datos.

## Uso

### Despliegue

Para desplegar el ejemplo, necesitas ejecutar el siguiente comando:
```
serverless deploy
```

Después de ejecutar el despliegue, deberías ver una salida similar a esta:

```
Deploying "serverless-http-api" to stage "dev" (us-east-1)

✔ Service deployed to stack serverless-http-api-dev (91s)

endpoint: GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/
functions:
  hello: serverless-http-api-dev-hello (1.6 kB)
```

_Nota_: En esta forma, después del despliegue, tu API será pública y podrá ser invocada por cualquiera. Para despliegues en producción, es posible que quieras configurar un autenticador. Para obtener detalles sobre cómo hacerlo, consulta la [documentación de eventos HTTP API (API Gateway V2)](https://www.serverless.com/framework/docs/providers/aws/events/http-api).


### Invocación

Después de un despliegue exitoso, puedes llamar a la aplicación creada a través de HTTP. Para obtener los datos almacenados en DynamoDB, por ejemplo, puedes hacer:

```
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

Lo que debería generar una respuesta similar a esta:

```json
{ "message": "Go Serverless v4! Your function executed successfully!" }
```

Y si tu API está configurada para obtener datos de DynamoDB, deberías ver una respuesta con los datos de la base de datos:

```json
{
  "items": [
    {
      "id": "12345",
      "name": "Ejemplo de Item",
      "createdAt": "2024-12-18T12:34:56Z"
    }
  ]
}
```
