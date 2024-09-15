from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq_service import GroqService

app = FastAPI()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_service = GroqService()

class UserInput(BaseModel):
    message: str

@app.post("/analyze")
async def analyze_input(user_input: UserInput):
    ai_response = groq_service.analyze_neighborhood(user_input.message)
    
    return {
        "response": ai_response
    }

@app.post("/clear")
async def clear_conversation():
    groq_service.clear_conversation()
    return {"message": "Conversation history cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)