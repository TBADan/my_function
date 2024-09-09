import OpenAI from 'openai';
import { Client, Databases, ID } from 'node-appwrite';

// Environment variables
const PROJECT_ID = process.env.PROJECT_ID;
const DB_ID = process.env.DB_ID;
const COLLECTION_ID_CONNECTIONS = process.env.COLLECTION_ID_CONNECTIONS;
const COLLECTION_ID_POSTS = process.env.COLLECTION_ID_POSTS;

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function
export default async ({ req, res, log, error }) => {
  const client = new Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

  const db = new Databases(client);

  if (req.method === 'GET') {
    const response = await db.listDocuments(
      DB_ID,
      COLLECTION_ID_CONNECTIONS
    );

    const documents = response.documents;

    const specificAttributes = documents.map(doc => ({
      Source: doc.Source,
      name: doc.Name,
    }));

    const responses = await Promise.all(specificAttributes.map(async attr => {
      const Source = attr.Source;
      const name = attr.name;

      const prompt = `Please visit the following URL: ${Source} and provide a concise summary of the content on that webpage. Focus on the key points, main arguments, and any relevant details or conclusions. The summary should be clear and easy to understand.`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '512'),
          messages: [{ role: 'user', content: prompt }],
        });

        const gptOutput = response.choices[0].message.content;

        
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return { ok: false, error: 'Internal Server Error', details: error.message }; // Provide more specific error details
      }
      const dbResponse = await db.createDocument(
        DB_ID,
        COLLECTION_ID_POSTS,
        ID.unique(),
        {
          creator: '66d79ff1003613b53ce1',
          caption: gptOutput,
          location: Source,
        }
      );
    }));
    
    return res.json(responses, 200);
  }
};