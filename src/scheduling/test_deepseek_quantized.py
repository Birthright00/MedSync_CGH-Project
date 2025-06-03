import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import gradio as gr

# Load tokenizer and model
model_id = "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"  # Replace with your model ID if different 

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

# Define the system prompt
system_prompt = """You are an AI assistant for a hospital scheduling system. Your task is to classify the type of scheduling-related email and extract structured information directly from it.

There are two valid types:
1. "change_request"
2. "availability"

If the email contains neither, return:
{
  "type": "none",
  "reason": "Not a scheduling-related email"
}

---

Rules:
- Only extract information that is **explicitly stated** in the email.
- **Do not assume**, guess, or fabricate any information.
- If a field is missing, set it to `null` or an empty array (`[]`).
- Dates and times must be extracted **verbatim**.
- Do not infer intent — treat the text as-is.

---

Definitions:

If type is **"change_request"**, extract:
- "original_session": the exact original session date and time (or null if missing)
- "new_session": the new requested date and time (or null if missing)
- "reason": stated reason for change (or null)
- "students": affected student group if mentioned (or null)

If type is **"availability"**, extract:
- "available_slots_timings": list of available dates/times as given (or empty list if none)
- "notes": any special conditions or notes (or null)
- "students": group if mentioned (or null)

In both cases, always include:
- "from": sender's email or name if given (or null)
- "to": recipient's email or name if given (or null)

---

Return your result using this exact JSON format:

{
  "type": "change_request" or "availability" or "none",
  "from": "...",
  "to": "...",
  "original_session": "...",             
  "new_session": "...",                  
  "reason": "...",                       
  "students": "...",                    
  "available_slots_timings": ["..."],    
  "notes": "..."                         
}

---

Example Email 1:
From: dr.lim@hospital.sg  
To: scheduler@hospital.sg  

Hi, I'm not able to make the 12 July 10am session. Can we move it to 14 July 2pm? I have a medical appointment. It's for the Year 3 group.

Expected Output:
{
  "type": "change_request",
  "from": "dr.lim@hospital.sg",
  "to": "scheduler@hospital.sg",
  "original_session": "12 July 10am",
  "new_session": "14 July 2pm",
  "reason": "medical appointment",
  "students": "Year 3 group",
  "available_slots_timings": [],
  "notes": null
}

---

Example Email 2:
From: dr.tan@hospital.sg  
To: scheduler@hospital.sg  

I'm available for the following slots:
- 10 July (Mon) 2pm  
- 13 July (Thu) 4pm  

Let me know what works best. This is for the Year 2 batch.

Expected Output:
{
  "type": "availability",
  "from": "dr.tan@hospital.sg",
  "to": "scheduler@hospital.sg",
  "original_session": null,
  "new_session": null,
  "reason": null,
  "students": "Year 2 batch",
  "available_slots_timings": ["10 July (Mon) 2pm", "13 July (Thu) 4pm"],
  "notes": null
}

---


"""

# Response generation function
def generate_response(email_text):
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": email_text}
    ]

    # Fix: do not access .input_ids because it's already a tensor
    input_ids = tokenizer.apply_chat_template(messages, return_tensors="pt", tokenize=True).to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_new_tokens=500,
            do_sample=False,
            temperature=0.7,
            top_k=50,
            top_p=0.95,
            eos_token_id=tokenizer.eos_token_id,
        )

    # Only return the model's generated reply (skip the prompt part)
    response_ids = output_ids[0][input_ids.shape[-1]:]
    response = tokenizer.decode(response_ids, skip_special_tokens=True).strip()
    return response


# Launch Gradio UI
interface = gr.Interface(
    fn=generate_response,
    inputs=gr.Textbox(lines=15, label="Doctor's Email"),
    outputs=gr.Textbox(label="Structured Output (JSON)"),
    title="📅 Email Assistant (DeepSeek) - Doctor Scheduling",
    description="Paste a doctor's email to extract structured timetable-related info.",
)

interface.launch()
