require('dotenv').config({ path: './config.env' });
const OpenAI = require('openai');
const { HttpsProxyAgent } = require('https-proxy-agent');

const Oaikey = process.env.OPENAI_API_KEY;
//console.log("API-Key = ", Oaikey);

// Setting up the proxy
const proxyUrl = 'http://sia-lb.telekom.de:8080';
const proxyAgent = new HttpsProxyAgent(proxyUrl);

const openai = new OpenAI({
  apiKey: Oaikey,
  httpAgent: proxyAgent,
  httpsAgent: proxyAgent
});

async function getResponse() {
  const question = "Wie ist der Name von Achims zweiten Huhn? Hat Achim noch andere Tiere?";
  console.log("Frage:", question);

  try {
    const response = await openai.chat.completions.create({
      model: "ft:gpt-4o-mini-2024-07-18:personal:huhnchecker:A3e6Tz6H",
      messages: [
        { role: "user", content: question }
      ],
    });

    console.log("Antwort:", response.choices[0].message.content);
  } catch (error) {
    console.error('Error creating chat completion:', error);
    console.error(error.response ? error.response.data : error.message);
  }
}

getResponse();