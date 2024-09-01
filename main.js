import  {Client, Databases} from 'node-appwrite'

///Enviroment variables
const PROJECT_ID = process.env.PROJECT_ID
const DB_ID = process.env.DB_ID
const COLLECTION_ID_CONNECTIONS = process.env.COLLECTION_ID_CONNECTIONS


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
                id: doc.$id,
                name: doc.Name,
            }
        });
        
        specificAttributes.forEach(attr => {
            const id = attr.Source;
            const name = attr.name;
            // You can now use id and name variables as needed
            console.log(`Source: ${Source}, Name: ${name}`);
        });

    

        return res.json(specificAttributes)
        
    }
    return res.send('Hello World')
}

