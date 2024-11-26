// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = async (event, context) => {
  try {
    const subject = event.queryStringParameters.name || 'World';
    console.log(context.env);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello ${subject}` })
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};

module.exports = { handler };