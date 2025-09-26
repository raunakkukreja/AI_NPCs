# model_server.py
# to activate the local environment you created : . "C:\coding\my projects\trial samsung model\npc_llm\Scripts\activate.ps1"
import os
import sys
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from llama_cpp import Llama
import json

# --- Configuration ---
MODEL_PATH = os.environ.get("MODEL_PATH", r"C:\Users\lokad\.cache\huggingface\hub\models--QuantFactory--Meta-Llama-3-8B-Instruct-GGUF\snapshots\86e0c07efa3f1b6f06ea13e31b1e930dce865ae4\Meta-Llama-3-8B-Instruct.Q4_K_M.gguf")  #"C:\Users\RAUNAK\.cache\huggingface\hub\models--QuantFactory--Meta-Llama-3-8B-Instruct-GGUF\snapshots\86e0c07efa3f1b6f06ea13e31b1e930dce865ae4\Meta-Llama-3-8B-Instruct.Q4_K_M.gguf"
API_KEY = os.environ.get(r"RVVL")  # optional; set to protect the local endpoint
PORT = int(os.environ.get("MODEL_PORT", "8000"))

if not MODEL_PATH:
    print("ERROR: MODEL_PATH env var not set. Exiting.")
    sys.exit(1)

# Llama init: tune n_ctx, n_gpu_layers as needed for your environment.
# If you have no GPU support set n_gpu_layers=0
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096,          # choose based on model & quantization
    n_gpu_layers=1,      # change if you have GPU and llama_cpp built with GPU support
    verbose=False
)

# FastAPI app
app = FastAPI(title="Local LLM model server (llama_cpp)")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 256
    temperature: Optional[float] = 0.3

def check_api_key(req: Request):
    if API_KEY:
        key = req.headers.get("x-api-key") or req.query_params.get("api_key")
        if key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")

@app.post("/chat/stream")
async def chat_stream(req: Request, body: ChatRequest):
    check_api_key(req)
    messages_for_model = [{"role": m.role, "content": m.content} for m in body.messages]
    
    def generate_stream():
        try:
            stream = llm.create_chat_completion(
                messages=messages_for_model,
                max_tokens=body.max_tokens,
                temperature=body.temperature,
                stream=True
            )
            
            for chunk in stream:
                if isinstance(chunk, dict) and "choices" in chunk:
                    delta = chunk["choices"][0].get("delta", {})
                    if "content" in delta:
                        data = {"choices": [{"delta": {"content": delta["content"]}}]}
                        yield f"data: {json.dumps(data)}\n\n"
            
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_data = {"error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/plain")

@app.post("/chat")
async def chat(req: Request, body: ChatRequest):
    check_api_key(req)
    messages_for_model = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        resp = llm.create_chat_completion(
            messages=messages_for_model,
            max_tokens=body.max_tokens,
            temperature=body.temperature,
            stream=False
        )
        content = ""
        if isinstance(resp, dict):
            choices = resp.get("choices", [])
            if choices and isinstance(choices, list):
                parts = []
                for ch in choices:
                    msg = ch.get("message") or ch.get("delta") or {}
                    text = msg.get("content") if isinstance(msg, dict) else None
                    if text:
                        parts.append(text)
                if parts:
                    content = "".join(parts)
                else:
                    content = resp.get("text") or resp.get("output") or ""
        else:
            content = str(resp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {e}")

    return {"id": f"local-{int(time.time()*1000)}", "choices": [{"message": {"role": "assistant", "content": content}}]}

# health
@app.get("/health")
def health():
    return {"ok": True, "model_path": MODEL_PATH}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("model_server:app", host="127.0.0.1", port=8000, log_level="info")
