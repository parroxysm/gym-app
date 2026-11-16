import express from "express";
import cors from "cors";
import "dotenv/config";
import { CosmosClient } from "@azure/cosmos";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

let container;

async function init() {
    const { database } = await client.databases.createIfNotExists({ id: "fitness-hub-db" });

    const { container: mainContainer } = await database.containers.createIfNotExists({
        id: "workouts",
        partitionKey: { paths: ["/id"] }
    });

    container = mainContainer;
    console.log("Connected to Cosmos DB (Single-container multi-user ready).");
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ error: "Acces interzis. Lipsește token-ul de autentificare." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token invalid sau expirat. Loghează-te din nou." });
        }
        req.user = user; // Conține { userId, username }
        next();
    });
}


app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password || username.trim().length < 3 || password.length < 4) {
        return res.status(400).json({ error: "Username-ul (min. 3 caractere) și parola (min. 4 caractere) sunt obligatorii." });
    }

    const normalizedUsername = username.trim().toLowerCase();

    try {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.docType = 'user' AND c.username = @username",
            parameters: [{ name: "@username", value: normalizedUsername }]
        };
        const { resources: existingUsers } = await container.items.query(querySpec).fetchAll();

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: "Acest username este deja folosit." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            docType: "user",
            username: normalizedUsername,
            displayName: username.trim(),
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        await container.items.create(newUser);

        const token = jwt.sign(
            { userId: newUser.id, username: newUser.displayName },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(201).json({
            token,
            user: { id: newUser.id, username: newUser.displayName }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Introdu username-ul și parola." });
    }

    const normalizedUsername = username.trim().toLowerCase();

    try {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.docType = 'user' AND c.username = @username",
            parameters: [{ name: "@username", value: normalizedUsername }]
        };
        const { resources: users } = await container.items.query(querySpec).fetchAll();

        if (users.length === 0) {
            return res.status(401).json({ error: "Username sau parolă incorectă." });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: "Username sau parolă incorectă." });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.displayName },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            token,
            user: { id: user.id, username: user.displayName }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get("/api/workouts", authenticateToken, async (req, res) => {
    try {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.docType = 'workout' AND c.userId = @userId",
            parameters: [{ name: "@userId", value: req.user.userId }]
        };
        const { resources: workouts } = await container.items.query(querySpec).fetchAll();
        res.status(200).json(workouts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/workouts", authenticateToken, async (req, res) => {
    const newWorkout = {
        id: Date.now().toString(),
        docType: "workout",
        userId: req.user.userId,
        type: req.body.type,
        date: req.body.date || new Date().toISOString().split("T")[0],
        exercises: req.body.exercises || []
    };

    try {
        await container.items.create(newWorkout);
        res.status(201).json(newWorkout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get("/api/profile", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const profileId = `profile_${userId}`;

    const defaultProfile = {
        id: profileId,
        docType: "profile",
        userId: userId,
        username: req.user.username,
        goal: "Hypertrophy",
        targetWeight: 80,
        weightHistory: [],
        schedule: {
            Monday: "Push",
            Tuesday: "Pull",
            Wednesday: "Legs",
            Thursday: "Rest",
            Friday: "Upper",
            Saturday: "Lower",
            Sunday: "Rest"
        }
    };

    try {
        const { resource } = await container.item(profileId, profileId).read();
        res.status(200).json(resource || defaultProfile);
    } catch (error) {
        if (error.code === 404) {
            return res.status(200).json(defaultProfile);
        }
        res.status(500).json({ error: error.message });
    }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const profileId = `profile_${userId}`;

    try {
        const updatedProfile = {
            ...req.body,
            id: profileId,
            docType: "profile",
            userId: userId,
            username: req.user.username
        };
        const { resource } = await container.items.upsert(updatedProfile);
        res.status(200).json(resource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get("/api/overload/:exerciseName", authenticateToken, async (req, res) => {
    const searchName = req.params.exerciseName.toLowerCase().trim();

    try {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.docType = 'workout' AND c.userId = @userId",
            parameters: [{ name: "@userId", value: req.user.userId }]
        };
        const { resources: workouts } = await container.items.query(querySpec).fetchAll();

        const sortedWorkouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        let lastPerformance = null;
        let lastDate = null;

        for (const workout of sortedWorkouts) {
            const match = workout.exercises?.find(
                (ex) => ex.name?.toLowerCase().trim() === searchName
            );
            if (match) {
                lastPerformance = match;
                lastDate = workout.date;
                break;
            }
        }

        if (!lastPerformance) {
            return res.status(200).json({
                exercise: req.params.exerciseName,
                message: "Nicio înregistrare anterioară. Setează greutatea de bază."
            });
        }

        const targetReps = lastPerformance.targetReps || 10;
        const hitTarget = lastPerformance.reps >= targetReps;

        const recommendation = hitTarget
            ? {
                  action: "INCREASE_WEIGHT",
                  suggestedWeight: lastPerformance.weight + 2.5,
                  suggestedReps: Math.max(6, targetReps - 2),
                  reason: `Ai atins ${lastPerformance.reps} repetări la ${lastPerformance.weight} kg. Crește greutatea cu +2.5 kg.`
              }
            : {
                  action: "INCREASE_REPS",
                  suggestedWeight: lastPerformance.weight,
                  suggestedReps: lastPerformance.reps + 1,
                  reason: `Păstrează ${lastPerformance.weight} kg și încearcă să ajungi la ${lastPerformance.reps + 1} repetări.`
              };

        res.status(200).json({
            exercise: lastPerformance.name,
            lastDate,
            lastPerformance,
            recommendation
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to initialize database:", error);
    });