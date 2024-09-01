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
        )

        const jsonResponse = JSON.parse(res.text());

        consol.log(jsonResponse)
        
    }
    return res.send('Hello World!!!!')
}



// // Assuming the JSON response is an array of objects
// const jsonResponse = JSON.parse(res.text());

// // Function to split the array based on a given attribute
// function splitByAttribute(array, attribute) {
//   const result = {};
//   array.forEach(item => {
//     const attributeValue = item[attribute];
//     if (!result[attributeValue]) {
//       result[attributeValue] = [];
//     }
//     result[attributeValue].push(item);
//   });
//   return result;
// }

// // Example usage: split the response by the "category" attribute
// const splitResponse = splitByAttribute(jsonResponse, "category");

// // Access the split data
// console.log(splitResponse); // Output: { category1: [object1, object2], category2: [object3] }
