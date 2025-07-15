from flask import Flask, request, jsonify
from llm_agent import get_ai_recommendation
from flask_cors import CORS
from dotenv import load_dotenv

import os

load_dotenv()
app = Flask(__name__)
CORS(app)

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        aave_data = request.get_json()
        recommendation = get_ai_recommendation(aave_data)
        return jsonify({"recommendation": recommendation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
        

if __name__ == "__main__":
    app.run(debug=True)
