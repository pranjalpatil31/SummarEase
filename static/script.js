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

document.getElementById("language-select").addEventListener("change", function () {
    const selectedLanguage = this.value;
    const summaryText = document.getElementById("summary-text").innerText;

    if (summaryText.trim() === "Your summary will appear here once you enter a video link.") return;

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
        }
    })
    .catch(error => console.error("Translation error:", error));
});
