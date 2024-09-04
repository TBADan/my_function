import OpenAI from 'openai';
import { Client, Databases } from 'node-appwrite';

/// Environment variables
const PROJECT_ID = process.env.PROJECT_ID;
const DB_ID = process.env.DB_ID;
const COLLECTION_ID_CONNECTIONS = process.env.COLLECTION_ID_CONNECTIONS;
const COLLECTION_ID_POST = process.env.COLLECTION_ID_POST;

/// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//// Function
export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

  const db = new Databases(client);

  if (req.method === 'GET') {
    const response = await db.listDocuments(DB_ID, COLLECTION_ID_CONNECTIONS);
    const documents = response.documents;

    const dataToSummarize = documents.map((doc) => ({
      Source: doc.Source,
      name: doc.Name,
    }));

    const summaries = await Promise.all(
      dataToSummarize.map(async (attr) => {
        const Source = attr.Source;
        const name = attr.name;

        const prompt = `Create a simple summary of this website ${Source} and the website name is ${name}.`; /// Prompt for GPT-3

        try {
          const openAIResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '512'),
            messages: [{ role: 'user', content: prompt }],
          });
          const gptOutput = openAIResponse.choices[0].message.content;

          // Add summary to the database
          await db.createDocument(
            DB_ID,
            COLLECTION_ID_POST,
            'unique()', // Generate a unique ID
            {
                creator:'66d79ff1003613b53ce1',
                location: Source,
                caption: gptOutput,
            }
          );

          return { ok: true, completion: gptOutput }; /// Return the completion
        } catch (error) {
          console.error('Error calling OpenAI API:', error);
          return { ok: false, error: 'Internal Server Error' };
        }
      })
    );

    return res.json(summaries, 200);
  }
};