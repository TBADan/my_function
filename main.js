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
    try {
      const response = await db.listDocuments(
        DB_ID,
        COLLECTION_ID_CONNECTIONS
      );

      const documents = response.documents;

      // Extract and filter out duplicate 'Source' values
      const uniqueSources = Array.from(new Set(documents.map(doc => doc.Source)));

      const responses = await Promise.all(documents.map(async doc => {
        const Source = doc.Source;
        const documentId = doc.$id; // Store the document ID
        const author = doc.author;

        const prompt = `Visit the following URL: ${Source} Please read and analyze the content on the webpage. Summarize the main key points and core information from the website in a concise format. The summary should be brief, clear, and highlight only the most important details presented on the page.`;

        try {
          console.log(`Sending prompt to OpenAI: ${prompt}`);
          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '512'),
            messages: [{ role: 'user', content: prompt }],
          });

          console.log('OpenAI API response:', aiResponse);

          if (!aiResponse.choices || aiResponse.choices.length === 0) {
            throw new Error('No choices returned from OpenAI API');
          }

          const gptOutput = aiResponse.choices[0].message.content;

          // Create a new document in the COLLECTION_ID_POSTS collection
          const dbResponse = await db.createDocument(
            DB_ID,
            COLLECTION_ID_POSTS,
            ID.unique(),
            {
              creator: doc.author,
              caption: gptOutput,
              location: Source,
              AI: true,
            }
          );

          // Update the existing document in the COLLECTION_ID_CONNECTIONS collection
          const dbUpdateResponse = await db.updateDocument(
            DB_ID,
            COLLECTION_ID_CONNECTIONS,
            documentId, // Use the stored document ID
            {
              Scraped: true,
            }
          );

          return dbUpdateResponse;
        } catch (error) {
          console.error('Error calling OpenAI API:', error);
          return { ok: false, error: 'Internal Server Error', details: error.message };
        }
      }));

      return res.json(responses, 200);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.json({ ok: false, error: 'Internal Server Error', details: error.message }, 500);
    }
  } else {
    return res.json({ error: 'Method not allowed' }, 405);
  }
};