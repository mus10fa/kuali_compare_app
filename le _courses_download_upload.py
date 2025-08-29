import requests
import json
from pymongo import MongoClient
from datetime import datetime

# === CONFIG ===
TOKEN = ""
URL = "https://york-sbx.kuali.co/api/v0/cm/search"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}
LIMIT = 1000
MAX_LIMIT = 10000
PREFIXES = ["mech", "eng", "esse", "eecs", "tron", "civl"]

# === FETCH COURSES ===
def fetch_courses_for_prefix(prefix):
    skip = 0
    courses = []

    while True:
        batch_limit = min(LIMIT, MAX_LIMIT - skip)
        if batch_limit <= 0:
            break

        params = {
            "limit": batch_limit,
            "skip": skip,
            "status": "active",
            "index": "courses_latest",
            "q": prefix
        }

        try:
            response = requests.get(URL, headers=HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

            if not isinstance(data, list) or len(data) == 0:
                break

            courses.extend(data)
            skip += len(data)
            print(f"✅ Fetched {len(data)} from prefix '{prefix}' (Total: {skip})")

        except requests.RequestException as e:
            print(f"❌ Error fetching courses for prefix '{prefix}': {e}")
            break

    return courses

# === MAIN FETCH FUNCTION WITH TIMESTAMPED FILENAME ===
def fetch_all_prefix_courses():
    all_courses = []
    seen_ids = set()

    for prefix in PREFIXES:
        prefix_courses = fetch_courses_for_prefix(prefix)

        for course in prefix_courses:
            course_id = course.get("id")
            subject_code = course.get("subjectCode", "")

            if course_id and course_id not in seen_ids and subject_code.startswith("LE/"):
                all_courses.append(course)
                seen_ids.add(course_id)

    print(f"\n📊 Total filtered LE/ courses: {len(all_courses)}")

    # Timestamped filename
    import os
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = os.path.join(os.path.expanduser("~"), "Documents", f"le_courses_{timestamp}.json")


    with open(filename, "w") as f:
        json.dump(all_courses, f, indent=2)

    print(f"📁 Saved to {filename}")
    return filename, timestamp

# === UPLOAD TO MONGODB WITH TIMESTAMPED COLLECTION NAME ===
def upload_to_mongodb(json_file, timestamp, db_name="kuali", collection_prefix="courses"):
    client = MongoClient("mongodb+srv://mus10faa:kualijson@kualicompare.ygobilo.mongodb.net/?retryWrites=true&w=majority&appName=kualicompare")
    db = client[db_name]

    collection_name = f"{collection_prefix}_{timestamp}"
    collection = db[collection_name]

    with open(json_file, "r") as f:
        data = json.load(f)
        if isinstance(data, list):
            collection.insert_many(data)
            print(f"📤 Inserted {len(data)} courses into MongoDB collection: {collection_name}")
        else:
            collection.insert_one(data)
            print(f"📤 Inserted 1 document into MongoDB collection: {collection_name}")

# === MAIN ===
if __name__ == "__main__":
    json_path, ts = fetch_all_prefix_courses()
    upload_to_mongodb(json_path, ts)

