import OpenAI from 'openai';
import { Client, Databases } from 'node-appwrite';

/// Environment variables
const PROJECT_ID = process.env.PROJECT_ID;
const DB_ID = process.env.DB_ID;
const COLLECTION_ID_CONNECTIONS = process.env.COLLECTION_ID_CONNECTIONS;
const COLLECTION_ID_SUMMARIES = process.env.COLLECTION_ID_SUMMARIES; // New collection for summaries

/// OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/// Function
export default async ({ req, res, log, error }) => {
    const client = new Client();
    client
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject(PROJECT_ID);

    const db = new Databases(client);

    if (req.method == 'GET') {
        const userId = req.query.userId; // Extract user ID from request query parameters

        try {
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

                const prompt = `Please visit the following URL: ${Source} and provide a concise summary of the content on that webpage. Focus on the key points, main arguments, and any relevant details or conclusions. The summary should be clear and easy to understand.`; /// Prompt for GPT-3

                try {
                    try {
                        const response = await openai.chat.completions.create({
                            model: 'text-davinci-003',
                            prompt: prompt,
                            max_tokens: 500
                        });
                    } catch (error) {
                        console.log(error);
                    }

                    console.log('OpenAI API response:', response); // Log the response from OpenAI API

                    // Check if the response structure is as expected
                    if (response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
                        const gptOutput = response.choices[0].message.content;

                        // Insert the summary into the new collection
                        const document = await db.createDocument(DB_ID, COLLECTION_ID_SUMMARIES, 'unique()', {
                            userId: userId,
                            Source: Source,
                            name: name,
                            summary: gptOutput,
                        });

                        console.log('Document created in Appwrite:', document); // Log the document creation response

                        return { ok: true, completion: gptOutput }; /// Return the completion
                    } else {
                        console.error('Unexpected response structure from OpenAI API:', response);
                        return { ok: false, error: 'Unexpected response structure from OpenAI API', details: response };
                    }
                } catch (error) {
                    console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message); // Log detailed error from OpenAI API
                    return { ok: false, error: 'Error calling OpenAI API', details: error.response ? error.response.data : error.message };
                }
            }));

            return res.json(responses, 200);
        } catch (error) {
            console.error('Error interacting with Appwrite:', error); // Log any errors from Appwrite
            return res.json({ ok: false, error: 'Error interacting with Appwrite' }, 500);
        }
    } else {
        return res.json({ error: 'Method not allowed' }, 405);
    }
};