/**
 * GVMC / Municipal Integration Adapter
 *
 * This file is the connection point between the
 * Clean Vizag complaint system and the municipal system.
 *
 * IMPORTANT:
 * Until an official municipal API/endpoint is configured,
 * complaints are accepted by Clean Vizag but are NOT actually
 * sent to GVMC.
 */

async function submitToMunicipality(complaint) {

    // No official municipal API configured yet.
    // Keep the complaint inside Clean Vizag for now.

    console.log(
        `Municipal integration not configured for complaint ${complaint.id}`
    );

    return {
        connected: false,
        referenceNumber: null,
        status: "Received by Clean Vizag"
    };
}

module.exports = {
    submitToMunicipality
};