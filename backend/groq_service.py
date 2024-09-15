import json
import re
from groq import Groq
from config import GROQ_API_KEY

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.history_file = 'conversation_history.json'
        self.initialize_history()

    def initialize_history(self):
        try:
            with open(self.history_file, 'r') as f:
                self.history = json.load(f)
        except FileNotFoundError:
            self.history = []
            self.save_history()

    def save_history(self):
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f)

    def get_completion(self, messages):
        completion = self.client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        return completion.choices[0].message.content

    def analyze_neighborhood(self, user_input):
        # Add user input to history
        self.history.append({"role": "user", "content": user_input})
        self.save_history()

        messages = [
            {"role": "system", "content": """You are an AI assistant specialized in neighborhood analysis. 
            Provide a comprehensive neighborhood analysis based on the user's input.
            Structure your response in clear sections:
            1. Introduction
            2. Housing Options
            3. Neighborhood Information
            4. Transportation
            5. Amenities
            6. Conclusion
            
            Use bullet points for lists and keep paragraphs short for readability."""}
        ] + self.history

        ai_response = self.get_completion(messages)

        formatted_response = self.format_response(ai_response)

        self.history.append({"role": "assistant", "content": formatted_response})
        self.save_history()

        return formatted_response

    def format_response(self, response):
        sections = re.split(r'\n(?=\d+\.|\*\*)', response)
        
        formatted_sections = []
        for section in sections:

            section = re.sub(r'(?<=\n)(\s*-)', r'\n\1', section)           

            section = re.sub(r'(\*\*.*?\*\*)', r'\n\1\n', section)
            
            section = re.sub(r'\n{2,}', '\n\n', section)
            
            formatted_sections.append(section.strip())
        
        formatted_response = '\n\n'.join(formatted_sections)
        
        return formatted_response


    def clear_conversation(self):
        self.history = []
        self.save_history()