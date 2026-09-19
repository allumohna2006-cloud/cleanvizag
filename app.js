const API_URL = "https://cleanvizag-backend.onrender.com";

// -----------------------------
// PHOTO PREVIEW
// -----------------------------

const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");

photoInput.addEventListener("change", () => {

    const file = photoInput.files[0];

    if (!file) {
        photoPreview.style.display = "none";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Photo must be smaller than 5 MB.");
        photoInput.value = "";
        photoPreview.style.display = "none";
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Only JPG, JPEG and PNG images are allowed.");
        photoInput.value = "";
        photoPreview.style.display = "none";
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        photoPreview.src = event.target.result;
        photoPreview.style.display = "block";
    };

    reader.readAsDataURL(file);
});


// -----------------------------
// CURRENT LOCATION
// -----------------------------

const locationButton =
    document.getElementById("locationButton");

const locationMessage =
    document.getElementById("locationMessage");

locationButton.addEventListener("click", () => {

    if (!navigator.geolocation) {
        locationMessage.textContent =
            "Location detection is not supported by this browser.";
        return;
    }

    locationMessage.textContent =
        "Detecting your location...";

    navigator.geolocation.getCurrentPosition(

        (position) => {

            document.getElementById("latitude").value =
                position.coords.latitude.toFixed(6);

            document.getElementById("longitude").value =
                position.coords.longitude.toFixed(6);

            locationMessage.textContent =
                "Location captured successfully.";

        },

        () => {

            locationMessage.textContent =
                "Unable to get your location. Please enter the location manually.";

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

});


// -----------------------------
// SUBMIT COMPLAINT
// -----------------------------

const complaintForm =
    document.getElementById("complaintForm");

complaintForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formMessage =
        document.getElementById("formMessage");

    formMessage.textContent =
        "Submitting complaint...";

    const formData = new FormData();

    formData.append(
        "wasteType",
        document.getElementById("wasteType").value
    );

    formData.append(
        "description",
        document.getElementById("description").value
    );

    formData.append(
        "area",
        document.getElementById("area").value
    );

    formData.append(
        "street",
        document.getElementById("street").value
    );

    formData.append(
        "pincode",
        document.getElementById("pincode").value
    );

    formData.append(
        "latitude",
        document.getElementById("latitude").value
    );

    formData.append(
        "longitude",
        document.getElementById("longitude").value
    );

    formData.append(
        "name",
        document.getElementById("name").value
    );

    formData.append(
        "mobile",
        document.getElementById("mobile").value
    );

    formData.append(
        "email",
        document.getElementById("email").value
    );

    if (photoInput.files[0]) {
        formData.append(
            "photo",
            photoInput.files[0]
        );
    }


    try {

        const response = await fetch(
            `${API_URL}/api/complaints`,
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to submit complaint."
            );
        }


        document.getElementById(
            "resultComplaintId"
        ).textContent = data.complaint.id;

        document.getElementById(
            "resultMunicipalReference"
        ).textContent =
            data.complaint.municipalReference || "Not connected";

        document.getElementById(
            "resultDate"
        ).textContent =
            new Date(
                data.complaint.createdAt
            ).toLocaleString();

        document.getElementById(
            "resultStatus"
        ).textContent =
            data.complaint.status;


        document.getElementById(
            "successMessage"
        ).textContent =
            data.message;


        document.getElementById(
            "successSection"
        ).classList.remove("hidden");


        complaintForm.reset();

        photoPreview.style.display = "none";

        document.getElementById(
            "successSection"
        ).scrollIntoView({
            behavior: "smooth"
        });


        formMessage.textContent = "";

    } catch (error) {

        formMessage.textContent =
            error.message;

    }

});


// -----------------------------
// TRACK COMPLAINT
// -----------------------------

const trackForm =
    document.getElementById("trackForm");

trackForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const id =
        document.getElementById("trackId").value.trim();

    const trackingResult =
        document.getElementById("trackingResult");


    try {

        const response = await fetch(
            `${API_URL}/api/complaints/${encodeURIComponent(id)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Complaint not found."
            );
        }


        const complaint = data.complaint;


        document.getElementById(
            "trackComplaintId"
        ).textContent = complaint.id;

        document.getElementById(
            "trackCategory"
        ).textContent = complaint.wasteType;

        document.getElementById(
            "trackLocation"
        ).textContent =
            `${complaint.area}, ${complaint.street}`;

        document.getElementById(
            "trackDate"
        ).textContent =
            new Date(
                complaint.createdAt
            ).toLocaleString();

        document.getElementById(
            "trackStatus"
        ).textContent =
            complaint.status;

        document.getElementById(
            "trackMunicipal"
        ).textContent =
            complaint.municipalReference || "Not connected";


        trackingResult.classList.remove("hidden");

    } catch (error) {

        trackingResult.classList.remove("hidden");

        trackingResult.innerHTML =
            `<p>${error.message}</p>`;

    }

});