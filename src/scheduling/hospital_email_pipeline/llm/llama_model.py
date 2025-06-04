import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import yaml
import os

class LlamaModel:
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "../config/llm_config.yaml")
        config_path = os.path.abspath(config_path)

        with open(config_path, "r") as f:
            config = yaml.safe_load(f)

        self.model_id = config["model_id"]
        self.system_prompt = config["system_prompt"]
        self.max_new_tokens = config["max_new_tokens"]
        self.temperature = config["temperature"]
        self.top_k = config["top_k"]
        self.top_p = config["top_p"]

        print("🔄 Loading tokenizer and model...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            device_map="auto",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            trust_remote_code=True
        )
        print("✅ Model loaded successfully on:", self.model.device)

    def generate(self, email_text):
        print("🧠 Preparing input...")
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": email_text}
        ]
        
        try:
            input_ids = self.tokenizer.apply_chat_template(
                messages,
                return_tensors="pt",
                tokenize=True
            ).to(self.model.device)
            print("📥 Input prepared:", input_ids.shape)
        except Exception as e:
            print("❌ Tokenization error:", e)
            return ""

        try:
            print("🚀 Generating output...")
            with torch.no_grad():
                output_ids = self.model.generate(
                    input_ids,
                    max_new_tokens=self.max_new_tokens,
                    do_sample=False,
                    temperature=self.temperature,
                    top_k=self.top_k,
                    top_p=self.top_p,
                    eos_token_id=self.tokenizer.eos_token_id,
                )
            print("✅ Output generated.")
        except Exception as e:
            print("❌ Generation error:", e)
            return ""

        try:
            response_ids = output_ids[0][input_ids.shape[-1]:]
            response_text = self.tokenizer.decode(response_ids, skip_special_tokens=True).strip()
            print("📤 Decoded output:", response_text)
            return response_text
        except Exception as e:
            print("❌ Decoding error:", e)
            return ""