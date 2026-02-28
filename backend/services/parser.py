import os 
import json 
from google import genai 
from dotenv import load_dotenv 

load_dotenv() 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 

class TransactionParser: 

    def build_prompt(self, raw_text, doc_type): 
        return f"""You are a financial data extraction assistant for Indian bank statements. 

Extract ALL transactions from the text and return ONLY a valid JSON array. 

Each object must have: 
- "date": convert any date format to DD-MM-YYYY 
  Common Indian bank formats you will see: 
  * 01 Feb 2026 → 01-02-2026 
  * 01/02/2026 → 01-02-2026 
  * 02-02-2026 → keep as is 
  * 2 Feb 26 → 02-02-2026 
  If date is completely unreadable, 
  use the date of the nearest valid transaction 
  Never return null or empty for date field
- "description": original text 
- "merchant": cleaned name 
- "amount": positive number 
- "type": "debit" or "credit" 
- "category": one of: Food, Transport, 
  Shopping, Housing, Health, Entertainment, 
  Investment, Income, Utilities, Education, Others 

Return ONLY JSON array. No markdown. No backticks. 

Document type: {doc_type} 
Raw text: 
{raw_text}""" 

    def parse(self, raw_text, doc_type): 
        try: 
            client = genai.Client(api_key=GEMINI_API_KEY) 
            prompt = self.build_prompt(raw_text, doc_type) 
            response = client.models.generate_content( 
                model="gemini-2.5-flash", 
                contents=prompt 
            ) 
            text = response.text.strip() 
            text = text.replace("```json","").replace("```","").strip() 
            transactions = json.loads(text) 
            if isinstance(transactions, list): 
                for t in transactions: 
                    if not t.get('date') or t['date'] == 'null': 
                        t['date'] = '01-01-2026' 
                    date_str = str(t['date']).strip() 
                    t['date'] = date_str 
                return transactions 
            return [] 
        except Exception as e: 
            print(f"PARSER ERROR: {e}") 
            return [] 

    def parse_in_chunks(self, raw_text, doc_type):
        if len(raw_text) <= 10000:
            return self.parse(raw_text, doc_type)
        
        chunks = []
        words = raw_text.split('\n')
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += len(word)
            if current_size >= 8000:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_size = 0
        
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
        
        print(f"Processing {len(chunks)} chunks in parallel")
        
        from concurrent.futures import ThreadPoolExecutor, as_completed
        all_transactions = []
        
        with ThreadPoolExecutor(max_workers=len(chunks)) as executor:
            futures = {
                executor.submit(self.parse, chunk, doc_type): i
                for i, chunk in enumerate(chunks)
            }
            for future in as_completed(futures):
                try:
                    result = future.result()
                    all_transactions.extend(result)
                except Exception as e:
                    print(f"Chunk error: {e}")
        
        seen = set()
        unique = []
        for t in all_transactions:
            key = f"{t.get('date')}-{t.get('amount')}-{t.get('merchant','')}"
            if key not in seen:
                seen.add(key)
                unique.append(t)
        
        print(f"Total unique transactions: {len(unique)}")
        return unique
