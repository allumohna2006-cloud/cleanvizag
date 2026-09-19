const express = require("express");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const {
    submitToMunicipality
} = require("./municipal/gvmcAdapter");


const app = express();

const PORT = process.env.PORT || 5000;


// ----------------------------------
// BASIC CONFIGURATION
// ----------------------------------

app.use(cors());

app.use(express.json());


// ----------------------------------
// UPLOAD DIRECTORY
// ----------------------------------

const uploadDirectory =
    path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}


// ----------------------------------
// IMAGE UPLOAD
// ----------------------------------

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadDirectory);

    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const filename =
            `${Date.now()}-${Math.round(Math.random() * 100000)}${extension}`;

        cb(null, filename);

    }

});


const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowed =
            ["image/jpeg", "image/png"];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, JPEG and PNG files are allowed."));
        }

    }

});


// ----------------------------------
// RATE LIMIT
// ----------------------------------

const complaintLimiter =
    rateLimit({

        windowMs: 15 * 60 * 1000,

        max: 20,

        message: {
            message:
                "Too many complaints submitted. Please try again later."
        }

    });


// ----------------------------------
// TEMPORARY DATABASE
// ----------------------------------
//
// IMPORTANT:
// This is only for local development.
// For the final project use PostgreSQL/MySQL.
//

const complaints = new Map();


// ----------------------------------
// VALIDATION
// ----------------------------------

const allowedWasteTypes = [

    "Garbage Dump",
    "Overflowing Dustbin",
    "Uncollected Waste",
    "Roadside Waste",
    "Plastic Waste",
    "Construction Waste",
    "Sewage/Wastewater",
    "Other"

];


function cleanText(value, maxLength = 1000) {

    if (typeof value !== "string") {
        return "";
    }

    return value
        .trim()
        .replace(/[<>]/g, "")
        .slice(0, maxLength);

}


// ----------------------------------
// HEALTH CHECK
// ----------------------------------

app.get("/", (req, res) => {

    res.json({
        name: "Clean Vizag Waste Reporting API",
        status: "running"
    });

});


// ----------------------------------
// CREATE COMPLAINT
// ----------------------------------

app.post(
    "/api/complaints",
    complaintLimiter,
    upload.single("photo"),
    async (req, res) => {

        try {

            const {

                wasteType,
                description,
                area,
                street,
                pincode,
                latitude,
                longitude,
                name,
                mobile,
                email

            } = req.body;


            // ----------------------------
            // VALIDATION
            // ----------------------------

            if (!allowedWasteTypes.includes(wasteType)) {

                return res.status(400).json({
                    message:
                        "Invalid waste problem type."
                });

            }


            if (!description || description.trim().length < 5) {

                return res.status(400).json({
                    message:
                        "Please provide a proper description."
                });

            }


            if (!area || !street || !pincode) {

                return res.status(400).json({
                    message:
                        "Please provide the complete location."
                });

            }


            if (!/^\d{6}$/.test(pincode)) {

                return res.status(400).json({
                    message:
                        "Please enter a valid 6-digit pincode."
                });

            }


            if (!name || name.trim().length < 2) {

                return res.status(400).json({
                    message:
                        "Please enter your name."
                });

            }


            if (!/^\d{10}$/.test(mobile)) {

                return res.status(400).json({
                    message:
                        "Please enter a valid 10-digit mobile number."
                });

            }


            // ----------------------------
            // CREATE LOCAL COMPLAINT ID
            // ----------------------------

            const complaintId =
                `CV-${new Date().getFullYear()}-${Date.now()}`;


            const complaint = {

                id: complaintId,

                wasteType:
                    cleanText(wasteType, 100),

                description:
                    cleanText(description, 2000),

                area:
                    cleanText(area, 200),

                street:
                    cleanText(street, 300),

                pincode,

                latitude:
                    cleanText(latitude, 50),

                longitude:
                    cleanText(longitude, 50),

                name:
                    cleanText(name, 150),

                mobile,

                email:
                    cleanText(email, 200),

                photo:
                    req.file
                        ? req.file.filename
                        : null,

                createdAt:
                    new Date().toISOString(),

                status:
                    "Received by Clean Vizag",

                municipalReference:
                    null,

                municipalForwarded:
                    false

            };


            // ----------------------------
            // SAVE LOCALLY
            // ----------------------------

            complaints.set(
                complaintId,
                complaint
            );


            // ----------------------------
            // MUNICIPAL INTEGRATION
            // ----------------------------

            const municipalResult =
                await submitToMunicipality(
                    complaint
                );


            if (municipalResult.connected) {

                complaint.municipalReference =
                    municipalResult.referenceNumber;

                complaint.municipalForwarded = true;

                complaint.status =
                    municipalResult.status ||
                    "Forwarded to Municipality";

            }


            // ----------------------------
            // RESPONSE
            // ----------------------------

            return res.status(201).json({

                message:
                    municipalResult.connected
                        ? "Complaint submitted and forwarded to the municipal system."
                        : "Complaint received by Clean Vizag. Municipal integration is not currently connected.",

                complaint

            });


        } catch (error) {

            console.error(error);

            return res.status(500).json({

                message:
                    "Unable to process complaint."

            });

        }

    }
);


// ----------------------------------
// TRACK COMPLAINT
// ----------------------------------

app.get(
    "/api/complaints/:id",
    (req, res) => {

        const complaint =
            complaints.get(req.params.id);


        if (!complaint) {

            return res.status(404).json({

                message:
                    "Complaint not found."

            });

        }


        return res.json({

            complaint

        });

    }
);


// ----------------------------------
// ERROR HANDLER
// ----------------------------------

app.use((error, req, res, next) => {

    console.error(error);

    res.status(400).json({

        message:
            error.message ||
            "Something went wrong."

    });

});


// ----------------------------------
// START SERVER
// ----------------------------------

app.listen(PORT, () => {

    console.log(
        `Clean Vizag backend running at http://localhost:${PORT}`
    );

});