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
  // **This entire function is triggered by the event, not by a GET request**

  // Get the document data from the event payload (**automatic on document creation**)
  const document = req.payload;

  const Source = document.Source; // Replace with your actual field name
  const name = document.Name; // Optional

  const prompt = `Please visit the following URL: ${Source} and provide a concise summary of the content on that webpage. Focus on the key points, main arguments, and any relevant details or conclusions. The summary should be clear and easy to understand.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '512'),
      messages: [{ role: 'user', content: prompt }],
    });

    const gptOutput = response.choices[0].message.content;

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

    return res.json({ success: true, message: 'Summary created successfully' }, 200); // Or return a more detailed response
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.json({ success: false, error: 'Internal Server Error' }, 500);
  }
};