import  {Client, Databases} from 'node-appwrite'

import OpenAI from "openai";

///Enviroment variables
const PROJECT_ID = process.env.PROJECT_ID
const DB_ID = process.env.DB_ID
const COLLECTION_ID_CONNECTIONS = process.env.COLLECTION_ID_CONNECTIONS

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

////Function
export default async ({req, res, log, error})=>{
    const client = new Client ()
    client
    .setEndpoint ('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)

    const db = new Databases(client)

    if(req.method == 'GET'){
        const response = await db.listDocuments(
            DB_ID,
            COLLECTION_ID_CONNECTIONS
        );

        const documents = response.documents;

        const specificAttributes = documents.map(doc => {
            return {
                Source: doc.Source,
                name: doc.Name,
            }
        });
        
        specificAttributes.forEach(async attr => {
            const Source = attr.Source;
            const name = attr.name; 

            const prompt = `The source is ${Source} and the name is ${name}.`

            try {
                const completion = await openai.createCompletion({
                    model: 'text-davinci-003',
                    prompt: prompt,
                    maxTokens: 100
                });
                const gptOutput = completion.data.choices[0].text.trim();
                console.log(`ChatGPT Response: ${gptOutput}`);

            } catch (error) {
                console.error('Error calling OpenAI API:', error)
            }
        });

        return res.json(specificAttributes)
        
    }
    return res.send('Hello World')
}

