# model_server.py
# to activate the local environment you created : . "C:\coding\my projects\trial samsung model\npc_llm\Scripts\activate.ps1"
import os
import sys
import time
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from llama_cpp import Llama

# --- Configuration ---
MODEL_PATH = os.environ.get("MODEL_PATH",r"C:\Users\kvidi\.cache\huggingface\hub\models--QuantFactory--Meta-Llama-3-8B-Instruct-GGUF\snapshots\86e0c07efa3f1b6f06ea13e31b1e930dce865ae4\Meta-Llama-3-8B-Instruct.Q4_K_M.gguf")  # e.g. "C:/Users/RAUNAK/.cache/huggingface/.../Meta-Llama-3-8B-Instruct.Q4_K_M.gguf"
API_KEY = os.environ.get("MODEL_API_KEY","12345678")  # optional; set to protect the local endpoint
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

@app.post("/chat")
async def chat(req: Request, body: ChatRequest):
    # optional API key check
    check_api_key(req)

    # Build messages into a single prompt that llama_cpp expects.
    # Many local chat wrappers expect messages in the OpenAI style; Llama's create_chat_completion accepts messages in same shape.
    messages_for_model = [{"role": m.role, "content": m.content} for m in body.messages]

    # convert to native python list (llama.create_chat_completion supports messages param)
    try:
        resp = llm.create_chat_completion(
            messages=messages_for_model,
            max_tokens=body.max_tokens,
            temperature=body.temperature,
            stream=False  # simple non-streaming for prototype
        )
        # resp structure: choices -> [ { message: { role: "assistant", content: "..." } } ]
        content = ""
        # handle shape differences
        if isinstance(resp, dict):
            # common layout
            choices = resp.get("choices", [])
            if choices and isinstance(choices, list):
                # join content if partials
                parts = []
                for ch in choices:
                    msg = ch.get("message") or ch.get("delta") or {}
                    text = msg.get("content") if isinstance(msg, dict) else None
                    if text:
                        parts.append(text)
                if parts:
                    content = "".join(parts)
                else:
                    # fallback to 'text' or 'output'
                    content = resp.get("text") or resp.get("output") or ""
        else:
            # fallback
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
