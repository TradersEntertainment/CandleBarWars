import time
import os
import json
import requests
from web3 import Web3
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load Env
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTRACTS_DIR = os.path.join(BASE_DIR, '..', 'contracts')

# Configuration
RPC_URL = os.getenv("BASE_RPC_URL", "https://sepolia.base.org")
PRIVATE_KEY = os.getenv("BASE_PRIVATE_KEY")

if not PRIVATE_KEY:
    raise ValueError("Missing BASE_PRIVATE_KEY in .env")

# Load Contract Address (V4 15m)
with open(os.path.join(CONTRACTS_DIR, "deployed_v4_15m_address.txt"), "r") as f:
    CONTRACT_ADDRESS = f.read().strip()

# Load ABI
with open(os.path.join(CONTRACTS_DIR, "artifacts", "contracts", "BarWars.sol", "BarWars.json"), "r") as f:
    CONTRACT_ABI = json.load(f)["abi"]

# Setup Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

print(f"⚡ [15m BOT] Started on {CONTRACT_ADDRESS}")
print(f"   Operator: {account.address}")

MARKETS = ["BTC", "ETH", "SOL", "XRP"]

def get_15m_stats(symbol):
    """Fetch last 15 1m candles to determine winner."""
    url = f"https://fapi.binance.com/fapi/v1/klines?symbol={symbol}USDT&interval=1m&limit=15"
    try:
        res = requests.get(url, timeout=10).json()
        if isinstance(res, dict) and "code" in res:
             print(f"Error fetching {symbol}: {res}")
             return 0, 0
        
        green = 0
        red = 0
        for c in res:
            open_p = float(c[1])
            close_p = float(c[4])
            if close_p > open_p:
                green += 1
            else:
                red += 1
        return green, red
    except Exception as e:
        print(f"Exception fetching {symbol}: {e}")
        return 0, 0

def resolve_round():
    print(f"\n⚡ [15m] Resolving Round: {datetime.now(timezone.utc)}")
    
    # Nonce management
    nonce = w3.eth.get_transaction_count(account.address)

    for symbol in MARKETS:
        green, red = get_15m_stats(symbol)
        print(f"   {symbol}: Green={green}, Red={red}")

        winner = 0 # Default Tie/House
        if green > red:
            winner = 1
        elif red > green:
            winner = 2
        
        # Build TX
        try:
            tx = contract.functions.resolve(symbol, winner).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': w3.eth.gas_price
            })
            
            signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            print(f"   -> TX Sent: {w3.to_hex(tx_hash)}")
            nonce += 1 # Increment local nonce for next loop
            
        except Exception as e:
            print(f"   -> Failed: {e}")

def main_loop():
    print("   Waiting for 15-minute intervals (00, 15, 30, 45)...")
    while True:
        now = datetime.now(timezone.utc)
        
        # Check if we are at minute 0, 15, 30, 45 AND second < 5 (to avoid double runs)
        if now.minute % 15 == 0 and now.second < 10:
            resolve_round()
            time.sleep(60) # Sleep to clear the trigger window
        else:
            time.sleep(1) # Fast poll to hit the mark

if __name__ == "__main__":
    main_loop()
