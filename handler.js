'use strict';

const livros = [
  {id: 1, name: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien'},
  {id: 2, name: 'O Hobbit', author: 'J.R.R. Tolkien'},
  {id: 3, name: 'O Cemitério dos Bichos', author: 'J.R.R. Tolkien'},
  {id: 4, name: 'Sherlock Holmes', author: 'Sir Arthur Conan Doyle'},
  {id: 5, name: 'Harry Potter', author: 'J.K. Rowling'},
]

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: 'LIVROS'
};


module.exports.livros = async (event) => {
  try {
    let data = await dynamoDb.scan(params).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
  } catch (err) {
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        error: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.obterLivro = async (event) => {
  try {
    const { livroId } = event.pathParameters;

    const data = await dynamoDb
      .get({
        ...params,
        Key: {
          livro_id: livroId,
        },
      })
      .promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Livro não existe" }, null, 2),
      };
    }

    const livro = data.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(livro, null, 2),
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};


module.exports.cadastrarLivro = async (event) => {
  try {
    const timestamp = new Date().getTime();

    let dados = JSON.parse(event.body);

    const { author, title } = dados;

    const livro = {
      livro_id: uuidv4(),
      author,
      title,      
      status: true,
      criado_em: timestamp,
      atualizado_em: timestamp,
    };

    await dynamoDb
      .put({
        TableName: "LIVROS",
        Item: livro,
      })
      .promise();

    return {
      statusCode: 201,
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

module.exports.atualizarLivro = async (event) => {  
  const { livroId } = event.pathParameters

  try {
    const timestamp = new Date().getTime();

    let dados = JSON.parse(event.body);

    const { author, title } = dados;

    await dynamoDb
      .update({
        ...params,
        Key: {
          livro_id: livroId
        },
        UpdateExpression:
          'SET author = :author, title = :title,' 
          + 'atualizado_em = :atualizado_em',
        ConditionExpression: 'attribute_exists(livro_id)',
        ExpressionAttributeValues: {
          ':author': author,
          ':title': title,         
          ':atualizado_em': timestamp
        }
      })
      .promise()

    return {
      statusCode: 204,
    };
  } catch (err) {
    console.log("Error", err);

    let error = err.name ? err.name : "Exception";
    let message = err.message ? err.message : "Unknown error";
    let statusCode = err.statusCode ? err.statusCode : 500;

    if (error == 'ConditionalCheckFailedException') {
      error = 'Livro não existe';
      message = `Recurso com o ID ${livroId} não existe e não pode ser atualizado`;
      statusCode = 404;
    }

    return {
      statusCode,
      body: JSON.stringify({
        error,
        message
      }),
    };
  }
};

module.exports.excluirLivro = async event => {
  const { livroId } = event.pathParameters

  try {
    await dynamoDb
      .delete({
        ...params,
        Key: {
          livro_id: livroId
        },
        ConditionExpression: 'attribute_exists(livro_id)'
      })
      .promise()
 
    return {
      statusCode: 204
    }
  } catch (err) {
    console.log("Error", err);

    let error = err.name ? err.name : "Exception";
    let message = err.message ? err.message : "Unknown error";
    let statusCode = err.statusCode ? err.statusCode : 500;

    if (error == 'ConditionalCheckFailedException') {
      error = 'Livro não existe';
      message = `Recurso com o ID ${livroId} não existe e não pode ser atualizado`;
      statusCode = 404;
    }

    return {
      statusCode,
      body: JSON.stringify({
        error,
        message
      }),
    };
  }
}
