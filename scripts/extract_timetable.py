import pdfplumber
import json
import re

def parse_pdf(pdf_path):
    data = []
    current_course = None
    
    with pdfplumber.open(pdf_path) as pdf:
        count = 0 
        for page in pdf.pages:
            # Extract table; adjust these settings based on PDF layout analysis
            # Using basic table extraction settings as a starting point
            table = page.extract_table(table_settings={
                "vertical_strategy": "lines", 
                "horizontal_strategy": "lines",
                "snap_tolerance": 3
            })
            
            if not table: continue

            for row in table:
                # Clean row data (remove newlines)
                cleaned_row = [cell.replace('\n', ' ').strip() if cell else '' for cell in row]
                
                # Check if row has enough columns (PDF seems to have around 9-10 cols based on description)
                # But let's be safe and check a reasonable length
                if len(cleaned_row) < 6: continue

                # Column mapping based on PDF description
                # 0: COM COD, 1: COURSE NO, 2: TITLE, ..., 5: INSTRUCTOR, 6: ROOM, 7: DAYS, 8: HOURS
                # Note: Adjust indices if the table structure is slightly different
                
                # Handling merging issues roughly:
                # Sometimes course_no is empty if it's a second section of the previous course
                
                # Try to map based on user's manual analysis:
                # 0: COM CODE
                # 1: COURSE NO
                # 2: COURSE TITLE
                # 3: CREDIT
                # 4: SECTION
                # 5: INSTRUCTOR
                # 6: ROOM
                # 7: DAYS
                # 8: HOURS
                # 9: COMPRE DATE (Maybe?)
                
                if len(cleaned_row) <= 8:
                    # Pad if short, though risk of misalignment
                    cleaned_row += [''] * (9 - len(cleaned_row))

                course_no = cleaned_row[1]
                title = cleaned_row[2]
                section = cleaned_row[4]
                instructor = cleaned_row[5]
                room = cleaned_row[6]
                days = cleaned_row[7]
                hours = cleaned_row[8]

                # 1. Detect New Course Block
                if course_no and title:
                    current_course = {
                        "id": course_no,
                        "title": title,
                        "credits": cleaned_row[3],
                        "sections": []
                    }
                    data.append(current_course)
                
                # If we have a course title but no number, update current? 
                # (Sometimes split across pages? usually repeated table header handles page breaks, but good to be careful)

                # 2. Detect Section/Component details belonging to current_course
                # If we have an instructor or room or valid section, it's a valid section row
                if current_course and (instructor or room or days or section):
                    section_type = "L" # Default to Lecture
                    
                    # Logic to determine type:
                    # Check "Practical" or "Tutorial" in Title (often in row[2] for new courses) or derived from usage
                    # The user prompt suggests checking col 0 or 2 for hints if "Practical" is textual.
                    # But often Section identifier is explicit (P1, T1).
                    # Let's check the section column (rank 4).
                    
                    if "P" in section.upper() or "PRAC" in title.upper():
                        section_type = "P"
                    elif "T" in section.upper() or "TUT" in title.upper():
                        section_type = "T"
                    
                    parsed_hours = parse_hours(hours) 
                    
                    current_course["sections"].append({
                        "section": section,
                        "instructor": instructor,
                        "room": room,
                        "days": days,
                        "hours": parsed_hours,
                        "type": section_type
                    })
    
    return data

def parse_hours(hour_str):
    # Map BITS hour codes to actual times if needed
    # Simple digit extraction
    return [int(h) for h in hour_str.split() if h.isdigit()]

if __name__ == "__main__":
    try:
        print("Parsing PDF...")
        timetable = parse_pdf("TIMETABLE-I-SEMESTER-2024-25.pdf")
        print(f"Found {len(timetable)} courses.")
        with open("lib/data/timetable_default.json", "w") as f:
            json.dump(timetable, f, indent=2)
        print("JSON saved to lib/data/timetable_default.json")
    except Exception as e:
        print(f"Error: {e}")
