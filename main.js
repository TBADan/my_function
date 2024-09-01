import { Client, Databases } from 'node-appwrite'

// Environment variables
const PROJECT_ID = process.env.PROJECT_ID
const DB_ID = process.env.DB_ID
const COLLECTION_ID_CONNECTIONS = process.env.COLLECTION_ID_CONNECTIONS

// Function
export default async ({ req, res, log, error }) => {
  const client = new Client()
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)

  const db = new Databases(client)

  if (req.method === 'GET') {
    const response = await db.listDocuments(
      DB_ID,
      COLLECTION_ID_CONNECTIONS
    )

    // Access and deconstruct the response.documents array
    const documents = response.documents

    // Loop through each document and access its properties
    for (const document of documents) {
      const documentId = document.$id; // Access the document ID

      // Use the variables as needed
      console.log(`Document ID: ${documentId}`);
    }

    return res.json(response.documents); // Or return a different response
  }

  return res.send('Hello World');
}