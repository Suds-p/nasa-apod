// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    const currentDate = event.queryStringParameters.date || '';
    const dateParam = currentDate ? `date=${currentDate}&` : '';
    const data = await fetch(`https://api.nasa.gov/planetary/apod?${dateParam}api_key=${process.env.API_KEY}`)
      .then(resp => resp.json());
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};

module.exports = { handler };