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

        print("[INFO] Loading tokenizer and model...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        
        # Set pad token if not already set
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
            print("[INFO] Set pad_token to eos_token")
        
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            device_map="auto",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            trust_remote_code=True
        )
        print("[OK] Model loaded successfully on:", self.model.device)

    def generate(self, email_text):
        print("[INFO] Preparing input...")
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": email_text}
        ]
        
        try:
            input_ids = self.tokenizer.apply_chat_template(
                messages,
                return_tensors="pt",
                tokenize=True,
                add_generation_prompt=True
            ).to(self.model.device)
            
            # Create attention mask
            attention_mask = torch.ones_like(input_ids)
            print("[INFO] Input prepared:", input_ids.shape)
        except Exception as e:
            print("[ERROR] Tokenization error:", e)
            return ""

        try:
            print("[INFO] Generating output...")
            with torch.no_grad():
                output_ids = self.model.generate(
                    input_ids,
                    attention_mask=attention_mask,
                    max_new_tokens=self.max_new_tokens,
                    do_sample=False,
                    temperature=self.temperature,
                    top_k=self.top_k,
                    top_p=self.top_p,
                    eos_token_id=self.tokenizer.eos_token_id,
                    pad_token_id=self.tokenizer.pad_token_id,
                )
            print("[OK] Output generated.")
        except Exception as e:
            print("[ERROR] Generation error:", e)
            return ""

        try:
            response_ids = output_ids[0][input_ids.shape[-1]:]
            response_text = self.tokenizer.decode(response_ids, skip_special_tokens=True).strip()
            print("[INFO] Decoded output:")
            try:
                safe_text = response_text.encode('ascii', 'ignore').decode('ascii')
                print(safe_text)
            except Exception:
                print("<Output contains special characters>")
            return response_text
        except Exception as e:
            print("[ERROR] Decoding error:", e)
            return ""