import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    question: String,
    difficulty: String,
    answer: String,
    timeLimit: Number,
    feedback: String,
    score: {type: Number, default: 0},
    correctAnswers: {type: Number, default: 0},
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

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
