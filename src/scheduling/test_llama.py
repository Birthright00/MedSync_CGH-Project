import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import gradio as gr
import faulthandler
import yaml
import os

faulthandler.enable()

# Load config from llm_config.yaml
config_path = os.path.join(os.path.dirname(__file__), "llm_config.yaml")
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

model_id = config["model_id"]
system_prompt = config["system_prompt"]

# Load tokenizer and model
print("🔄 Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    device_map="auto",  # Uses GPU if available
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    trust_remote_code=True
)
print("✅ Model loaded successfully.")
print(f"Model loaded on: {model.device}")

# Response generation function
def generate_response(email_text):
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": email_text}
    ]

    input_ids = tokenizer.apply_chat_template(messages, return_tensors="pt", tokenize=True).to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_new_tokens=config["max_new_tokens"],
            do_sample=False,
            temperature=config["temperature"],
            top_k=config["top_k"],
            top_p=config["top_p"],
            eos_token_id=tokenizer.eos_token_id,
        )

    response_ids = output_ids[0][input_ids.shape[-1]:]
    response = tokenizer.decode(response_ids, skip_special_tokens=True).strip()
    return response

# Launch Gradio UI
interface = gr.Interface(
    fn=generate_response,
    inputs=gr.Textbox(lines=15, label="Doctor's Email"),
    outputs=gr.Textbox(label="Structured Output (JSON)"),
    title="📅 Email Assistant (Llama) - Doctor Scheduling",
    description="Paste a doctor's email to extract structured timetable-related info.",
)

interface.launch()
