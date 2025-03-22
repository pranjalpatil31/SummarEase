document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("url-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const videoUrl = document.getElementById("video-url").value;
        const spinner = document.getElementById("loading-spinner");
        const summaryContainer = document.getElementById("summary-container");

        // ✅ Show loading spinner & hide summary initially
        spinner.style.display = "inline-block";
        summaryContainer.style.display = "block";

        try {
            const response = await fetch("/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_url: videoUrl }),
            });

            const data = await response.json();

            if (data.title && data.summary) {
                document.getElementById("summary-title").innerHTML = `<strong>Title:</strong> ${data.title}`;
                document.getElementById("summary-text").innerHTML = data.summary;
                
                // ✅ Show buttons after loading summary
                document.getElementById("download-summary-pdf").style.display = "inline-block";
                document.getElementById("watch-video").style.display = "inline-block";
                document.getElementById("clear-button").style.display = "inline-block";
            } else if (data.error) {
                document.getElementById("summary-text").innerHTML = data.error;
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
            document.getElementById("summary-text").innerHTML = "An error occurred.";
        } finally {
            // ✅ Hide loading spinner & show summary container
            spinner.style.display = "none";
            summaryContainer.style.display = "block";
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const summarizeButton = document.getElementById("summarize-button");

    if (!summarizeButton) {
        console.error("❌ Error: 'summarize-button' not found in HTML.");
        return; // Stop script execution if button is missing
    }

    // ✅ Proceed only if button exists
    document.getElementById("url-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        summarizeButton.disabled = true; // ✅ No error since button exists
        console.log("✅ Summarization started...");

        // Continue with fetch request...
    });
});


    document.getElementById("summary-container").classList.add("show");

    document.getElementById("clear-button").addEventListener("click", () => {
        document.getElementById("video-url").value = "";
        document.getElementById("summary-text").innerHTML = "Your summary will appear here.";
        document.getElementById("summary-title").innerHTML = "";
        document.getElementById("loading-spinner").style.display = "none";
        document.getElementById("summary-container").style.display = "block";  // ✅ Hide summary again
        document.getElementById("summarize-button").disabled = false;  // ✅ Re-enable summarize button
    });
    
    
    // 🎯 Download PDF functionality
    document.getElementById("download-summary-pdf").addEventListener("click", async () => {
        const summaryText = document.getElementById("summary-text").innerText;
        const titleText = document.getElementById("summary-title").innerText;

        if (!summaryText.trim()) {
            alert("No summary available to download.");
            return;
        }

        try {
            const response = await fetch("/download_summary_pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary: summaryText, title: titleText })
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = "summary.pdf";
                link.click();
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to download the summary");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to download the summary: " + error.message);
        }
    });

    // 🎯 Watch YouTube video functionality
    document.getElementById("watch-video").addEventListener("click", () => {
        const videoUrl = document.getElementById("video-url").value.trim();
        const videoContainer = document.getElementById("video-container");
        const videoFrame = document.getElementById("video-frame");

        if (!videoUrl) {
            alert("Please enter a YouTube video URL.");
            return;
        }

        let videoId = null;
        let match = videoUrl.match(/(?:v=|\/|embed\/|youtu.be\/|watch\?v=)([0-9A-Za-z_-]{11})/);
        if (match) {
            videoId = match[1];
        }

        if (videoId) {
            videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            videoContainer.style.display = "block"; 
        } else {
            alert("Invalid YouTube URL.");
        }
    });


    // 🎯 Close video button functionality
    document.getElementById("close-video").addEventListener("click", () => {
        document.getElementById("video-container").style.display = "none";
        document.getElementById("video-frame").src = "";
    });

    // 🎯 Contact Form Validation
const contactForm = document.getElementById("contact-form");
if (contactForm) {
    contactForm.addEventListener("submit", function(e) {
        e.preventDefault(); 

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();
        const formStatus = document.getElementById("form-status");

        if (name === "" || email === "" || message === "") {
            formStatus.innerText = "Please fill in all fields!";
            formStatus.style.color = "red";
            return;
        }

        formStatus.innerText = "Message sent successfully!";
        formStatus.style.color = "green";
        contactForm.reset();
    });
}

document.getElementById("translate-btn").addEventListener("click", function () {
    document.getElementById("language-dropdown").classList.toggle("show");
});

document.querySelectorAll("#language-dropdown div").forEach(item => {
    item.addEventListener("click", function () {
        const selectedLanguage = this.getAttribute("data-lang");
        const summaryText = document.getElementById("summary-text").innerText;

        if (summaryText.trim() === "Your summary will appear here once you enter a video link.") return;

        // Show selected language on button
        document.getElementById("translate-btn").innerText = `Translate: ${this.innerText} ▼`;

        // Call API to translate summary
        fetch("/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: summaryText, target_lang: selectedLanguage })
        })
        .then(response => response.json())
        .then(data => {
            if (data.translated_text) {
                document.getElementById("summary-text").innerText = data.translated_text;
            } else {
                document.getElementById("summary-text").innerText = "Translation failed. Please try again.";
            }
        })
        .catch(error => {
            console.error("Translation error:", error);
            document.getElementById("summary-text").innerText = "An error occurred during translation.";
        });

        // Close dropdown after selection
        document.getElementById("language-dropdown").classList.remove("show");
    });
});

// Close dropdown if clicked outside
window.addEventListener("click", function (e) {
    if (!e.target.matches("#translate-btn")) {
        document.getElementById("language-dropdown").classList.remove("show");
    }
});

// share

function toggleShareDropdown() {
    const dropdown = document.getElementById("share-dropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

function getSummaryText() {
    let summaryElement = document.getElementById("summary-text");
    return summaryElement.innerText.trim();
}

function shareWhatsApp() {
    let summary = getSummaryText();
    if (!summary || summary === "Your summary will appear here once you enter a video link.") {
        alert("Please generate a summary before sharing.");
        return;
    }

    let encodedSummary = encodeURIComponent(summary);

    // Check if user has WhatsApp Desktop installed
    let desktopLink = "whatsapp://send?text=" + encodedSummary;
    let webLink = "https://wa.me/?text=" + encodedSummary;

    // Try opening WhatsApp Desktop first
    window.location.href = desktopLink;

    // Fallback: Open WhatsApp Web if Desktop app isn’t available
    setTimeout(() => {
        window.open(webLink, "_blank");
    }, 1000); // Delay ensures WhatsApp Desktop gets priority

    alert("If you’re not logged in to WhatsApp Web, please scan the QR code when prompted.");
    let url = "https://wa.me/?text=" + encodeURIComponent(summary);
    window.open(url, "_blank");
}


function shareTelegram() {
    let summary = getSummaryText();
    if (!summary || summary === "Your summary will appear here once you enter a video link.") {
        alert("Please generate a summary before sharing.");
        return;
    }
    let url = "https://t.me/share/url?text=" + encodeURIComponent(summary);
    window.open(url, "_blank");
}

function shareTwitter() {
    let summary = getSummaryText();
    if (!summary || summary === "Your summary will appear here once you enter a video link.") {
        alert("Please generate a summary before sharing.");
        return;
    }
    let url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(summary);
    window.open(url, "_blank");
}

function copyToClipboard() {
    let summary = getSummaryText();
    if (!summary || summary === "Your summary will appear here once you enter a video link.") {
        alert("Please generate a summary before copying.");
        return;
    }
    navigator.clipboard.writeText(summary).then(() => {
        alert("Summary copied to clipboard!");
    });
}

document.getElementById('contact-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent page refresh

    const formData = new FormData(this);

    try {
        const response = await fetch('/submit-form', {  // Ensure route matches your Flask endpoint
            method: 'POST',
            body: formData
        });

        const result = await response.text();

        if (response.ok) {
            document.getElementById('form-status').textContent = "Your message sent successfully!";
            document.getElementById('form-status').style.color = "green";
            this.reset();  // Clear the form after submission
        } else {
            document.getElementById('form-status').textContent = "Failed to send message.";
            document.getElementById('form-status').style.color = "red";
        }
    } catch (error) {
        document.getElementById('form-status').textContent = "Error sending message.";
        document.getElementById('form-status').style.color = "red";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const stars = document.querySelectorAll('.rate input');
    const submitButton = document.getElementById('submit-btn');
    const feedbackMessage = document.getElementById('feedback-message');

    submitButton.addEventListener('click', function () {
        const selectedStar = document.querySelector('.rate input:checked');

        if (!selectedStar) {
            alert("Please select a rating before submitting.");
        } else {
            feedbackMessage.style.display = "block";
        }
    });
});

document.getElementById('feedback-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch('/submit-feed', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            window.location.href = '/success';  // Change redirect path to match success route
        } else {
            document.getElementById('sub-status').textContent = "Failed to submit feedback.";
            document.getElementById('sub-status').style.color = "red";
        }
    } catch (error) {
        document.getElementById('sub-status').textContent = "Error submitting feedback.";
        document.getElementById('sub-status').style.color = "red";
    }
});
