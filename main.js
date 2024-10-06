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
export default async function main(req, res, log, error) {
  console.log('Function invoked'); // Log each invocation

  const client = new Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Ensure the API key is set

  const db = new Databases(client);

  try {
    const response = await db.listDocuments(
      DB_ID,
      COLLECTION_ID_CONNECTIONS
    );
    const documents = response.documents;

      // Log the documents to verify their structure
      console.log('Fetched documents:', documents);

    // Log the document details
    console.log(`Processing document ID: ${documentId}, Source: ${Source}, Author: ${author}`);

    const prompt = `Visit the following URL: ${Source} Please read and analyze the content on the webpage. Summarize the main key points and core information from the website in a concise format. The summary should be brief, clear, and highlight only the most important details presented on the page.`;

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

    // Log the data being sent to the database
    console.log('Creating document with data:', {
      creator: author, // Use the author relationship ID
      caption: gptOutput,
      location: Source,
      AI: true,
    });

    // Create a new document in the COLLECTION_ID_POSTS collection
    const dbResponse = await db.createDocument(
      DB_ID,
      COLLECTION_ID_POSTS,
      ID.unique(),
      {
        creator: author, // Use the author relationship ID
        caption: gptOutput,
        location: Source,
        AI: true,
      }
    );

    // Log the response from creating the document
    console.log('Document created:', dbResponse);

    // Update the existing document in the COLLECTION_ID_CONNECTIONS collection
    const dbUpdateResponse = await db.updateDocument(
      DB_ID,
      COLLECTION_ID_CONNECTIONS,
      documentId, // Use the stored document ID
      {
        Scraped: true,
      }
    );

    // Log the response from updating the document
    console.log('Document updated:', dbUpdateResponse);

    return res.json({ success: true, dbResponse, dbUpdateResponse });
  } catch (error) {
    console.error('Error processing event:', error);
    return res.json({ success: false, error: error.message });
  }
}