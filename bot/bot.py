
import os
import time
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from web3 import Web3

# Robust Path Handling
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load .env from root
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
BASE_RPC_URL = os.getenv("BASE_RPC_URL", "https://sepolia.base.org")

PRIVATE_KEY = os.getenv("BASE_PRIVATE_KEY")
if not PRIVATE_KEY:
    raise ValueError(f"BASE_PRIVATE_KEY NOT FOUND in {os.path.join(BASE_DIR, '..', '.env')}")

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET")
PINATA_JWT = os.getenv("PINATA_JWT")

CONTRACTS_DIR = os.path.join(BASE_DIR, '..', 'contracts')

# Load Contract Address (V3.2)
with open(os.path.join(CONTRACTS_DIR, "deployed_v3_2_address.txt"), "r") as f:
    CONTRACT_ADDRESS = f.read().strip()

# Load ABI
with open(os.path.join(CONTRACTS_DIR, "BarWarsV2.json"), "r") as f:
    CONTRACT_ABI = json.load(f)["abi"]

# Setup Web3
w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

# --- MARKET DATA ---
MARKETS = ["BTC", "ETH", "SOL", "XRP"]

def get_candle_stats(symbol):
    """
    Fetches 1m candles for SYMBOL + USDT from Binance Futures for the last 24h.
    Counts Green vs Red candles.
    """
    pair = f"{symbol}USDT"
    print(f"[{symbol}] Fetching Binance Futures data...")
    try:
        url = "https://fapi.binance.com/fapi/v1/klines"
        # 1m intervals, limit 1440 (24 hours)
        params = {
            "symbol": pair,
            "interval": "1m",
            "limit": 1440 
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        green_count = 0
        red_count = 0
        
        for candle in data:
            open_price = float(candle[1])
            close_price = float(candle[4])
            
            if close_price > open_price:
                green_count += 1
            else:
                red_count += 1
                
        print(f"[{symbol}] Stats: Green={green_count}, Red={red_count}")
        return green_count, red_count
    except Exception as e:
        print(f"[{symbol}] Error fetching data: {e}")
        return 0, 0

# --- CONTRACT INTERACTION ---
def resolve_round():
    print("Resolving Bar Wars V3.2 Rounds...")
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
    
    nonce = w3.eth.get_transaction_count(account.address)
    
    for symbol in MARKETS:
        green, red = get_candle_stats(symbol)
        
        # 1 = BULL, 2 = BEAR
        winner = 0
        if green > red:
            winner = 1
            print(f"[{symbol}] Winner: BULLS")
        elif red > green:
            winner = 2
            print(f"[{symbol}] Winner: BEARS")
        else:
            print(f"[{symbol}] Draw! Skipping resolution.")
            continue

        try:
            print(f"[{symbol}] Sending TX with nonce {nonce}...")
            tx = contract.functions.resolve(symbol, winner).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 300000,
                'gasPrice': w3.eth.gas_price
            })
            
            signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            print(f"[{symbol}] TX Sent: {tx_hash.hex()}")
            
            # Increment Check
            nonce += 1
            time.sleep(2) # Prevent RPC rate limits
            
        except Exception as e:
            print(f"[{symbol}] Error parsing/sending: {e}")
            # Refresh nonce on error to be safe
            nonce = w3.eth.get_transaction_count(account.address)

if __name__ == "__main__":
    resolve_round()
