import logging
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file,  redirect, url_for
from youtube_transcript_api import YouTubeTranscriptApi
import re
from transformers import pipeline
import csv
import os
from fpdf import FPDF
import yt_dlp  
import requests
import openai  # OpenAI API for grammar correction
from deep_translator import GoogleTranslator
from google.cloud import translate


app = Flask(__name__, static_folder="static", template_folder="templates")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/features.html")
def features():
    return render_template("features.html")

@app.route("/about.html")
def about():
    return render_template("about.html")

@app.route("/contact.html")
def contact():
    return render_template("contact.html")

@app.route("/rateus.html")  
def rateus():
    return render_template("rateus.html")

@app.route("/main.html")
def main():
    return render_template("main.html")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

# Create 'contact_responses.csv' if it doesn't exist
CSV_FILE = "contact_responses.csv"
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Name", "Email", "Message"])  # CSV Headers

CSV_FILE = "contact_responses.csv"

# Create CSV file if it doesn't exist
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Name", "Email", "Message"])

@app.route('/submit-form', methods=['POST'])
def submit_form():
    name = request.form.get('name')
    email = request.form.get('email')
    message = request.form.get('message')

    # Save data to CSV
    with open(CSV_FILE, 'a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([name, email, message])

    # Redirect to success page
    return redirect(url_for('success_page'))

@app.route('/success')
def success_page():
    return render_template('success.html')

@app.route('/submit-feed', methods=['POST'])
def submit_feedback():
    rating = request.form.get('rating')
    comment = request.form.get('comment')

    if rating:
        print(f"Rating: {rating}, Comment: {comment}")
        return redirect(url_for('success_page'))  # Change redirect to match success page
    else:
        return "Failed", 400

@app.route('/feedback-success')
def feedback_success():
    return render_template('success.html')


def get_video_title(video_url):
    try:
        video_id = get_video_id(video_url)
        if not video_id:
            return "Unknown Title"

        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(oembed_url)

        if response.status_code == 200:
            return response.json().get("title", "Unknown Title")
        else:
            return "Unknown Title"
    except Exception as e:
        app.logger.error(f"❌ Error fetching video title: {str(e)}")
        return "Unknown Title"
    
def get_video_id(video_url):
    try:
        video_id_match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", video_url)
        return video_id_match.group(1) if video_id_match else None
    except Exception as e:
        app.logger.error(f"Error in get_video_id: {str(e)}")
        return None

def extract_transcript(video_url, language="en"):
    try:
        video_id = get_video_id(video_url)
        if not video_id:
            raise ValueError("Invalid video ID extracted from URL.")

        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = transcript_list.find_transcript([language])
        caption_text = transcript.fetch()
        return "\n".join([t['text'] for t in caption_text])

    except Exception as e:
        app.logger.error(f"Error in extract_transcript: {str(e)}")
        return f"An error occurred while fetching the transcript: {str(e)}"

# Initialize the summarization model
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", torch_dtype="auto")
# "facebook/bart-large-cnn"

def correct_grammar(text):
    """Corrects grammatical mistakes using OpenAI GPT-3."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "Fix any grammar mistakes in this summary while keeping it concise and clear:"},
                      {"role": "user", "content": text}]
        )
        return response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return text  # Fallback to original text if correction fails

def summarize_text(text):
    try:
        max_chunk_length = 512  # Model limit
        inputs = [text[i:i + max_chunk_length] for i in range(0, len(text), max_chunk_length)]

        # **Batch processing for speed**
        summaries = summarizer(inputs, max_length=150, min_length=30, do_sample=False, batch_size=8)

        # **Correct grammar for better readability**
        corrected_summaries = [correct_grammar(summary["summary_text"]) for summary in summaries]

        # **Format structured summary**
        return "".join(f"✦ {summary}<br><br>" for summary in corrected_summaries)

    except Exception as e:
        app.logger.error(f"Error in summarize_text: {str(e)}")
        return f"An error occurred during summarization: {str(e)}"


@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        video_url = request.json['video_url']
        app.logger.debug(f"Received URL: {video_url}")

        video_title = get_video_title(video_url)
        transcript = extract_transcript(video_url)
        if "An error occurred" in transcript:
            return jsonify({"error": transcript})

        summary = summarize_text(transcript)
        return jsonify({"title": video_title, "summary": summary.replace("\n", "<br>")})

    except Exception as e:
        app.logger.error(f"Error in summarize route: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again."})


# ✅ Alternate summarization route (Kept intact)
@app.route('/summarize_alternate', methods=['POST'])
def summarize_alternate():
    try:
        video_url = request.json['video_url']
        app.logger.debug(f"Received URL: {video_url}")

        transcript = extract_transcript(video_url)
        if "An error occurred" in transcript:
            return jsonify({"error": transcript})

        summary = summarize_text(transcript)
        return jsonify({"summary": summary.replace("\n", "<br>")})

    except Exception as e:
        app.logger.error(f"Error in summarize route: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again."})

# ✅ PDF Download API (Kept unchanged)
@app.route('/download_summary_pdf', methods=['POST'])
def download_summary_pdf():
    try:
        summary_text = request.json.get('summary')
        title_text = request.json.get('title', 'Video Summary')

        if not summary_text:
            return jsonify({"error": "No summary available to download."})

        summary_text = re.sub(r'[^A-Za-z0-9\s.,!?\'"-]', '', summary_text)
        summary_text = summary_text.replace("<br>", "\n").strip()

        file_name = "video_summary.pdf"
        file_path = os.path.join("static", file_name)

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", size=10)
        pdf.multi_cell(0, 10, title_text)
        pdf.multi_cell(0, 10, summary_text)
        pdf.output(file_path)

        return send_file(file_path, as_attachment=True)

    except Exception as e:
        app.logger.error(f"Error generating PDF: {str(e)}")
        return jsonify({"error": f"An error occurred while trying to generate the PDF: {str(e)}"})

    
@app.route("/translate", methods=["POST"])
def translate_text():
    try:
        data = request.json
        text = data.get("text", "")
        target_lang = data.get("target_lang", "en")

        if not text.strip():
            return jsonify({"error": "No text provided"}), 400

        translator = GoogleTranslator(source="auto", target=target_lang)
        translated_text = translator.translate(text)

        if not translated_text.strip():
            raise Exception("Empty translation result")

        return jsonify({"translated_text": translated_text})

    except Exception as e:
        print("Translation Error:", str(e))  # Debugging
        return jsonify({"error": "Translation service is currently unavailable. Please try again later."}), 500


if __name__ == '__main__':
    app.run(debug=True)
