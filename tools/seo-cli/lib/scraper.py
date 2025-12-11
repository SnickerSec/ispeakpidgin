#!/usr/bin/env python3
"""
Google SERP Scraper using Botasaurus
Extracts PAA (People Also Ask) and PASF (People Also Search For) data
"""

import sys
import json
import argparse
import os
import glob
import re
from botasaurus.browser import browser, Driver


# Find Chrome executable from Puppeteer cache
def find_chrome():
    puppeteer_cache = os.path.expanduser("~/.cache/puppeteer/chrome")
    if os.path.exists(puppeteer_cache):
        chrome_paths = glob.glob(os.path.join(puppeteer_cache, "*/chrome-linux*/chrome"))
        if chrome_paths:
            return sorted(chrome_paths, key=os.path.getmtime, reverse=True)[0]
    return None


CHROME_PATH = find_chrome()


@browser(
    headless=True,
    block_images=True,
    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    chrome_executable_path=CHROME_PATH,
)
def scrape_google(driver: Driver, keyword: str):
    """Scrape Google SERP for PAA and PASF data"""

    results = {
        "keyword": keyword,
        "paa": [],
        "pasf": [],
        "organic": [],
        "featured_snippet": None,
        "success": True,
        "error": None
    }

    try:
        # Navigate to Google search using google_get for better handling
        search_url = f"https://www.google.com/search?q={keyword.replace(' ', '+')}&hl=en"
        driver.google_get(search_url, accept_google_cookies=True)

        # Wait for page to load
        driver.sleep(3)

        # Check for CAPTCHA using page text (it's a property, not a method)
        page_text = driver.page_text
        if page_text and ("unusual traffic" in page_text.lower() or "captcha" in page_text.lower() and "Search Results" not in page_text):
            results["success"] = False
            results["error"] = "CAPTCHA detected"
            return results

        # Get page HTML
        page_html = driver.page_html

        # Extract People Also Ask (PAA) - look for questions in the page text
        # PAA questions usually appear after "People also ask"
        if "People also ask" in page_text:
            # Find questions - they end with ?
            lines = page_text.split('\n')
            in_paa = False
            for line in lines:
                line = line.strip()
                if "People also ask" in line:
                    in_paa = True
                    continue
                if in_paa and line.endswith('?') and 15 < len(line) < 150:
                    if line not in results["paa"]:
                        results["paa"].append(line)
                    if len(results["paa"]) >= 8:
                        break
                # Stop if we hit another section
                if in_paa and len(results["paa"]) > 0 and ("Related searches" in line or "People also search for" in line):
                    break

        # Alternative: Extract questions from page text using regex
        if not results["paa"]:
            # Find questions that look like PAA
            question_pattern = r'([A-Z][^.!?]*\?)'
            questions = re.findall(question_pattern, page_text)
            for q in questions[:15]:
                q = q.strip()
                if 15 < len(q) < 150 and q not in results["paa"]:
                    # Filter out navigational text
                    if not any(skip in q.lower() for skip in ['sign in', 'accessibility', 'feedback', 'skip to']):
                        results["paa"].append(q)
                        if len(results["paa"]) >= 8:
                            break

        # Extract Related Searches / PASF
        if "Related searches" in page_text or "People also search" in page_text:
            lines = page_text.split('\n')
            in_related = False
            for line in lines:
                line = line.strip()
                if "Related searches" in line or "People also search" in line:
                    in_related = True
                    continue
                if in_related and 5 < len(line) < 80 and not line.endswith('?'):
                    # Filter out UI text
                    if not any(skip in line.lower() for skip in ['sign in', 'images', 'videos', 'news', 'maps', 'shopping', 'more', 'tools', 'feedback']):
                        if line not in results["pasf"]:
                            results["pasf"].append(line)
                        if len(results["pasf"]) >= 10:
                            break

        # Extract links to get organic results
        try:
            all_links = driver.get_all_links()
            position = 0
            seen_urls = set()
            for url in all_links:
                if url and url.startswith('http') and 'google.com' not in url and 'gstatic.com' not in url:
                    if url not in seen_urls:
                        seen_urls.add(url)
                        position += 1
                        results["organic"].append({
                            "title": "",  # Can't easily get titles this way
                            "url": url,
                            "position": position
                        })
                        if position >= 10:
                            break
        except Exception as e:
            pass

        # Extract featured snippet - look for definition text at the top
        definition_patterns = [
            r'Definitions from Oxford Languages',
            r'noun\nnoun:',
            r'adjective\nadjective:',
            r'verb\nverb:',
        ]
        for pattern in definition_patterns:
            if pattern in page_text:
                # Get text around the definition
                idx = page_text.find(pattern)
                if idx > 0:
                    snippet = page_text[max(0, idx-100):idx+400]
                    results["featured_snippet"] = snippet.strip()
                    break

    except Exception as e:
        results["success"] = False
        results["error"] = str(e)

    return results


def main():
    parser = argparse.ArgumentParser(description="Scrape Google SERP data")
    parser.add_argument("keyword", help="Search keyword to scrape")
    parser.add_argument("--type", choices=["all", "paa", "pasf"], default="all",
                       help="Type of data to scrape")

    args = parser.parse_args()

    # Run the scraper
    result = scrape_google(args.keyword)

    # Filter output based on type
    if args.type == "paa":
        output = {"keyword": result["keyword"], "paa": result["paa"], "success": result["success"], "error": result.get("error")}
    elif args.type == "pasf":
        output = {"keyword": result["keyword"], "pasf": result["pasf"], "success": result["success"], "error": result.get("error")}
    else:
        output = result

    # Output as JSON
    print(json.dumps(output, indent=2))

    # Exit with error code if failed
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
