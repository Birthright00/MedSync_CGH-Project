import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import gradio as gr

# Load tokenizer and model
model_id = "meta-llama/Llama-3.2-3B-Instruct"

print("🔄 Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    device_map="auto",  # Use GPU if available
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    trust_remote_code=True
)
print("✅ Model loaded successfully.")

# Response generation function
def generate_response(prompt):
    input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_new_tokens=300,
            do_sample=False,
            temperature=0.7,
            top_k=50,
            top_p=0.95,
            eos_token_id=tokenizer.eos_token_id,
        )

    response = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return response[len(prompt):].strip()

# Optional default email example
default_prompt = """You are an AI assistant for a hospital scheduling system. Your job is to extract and categorize structured information from emails sent by doctors.

There are two main types of emails:
1. Change Request
2. Timetable Availability

Given the email in the input, classify its type and extract relevant fields accordingly.

---

If it's a **Change Request**, extract:
- Original Session Date and Time:
- New Requested Session Date and Time:
- Reason for Change:
- Affected Student Group:

If it's a **Timetable Availability**, extract:
- Available Dates and Time Slots/Timings (as many as listed):
- Any Special Conditions or Notes:
- Relevant Student Group (if mentioned):

If no relevant information can be extracted, return:
`{"type": "none", "reason": "Not a scheduling-related email"}`

---

Return your response in this structured JSON format:
{
  "type": "change_request" or "availability",
  "original_session": "...",        ← only for change_request
  "new_session": "...",             ← only for change_request
  "reason": "...",                  ← only for change_request
  "students": "...",                ← only if mentioned
  "available_slots_timings": ["..."],       ← only for availability
  "notes": "..."                    ← optional, for availability
}

"""

# Launch Gradio UI
interface = gr.Interface(
    fn=generate_response,
    inputs=gr.Textbox(lines=15, value=default_prompt, label="Prompt / Email"),
    outputs=gr.Textbox(label="Model Response"),
    title="🧠 DeepSeek-R1-Distill-Qwen-1.5B Email Assistant",
    description="Paste your email prompt and get structured output using DeepSeek LLM.",
)

interface.launch()
