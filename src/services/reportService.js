// src/services/reportService.js

// Report data storage
let reportData = {
  location: {
    address: "",
    coordinates: { lat: null, lng: null },
    barangay: "",
    specificDetails: ""
  },
  photo: null,
  incidentDetails: {
    type: "",
    victimsAffected: 0,
    description: "",
    reporterName: "",
    reporterContact: "",
    reporterNumber: ""
  },
  submittedAt: null,
  reportId: null
};

// Helper functions
function determineSeverity(incidentType) {
  const severityMap = {
    "Medical Emergency": "Critical",
    "Fire Incident": "Critical",
    "Vehicle Accident": "High",
    "Crime Incident": "High",
    "Flooding": "Medium",
    "Road Obstruction": "Medium",
    "Other": "Low"
  };
  return severityMap[incidentType] || "Medium";
}

function generateIncidentId() {
  const prefix = "INC";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export const reportService = {
  saveLocation: (data) => {
    reportData.location = { ...reportData.location, ...data };
    localStorage.setItem('tempReport', JSON.stringify(reportData));
    console.log("✅ Location saved");
    return reportData;
  },

  savePhoto: (photoData) => {
    reportData.photo = photoData;
    localStorage.setItem('tempReport', JSON.stringify(reportData));
    console.log("✅ Photo saved");
    return reportData;
  },

  saveIncidentDetails: (data) => {
    reportData.incidentDetails = {
      ...reportData.incidentDetails,
      type: data.type,
      victimsAffected: data.victimsAffected,
      description: data.description,
      reporterName: data.reporterName || data.name || "Anonymous",
      reporterContact: data.reporterContact || data.contact || "",
      reporterNumber: data.reporterNumber || ""
    };
    localStorage.setItem('tempReport', JSON.stringify(reportData));
    console.log("✅ Incident details saved");
    return reportData;
  },

  getReportData: () => {
    const saved = localStorage.getItem('tempReport');
    if (saved) {
      try {
        reportData = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing report data:", e);
      }
    }
    return reportData;
  },

  clearReport: () => {
    reportData = {
      location: { address: "", coordinates: { lat: null, lng: null }, barangay: "", specificDetails: "" },
      photo: null,
      incidentDetails: { type: "", victimsAffected: 0, description: "", reporterName: "", reporterContact: "", reporterNumber: "" },
      submittedAt: null,
      reportId: null
    };
    localStorage.removeItem('tempReport');
    sessionStorage.removeItem('reportData');
    console.log("🗑️ Report cleared");
  },

  submitReport: async (incidentService) => {
    try {
      console.log("📦 Starting report submission...");

      const data = reportService.getReportData();

      // Validate
      const errors = [];
      if (!data.incidentDetails.type || data.incidentDetails.type === "Select incident type") {
        errors.push("Please select an incident type");
      }
      if (!data.incidentDetails.description || data.incidentDetails.description.trim() === "") {
        errors.push("Please provide a description");
      }
      if (!data.location.address || data.location.address.trim() === "") {
        errors.push("Location address is required");
      }
      if (!data.incidentDetails.reporterNumber || data.incidentDetails.reporterNumber.trim() === "") {
        errors.push("Contact number is required");
      }

      if (errors.length > 0) {
        throw new Error(errors.join(". "));
      }

      // Prepare incident data
      const incidentData = {
        type: data.incidentDetails.type,
        severity: determineSeverity(data.incidentDetails.type),
        description: data.incidentDetails.description,
        location: {
          address: data.location.address,
          coordinates: {
            latitude: data.location.coordinates?.lat || 15.3613,
            longitude: data.location.coordinates?.lng || 120.9365
          },
          barangay: data.location.barangay || "Poblacion"
        },
        reporterName: data.incidentDetails.reporterName || "Anonymous",
        reporterNumber: data.incidentDetails.reporterNumber || "",
        victimsAffected: parseInt(data.incidentDetails.victimsAffected) || 0,
        photo: data.photo || null,
        status: "Pending"
      };

      console.log("📤 Sending to backend:", incidentData);

      // ✅ Check if incidentService exists
      if (!incidentService || typeof incidentService.reportIncident !== 'function') {
        throw new Error("Incident service not available");
      }

      const response = await incidentService.reportIncident(incidentData);
      console.log("📥 Backend response:", response);

      if (response && response.success) {
        reportService.clearReport();
        return {
          success: true,
          data: response.data || response,
          message: "Report submitted successfully"
        };
      } else if (response && response.data) {
        reportService.clearReport();
        return {
          success: true,
          data: response.data,
          message: "Report submitted successfully"
        };
      } else {
        throw new Error(response?.message || "Failed to submit report");
      }

    } catch (error) {
      console.error("❌ Submit report error:", error);
      return {
        success: false,
        error: error.message || "Failed to submit report"
      };
    }
  }
};

export default reportService;