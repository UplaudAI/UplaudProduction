#!/usr/bin/env python3
"""
All-in-one Google Maps scraper with CLI and FastAPI service.
- CLI: scrape a configured URL and push reviews to Airtable (with enrichment + dedupe).
- API: POST /scrape with {"url": "<maps_link>"} to scrape, enrich, dedupe, and push to Airtable.

Functionality matches the existing simple scraper and no-duplicate service.
"""
import os
import time
import traceback
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
try:
    from webdriver_manager.chrome import ChromeDriverManager
except Exception:
    ChromeDriverManager = None
from pyairtable import Api
from pyairtable.formulas import match

# ========== CONFIG (CLI) ==========
URL = "https://www.google.com/maps/contrib/110753570881278213135/reviews/"
HEADLESS = True
SLEEP_SHORT = 1.2
SLEEP_LONG = 2.5
# ==================================

# Airtable config (service)
load_dotenv()
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = os.getenv("AIRTABLE_TABLE_NAME", "Uplaud")

app = FastAPI(title="GMaps Scraper All-in-One (no duplicates)")


# ---------- Core scraper ----------
def setup_driver():
    """Return a Chrome WebDriver (Selenium Manager preferred; webdriver-manager fallback)."""
    options = Options()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    try:
        driver = webdriver.Chrome(options=options)
    except Exception:
        if ChromeDriverManager is None:
            raise
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    driver.set_window_size(1200, 1000)
    return driver


def find_reviews_container(driver):
    """Locate the scrollable reviews container on profile pages."""
    selectors = [
        'div[role="feed"]',
        'div[role="main"]',
        'div.m6QErb.DxyBCb',
        'div[aria-label*="Reviews" i]'
    ]
    for sel in selectors:
        try:
            el = driver.find_element(By.CSS_SELECTOR, sel)
            if el:
                return el
        except Exception:
            continue
    return None


def _get_review_cards(container):
    """Return list of review card elements from the given container."""
    if container is None:
        return []
    selectors = [
        'div.jftiEf',
        'div[data-review-id]'
    ]
    for sel in selectors:
        try:
            cards = container.find_elements(By.CSS_SELECTOR, sel)
            if cards:
                return cards
        except Exception:
            continue
    return []


def scroll_until_end(driver, container, max_stable_rounds=8, max_scrolls=800, min_scrolls=20, sleep_sec=SLEEP_SHORT):
    """Scroll the container (and window) until card count stops increasing."""
    if container is None:
        print("No reviews container found to scroll")
        return

    stable_hits = 0
    last_card_count = -1
    last_scroll_height = -1

    for i in range(1, max_scrolls + 1):
        try:
            driver.execute_script("arguments[0].scrollBy(0, arguments[0].clientHeight);", container)
        except Exception:
            try:
                driver.execute_script("window.scrollBy(0, window.innerHeight);")
            except Exception:
                pass

        time.sleep(sleep_sec)

        try:
            cards = _get_review_cards(container)
            card_count = len(cards)
        except Exception:
            card_count = 0

        try:
            scroll_height = driver.execute_script("return arguments[0].scrollHeight;", container)
        except Exception:
            try:
                scroll_height = driver.execute_script("return document.body.scrollHeight;")
            except Exception:
                scroll_height = 0

        try:
            if card_count > 0:
                driver.execute_script("arguments[0].scrollIntoView({block: 'end'});", cards[-1])
        except Exception:
            pass

        print(f"Auto-scroll {i} — cards: {card_count}, scrollHeight: {scroll_height} (stable {stable_hits})")

        if card_count == last_card_count and scroll_height == last_scroll_height:
            stable_hits += 1
        else:
            stable_hits = 0

        last_card_count = card_count
        last_scroll_height = scroll_height

        if i < min_scrolls:
            continue

        if stable_hits >= max_stable_rounds:
            print("No new reviews detected after multiple stable checks — stopping scroll.")
            break
    else:
        print(f"Reached safety limit ({max_scrolls}) — stopping scroll.")


def expand_reviews(driver):
    """Click 'More' or expand buttons to reveal full review text."""
    try:
        more_buttons = driver.find_elements(By.CSS_SELECTOR, 'button.w8nwRe, button[jsaction*="expand"]')
        for btn in more_buttons[:300]:
            try:
                driver.execute_script("arguments[0].click();", btn)
                time.sleep(0.08)
            except Exception:
                pass
        print("Attempted to expand review texts.")
    except Exception as e:
        print(f"Expand error: {e}")


def extract_reviews(driver, container=None):
    """Extract reviews from the page: business_name, review, rating."""
    reviews = []
    seen = set()

    try:
        profile_name = driver.find_element(By.CSS_SELECTOR, 'h1').text
    except Exception:
        profile_name = "Unknown"

    print(f"Profile: {profile_name}")

    if container is None:
        container = find_reviews_container(driver)

    review_elements = _get_review_cards(container)
    if not review_elements:
        print("No review elements found with any selector. Returning empty list.")
        return reviews

    for idx, element in enumerate(review_elements):
        try:
            try:
                business_name = element.find_element(By.CSS_SELECTOR, 'div.d4r55').text
            except Exception:
                try:
                    business_name = element.find_element(By.CSS_SELECTOR, 'button.fontHeadlineSmall').text
                except Exception:
                    business_name = profile_name

            rating = ""
            try:
                rating_elem = element.find_element(By.CSS_SELECTOR, 'span.kvMYJc')
                rating_text = rating_elem.get_attribute('aria-label') or ""
                rating = rating_text.split()[0] if rating_text else ""
            except Exception:
                try:
                    r2 = element.find_element(By.CSS_SELECTOR, 'span[role="img"][aria-label*="star"]')
                    rating_text = r2.get_attribute('aria-label') or ""
                    rating = rating_text.split()[0] if rating_text else ""
                except Exception:
                    rating = ""

            review_text = ""
            try:
                review_text = element.find_element(By.CSS_SELECTOR, 'span.wiI7pd').text.strip()
            except Exception:
                try:
                    review_text = element.find_element(By.CSS_SELECTOR, 'div.MyEned span').text.strip()
                except Exception:
                    try:
                        review_text = element.find_element(By.XPATH, ".//span[normalize-space(text())]").text.strip()
                    except Exception:
                        review_text = ""

            if not review_text and not rating:
                continue

            key = (business_name, review_text, rating)
            if key in seen:
                continue
            seen.add(key)

            reviews.append({
                'business_name': business_name,
                'review': review_text,
                'rating': rating
            })
            print(f"  {len(reviews)}. {business_name} - {rating} stars")

        except Exception as e:
            print(f"Error extracting review #{idx+1}: {e}")
            continue

    return reviews


# ---------- Enrichment and Airtable ----------
class ScrapeRequest(BaseModel):
    url: str


def extract_location_fields(element):
    """Try to get city/state/country from the review card if present."""
    city = state = country = ""
    try:
        candidates = [
            'a[href*="/maps/place"]',
            'div.d4r55+div',
            'div.W4Efsd',
            'div.fontBodyMedium',
        ]
        for sel in candidates:
            try:
                text = element.find_element(By.CSS_SELECTOR, sel).text.strip()
                if text:
                    parts = [p.strip() for p in text.split(',') if p.strip()]
                    if len(parts) >= 1:
                        city = parts[-2] if len(parts) >= 2 else ""
                        country = parts[-1]
                        if len(parts) >= 3:
                            state = parts[-3]
                        break
            except Exception:
                continue
    except Exception:
        pass
    return city, state, country


def enrich_reviews_with_names_and_location(driver, reviews):
    """Add reviewer name (profile owner) and best-effort city/state/country."""
    enriched = []
    try:
        try:
            profile_owner = driver.find_element(By.CSS_SELECTOR, 'h1').text.strip()
            print(f"   Profile owner (reviewer): {profile_owner}")
        except Exception:
            profile_owner = "Unknown"

        container = find_reviews_container(driver)
        if container is None:
            try:
                container = driver.find_element(By.CSS_SELECTOR, 'div[role="main"]')
            except Exception:
                container = None

        review_elements = []
        if container:
            try:
                review_elements = _get_review_cards(container)
            except Exception:
                review_elements = []

        for idx, review in enumerate(reviews):
            enriched_review = review.copy()
            enriched_review['reviewer_name'] = profile_owner

            city = state = country = ""
            if idx < len(review_elements):
                city, state, country = extract_location_fields(review_elements[idx])
            enriched_review['city'] = city
            enriched_review['state'] = state
            enriched_review['country'] = country

            enriched.append(enriched_review)
            print(f"   ✓ Review: {profile_owner} → {review['business_name']} | {city}, {state}, {country}")
    except Exception as e:
        print(f"   Error enriching: {e}")
        for review in reviews:
            review['reviewer_name'] = "Unknown"
            review['city'] = ""
            review['state'] = ""
            review['country'] = ""
            enriched.append(review)
    return enriched


def check_duplicate(table, reviewer_name, business_name, review_text):
    """Check if review already exists in Airtable."""
    try:
        formula = match({
            "Name_Creator": reviewer_name,
            "business_name": business_name,
            "Uplaud": review_text
        })
        records = table.all(formula=formula)
        return len(records) > 0
    except Exception as e:
        print(f"   Error checking duplicate: {e}")
        return False


def push_to_airtable(reviews):
    """Push reviews to Airtable table with duplicate checking."""
    if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
        print("⚠️ Airtable credentials missing. Skipping push.")
        return 0, 0

    try:
        api = Api(AIRTABLE_API_KEY)
        table = api.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME)

        inserted = 0
        skipped = 0

        for review in reviews:
            try:
                reviewer_name = review.get("reviewer_name", "Unknown")
                business_name = review.get("business_name", "")
                review_text = review.get("review", "")

                if check_duplicate(table, reviewer_name, business_name, review_text):
                    print(f"⊘ Skipped (duplicate): {reviewer_name} → {business_name}")
                    skipped += 1
                    continue

                record = {
                    "Name_Creator": reviewer_name,
                    "business_name": business_name,
                    "Uplaud": review_text,
                    "Uplaud Score": float(review.get("rating", 0)) if review.get("rating") else None,
                }

                if review.get("city"):
                    record["City"] = review.get("city")
                if review.get("state"):
                    record["State"] = review.get("state")
                if review.get("country"):
                    record["Country"] = review.get("country")

                table.create(record)
                inserted += 1
                print(f"✓ Inserted: {reviewer_name} → {business_name}")
            except Exception as e:
                print(f"✗ Failed to insert review: {e}")
                continue

        return inserted, skipped
    except Exception as e:
        print(f"Airtable error: {e}")
        traceback.print_exc()
        return 0, 0


# ---------- FastAPI endpoint ----------
@app.post("/scrape")
def scrape_reviews(payload: ScrapeRequest):
    url = payload.url.strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Provide a valid http/https URL.")

    print(f"\n{'='*60}")
    print(f"Starting scrape for: {url}")
    print(f"{'='*60}\n")

    driver = setup_driver()
    try:
        print("1. Loading page...")
        driver.get(url)
        time.sleep(SLEEP_LONG)

        print("2. Locating reviews container...")
        container = find_reviews_container(driver)
        if container is None:
            print("Could not locate reviews container; attempting fallback...")
            try:
                container = driver.find_element(By.CSS_SELECTOR, 'div[role="main"]')
            except Exception:
                container = None

        print("3. Auto-scrolling to load all reviews...")
        scroll_until_end(driver, container, max_stable_rounds=5, max_scrolls=300, min_scrolls=20, sleep_sec=SLEEP_SHORT)

        print("4. Expanding review texts...")
        expand_reviews(driver)
        time.sleep(1.2)

        print("5. Extracting reviews...")
        reviews = extract_reviews(driver, container)
        print(f"   Found {len(reviews)} reviews")

        print("6. Enriching with reviewer name and location...")
        reviews = enrich_reviews_with_names_and_location(driver, reviews)

        print("7. Pushing to Airtable (checking duplicates)...")
        inserted_count, skipped_count = push_to_airtable(reviews)

        print(f"\n✓ Complete: {inserted_count} inserted, {skipped_count} skipped (duplicates)")

        return {
            "status": "success",
            "count": len(reviews),
            "inserted_to_airtable": inserted_count,
            "skipped_duplicates": skipped_count,
            "reviews": reviews
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"\nFatal error: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(exc)}")
    finally:
        try:
            driver.quit()
        except Exception:
            pass
        print("Browser closed.\n")


# ---------- CLI entrypoint ----------
def main():
    print(f"Starting scraper for: {URL}\n")
    driver = setup_driver()
    try:
        print("Loading page...")
        driver.get(URL)
        time.sleep(SLEEP_LONG)

        print("Locating reviews container...")
        container = find_reviews_container(driver)
        if container is None:
            print("Could not locate reviews container reliably; attempting to use role='main' fallback.")
            try:
                container = driver.find_element(By.CSS_SELECTOR, 'div[role="main"]')
            except Exception:
                container = None

        print("\nAuto-scrolling to load all reviews...")
        scroll_until_end(driver, container, max_stable_rounds=5, max_scrolls=800, sleep_sec=SLEEP_SHORT)

        print("\nExpanding review texts...")
        expand_reviews(driver)
        time.sleep(1.2)

        print("\nExtracting reviews...")
        reviews = extract_reviews(driver, container)

        print("\nEnriching and pushing to Airtable...")
        reviews = enrich_reviews_with_names_and_location(driver, reviews)
        inserted, skipped = push_to_airtable(reviews)
        print(f"\nDone. Inserted: {inserted}, Skipped (duplicates): {skipped}")

    except Exception:
        print("\nFatal error:")
        traceback.print_exc()
    finally:
        try:
            driver.quit()
        except Exception:
            pass
        print("Browser closed.")


if __name__ == "__main__":
    main()
