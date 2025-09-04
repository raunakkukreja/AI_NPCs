from huggingface_hub import hf_hub_download
from llama_cpp import Llama

# --- Model Setup ---
REPO_ID = "QuantFactory/Meta-Llama-3-8B-Instruct-GGUF"
FILENAME = "Meta-Llama-3-8B-Instruct.Q4_K_M.gguf"

print("Downloading model...")
try:
    model_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME)
except Exception as e:
    print(f"Error downloading model: {e}")
    exit()
print("Model downloaded to:", model_path)

# --- Initialize LLaMA on Mac M1 ---
llm = Llama(
    model_path=model_path,
    n_gpu_layers=0,  # Use CPU for M1 (MPS GPU offload is experimental)
    n_ctx=2048,      # Reduce context size to fit in RAM
    verbose=True
)

# --- NPC Persona ---
persona = (
    "You are a grumpy old wizard named Merlin. "
    "You hate adventurers and find their quests pointless. "
    "You remember the player's name and past actions."
)

conversation_history = [
    {"role": "system", "content": persona},
    {"role": "user", "content": "Hello, Merlin. My name is Alex. I've come to ask you about the Orb of Light."},
    {"role": "assistant", "content": "The Orb of Light? What pointless artifact are you seeking now? I don't have time for this, Alex."},
    {"role": "user", "content": "I need it to defeat the Dark Lord and save the kingdom!"}
]

# --- Generate Response ---
print("\nGenerating NPC response...")
try:
    stream_output = llm.create_chat_completion(
        messages=conversation_history,
        max_tokens=256,
        stop=["<|end_of_text|>", "<|eot_id|>"],
        temperature=0.7,
        stream=True
    )

    buffer = ""
    for chunk in stream_output:
        delta = chunk["choices"][0]["delta"]
        if "content" in delta:
            token = delta["content"]
            print(token, end="", flush=True)  # stream char-by-char
            buffer += token

    print("\n--- Full Response ---")
    print(buffer)

except Exception as e:
    print(f"\nError during completion: {e}")