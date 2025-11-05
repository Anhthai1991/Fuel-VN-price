#!/usr/bin/env python3
"""
PVOIL Price Update Script
Automatically crawls and updates gasoline prices from PVOIL website
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import os
import subprocess
import sys

# Configuration
PVOIL_URL = "https://www.pvoil.com.vn/tin-gia-xang-dau"
CSV_FILE = "pvoil_gasoline_prices_full.csv"
GIT_COMMIT_MESSAGE = "Auto-update PVOIL fuel prices - {date}"

def crawl_pvoil_prices():
    """
    Crawl current fuel prices from PVOIL website
    Returns: dict with price data or None if failed
    """
    try:
        print("Fetching data from PVOIL website...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(PVOIL_URL, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract price data (adjust selectors based on actual website structure)
        price_data = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'time': datetime.now().strftime('%H:%M:%S'),
        }
        
        # Find price table (adjust selector as needed)
        price_table = soup.find('table', class_='price-table') or soup.find('table')
        
        if price_table:
            rows = price_table.find_all('tr')
            for row in rows[1:]:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    fuel_type = cols[0].get_text(strip=True)
                    price = cols[1].get_text(strip=True).replace('.', '').replace(',', '')
                    price_data[fuel_type] = price
        
        print(f"Successfully crawled data: {price_data}")
        return price_data
        
    except Exception as e:
        print(f"Error crawling PVOIL prices: {e}")
        return None

def update_csv(price_data):
    """
    Update CSV file with new price data
    """
    try:
        # Load existing CSV or create new DataFrame
        if os.path.exists(CSV_FILE):
            df = pd.read_csv(CSV_FILE)
            print(f"Loaded existing CSV with {len(df)} rows")
        else:
            df = pd.DataFrame()
            print("Creating new CSV file")
        
        # Append new data
        new_row = pd.DataFrame([price_data])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save to CSV
        df.to_csv(CSV_FILE, index=False, encoding='utf-8-sig')
        print(f"CSV updated successfully. Total rows: {len(df)}")
        return True
        
    except Exception as e:
        print(f"Error updating CSV: {e}")
        return False

def git_commit_push():
    """
    Commit and push changes to Git repository
    """
    try:
        # Configure git (if needed)
        subprocess.run(['git', 'config', 'user.name', 'PVOIL Auto-Update Bot'], 
                      check=False)
        subprocess.run(['git', 'config', 'user.email', 'bot@pvoil-update.local'], 
                      check=False)
        
        # Add changes
        print("Adding changes to git...")
        subprocess.run(['git', 'add', CSV_FILE], check=True)
        
        # Commit
        commit_msg = GIT_COMMIT_MESSAGE.format(date=datetime.now().strftime('%Y-%m-%d %H:%M'))
        print(f"Committing: {commit_msg}")
        subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
        
        # Push
        print("Pushing to remote repository...")
        subprocess.run(['git', 'push'], check=True)
        
        print("Successfully pushed to repository")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Git operation failed: {e}")
        return False

def main():
    """
    Main execution function
    """
    print("="*50)
    print("PVOIL Price Auto-Update Script")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50)
    
    # Step 1: Crawl prices
    price_data = crawl_pvoil_prices()
    if not price_data:
        print("Failed to crawl price data. Exiting.")
        sys.exit(1)
    
    # Step 2: Update CSV
    if not update_csv(price_data):
        print("Failed to update CSV. Exiting.")
        sys.exit(1)
    
    # Step 3: Git commit and push
    if not git_commit_push():
        print("Failed to push to repository. Exiting.")
        sys.exit(1)
    
    print("="*50)
    print("Update completed successfully!")
    print("="*50)

if __name__ == "__main__":
    main()
