import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: String,
    difficulty: String,
    answer: String,
    timeLimit: Number,
    feedback: String,
    score: {type: Number, default: 0},
    correctness: {type: Number, default: 0},
    communication: {type: Number, default: 0},
    confidence: {type: Number, default: 0},
})

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    role: {
      type: String,
      require: true,
    },
      experience:{
        type:String,
          required:true
      },
      mode:{
        type: String,
          required:true,
          enum:["HR","Technical","SystemDesign" ]
      },
      resumeText:{
        type:String
      },
    questions:[questionSchema],
      finalScore:{type: Number, default: 0},
      status:{
        type: String,
          enum:["Incomplete","complete"],
          default:"Incomplete",
      },
  },
  { timestamps: true },
);

// Performance Optimization: Indexes for highly efficient lookup and sorting of interview records.
// Compounding userId and createdAt eliminates MongoDB in-memory sort stage and turns query from O(N) to O(log N).
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ createdAt: -1 });

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
