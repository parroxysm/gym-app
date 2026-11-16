import express from "express";
import cors from "cors";
import 'dotenv/config';
import { CosmosClient } from "@azure/cosmos";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});


let workoutsContainer;

async function init()
{
    const { database } = await client.databases.createIfNotExists({ id: "fitness-hub-db" });
    const { container } = await database.containers.createIfNotExists({ id: "workouts", partitionKey: { paths: ["/id"] } });
    workoutsContainer = container;
    console.log("Connected to Cosmos DB.");
}


app.get('/api/workouts', async (req, res) => {
    try {
        const { resources: workouts } = await workoutsContainer.items.readAll().fetchAll();
        res.status(200).json(workouts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/workouts', async (req, res) => {
    const newWorkout = {
        id: Date.now().toString(),
        type: req.body.type,
        date: req.body.date,
        exercises: req.body.exercises
    }
    try {
        await workoutsContainer.items.create(newWorkout);
        res.status(201).json(newWorkout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


init().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to initialize database:", error);
});