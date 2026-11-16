import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let workouts = [
    {
        id: 1,
        type: "Push-ups",
        date: "2024-06-01",
        exercises: 
        [
            {
                name: "Push-ups",
                sets: 3,
                reps: 15
            }
        ]
    }
];

app.get('/api/workouts', (req, res) => {
    res.status(200).json(workouts);
});

app.post('/api/workouts', (req, res)   => {
    const newWorkout = {
        id: Date.now(),
        type: req.body.type,
        date: req.body.date,
        exercises: req.body.exercises
    }
    workouts.push(newWorkout);
    res.status(201).json(newWorkout);
});


app.listen(PORT, () => {
    console.log(`Serverul ruleaza pe http://localhost:${PORT}`);
});

